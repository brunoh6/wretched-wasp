#!/usr/bin/env bash
# =============================================================================
# Prueba el .htaccess de public/ contra un Apache REAL antes de publicarlo.
#
#   bash scripts/probar-htaccess.sh
#
# Compila el sitio, levanta un Apache 2.4 temporal (HTTP en 18080 y HTTPS en
# 18443 con un certificado autofirmado para dihyc.com.pe y www.dihyc.com.pe),
# corre todas las comprobaciones y lo apaga. No necesita sudo ni toca nada del sistema:
# todo vive en una carpeta temporal que se borra al terminar.
#
# Por qué existe: un error en el .htaccess de un hosting compartido tumba el
# sitio ENTERO con un error 500, y se descubre en producción. Si cambias el
# .htaccess, corre esto antes de hacer push.
#
# Pensado para macOS (trae Apache en /usr/sbin/httpd). En Linux, indica dónde
# están Apache y sus módulos:
#   HTTPD=/usr/sbin/apache2 MODDIR=/usr/lib/apache2/modules bash scripts/probar-htaccess.sh
#
# Además prueba que el sitio sigue funcionando (sin error 500) si el hosting no
# tuviera mod_headers, mod_deflate ni mod_filter.
# =============================================================================
set -uo pipefail

HTTPD="${HTTPD:-/usr/sbin/httpd}"
MODDIR="${MODDIR:-/usr/libexec/apache2}"
MIME="${MIME:-/private/etc/apache2/mime.types}"
[ -f "$MIME" ] || MIME=/etc/mime.types
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
# pwd -P: ruta REAL. En macOS mktemp crea la carpeta bajo /var, que es un enlace
# simbólico a /private/var; servida a través del enlace, la 404 propia
# (ErrorDocument) no se encuentra y Apache muestra su página genérica.
T="$(cd "$(mktemp -d)" && pwd -P)"
trap '"$HTTPD" -f "$T/full.conf" -k stop >/dev/null 2>&1; "$HTTPD" -f "$T/min.conf" -k stop >/dev/null 2>&1; rm -rf "$T"' EXIT

command -v "$HTTPD" >/dev/null || { echo "No encuentro Apache en $HTTPD"; exit 2; }

echo "Compilando el sitio…"
# Siempre SIN medición (Google Ads, GA4, Clarity), aunque quien lo corre tenga
# las variables puestas: los casos "con ID" se prueban más abajo (o) sobre una
# copia del .htaccess.
( cd "$RAIZ" && unset PUBLIC_GOOGLE_ADS_ID PUBLIC_ADS_LABEL_WHATSAPP PUBLIC_ADS_LABEL_FORMULARIO PUBLIC_ADS_LABEL_LLAMADA \
    PUBLIC_GA4_ID PUBLIC_CLARITY_ID && npm run build >/dev/null 2>&1 ) || { echo "Falló npm run build"; exit 2; }
cp -R "$RAIZ/dist" "$T/www"
mkdir -p "$T/www/.well-known/acme-challenge" "$T/logs"
echo "token-de-prueba" > "$T/www/.well-known/acme-challenge/prueba.txt"
echo '{"lista":"secreta"}' > "$T/www/.ftp-deploy-sync-state.json"
# Restos del sitio viejo que quedan en public_html tras la primera publicación
# (FTP no borra lo que no subió). Sin PHP en este Apache, se sirven como texto:
# basta para saber QUÉ archivo eligió el servidor.
for f in index productos empresa servicios contacto; do echo "SITIO-VIEJO-$f" > "$T/www/$f.php"; done
echo "SITIO-VIEJO-indexw" > "$T/www/indexw.html"
mkdir -p "$T/www/otra-app" && echo "OTRA-APP-PHP" > "$T/www/otra-app/index.php"
mkdir -p "$T/www/adminxL242" "$T/www/test" "$T/www/testimonios"
for f in index delProd; do echo "PANEL-VIEJO" > "$T/www/adminxL242/$f.php"; done
echo "COPIA-PRUEBAS" > "$T/www/test/index.php"; echo "OTRA-CARPETA" > "$T/www/testimonios/index.php"

openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj "/CN=www.dihyc.com.pe" \
  -addext "subjectAltName=DNS:www.dihyc.com.pe,DNS:dihyc.com.pe" \
  -keyout "$T/test.key" -out "$T/test.crt" >/dev/null 2>&1

