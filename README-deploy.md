# Cómo se publica www.dihyc.com.pe

Cada vez que se guarda un cambio en GitHub —desde el código o desde el panel
`/admin`— el sitio se compila, se revisa y se sube solo al hosting cPanel de la
empresa. Al final, una prueba automática entra al sitio en vivo y confirma que
la versión nueva es la que se ve.

```
cambio → GitHub → compilar y validar → subir a public_html → probar en vivo
```

Mientras no se configure (pasos de abajo), GitHub **sólo compila y valida**: no
publica nada y no falla por falta de datos.

---

## 1. Antes del primer despliegue (se hace una sola vez)

### 1.1 Respaldar lo que hay hoy en el hosting

Hoy en dihyc.com.pe hay una versión vieja del sitio. Antes de reemplazarla:

1. Entrar a cPanel → **Administrador de archivos**.
2. Marcar la carpeta **public_html** → botón **Comprimir** → formato *Zip* →
   **Comprimir archivos**.
3. Marcar el `.zip` que aparece → **Descargar**. Guardarlo en un lugar seguro.

Con ese archivo se puede volver atrás (ver sección 4). Ojo: el `.zip` trae
**la carpeta `public_html` entera** dentro, no sólo su contenido.

> El `.htaccess` que hay hoy en el servidor será **reemplazado** por el nuevo.
> Queda guardado dentro de ese respaldo.

### 1.2 Revisar qué más vive en el hosting

El cPanel muestra **1 dominio complementario**, **1 subdominio** y **1 base de
datos** que no son de este sitio. Hay que saber dónde está la carpeta de ese
otro dominio:

1. cPanel → **Dominios**.
2. Mirar la columna **Raíz del documento** de cada dominio y subdominio.
   - Si es algo como `/home/dihyccom/otrodominio.com` → está **fuera** de
     public_html. Perfecto, nada que hacer.
   - Si es algo como `/home/dihyccom/public_html/otrodominio.com` → está
     **dentro**. Anotar el nombre de la carpeta (`otrodominio.com/`): hará falta
     si algún día se publica por SSH con borrado (sección 3), y **después de la
     primera publicación hay que abrir ese otro dominio y comprobar que carga**
     (el `.htaccess` de public_html también rige en sus carpetas).
3. En la misma tabla, dejar **apagado** "Forzar redireccionamiento HTTPS" de
   dihyc.com.pe: el `.htaccess` ya lleva todo a `https://www.` en un solo salto;
   con los dos activos serían dos saltos y la prueba en vivo lo marcaría.

Publicando por FTPS, el sistema **sólo borra archivos que él mismo subió**, así
que nunca toca la carpeta de otro dominio, ni `cgi-bin`, ni `.well-known`
(donde cPanel renueva el certificado SSL).

### 1.3 Crear una cuenta FTP sólo para publicar

1. cPanel → **Cuentas FTP** → sección *Agregar cuenta FTP*.
2. **Inicio de sesión:** `publicar` (quedará como `publicar@dihyc.com.pe`).
3. **Contraseña:** usar el botón **Generador de contraseñas** y copiarla.
4. **Directorio:** borrar lo que cPanel escribe solo y poner exactamente
   `public_html`
   *(así la cuenta sólo puede tocar el sitio, nada más del hosting).*
5. **Crear cuenta FTP**.
6. En la lista, la columna **Ruta** de la cuenta nueva debe terminar en
   `/public_html`. Si termina en otra cosa (por ejemplo `public_html/publicar`),
   **eliminar la cuenta y crearla de nuevo**: no se arregla con variables.
7. **Configurar cliente FTP** muestra *Servidor FTP: `ftp.dihyc.com.pe`* y el
   puerto (21). **Ese nombre NO sirve** para publicar cifrado: el FTP de cPanel
   presenta el certificado del **nombre del servidor**, que en este hosting es
   `host101.latinoamericahosting.com` (misma IP, certificado válido; comprobado
   en octubre 2026). Ése es el que va en `FTP_SERVER`.

