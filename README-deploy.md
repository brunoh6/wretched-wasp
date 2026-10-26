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

Con ese archivo se puede volver atrás en un minuto (ver sección 4).

> El `.htaccess` que hay hoy en el servidor será **reemplazado** por el nuevo.
> Queda guardado dentro de ese respaldo.

### 1.2 Revisar qué más vive en el hosting

El cPanel muestra **1 dominio complementario**, **1 subdominio** y **1 base de
datos** que no son de este sitio. Hay que saber dónde está la carpeta de ese
otro dominio:

1. cPanel → **Dominios**.
2. Mirar la columna **Raíz del documento** del otro dominio.
   - Si es algo como `/home/dihyccom/otrodominio.com` → está **fuera** de
     public_html. Perfecto, nada que hacer.
   - Si es algo como `/home/dihyccom/public_html/otrodominio.com` → está
     **dentro**. Anotar el nombre de la carpeta (`otrodominio.com/`): hará falta
     sólo si algún día se publica por SSH con borrado (sección 3).

Publicando por FTPS no hace falta nada más: el sistema **sólo borra archivos
que él mismo subió**, así que nunca toca la carpeta de otro dominio, ni
`cgi-bin`, ni `.well-known` (donde cPanel renueva el certificado SSL).

### 1.3 Crear una cuenta FTP sólo para publicar

1. cPanel → **Cuentas FTP** → sección *Agregar cuenta FTP*.
2. **Inicio de sesión:** `publicar` (quedará como `publicar@dihyc.com.pe`).
3. **Contraseña:** usar el botón **Generador de contraseñas** y copiarla.
4. **Directorio:** borrar lo que cPanel escribe solo y poner exactamente
   `public_html`
   *(así la cuenta sólo puede tocar el sitio, nada más del hosting).*
5. **Crear cuenta FTP**.
6. En la lista de cuentas, junto a la nueva, pulsar **Configurar cliente FTP**
   y anotar el **Servidor FTP** que aparece (suele ser un nombre como
   `servidor123.proveedor.com`, no `dihyc.com.pe`) y el **puerto** (normalmente 21).

### 1.4 Cargar esos datos en GitHub

En GitHub: repositorio → **Settings** → **Secrets and variables** → **Actions**.

**Pestaña "Secrets"** → *New repository secret*, uno por uno:

| Nombre          | Valor                                              |
|-----------------|----------------------------------------------------|
| `FTP_SERVER`    | el *Servidor FTP* anotado en 1.3                   |
| `FTP_USERNAME`  | el usuario completo, p. ej. `publicar@dihyc.com.pe`|
| `FTP_PASSWORD`  | la contraseña generada en 1.3                      |

**Pestaña "Variables"** → *New repository variable*:

| Nombre          | Valor   | ¿Obligatoria?                                   |
|-----------------|---------|-------------------------------------------------|
| `DEPLOY_METHOD` | `ftps`  | Sí. Es el interruptor que activa la publicación. |
| `FTP_PORT`      | `21`    | Sólo si cPanel indicó otro puerto.              |
| `FTP_SECURITY`  | `loose` | Sólo si falla el certificado (ver sección 5).   |
| `FTP_SERVER_DIR`| `public_html/` | Sólo si la cuenta FTP NO se creó con directorio `public_html`. |

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

1. Subir todo el trabajo a la rama `main` (commit + push).
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
> qué subió). Los archivos de la versión vieja quedan en el servidor sin
> estorbar: el sitio nuevo no los enlaza. Si se quieren limpiar, que lo haga
> alguien técnico después del respaldo, **sin tocar nunca** `.well-known`,
> `cgi-bin` ni la carpeta de otro dominio.

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

- **A una versión anterior del sitio:** GitHub → Actions → abrir la última
  ejecución que estaba bien → **Re-run all jobs**. Se vuelve a publicar
  exactamente esa versión. (El siguiente cambio que se guarde publicará el
  último código otra vez.)
- **Al sitio viejo de antes de todo esto:** cPanel → Administrador de archivos
  → subir el `.zip` del paso 1.1 a `public_html` → **Extraer**.

---

## 5. Problemas frecuentes

| Síntoma | Qué hacer |
|---|---|
| Tras publicar, **todo el sitio da error 500** | Algunos proveedores no permiten `Options` en el `.htaccess`. Comentar la línea `Options -Indexes` de `public/.htaccess` (anteponer `#`) y volver a publicar. |
| *Publicar por FTPS* falla con un error de **certificado** | `FTP_SERVER` debe ser el nombre del servidor que muestra cPanel en *Configurar cliente FTP*, no `dihyc.com.pe`. Si aun así falla, crear la variable `FTP_SECURITY = loose`: la conexión sigue cifrada, pero ya no se verifica la identidad del servidor (riesgo bajo, pero real). |
| *Publicar por FTPS* falla con **530 Login incorrect** | `FTP_USERNAME` debe ser el usuario completo (`publicar@dihyc.com.pe`). Revisar también la contraseña. |
| *Probar el sitio en vivo* dice que **no se ve la versión nueva** | El hosting puede tener una caché propia. Esperar unos minutos y usar *Re-run failed jobs*. |
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
51 comprobaciones: las tres redirecciones a `https://www.dihyc.com.pe` en un
salto, la query conservada, PDFs con espacios y `°`, la 404 propia, `/admin` con
su política, `.well-known` sin redirección, otro dominio intacto, caché,
compresión, sin listado de carpetas, archivos ocultos bloqueados, y que el
sitio **no** da 500 si al hosting le faltan `mod_headers`, `mod_deflate` o
`mod_filter`.

### Qué hace el `.htaccess`, en una línea por regla

- `https://www.dihyc.com.pe` como única dirección (301 en un salto).
- `/.well-known/` sin tocar (renovación automática del SSL de cPanel).
- Cabeceras de seguridad y **Content-Security-Policy** aplicada (verificada en
  navegador sin violaciones en todas las páginas). Si se añade Google Analytics,
  hay que sumar sus dominios a la CSP.
- HSTS de 1 día, sin `includeSubDomains`: subirlo a un año tras un mes estable.
- Caché: `/_astro/` un año; HTML, sitemap y config del CMS siempre frescos;
  PDFs e imágenes 1 día (las fichas se reemplazan con el mismo nombre).
- Todo acotado a `dihyc.com.pe` / `www.dihyc.com.pe`: otro dominio del hosting
  no recibe nada.