conf() { # $1 = archivo, $2 = full | min
  {
    echo "ServerRoot \"$(dirname "$MODDIR")\""
    echo "ServerName localhost"
    echo "DefaultRuntimeDir \"$T/logs\""
    echo "Mutex file:$T/logs default"
    echo "Listen 127.0.0.1:18080"
    echo "Listen 127.0.0.1:18443"
    for m in mpm_prefork authz_core unixd mime log_config dir autoindex rewrite setenvif ssl socache_shmcb alias; do
      echo "LoadModule ${m}_module $MODDIR/mod_${m}.so"
    done
    if [ "$2" = full ]; then
      for m in headers deflate filter; do echo "LoadModule ${m}_module $MODDIR/mod_${m}.so"; done
    fi
    cat <<EOF
PidFile "$T/logs/$2.pid"
ErrorLog "$T/logs/error-$2.log"
LogFormat "%h %>s %r" simple
CustomLog "$T/logs/access-$2.log" simple
TypesConfig "$MIME"
SSLSessionCache "shmcb:$T/logs/ssl-$2(512000)"
DocumentRoot "$T/www"
<Directory "$T/www">
  AllowOverride All
  Options FollowSymLinks Indexes
  Require all granted
</Directory>
<VirtualHost 127.0.0.1:18443>
  DocumentRoot "$T/www"
  SSLEngine on
  SSLCertificateFile "$T/test.crt"
  SSLCertificateKeyFile "$T/test.key"
</VirtualHost>
EOF
  } > "$1"
}
conf "$T/full.conf" full
conf "$T/min.conf" min

"$HTTPD" -t -f "$T/full.conf" >/dev/null 2>&1 || { echo "La configuración de Apache de prueba no es válida"; "$HTTPD" -t -f "$T/full.conf"; exit 2; }
"$HTTPD" -f "$T/full.conf" -k start 2>/dev/null; sleep 2
cd "$T"

H="http://127.0.0.1:18080"
pass=0; fail=0
ok(){ printf "  ✅ %s\n" "$1"; pass=$((pass+1)); }
ko(){ printf "  ❌ %s  →  %s\n" "$1" "$2"; fail=$((fail+1)); }
hdr(){ # $1 esquema(http|https) $2 host $3 ruta → cabeceras
  if [ "$1" = https ]; then
    curl -sk -o /dev/null -D - --resolve "$2:18443:127.0.0.1" -H "Host: $2" "https://$2:18443$3"
  else
    curl -s -o /dev/null -D - -H "Host: $2" "$H$3"
  fi
}
body(){ if [ "$1" = https ]; then curl -sk --resolve "$2:18443:127.0.0.1" -H "Host: $2" "https://$2:18443$3"; else curl -s -H "Host: $2" "$H$3"; fi; }
st(){ echo "$1" | head -1 | awk '{print $2}'; }
loc(){ echo "$1" | grep -i '^location:' | tr -d '\r' | sed 's/^[Ll]ocation: //'; }
has(){ echo "$1" | grep -qi "^$2"; }