### 1.4 Cargar esos datos en GitHub

En GitHub: repositorio → **Settings** → **Secrets and variables** → **Actions**.

**Pestaña "Secrets"** → *New repository secret*, uno por uno:

| Nombre          | Valor                                              |
|-----------------|----------------------------------------------------|
| `FTP_SERVER`    | `host101.latinoamericahosting.com` (ver 1.3, paso 7) |
| `FTP_USERNAME`  | el usuario completo, p. ej. `publicar@dihyc.com.pe`|
| `FTP_PASSWORD`  | la contraseña generada en 1.3                      |

**Pestaña "Variables"** → *New repository variable*:

| Nombre          | Valor   | ¿Obligatoria?                                   |
|-----------------|---------|-------------------------------------------------|
| `DEPLOY_METHOD` | `ftps`  | Sí. Es el interruptor que activa la publicación. |
| `FTP_PORT`      | `21`    | Sólo si cPanel indicó otro puerto.              |
| `FTP_SECURITY`  | `loose` | Sólo si falla el certificado (ver sección 5).   |
| `FTP_SERVER_DIR`| `public_html/` | Sólo si se publica con la cuenta **principal** de cPanel (`dihyccom`). Con la cuenta `publicar@` NO usarla (ver 1.3, paso 6). |

Los *secrets* nadie los puede volver a leer, ni siquiera en GitHub: si se
pierde la contraseña, se genera otra en cPanel y se reemplaza el secret.

### 1.5 Permiso "workflow" para poder subir el código

GitHub rechaza subir cambios a `.github/workflows/` si el acceso que se usa no
tiene el permiso **workflow**. Ya pasó en este repositorio (el commit
`b23c350`, "push without workflow", borró un archivo así para poder subir lo
demás). Si al hacer push aparece *"refusing to allow … without `workflow`
scope"*:

- **Token clásico:** GitHub → Settings → Developer settings → Personal access
  tokens → editar el token → marcar **workflow** → *Update token*.
- **Token de grano fino:** en *Repository permissions*, **Workflows → Read and write**.
- **GitHub CLI:** `gh auth refresh -s workflow`.

---

## 2. Primer despliegue

1. Subir todo el trabajo a la rama `main`, desde la carpeta del proyecto:
   ```bash
   git add -A
   git status
   ```
   En `git status` no debe quedar nada en "Changes not staged" ni en
   "Untracked files". Luego `git commit -m "…"` y `git push origin main`.
   *(Si las variables de 1.4 se cargan DESPUÉS del push, lanzar la publicación
   a mano: Actions → **Construir y publicar** → **Run workflow**.)*
2. En GitHub → pestaña **Actions** → la ejecución **Construir y publicar**.
3. Deben ponerse en verde, en orden:
   - **Compilar y validar** — el sitio compiló y no falta ningún archivo clave.
     Si el HTML cita una ficha, una foto del catálogo o un archivo del panel
     (`/assets/fichas-tecnicas/`, `hero/`, `categories/`, `products/`,
     `materiales/`, `panel/`) que no existe, **falla y no publica** (línea roja
     `::error::` con la ruta y la página). Lo demás que falte (hoy la foto de
     alquiler de `/assets/services/`) sólo avisa en amarillo.
   - **Publicar por FTPS** — los archivos se subieron a `public_html`.
   - **Probar el sitio en vivo** — entra a www.dihyc.com.pe y comprueba:
     que se ve **esta** versión, que las páginas principales responden, que una
     página inexistente da 404, y que `dihyc.com.pe` y `http://` llevan a
     `https://www.dihyc.com.pe`.
4. Si algo falla, la línea en rojo dice exactamente qué (ver sección 5).

