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
( cd "$RAIZ" && npm run build >/dev/null 2>&1 ) || { echo "Falló npm run build"; exit 2; }
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