echo "a) Redirecciones a la dirección canónica (un solo salto)"
r=$(hdr http dihyc.com.pe '/productos/?x=1');      [ "$(st "$r")" = 301 ] && [ "$(loc "$r")" = "https://www.dihyc.com.pe/productos/?x=1" ] && ok "http + sin www → https://www (query conservada)" || ko "http sin www" "$(st "$r") $(loc "$r")"
r=$(hdr http www.dihyc.com.pe '/empresa/');        [ "$(st "$r")" = 301 ] && [ "$(loc "$r")" = "https://www.dihyc.com.pe/empresa/" ] && ok "http + www → https" || ko "http www" "$(st "$r") $(loc "$r")"
r=$(hdr https dihyc.com.pe '/contacto/');          [ "$(st "$r")" = 301 ] && [ "$(loc "$r")" = "https://www.dihyc.com.pe/contacto/" ] && ok "https sin www → https://www" || ko "https sin www" "$(st "$r") $(loc "$r")"
p='/assets/fichas-tecnicas/ESPECIFICACIONES%20CODO%2090%C2%B0%20SDR11%20-%20SDR9%20HDPE%20FM%20GEORG%20FISCHER.pdf'
r=$(hdr http dihyc.com.pe "$p");                   [ "$(loc "$r" | tr A-F a-f)" = "$(echo "https://www.dihyc.com.pe$p" | tr A-F a-f)" ] && ok "PDF con espacios y ° redirige con la ruta bien codificada" || ko "PDF codificado" "$(loc "$r")"
f=$(curl -sk -L -o /dev/null -w '%{http_code} %{num_redirects}' --resolve www.dihyc.com.pe:18443:127.0.0.1 --resolve dihyc.com.pe:18443:127.0.0.1 "https://www.dihyc.com.pe:18443$p")
[ "${f%% *}" = 200 ] && ok "y el PDF descarga (200) en la URL canónica" || ko "PDF descarga" "$f"

echo "b) Portada canónica: 200 + cabeceras"
r=$(hdr https www.dihyc.com.pe '/')
[ "$(st "$r")" = 200 ] && ok "200" || ko "portada" "$(st "$r")"
for h in "X-Content-Type-Options: nosniff" "Referrer-Policy: strict-origin-when-cross-origin" "X-Frame-Options: SAMEORIGIN" "Permissions-Policy:" "Content-Security-Policy: default-src 'self'" "Strict-Transport-Security: max-age=86400" "Cache-Control: no-cache"; do
  has "$r" "$h" && ok "$h" || ko "falta cabecera" "$h"
done
echo "$r" | grep -i "Strict-Transport" | grep -qi includeSubDomains && ko "HSTS" "trae includeSubDomains" || ok "HSTS sin includeSubDomains"
r=$(hdr http otro.test '/'); echo "$r" | grep -qi "Strict-Transport" && ko "HSTS en http" "presente" || ok "HSTS ausente en respuestas http"

echo "c) Catálogo sin barra final conserva la query"
r=$(hdr https www.dihyc.com.pe '/productos/tuberias?linea=fm')
[ "$(st "$r")" = 301 ] && [ "$(loc "$r")" = "https://www.dihyc.com.pe:18443/productos/tuberias/?linea=fm" -o "$(loc "$r")" = "https://www.dihyc.com.pe/productos/tuberias/?linea=fm" ] && ok "301 → /productos/tuberias/?linea=fm" || ko "barra final" "$(st "$r") $(loc "$r")"
r=$(hdr https www.dihyc.com.pe '/productos/tuberias/?linea=fm'); [ "$(st "$r")" = 200 ] && ok "/productos/tuberias/?linea=fm → 200" || ko "catálogo" "$(st "$r")"
r=$(hdr https www.dihyc.com.pe '/productos/conexiones/');        [ "$(st "$r")" = 200 ] && ok "/productos/conexiones/ → 200 (en vivo hoy da 404)" || ko "conexiones" "$(st "$r")"

echo "d) 404 propia"
r=$(hdr https www.dihyc.com.pe '/no-existe-esta-pagina')
[ "$(st "$r")" = 404 ] && ok "código 404" || ko "404" "$(st "$r")"
# El cuerpo se guarda ANTES de buscar en él: con pipefail, "curl | grep -q" falla
# en falso (grep corta la tubería al encontrar el texto y curl muere a mitad).
b404=$(body https www.dihyc.com.pe '/no-existe-esta-pagina')
[[ "$b404" == *dihyc-build* ]] && ok "sirve NUESTRA 404.html (no la genérica)" || ko "404 propia" "cuerpo genérico"
has "$r" "Content-Security-Policy:" && ok "la 404 también lleva cabeceras de seguridad" || ko "404 sin cabeceras" ""

echo "e) /admin con su propia política"
r=$(hdr https www.dihyc.com.pe '/admin'); [ "$(st "$r")" = 301 ] && ok "/admin → 301 a /admin/" || ko "/admin" "$(st "$r") $(loc "$r")"
r=$(hdr https www.dihyc.com.pe '/admin/')
[ "$(st "$r")" = 200 ] && ok "/admin/ → 200" || ko "/admin/" "$(st "$r")"
echo "$r" | grep -i '^Content-Security-Policy:' | grep -q "frame-ancestors 'none'" && ok "CSP del panel (frame-ancestors 'none')" || ko "CSP admin" "$(echo "$r" | grep -i content-security)"
[ "$(echo "$r" | grep -ci '^Content-Security-Policy:')" = 1 ] && ok "una sola CSP (la del sitio no se suma)" || ko "CSP duplicada" "$(echo "$r" | grep -ci '^Content-Security-Policy:') cabeceras"
has "$r" "X-Frame-Options: DENY" && ok "X-Frame-Options: DENY" || ko "XFO admin" ""
r=$(hdr https www.dihyc.com.pe '/admin/config.yml'); echo "$r" | grep -qi '^Content-Type: text/yaml' && ok "config.yml servido como text/yaml" || ko "config.yml" "$(echo "$r" | grep -i content-type)"

echo "f) SSL automático de cPanel"
r=$(hdr http dihyc.com.pe '/.well-known/acme-challenge/prueba.txt')
[ "$(st "$r")" = 200 ] && ok "acme-challenge por http plano → 200 SIN redirección" || ko "acme-challenge" "$(st "$r") $(loc "$r")"
[ "$(body http dihyc.com.pe '/.well-known/acme-challenge/prueba.txt')" = "token-de-prueba" ] && ok "y devuelve el token exacto" || ko "token" ""

echo "g) Otro dominio del mismo hosting queda intacto"
r=$(hdr http otro-dominio.test '/')
[ "$(st "$r")" = 200 ] && ok "sin redirección" || ko "addon redirigido" "$(st "$r") $(loc "$r")"
for h in "Content-Security-Policy" "X-Frame-Options" "Strict-Transport-Security" "X-Content-Type-Options"; do
  has "$r" "$h" && ko "el addon recibe" "$h" || ok "el addon NO recibe $h"
done

echo "h) Caché"
js=$(cd www && ls _astro/*.js | head -1)
r=$(hdr https www.dihyc.com.pe "/$js");                   has "$r" "Cache-Control: public, max-age=31536000, immutable" && ok "/_astro/*.js → 1 año, immutable" || ko "astro" "$(echo "$r" | grep -i cache-control)"
fuente=$(cd www && ls _astro/poppins-latin-400-normal.*.woff2 | head -1)
r=$(hdr https www.dihyc.com.pe "/$fuente");               has "$r" "Content-Type: font/woff2" && has "$r" "Cache-Control: public, max-age=31536000, immutable" && ok "tipografía /_astro/*.woff2 → font/woff2, 1 año" || ko "woff2" "$(echo "$r" | grep -i -e content-type -e cache-control)"
r=$(hdr https www.dihyc.com.pe "$p");                      has "$r" "Cache-Control: public, max-age=86400" && ok "PDF → 1 día" || ko "pdf" "$(echo "$r" | grep -i cache-control)"
r=$(hdr https www.dihyc.com.pe '/assets/products/pvc.png'); has "$r" "Cache-Control: public, max-age=86400" && ok "imagen → 1 día" || ko "img" "$(echo "$r" | grep -i cache-control)"
r=$(hdr https www.dihyc.com.pe '/productos/');             has "$r" "Cache-Control: no-cache" && ok "página → no-cache" || ko "html" "$(echo "$r" | grep -i cache-control)"
r=$(hdr https www.dihyc.com.pe '/robots.txt');             has "$r" "Cache-Control: no-cache" && ok "robots.txt → no-cache" || ko "robots" "$(echo "$r" | grep -i cache-control)"
[ "$(echo "$r" | grep -ci '^Cache-Control:')" -le 1 ] && ok "sin Cache-Control duplicado" || ko "Cache-Control duplicado" ""

echo "i) Compresión"
r=$(curl -sk -o /dev/null -D - -H 'Accept-Encoding: gzip' --resolve www.dihyc.com.pe:18443:127.0.0.1 https://www.dihyc.com.pe:18443/productos/conexiones/)
has "$r" "Content-Encoding: gzip" && ok "HTML comprimido con gzip" || ko "gzip" "sin Content-Encoding"

echo "j) Nada que no deba verse"
r=$(hdr https www.dihyc.com.pe '/assets/fichas-tecnicas/'); bdir=$(body https www.dihyc.com.pe '/assets/fichas-tecnicas/'); [ "$(st "$r")" = 403 ] && [[ "$bdir" != *"Index of"* ]] && ok "sin listado de carpetas (403, sin 'Index of')" || ko "listado" "$(st "$r")"
r=$(hdr https www.dihyc.com.pe '/.htaccess');               [ "$(st "$r")" = 403 ] && ok "/.htaccess → 403" || ko ".htaccess" "$(st "$r")"
r=$(hdr https www.dihyc.com.pe '/.ftp-deploy-sync-state.json'); [ "$(st "$r")" = 403 ] && ok "estado de la publicación FTP → 403" || ko "state" "$(st "$r")"

echo "l) Restos del sitio viejo (PHP) en public_html"
bport=$(body https www.dihyc.com.pe '/')
[[ "$bport" == *dihyc-build* ]] && ok "/ sirve el index.html nuevo aunque siga el index.php viejo" || ko "portada" "sirvió otra cosa"
for par in "/index.php|https://www.dihyc.com.pe/" "/index.php?pag=2|https://www.dihyc.com.pe/" "/indexw.html|https://www.dihyc.com.pe/" \
           "/productos.php|https://www.dihyc.com.pe/productos/" "/empresa.php?id=3|https://www.dihyc.com.pe/empresa/" \
           "/servicios.php|https://www.dihyc.com.pe/servicios/" "/contacto.php|https://www.dihyc.com.pe/contacto/"; do
  ruta="${par%%|*}"; dest="${par#*|}"
  r=$(hdr https www.dihyc.com.pe "$ruta"); [ "$(st "$r")" = 301 ] && [ "$(loc "$r")" = "$dest" ] && ok "$ruta → 301 $dest" || ko "$ruta" "$(st "$r") $(loc "$r")"
done
f=$(curl -sk -L -o /dev/null -w '%{http_code} %{num_redirects} %{url_effective}' --connect-to www.dihyc.com.pe:443:127.0.0.1:18443 --connect-to dihyc.com.pe:443:127.0.0.1:18443 "https://dihyc.com.pe/productos.php")
[ "$f" = "200 2 https://www.dihyc.com.pe/productos/" ] && ok "sin www + .php → 2 saltos hasta /productos/ (200)" || ko "cadena .php" "$f"
r=$(hdr https www.dihyc.com.pe '/productos'); [ "$(st "$r")" = 301 ] && [[ "$(loc "$r")" == */productos/ ]] && ok "/productos (dirección vieja sin extensión) → /productos/" || ko "/productos" "$(st "$r") $(loc "$r")"
r=$(hdr https www.dihyc.com.pe '/otra-app/'); bapp=$(body https www.dihyc.com.pe '/otra-app/')
[ "$(st "$r")" = 200 ] && [ "$bapp" = "OTRA-APP-PHP" ] && ok "una carpeta PHP (sitio viejo u otro dominio) sigue respondiendo con su index.php" || ko "carpeta PHP" "$(st "$r")"
# Ventana de la primera publicación: el .htaccess nuevo ya subió pero el
# index.html todavía no. La portada vieja debe seguir viva, sin bucle.
mv "$T/www/index.html" "$T/www/index.html.espera"
r=$(hdr https www.dihyc.com.pe '/'); bv=$(body https www.dihyc.com.pe '/')
[ "$(st "$r")" = 200 ] && [ "$bv" = "SITIO-VIEJO-index" ] && ok "mientras sube: / sigue sirviendo la portada vieja (200, sin bucle)" || ko "ventana de subida" "$(st "$r") $(loc "$r")"
mv "$T/www/index.html.espera" "$T/www/index.html"
for ruta in /adminxL242 /adminxL242/ /adminxL242/delProd.php /test/ /test/index.php; do
  r=$(hdr https www.dihyc.com.pe "$ruta"); bc=$(body https www.dihyc.com.pe "$ruta")
  [ "$(st "$r")" = 410 ] && [[ "$bc" != *PANEL-VIEJO* && "$bc" != *COPIA-PRUEBAS* ]] && ok "$ruta → 410 cerrado (no se ejecuta)" || ko "$ruta" "$(st "$r")"