> El primer despliegue sube todo y **no borra nada** (todavía no hay registro de
> qué subió). Mientras sube (unos minutos), la portada vieja sigue
> respondiendo. Los archivos del sitio viejo quedan en el servidor: sus
> direcciones (`/index.php`, `/productos.php`, `/empresa.php`, `/servicios.php`,
> `/contacto.php`) llevan a las páginas nuevas, y el panel viejo `adminxL242/`
> y su copia de pruebas `test/` están **cerrados** (responden 410) desde el
> `.htaccess`: sus archivos y la base de datos siguen en el hosting, sólo que
> nadie puede abrirlos. Para reabrirlos, quitar la regla "2c" del `.htaccess`.
> Si algún día se borran los restos, que lo haga alguien técnico después del
> respaldo (de archivos **y** de la base de datos), **sin tocar nunca**
> `.well-known`, `cgi-bin` ni la carpeta de otro dominio.

Desde entonces, cada guardado en el panel `/admin` publica solo: la
publicación tarda 1–2 minutos y, con la caché del navegador, el cambio se ve
en la web en unos 5 minutos (es lo que dice el panel).
Si se guardan varios cambios seguidos, se encolan y se publica el último.

---

## 3. Publicar por SSH (opcional, más rápido)

### ¿El hosting tiene SSH?

En cPanel, escribir **SSH** en el buscador de herramientas:

- **Acceso SSH** (sección Seguridad) → está disponible.
- **Terminal** (sección Avanzado) → además hay una consola en el navegador.
- Ninguno de los dos → el proveedor lo tiene apagado; muchos lo activan si se
  pide por ticket.

Es una consola **restringida**: se ve sólo la carpeta de la cuenta, sin
permisos de administrador y sin poder instalar programas. Alcanza para publicar
y hacer respaldos.

### Configurarlo

