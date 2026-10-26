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

Desde entonces, cada guardado en el panel `/admin` publica solo en 1–2 minutos.
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
| El push falla por **workflow scope** | Ver 1.5. |

---

## 6. Para quien toque el código

### Probar el `.htaccess` antes de publicarlo

Un error en el `.htaccess` de un hosting compartido tumba el sitio entero con
un 500, y se descubre en producción. Antes de subir cualquier cambio a
`public/.htaccess` o `public/admin/.htaccess`:

```bash
bash scripts/probar-htaccess.sh
```

Levanta un Apache 2.4 temporal (sin sudo; en macOS ya viene instalado) y corre
63 comprobaciones: las tres redirecciones a `https://www.dihyc.com.pe` en un
salto, la query conservada, PDFs con espacios y `°`, la 404 propia, `/admin` con
su política, `.well-known` sin redirección, otro dominio intacto, caché,
compresión, sin listado de carpetas, archivos ocultos bloqueados, los restos
del sitio viejo (sus `.php` redirigen, la portada nueva gana al `index.php`
viejo, y mientras sube la primera publicación la portada vieja sigue viva), y
que el sitio **no** da 500 si al hosting le faltan `mod_headers`, `mod_deflate`
o `mod_filter`. El servidor real es **LiteSpeed**, que lee el mismo `.htaccess`;
la prueba en vivo del workflow confirma en el servidor lo esencial.

### Qué hace el `.htaccess`, en una línea por regla

- `https://www.dihyc.com.pe` como única dirección (301 en un salto).
- Direcciones del sitio viejo (`/index.php`, `/productos.php`…) → sus páginas
  nuevas (301), sin bucles aunque el `index.php` viejo siga en el servidor.
- `/.well-known/` sin tocar (renovación automática del SSL de cPanel).
- Cabeceras de seguridad y **Content-Security-Policy** aplicada (verificada en
  navegador sin violaciones en todas las páginas). Si se añade Google Analytics,
  hay que sumar sus dominios a la CSP.
- HSTS de 1 día, sin `includeSubDomains`: subirlo a un año tras un mes estable.
- Caché: `/_astro/` un año; HTML, sitemap y config del CMS siempre frescos;
  PDFs e imágenes 1 día (las fichas se reemplazan con el mismo nombre).
- Redirecciones, cabeceras y bloqueos acotados a `dihyc.com.pe` /
  `www.dihyc.com.pe`: otro dominio del hosting no los recibe. `Options`,
  `DirectoryIndex` y `ErrorDocument` sí rigen en toda carpeta bajo public_html
  (por eso `DirectoryIndex` incluye `index.php`).