done
r=$(hdr http dihyc.com.pe '/adminxL242/'); [ "$(st "$r")" = 301 ] && [ "$(loc "$r")" = "https://www.dihyc.com.pe/adminxL242/" ] && ok "http sin www → primero a https://www (y allí 410)" || ko "admin http" "$(st "$r") $(loc "$r")"
r=$(hdr https www.dihyc.com.pe '/testimonios/'); [ "$(st "$r")" = 200 ] && ok "/testimonios/ NO se ve afectado (sólo /test exacto)" || ko "testimonios" "$(st "$r")"

echo "m) SVG de /assets/ servidos inertes (sin scripts)"
for s in /assets/categories/conexiones-fm.svg /assets/panel/tarjetas/conexiones-fm.svg; do
  r=$(hdr https www.dihyc.com.pe "$s")
  [ "$(st "$r")" = 200 ] && [ "$(echo "$r" | grep -ci '^Content-Security-Policy:')" = 1 ] \
    && echo "$r" | grep -i '^Content-Security-Policy:' | grep -q "default-src 'none'.*sandbox" \
    && ok "$s → una sola CSP, default-src 'none' + sandbox" || ko "$s" "$(st "$r") $(echo "$r" | grep -i content-security)"
  has "$r" "Cache-Control: public, max-age=86400" && ok "  y conserva la caché de 1 día" || ko "caché svg" "$(echo "$r" | grep -i cache-control)"