1. En el Mac, crear una llave **sólo para publicar** (no reutilizar la personal):
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/dihyc_publicar -C "github-actions-dihyc"
   ```
   (dejar la frase de contraseña vacía: GitHub no puede escribirla).
2. cPanel → **Acceso SSH** → **Administrar claves SSH** → **Importar clave** →
   pegar el contenido de `~/.ssh/dihyc_publicar.pub` → luego **Autorizar**.
3. Averiguar el puerto SSH del proveedor (en su documentación o por ticket; no
   siempre es 22) y obtener la huella del servidor:
   ```bash
   ssh-keyscan -p PUERTO dihyc.com.pe
   ```
   Compararla con la que publique el proveedor antes de confiar en ella.
4. En GitHub (Settings → Secrets and variables → Actions):

   | Secret            | Valor                                                   |
   |-------------------|---------------------------------------------------------|
   | `SSH_KEY`         | contenido de `~/.ssh/dihyc_publicar` (el archivo SIN `.pub`) |
   | `SSH_KNOWN_HOSTS` | lo que imprimió `ssh-keyscan`                           |
   | `SSH_HOST`        | `dihyc.com.pe` (o el nombre del servidor)               |
   | `SSH_USER`        | `dihyccom`                                              |

   | Variable           | Valor              | Nota                                    |
   |--------------------|--------------------|-----------------------------------------|
   | `DEPLOY_METHOD`    | `ssh`              | reemplaza a `ftps`                      |
   | `SSH_PORT`         | el puerto          | si no es 22                             |
   | `SSH_TARGET_DIR`   | `public_html/`     | es el valor por defecto                 |
   | `SSH_ALLOW_DELETE` | *(no crearla)*     | ver abajo                               |
   | `DEPLOY_PROTECT`   | `otrodominio.com/` | sólo si existe la carpeta del 1.2       |

**Borrado de archivos viejos por SSH:** está **apagado** a propósito. Un borrado
mal dirigido puede eliminar el sitio de otro dominio o la carpeta que usa cPanel
para renovar el SSL. Si algún día se activa (`SSH_ALLOW_DELETE = true`),
`.well-known/`, `cgi-bin/` y todo lo listado en `DEPLOY_PROTECT` quedan
protegidos, y el sistema se niega a borrar si el destino no es una carpeta
concreta como `public_html/`.

---

## 4. Volver atrás

- **A una versión anterior del sitio (últimos 30 días):** GitHub → Actions →
  abrir la última ejecución que estaba bien → **Re-run all jobs**. Se vuelve a
  publicar exactamente esa versión. (El siguiente cambio que se guarde publicará
  el último código otra vez.) GitHub sólo permite re-ejecutar durante 30 días.
- **Más antigua que 30 días:** deshacer el cambio malo (desde el panel `/admin`,
  o que alguien técnico haga `git revert <commit>` y `git push`). Se publica solo.
- **Al sitio viejo de antes de todo esto:**
  1. cPanel → Administrador de archivos → ir a `/home/dihyccom` (la carpeta que
     **contiene** a public_html, no public_html).
  2. **Cargar** ahí el `.zip` del paso 1.1 → marcarlo → **Extraer** en
     `/home/dihyccom`. Como el `.zip` trae la carpeta `public_html`, sus archivos
     vuelven a su sitio (extraerlo DENTRO de public_html crearía
     `public_html/public_html` y no restauraría nada).
  3. **Configuración** (arriba a la derecha) → marcar **Mostrar archivos
     ocultos** → borrar `public_html/.ftp-deploy-sync-state.json`. Sin esto, la
     siguiente publicación creería que el `.htaccess` nuevo sigue en el servidor
     y no lo volvería a subir.

  La extracción sobrescribe los archivos viejos pero deja los del sitio nuevo:
  si `index.html` sigue ahí, la portada seguirá siendo la nueva. Para volver del
  todo al sitio viejo, borrar también `index.html` (sólo el de public_html).

---

## 5. Problemas frecuentes

| Síntoma | Qué hacer |
|---|---|
| Tras publicar, **todo el sitio da error 500** | Algunos proveedores no permiten `Options` en el `.htaccess`. Comentar la línea `Options -Indexes` de `public/.htaccess` (anteponer `#`) y volver a publicar. |
| *Publicar por FTPS* falla con un error de **certificado** (*is not in the cert's altnames*) | `FTP_SERVER` debe ser el nombre del servidor (`host101.latinoamericahosting.com`), no `ftp.dihyc.com.pe`. Si el proveedor cambió de servidor, el nombre correcto aparece en el propio error, después de `DNS:`: copiarlo en `FTP_SERVER`. Sólo si el certificado del servidor está vencido o es autofirmado, crear la variable `FTP_SECURITY = loose` (sigue cifrado, pero ya no verifica con quién habla). |
| *Publicar por FTPS* falla con **530 Login incorrect** | `FTP_USERNAME` debe ser el usuario completo (`publicar@dihyc.com.pe`). Revisar también la contraseña. |
| *Publicar por FTPS* falla **a mitad** (timeout, conexión cortada) | No se borró nada. Actions → la ejecución → **Re-run failed jobs**: vuelve a subir lo que falta. |
| Se cambió un secret o una variable y hay que reintentar | Mejor Actions → **Construir y publicar** → **Run workflow** (ejecución nueva) que *Re-run*. |
| *Probar el sitio en vivo* dice que **no se ve la versión nueva** | Si se restauró el `.zip` (sección 4), falta borrar `.ftp-deploy-sync-state.json`. Si no, el hosting puede tener una caché propia: esperar unos minutos y **Re-run failed jobs**. |
| *Probar el sitio en vivo* avisa (en amarillo) que **faltan cabeceras de seguridad** | El sitio funciona; el hosting no tiene activo `mod_headers`. Consultar al proveedor si lo puede activar. |
| *Compilar y validar* falla con `::error::/assets/... no existe en el sitio` | Alguien borró o renombró un archivo que la web cita (p. ej. desde la biblioteca del panel). Mientras siga así **no se publica ningún cambio**, tampoco los guardados del panel. Restaurar el archivo (está en el historial de GitHub) o quitar la cita, y volver a publicar. |
| El push falla por **workflow scope** | Ver 1.5. |
| *Compilar* falla con `PUBLIC_GOOGLE_ADS_ID=… no tiene la forma AW-123456789` (o con una etiqueta de conversión) | La variable `GOOGLE_ADS_ID` (o `ADS_LABEL_…`) está mal copiada: sin espacios, sin comillas, el ID empieza por `AW-`. Corregirla y **Run workflow** (sección 6). |

---

## 6. Activar la medición de Google Ads

El sitio ya está preparado para medir qué anuncios traen contactos. Mientras
no se active, **no carga nada de Google Ads** (sólo lo de siempre: la
tipografía de Google Fonts y el mapa de Contacto): los clics sólo quedan anotados
dentro del navegador del visitante (para un futuro Google Analytics). Activarlo
es crear unas variables en GitHub; no hay que tocar código.

Se miden tres cosas, cada una como una «acción de conversión» de Google Ads:

| Conversión | Cuándo cuenta | Variable de GitHub |
|---|---|---|
| **Clic en WhatsApp** | Al tocar cualquier botón o enlace de WhatsApp, incluido «Solicitar cotización» del catálogo. | `ADS_LABEL_WHATSAPP` |
| **Formulario enviado** | Sólo cuando Formspree confirma que el mensaje llegó (no al pulsar el botón). | `ADS_LABEL_FORMULARIO` |
| **Clic en un teléfono** | Al tocar un número de teléfono (llamada desde el celular). | `ADS_LABEL_LLAMADA` |

> ⚠ **Antes de activarlo** tiene que estar publicada en el sitio la
> **Política de privacidad**, y debe decir que el sitio usa cookies y la
> etiqueta de Google Ads para medir los resultados de la publicidad. Google
> pide informar de ello a los visitantes y la ley peruana de datos personales
> (Ley 29733) exige el aviso de privacidad. Hoy el sitio no tiene esa página:
> sin ella, no activar.

### Paso 1. Crear las acciones de conversión en Google Ads

Lo hace quien administra la cuenta de Google Ads. Los menús de Google cambian de
nombre a veces; la ruta suele ser esta:

1. **Objetivos** → **Conversiones** → **Resumen** → **+ Crear acción de
   conversión** → **Sitio web**. Escribir `www.dihyc.com.pe` y continuar.
2. Elegir **añadir una acción de conversión manualmente** y crear tres, una por
   fila de la tabla de arriba:
   - **Nombre**: «Clic WhatsApp», «Formulario enviado», «Clic teléfono».
   - **Categoría**: «Contacto» para WhatsApp y teléfono; «Enviar formulario de
     clientes potenciales» para el formulario.
   - **Recuento**: **Una** (un mismo cliente que escribe dos veces por el mismo
     anuncio es un solo contacto).
   - La que se use para que Google puje (la empresa decide cuál: WhatsApp o
     formulario) debe quedar como acción **principal**.
3. Al terminar cada una, en **Configuración de la etiqueta** elegir **Usar
   Google Tag Manager** o **Instalar la etiqueta tú mismo**: en ambas se ve el
   **ID de conversión** y la **etiqueta de conversión**. Si se ve el código, está
   en la línea `'send_to': 'AW-123456789/AbC-dEfGhIj'`:
   - lo de **antes** de la barra (`AW-123456789`) es el **ID**: es el mismo
     para las tres acciones;
   - lo de **después** de la barra (`AbC-dEfGhIj`) es la **etiqueta**: distinta
     en cada acción.

   **No** hay que pegar ese código en ningún sitio: el sitio ya lo trae.

### Paso 2. Crear las variables en GitHub

Repositorio → **Settings** → **Secrets and variables** → **Actions** →
pestaña **Variables** → *New repository variable*, una por una:

| Nombre | Valor (ejemplo) |
|---|---|
| `GOOGLE_ADS_ID` | `AW-123456789` |
| `ADS_LABEL_WHATSAPP` | la etiqueta de «Clic WhatsApp» |
| `ADS_LABEL_FORMULARIO` | la etiqueta de «Formulario enviado» |
| `ADS_LABEL_LLAMADA` | la etiqueta de «Clic teléfono» |

- Son **Variables**, no *Secrets*: el ID y las etiquetas no son secretos (se
  ven en el código de cualquier página publicada).
- Copiarlos sin espacios ni comillas. Si el ID no tiene la forma
  `AW-` + números, o una etiqueta lleva caracteres raros, la compilación
  **falla a propósito** con un mensaje que lo dice, en vez de publicar un sitio
  que no mide.
- Si falta alguna etiqueta, el sitio se publica igual y esa conversión
  simplemente no se cuenta (la compilación lo avisa en amarillo).

### Paso 3. Volver a publicar

Las variables sólo se leen al compilar: **Actions** → **Construir y publicar**
→ **Run workflow**. Al terminar, comprobar en la ejecución:

- *Compilar y validar*: `Google Ads AW-…: etiqueta en el HTML y CSP ampliada.`
- *Probar el sitio en vivo*: `✅ la CSP en vivo permite la etiqueta de Google Ads`.

La «CSP» es la lista de dominios externos que el navegador deja usar a la web.
La compilación añade sola los de Google Ads; sin ellos, el navegador bloquearía
la etiqueta sin avisar y la campaña no mediría nada.

### Paso 4. Comprobarlo con Tag Assistant

1. Abrir [tagassistant.google.com](https://tagassistant.google.com), **Add
   domain** → `https://www.dihyc.com.pe` → **Connect**. Se abre el sitio en otra
   ventana.
2. En esa ventana: tocar el botón de WhatsApp, tocar un teléfono y, si se
   quiere probar el formulario, enviarlo **avisando antes a ventas** (llega un
   correo de verdad) y con «PRUEBA» en el mensaje.
3. En Tag Assistant debe aparecer la etiqueta `AW-…` y, por cada acción, un
   evento **conversion** con la etiqueta correcta (`send_to`).
4. Opcional, en una computadora: tecla **F12** → pestaña **Console**. No debe
   haber errores en rojo que digan *Content Security Policy*.

En Google Ads, el estado de cada acción pasa de «Sin verificar» a «Registrando
conversiones» en unas horas, cuando llegue la primera conversión real.

### Desactivarlo

Borrar la variable `GOOGLE_ADS_ID` y volver a publicar (paso 3). El sitio queda
como antes: sin nada de Google Ads en las páginas ni en la CSP.

### Para quien toque el código

- `src/layouts/BaseLayout.astro`: con `PUBLIC_GOOGLE_ADS_ID` carga la etiqueta
  de Google (gtag.js) al principio del `<head>`, como indica
  [la guía oficial](https://developers.google.com/tag-platform/gtagjs/install).
  Además, en todas las páginas hay un único escucha que, en un clic a `wa.me` /
  `api.whatsapp.com`, en un `tel:` o en el evento
  `document.dispatchEvent(new CustomEvent("dihyc:conversion", { detail: { tipo: "formulario" } }))`,
  llama a `gtag('event', 'conversion', { send_to: 'AW-…/etiqueta', transport_type: 'beacon' })`
  y siempre deja `{ event: 'dihyc_conversion', tipo }` en `window.dataLayer`.
  No retrasa ni cancela la navegación (la guía de
  [conversiones por clic](https://support.google.com/google-ads/answer/6331304)
  usa `event_callback` para retrasar el enlace; aquí se usa `beacon` para que
  WhatsApp abra sin espera).
- `scripts/csp-google-ads.mjs` (se ejecuta dentro de `npm run build`): sólo
  con ID, añade a la CSP de `dist/.htaccess` los dominios de la
  [guía de CSP de Google](https://developers.google.com/tag-platform/security/guides/csp)
  para Google Ads (`script-src`, `img-src`, `connect-src`, `frame-src`; cada
  dominio `google.<TLD>` va aparte, por eso `www.google.com.pe`). Sin ID no toca
  nada. `public/.htaccess` no cambia.
- Para probar en local: `PUBLIC_GOOGLE_ADS_ID=AW-000000000 PUBLIC_ADS_LABEL_WHATSAPP=prueba npm run build`.
  Esas compilaciones de prueba no se suben: la publicación siempre compila en GitHub.

---

## 7. Para quien toque el código

### Probar el `.htaccess` antes de publicarlo

Un error en el `.htaccess` de un hosting compartido tumba el sitio entero con
un 500, y se descubre en producción. Antes de subir cualquier cambio a
`public/.htaccess` o `public/admin/.htaccess`:

```bash
bash scripts/probar-htaccess.sh
```

Levanta un Apache 2.4 temporal (sin sudo; en macOS ya viene instalado) y corre
95 comprobaciones: las tres redirecciones a `https://www.dihyc.com.pe` en un
salto, la query conservada, PDFs con espacios y `°`, la 404 propia, `/admin` con
su política, `.well-known` sin redirección, otro dominio intacto, caché,
compresión, sin listado de carpetas, archivos ocultos bloqueados, SVG de
`/assets/` servidos sin scripts, los restos
del sitio viejo (sus `.php` redirigen, la portada nueva gana al `index.php`
viejo, y mientras sube la primera publicación la portada vieja sigue viva), y
que el sitio **no** da 500 si al hosting le faltan `mod_headers`, `mod_deflate`
o `mod_filter`. También prueba la CSP: `connect-src` con `formspree.io`, y la
CSP sin Google Ads y con ella (`scripts/csp-google-ads.mjs` con un ID de
prueba: dominios de la guía de Google, idempotente, sin tocar `/admin` ni los
SVG). El servidor real es **LiteSpeed**, que lee el mismo `.htaccess`;
la prueba en vivo del workflow confirma en el servidor lo esencial.

### Qué hace el `.htaccess`, en una línea por regla

- `https://www.dihyc.com.pe` como única dirección (301 en un salto).
- Direcciones del sitio viejo (`/index.php`, `/productos.php`…) → sus páginas
  nuevas (301), sin bucles aunque el `index.php` viejo siga en el servidor.
- `/.well-known/` sin tocar (renovación automática del SSL de cPanel).
- Cabeceras de seguridad y **Content-Security-Policy** aplicada (verificada en
  navegador sin violaciones en todas las páginas). Los dominios de Google Ads
  los añade la compilación sólo si hay `GOOGLE_ADS_ID` (sección 6); si se añade
  Google Analytics, sumar sus dominios en `scripts/csp-google-ads.mjs`.
- HSTS de 1 día, sin `includeSubDomains`: subirlo a un año tras un mes estable.
- SVG de `/assets/`: CSP propia (`default-src 'none'; sandbox`) para que un SVG
  con `<script>` abierto directamente no se ejecute en el dominio del panel.
- Caché: `/_astro/` un año; HTML, sitemap y config del CMS siempre frescos;
  PDFs e imágenes 1 día (las fichas se reemplazan con el mismo nombre).
- Redirecciones, cabeceras y bloqueos acotados a `dihyc.com.pe` /
  `www.dihyc.com.pe`: otro dominio del hosting no los recibe. `Options`,
  `DirectoryIndex` y `ErrorDocument` sí rigen en toda carpeta bajo public_html
  (por eso `DirectoryIndex` incluye `index.php`).