done
r=$(hdr https www.dihyc.com.pe '/productos/'); echo "$r" | grep -i '^Content-Security-Policy:' | grep -q "default-src 'self'" && ok "las páginas siguen con la CSP del sitio" || ko "CSP página" "$(echo "$r" | grep -i content-security)"
r=$(hdr http otro-dominio.test '/assets/categories/conexiones-fm.svg'); has "$r" "Content-Security-Policy" && ko "el addon recibe la CSP de SVG" "" || ok "el addon NO recibe la CSP de SVG"

echo "n) Carpeta del panel: sólo fichas e imágenes"
echo '<script>alert(1)</script>' > "$T/www/assets/panel/lista-de-precios.html"
echo '<script>alert(1)</script>' > "$T/www/assets/panel/tarjetas/OTRA.HTM"
echo '<script>alert(1)</script>' > "$T/www/assets/panel/servicios/termofusion.html"
for s in /assets/panel/lista-de-precios.html /assets/panel/tarjetas/OTRA.HTM /assets/panel/servicios/termofusion.html; do
  r=$(hdr https www.dihyc.com.pe "$s"); [ "$(st "$r")" = 403 ] && ok "$s → 403 (no se sirve)" || ko "$s" "$(st "$r")"
done
for s in /assets/panel/fichas/especificaciones-brida-loca-pvc-georg-fischer.pdf /assets/panel/tarjetas/tuberias-fm.webp /assets/panel/tarjetas/conexiones-fm.svg /assets/panel/servicios/termofusion.webp; do
  r=$(hdr https www.dihyc.com.pe "$s"); [ "$(st "$r")" = 200 ] && ok "$s → 200" || ko "$s" "$(st "$r")"
done

echo "o) CSP: formulario por fetch y medición (scripts/csp-medicion.mjs)"
csp_de(){ hdr https www.dihyc.com.pe "$1" | grep -i '^Content-Security-Policy:' | tr -d '\r'; }
# ¿La directiva $2 de la CSP $1 permite exactamente la fuente $3? (los espacios
# evitan que www.google.com se dé por bueno dentro de www.google.com.pe)
permite(){ local d; d=" $(echo "$1" | sed 's/^[^:]*: *//' | tr ';' '\n' | sed 's/^ *//' | grep "^$2 ") "; [[ "$d" == *" $3 "* ]]; }
# Corre el script con SÓLO las variables indicadas (las demás, vacías).
medir_csp(){ env PUBLIC_GOOGLE_ADS_ID= PUBLIC_GA4_ID= PUBLIC_CLARITY_ID= "$@" node "$RAIZ/scripts/csp-medicion.mjs" "$T/www" >/dev/null 2>&1; }
igual(){ cmp -s "$T/www/.htaccess" "$T/htaccess.original"; }
# Dominios de las guías oficiales (ver el encabezado de scripts/csp-medicion.mjs).
ADS_DOM="https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com https://www.google.com https://www.google.com.pe"
GA4_DOM="https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com https://*.google.com.pe https://*.g.doubleclick.net"
CLA_DOM="https://*.clarity.ms https://c.bing.com"
faltan_ads(){ local f="" d
  for d in https://www.googletagmanager.com https://www.googleadservices.com https://www.google.com; do permite "$1" script-src "$d" || f+=" script-src:$d"; done
  for d in $ADS_DOM; do permite "$1" img-src "$d" || f+=" img-src:$d"; done
  for d in $ADS_DOM https://ad.doubleclick.net; do permite "$1" connect-src "$d" || f+=" connect-src:$d"; done
  permite "$1" frame-src https://www.googletagmanager.com || f+=" frame-src:gtm"
  echo "$f"; }
faltan_ga4(){ local f="" d
  permite "$1" script-src https://www.googletagmanager.com || f+=" script-src:gtm"
  for d in $GA4_DOM; do permite "$1" img-src "$d" || f+=" img-src:$d"; done
  for d in $GA4_DOM https://pagead2.googlesyndication.com; do permite "$1" connect-src "$d" || f+=" connect-src:$d"; done
  permite "$1" frame-src https://www.googletagmanager.com || f+=" frame-src:gtm"
  echo "$f"; }
faltan_cla(){ local f="" x d
  for x in script-src img-src connect-src; do for d in $CLA_DOM; do permite "$1" "$x" "$d" || f+=" $x:$d"; done; done
  echo "$f"; }
# Comprobaciones comunes a cada caso "con ID": Apache sin 500, una sola CSP, el
# resto de la política intacto, SVG y /admin con lo suyo.
con_id_comun(){ # $1 = nombre del caso
  local r c
  r=$(hdr https www.dihyc.com.pe '/productos/')
  [ "$(st "$r")" = 200 ] && ok "$1: Apache responde 200 con la CSP ampliada (sin error 500)" || ko "$1: CSP ampliada" "$(st "$r")"
  [ "$(echo "$r" | grep -ci '^Content-Security-Policy:')" = 1 ] && ok "$1: sigue habiendo UNA sola CSP" || ko "$1: CSP duplicada" ""
  c=$(csp_de /productos/)
  permite "$c" connect-src https://formspree.io && permite "$c" frame-src https://www.google.com && permite "$c" script-src "'unsafe-inline'" \
    && [[ "$c" == *"default-src 'self';"* && "$c" == *"frame-ancestors 'self'"* && "$c" == *"object-src 'none'"* ]] \
    && ok "$1: se conserva el resto de la política (formspree, mapa, frame-ancestors…)" || ko "$1: resto de la CSP" "$c"
  r=$(hdr https www.dihyc.com.pe /assets/categories/conexiones-fm.svg)
  echo "$r" | grep -i '^Content-Security-Policy:' | grep -q "default-src 'none'.*sandbox" && [[ "$r" != *googletagmanager* && "$r" != *clarity.ms* ]] \
    && ok "$1: los SVG conservan su CSP inerte" || ko "$1: SVG" "$(echo "$r" | grep -i content-security)"
  r=$(hdr https www.dihyc.com.pe '/admin/')
  [ "$(echo "$r" | grep -ci '^Content-Security-Policy:')" = 1 ] && echo "$r" | grep -qi "frame-ancestors 'none'" && [[ "$r" != *googletagmanager* && "$r" != *clarity.ms* ]] \
    && ok "$1: /admin/ conserva sólo su política" || ko "$1: admin" "$(echo "$r" | grep -i content-security)"
}
csp=$(csp_de /contacto/)
permite "$csp" connect-src "'self'" && permite "$csp" connect-src https://formspree.io && ok "connect-src permite https://formspree.io (formulario con fetch)" || ko "connect-src formspree" "$csp"
permite "$csp" form-action https://formspree.io && ok "form-action sigue permitiendo formspree.io" || ko "form-action" "$csp"
[[ "$csp" != *googletagmanager* && "$csp" != *googleadservices* && "$csp" != *doubleclick* && "$csp" != *google.com.pe* && "$csp" != *google-analytics* && "$csp" != *clarity.ms* && "$csp" != *bing.com* ]] \
  && ok "sin IDs: la CSP no trae ningún dominio de Google Ads, GA4 ni Clarity" || ko "CSP sin ID" "$csp"
bport=$(body https www.dihyc.com.pe '/')
[[ "$bport" != *googletagmanager* && "$bport" != *"gtag/js"* && "$bport" != *google-analytics* && "$bport" != *clarity.ms* && "$bport" != *data-clarity-mask* ]] \
  && ok "sin IDs: el HTML no carga gtag.js ni Clarity (ni marca el formulario)" || ko "HTML sin ID" "trae gtag o Clarity"
cp "$T/www/.htaccess" "$T/htaccess.original"
medir_csp && igual && ok "sin IDs el script no toca el .htaccess" || ko "script sin ID" "cambió el archivo"
for malo in PUBLIC_GOOGLE_ADS_ID=G-123 PUBLIC_GA4_ID=UA-12345-1 PUBLIC_GA4_ID=g-test000000 PUBLIC_GA4_ID=123456789 \
            PUBLIC_CLARITY_ID=ABCDEFGHIJ PUBLIC_CLARITY_ID=abc123 "PUBLIC_CLARITY_ID=<script>xx"; do
  medir_csp "$malo" && ko "ID inválido $malo" "el script no falló" \
    || { igual && ok "ID con forma inválida ($malo): el script falla y no toca nada" || ko "ID inválido $malo" "cambió el archivo"; }
done
medir_csp PUBLIC_GA4_ID=G-TEST000000 PUBLIC_CLARITY_ID=MAL && ko "GA4 válido + Clarity inválido" "no falló" \
  || { igual && ok "GA4 válido + Clarity inválido: falla sin escribir nada" || ko "GA4 + Clarity inválido" "cambió el archivo"; }

#   Google Ads sólo.
medir_csp PUBLIC_GOOGLE_ADS_ID=AW-000000000 && ok "Ads: el script amplía la CSP" || ko "script Ads" "falló"
cp "$T/www/.htaccess" "$T/htaccess.ads"
medir_csp PUBLIC_GOOGLE_ADS_ID=AW-000000000 && cmp -s "$T/www/.htaccess" "$T/htaccess.ads" && ok "Ads: idempotente (segunda pasada, mismo archivo)" || ko "idempotencia Ads" "cambió"
csp=$(csp_de /productos/); f=$(faltan_ads "$csp")
[ -z "$f" ] && ok "Ads: script-src, img-src, connect-src y frame-src con los dominios de la guía de Google (incl. www.google.com.pe)" || ko "dominios de Google Ads" "$f"
[[ "$csp" != *google-analytics* && "$csp" != *clarity.ms* ]] && ok "Ads: sin dominios de GA4 ni de Clarity" || ko "Ads trae de más" "$csp"
con_id_comun "Ads"
cp "$T/htaccess.original" "$T/www/.htaccess"

#   GA4 sólo.
medir_csp PUBLIC_GA4_ID=G-TEST000000 && ok "GA4: el script amplía la CSP" || ko "script GA4" "falló"
cp "$T/www/.htaccess" "$T/htaccess.ga4"
medir_csp PUBLIC_GA4_ID=G-TEST000000 && cmp -s "$T/www/.htaccess" "$T/htaccess.ga4" && ok "GA4: idempotente" || ko "idempotencia GA4" "cambió"
csp=$(csp_de /productos/); f=$(faltan_ga4 "$csp")
[ -z "$f" ] && ok "GA4: googletagmanager, *.google-analytics.com, *.google.com, *.google.com.pe y *.g.doubleclick.net (guía de Google)" || ko "dominios de GA4" "$f"
[[ "$csp" != *googleadservices* && "$csp" != *clarity.ms* ]] && ok "GA4: sin dominios propios de Ads ni de Clarity" || ko "GA4 trae de más" "$csp"
con_id_comun "GA4"
cp "$T/htaccess.original" "$T/www/.htaccess"

#   Clarity sólo.
medir_csp PUBLIC_CLARITY_ID=dihyctest0 && ok "Clarity: el script amplía la CSP" || ko "script Clarity" "falló"
cp "$T/www/.htaccess" "$T/htaccess.clarity"
medir_csp PUBLIC_CLARITY_ID=dihyctest0 && cmp -s "$T/www/.htaccess" "$T/htaccess.clarity" && ok "Clarity: idempotente" || ko "idempotencia Clarity" "cambió"
csp=$(csp_de /productos/); f=$(faltan_cla "$csp")
[ -z "$f" ] && ok "Clarity: *.clarity.ms y c.bing.com en script-src, img-src y connect-src (guía de Microsoft)" || ko "dominios de Clarity" "$f"
[[ "$csp" != *googletagmanager* && "$csp" != *google-analytics* && "$csp" != *googleadservices* ]] && ok "Clarity: sin dominios de Google" || ko "Clarity trae de más" "$csp"
con_id_comun "Clarity"
cp "$T/htaccess.original" "$T/www/.htaccess"

#   Las tres juntas; idempotente, y si una pasada anterior ya añadió GA4 el
#   resultado permite exactamente lo mismo (sólo cambia el orden).
medir_csp PUBLIC_GOOGLE_ADS_ID=AW-000000000 PUBLIC_GA4_ID=G-TEST000000 PUBLIC_CLARITY_ID=dihyctest0 && ok "Ads + GA4 + Clarity: el script amplía la CSP" || ko "script las tres" "falló"
cp "$T/www/.htaccess" "$T/htaccess.todas"
medir_csp PUBLIC_GOOGLE_ADS_ID=AW-000000000 PUBLIC_GA4_ID=G-TEST000000 PUBLIC_CLARITY_ID=dihyctest0 && cmp -s "$T/www/.htaccess" "$T/htaccess.todas" \
  && ok "las tres: idempotente (segunda pasada, mismo archivo)" || ko "idempotencia las tres" "cambió"
# Fuentes de cada directiva, ordenadas: "directiva fuente" por línea.
fuentes(){ grep "Content-Security-Policy \"default-src 'self';" "$1" | sed 's/.*Content-Security-Policy "//; s/" env=DIHYC.*//' | tr ';' '\n' \
  | while read -r dir fs; do for x in $fs; do echo "$dir $x"; done; done | sort; }
cp "$T/htaccess.original" "$T/www/.htaccess"
medir_csp PUBLIC_GA4_ID=G-TEST000000 && medir_csp PUBLIC_GOOGLE_ADS_ID=AW-000000000 PUBLIC_GA4_ID=G-TEST000000 PUBLIC_CLARITY_ID=dihyctest0 \
  && [ "$(fuentes "$T/www/.htaccess")" = "$(fuentes "$T/htaccess.todas")" ] && ok "las tres: sobre una CSP que ya tenía GA4 se llega a la misma política" || ko "GA4 y luego las tres" "otra política"
csp=$(csp_de /productos/); f="$(faltan_ads "$csp")$(faltan_ga4 "$csp")$(faltan_cla "$csp")"
[ -z "$f" ] && ok "las tres: todos los dominios de Ads, GA4 y Clarity" || ko "dominios las tres" "$f"
dups=$(echo "$csp" | sed 's/^[^:]*: *//' | tr ';' '\n' | while read -r dir; do echo "$dir" | tr ' ' '\n' | sort | uniq -d; done)
[ -z "$dups" ] && ok "las tres: ningún dominio repetido dentro de una directiva" || ko "repetidos" "$dups"
con_id_comun "Las tres"
cp "$T/htaccess.original" "$T/www/.htaccess"

echo
echo "k) Sin mod_headers, mod_deflate ni mod_filter el sitio NO da error 500"
"$HTTPD" -f "$T/full.conf" -k stop >/dev/null 2>&1; sleep 2
"$HTTPD" -f "$T/min.conf" -k start 2>/dev/null; sleep 2
for p in / /productos/ /productos/tuberias/ /productos/conexiones/ /contacto/ /admin/; do
  c=$(curl -sk -o /dev/null -w '%{http_code}' --resolve www.dihyc.com.pe:18443:127.0.0.1 -H 'Host: www.dihyc.com.pe' "https://www.dihyc.com.pe:18443$p")
  [ "$c" = 200 ] && ok "$p → 200 sin esos módulos" || ko "$p sin módulos" "$c"
done
[ "$(grep -c ' 500 ' "$T/logs/access-min.log")" = 0 ] && ok "ningún error 500" || ko "errores 500" "$(grep -c ' 500 ' "$T/logs/access-min.log")"

echo; echo "TOTAL: $pass correctas, $fail fallidas"
[ "$fail" = 0 ]
