# Panel de administración del catálogo

Este documento explica cómo usar y cómo poner en marcha el panel con el que se
gestionan las fichas técnicas, las fotos y la visibilidad de los productos.

- **Dónde vive:** `public/admin/` (dos archivos: `index.html` y `config.yml`).
- **Qué motor usa:** [Sveltia CMS](https://sveltiacms.app), un CMS que funciona
  dentro del navegador y guarda los cambios como commits en este mismo
  repositorio de GitHub.
- **Dirección del panel:** `https://TU-DOMINIO/admin/`

> **Por qué Sveltia y no Decap CMS**
> Se evaluaron los dos. Sveltia es el sucesor moderno de Decap/Netlify CMS, se
> carga como un único archivo JavaScript y —lo importante para este proyecto—
> permite entrar con un **token personal de GitHub sin montar ningún servidor de
> autenticación**. Decap obliga a montar ese servidor sí o sí. No se encontró
> ningún impedimento para usar Sveltia, así que se usó Sveltia.

---

## 1. Cómo se entra al panel

Hay tres formas. La tabla resume cuál conviene en cada momento; abajo está el
detalle de cada una.

| Forma de entrar | ¿Necesita montar algo? | ¿Cuándo usarla? |
|---|---|---|
| **A. Token de acceso personal** | No | **Para arrancar hoy mismo**, con el sitio en cualquier hosting |
| **B. "Sign In with GitHub" (OAuth)** | Sí, según dónde se aloje | Cuando el cliente entre solo y a menudo |
| **C. Repositorio local** | No | Sólo para pruebas en la computadora de quien programa |

### A. Token de acceso personal — la vía rápida (recomendada para empezar)

Funciona **en cualquier hosting**, incluso GitHub Pages, y **no requiere montar
ningún servicio de OAuth**. Es la forma más rápida de dejar el panel operativo.

1. Abrir `https://TU-DOMINIO/admin/`.
2. Pulsar **"Sign In Using Access Token"**.
3. El propio panel muestra un enlace a la página de GitHub donde se crea el
   token **con los permisos ya marcados**. Se sigue ese enlace y se crea.
4. Se pega el token en el panel. Queda guardado en ese navegador, así que sólo
   hay que hacerlo una vez por computadora.

> ⚠ **El token es una contraseña.** No se comparte por WhatsApp ni por correo.
> Cada persona crea el suyo. Si alguien deja la empresa, se borra su token desde
> GitHub → Settings → Developer settings.

**Desventaja:** al cliente hay que explicarle qué es un token, y caduca si se le
pone fecha de caducidad. Por eso, si el cliente va a entrar a menudo, conviene
pasar a la opción B.

### B. "Sign In with GitHub" — la vía cómoda para el cliente

El cliente pulsa un botón, GitHub le pide usuario y contraseña, y listo. No hay
tokens que copiar. **Requiere un pequeño servicio de OAuth**, porque un sitio
estático no puede guardar el secreto que GitHub exige. Ese servicio no existe
todavía en este proyecto. Hay dos maneras de conseguirlo:

#### B.1 · Worker de OAuth en Cloudflare ← **RECOMENDADA**

El sitio vive en el **cPanel de la empresa** (decidido en octubre de 2026), así
que las opciones de alojar el sitio en Netlify o Cloudflare Pages ya no aplican.
Lo único que hace falta para el botón "Sign In with GitHub" es el pequeño
servicio de OAuth, y se puede alojar gratis en Cloudflare Workers **sin mover el
sitio ni tocar el DNS ni el correo**: el Worker vive en una dirección propia
`*.workers.dev`.

1. Crear una cuenta gratuita en Cloudflare (no hace falta añadir el dominio).
2. Desplegar el
   [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth) en
   Cloudflare Workers (el repositorio trae un botón de despliegue directo).
3. Crear una OAuth App en GitHub (**Settings → Developer settings → OAuth Apps
   → New OAuth App**) con
   **Authorization callback URL: `https://TU-WORKER.workers.dev/callback`**.
4. En el Worker, configurar las variables de entorno:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET` (marcar **Encrypt**)
   - `ALLOWED_DOMAINS` = `www.dihyc.com.pe`. **No es opcional en la práctica:**
     sin esta lista, cualquier web ajena puede usar tu Worker y llegar a obtener
     un token de acceso.
5. Añadir en `public/admin/config.yml`, dentro de `backend:`:
   ```yaml
   base_url: https://TU-WORKER.workers.dev
   ```
   y publicar (el cambio sale solo, ver `README-deploy.md`).

#### B.2 · Servicio propio en un VPS (si se autoaloja)

Si el sitio va a vivir en un servidor propio, hace falta un microservicio que
haga de intermediario en el "baile" de OAuth. Es pequeño pero hay que
mantenerlo: dominio, certificado HTTPS, actualizaciones y vigilancia.

Lo que tendría que hacer, en tres pasos:

1. `GET /auth` → redirige a
   `https://github.com/login/oauth/authorize` con el `client_id` y un parámetro
   `state` aleatorio (el `state` evita que un tercero falsifique la vuelta).
2. `GET /callback` → GitHub vuelve con un `code`. El servicio lo cambia por un
   token llamando a `https://github.com/login/oauth/access_token` **desde el
   servidor**, que es donde puede vivir el `client_secret` sin quedar expuesto.
3. Devuelve el token a la ventana del panel con `postMessage`, comprobando
   antes que el dominio que lo pide está en una lista blanca.

En la práctica **no hace falta escribirlo**: el mismo
[sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) se puede
desplegar en un VPS con Node en lugar de en Cloudflare, y ya implementa esos
tres pasos con el `state` y la lista blanca bien hechos.

Después hay que apuntar el panel a ese servicio en `config.yml`:

```yaml
backend:
  name: github
  repo: brunoh6/wretched-wasp
  branch: main
  base_url: https://auth.tu-dominio.com
```

#### Recomendación

**El Worker de Cloudflare (opción B.1).** Motivos:

- Resuelve el login de un clic sin mover el sitio del cPanel ni tocar el DNS.
- Es gratuito y no hay servidor que mantener.
- La B.2 (servicio propio) sólo tendría sentido si algún día se monta un VPS por
  otros motivos.

**Plan sugerido:** empezar con la **opción A (token)** para que el cliente pueda
usar el panel ya, y montar la **B.1** cuando el cliente vaya a entrar seguido.
No son excluyentes: los dos botones conviven en la pantalla de entrada.

### C. Repositorio local (pruebas de quien programa)

Sirve para probar el panel **sin OAuth y sin tocar GitHub**: los cambios se
escriben directamente en los archivos del disco.

1. Levantar el servidor de desarrollo:
   ```bash
   PATH=/opt/homebrew/bin:$PATH npm run dev
   ```
2. Abrir **`http://localhost:4321/admin/index.html`**
   ⚠ **Ojo:** en desarrollo hay que escribir `/admin/index.html` completo.
   `http://localhost:4321/admin/` devuelve **404** — está comprobado. Es una
   peculiaridad del servidor de desarrollo de Astro, que no busca el
   `index.html` de una carpeta. En producción `/admin/` sí funciona.
3. Pulsar **"Work with Local Repository"** y, cuando el navegador lo pida,
   seleccionar la carpeta raíz del repositorio (`wretched-wasp`).

> **Requiere Chrome, Edge, Brave o similar.** Usa la File System Access API, que
> Firefox y Safari no tienen.
>
> **Nota técnica:** Sveltia **no** usa `local_backend: true` ni el proxy
> `decap-server` / `netlify-cms-proxy-server`; su documentación dice
> expresamente que no los soporta y que la opción `local_backend` se ignora. Por
> eso no aparece en `config.yml`: ponerla no haría nada.

---

## 2. Grupos de producto

El panel tiene dos secciones, las dos dentro de **Catálogo**:

| Sección | Qué controla | Archivo que edita | Dónde se explica |
|---|---|---|---|
| **Grupos de producto** | Ficha técnica, foto y visibilidad de cada grupo del catálogo | `src/data/catalog/overrides.json` | esta sección |
| **Tarjetas de portada** | Las cuatro tarjetas de la página **Productos** | `src/data/catalog/cards.json` | sección 3 |

El aviso del idioma y el glosario de abajo valen para las dos.

> ⚠ **LOS BOTONES DEL PANEL ESTÁN EN INGLÉS Y NO SE PUEDEN TRADUCIR.**
> Todo lo NUESTRO está en español: los nombres de los campos ("Ficha técnica
> (PDF)"), las ayudas y el interruptor Oculto/Activo. Pero los botones y menús
> del propio programa son inglés fijo: el paquete de Sveltia CMS trae **un único
> diccionario de textos, el inglés**, y su configuración **no tiene ninguna
> opción de idioma**. No es algo que se haya dejado a medias: no se puede
> cambiar sin modificar el programa.
>
> Glosario de lo que el cliente se va a encontrar:
>
> | En pantalla | Qué es |
> |---|---|
> | **Save** | Guardar |
> | **Browse** | Buscar el archivo en la computadora |
> | **Paste** / **Paste Image** | Pegar un archivo o una imagen del portapapeles |
> | **Drop a file here** | Arrastrar el archivo hasta aquí |
> | **Expand All** / **Collapse All** | Desplegar / plegar todos los grupos |
> | **Contents** / **Collections** | Contenidos / Colecciones (el menú lateral) |
> | **Search for contents…** | Buscar |
> | **Sign In with GitHub** | Entrar con la cuenta de GitHub |
> | **Sign In Using Access Token** | Entrar con un token (ver sección 1.A) |
> | **Work with Local Repository** | Trabajar con los archivos del disco (sección 1.C) |

### Qué es un "grupo"

Un grupo son **todas las medidas de un mismo producto**. Por ejemplo, "Codo 90°
PVC · Agua fría" es un grupo con sus 20 diámetros. La ficha técnica y la foto
son las mismas para todas las medidas, así que **se cargan una sola vez por
grupo**: 32 grupos en lugar de 443 productos sueltos.

Cada grupo aparece en la lista identificado por su código, que se lee de
izquierda a derecha separado por barras:

```
agua | conexiones | codo-90 | pvc | agua-fria
 │       │           │      │      └─ aplicación
 │       │           │      └──────── material
 │       │           └─────────────── producto
 │       └─────────────────────────── familia
 └─────────────────────────────────── línea comercial
```

### Los cinco campos

| Campo | Para qué sirve |
|---|---|
| **Identificador del grupo** | Sólo lectura. Es lo que une este grupo con sus medidas. No se puede modificar. |
| **Estado en la web** | Interruptor **Activo / Oculto**. Oculto quita el grupo y todas sus medidas del catálogo, sin borrar nada. |
| **Ficha técnica (PDF)** | Sube el PDF. Si se deja vacío, la web muestra "Ficha pendiente". |
| **Imagen del producto** | Foto del grupo. Opcional. |
| **Notas internas** | Apuntes para el equipo. **No se publican en la web.** |

### Cómo se sube una ficha técnica, paso a paso

1. Entrar en **Catálogo → Grupos de producto**.
2. Buscar el grupo en la lista y pulsarlo para desplegarlo.
3. En **Ficha técnica (PDF)**, pulsar el recuadro y elegir el archivo.
4. Pulsar **Save** (guardar) arriba a la derecha.
5. El cambio se guarda como un commit en GitHub.

> **¿Cuándo se ve el cambio en la web?** Cada guardado es un commit en GitHub,
> y GitHub publica solo en el cPanel en 1–2 minutos **una vez configurada la
> publicación** (`README-deploy.md`: cuenta FTP, secrets y la variable
> `DEPLOY_METHOD`). Si esa variable todavía no existe, el cambio queda guardado
> en GitHub pero no se publica. En GitHub → **Actions** se ve cada publicación y
> si terminó bien.

### Por qué no se pueden añadir ni borrar grupos

Los botones de añadir, eliminar, duplicar y reordenar están **desactivados a
propósito**. Los grupos los crea el importador de Excel; si se pudieran crear a
mano aquí, quedarían descolgados de los datos reales y un grupo bueno podría
perder su ficha técnica.

**Para añadir productos nuevos: se manda el Excel actualizado y se vuelve a
importar.** Los grupos nuevos aparecen solos en el panel, listos para que el
cliente les ponga ficha y foto. Lo que ya estaba cargado **no se pierde**: el
importador tiene prohibido sobreescribir `overrides.json`.

### Dónde acaban los archivos que se suben

Vale para las dos secciones del panel.

| Qué se sube | Dónde se guarda | URL pública |
|---|---|---|
| Fichas técnicas (grupos) | `public/assets/fichas-tecnicas/` | `/assets/fichas-tecnicas/...` |
| Imágenes de grupo | `public/assets/products/` | `/assets/products/...` |
| Fotos de las tarjetas de portada | `public/assets/categories/` | `/assets/categories/...` |

---

## 3. Tarjetas de portada

Es la sección **Catálogo → Tarjetas de portada**. Controla las **cuatro
tarjetas** que se ven al entrar en la página **Productos**:

| Tarjeta | A qué catálogo lleva |
|---|---|
| Tuberías FM | Tuberías, filtrado a contra incendio |
| Tuberías | Tuberías, filtrado a agua fría y caliente |
| Conexiones FM | Conexiones, filtrado a contra incendio |
| Conexiones | Conexiones, filtrado a agua fría y caliente |

### Qué puede cambiar el cliente

| Campo | Qué hace |
|---|---|
| **Título** | El texto grande debajo de la foto. Máximo 40 caracteres. |
| **Subtítulo** | La línea gris de debajo. Máximo 70. Es obligatorio, porque el sitio lo usa además como texto alternativo de la foto. |
| **Foto de la tarjeta** | La imagen. Ver más abajo el tamaño recomendado. |
| **Estado en la portada** | Interruptor **Oculta / Visible**. Oculta quita la tarjeta de la portada; las otras tres se recolocan solas para llenar la fila. |
| **Posición** | Un número del 1 al 4. 1 es la tarjeta de más a la izquierda. |

> **El orden se cambia con el número, no arrastrando.** La lista no deja
> arrastrar filas a propósito: la web ordena las tarjetas por el campo
> **Posición**, así que mover una fila en el panel no cambiaría nada en la web.
> Un botón de arrastrar sería un botón que miente.
>
> Si por descuido dos tarjetas acaban con el mismo número no se rompe nada,
> pero cuál de las dos sale antes queda al azar.

### Qué NO debe tocar, y por qué

Al final de cada tarjeta hay **tres casillas en gris que no dejan escribir**:

| Campo bloqueado | Qué es |
|---|---|
| **Identificador de la tarjeta** | El nombre interno con el que el código reconoce esta tarjeta. |
| **Familia a la que enlaza** | `tuberias` o `conexiones`. |
| **Línea comercial a la que enlaza** | `fm` (contra incendio) o `agua` (fría y caliente). |

Los dos últimos son literalmente la dirección a la que lleva la tarjeta:

```
/productos/{familia}?linea={línea}

Conexiones FM  ->  /productos/conexiones?linea=fm
```

Si se pudieran cambiar, pasaría una de dos cosas, y **ninguna daría error
visible en el panel**: la tarjeta llevaría a una página que no existe (un 404 en
la cara del cliente final), o llevaría al catálogo equivocado —la tarjeta
"Conexiones FM" abriendo el listado de agua—. Por eso están bloqueadas.

**Para cambiar a qué catálogo lleva una tarjeta hay que tocar código.** No es
un olvido: es que esa decisión va junto con las páginas que existen en el sitio.

> ⚠ **En estos tres campos el panel sólo muestra la etiqueta.** Sveltia **no
> pinta el texto de ayuda de los campos de sólo lectura** (se comprobó abriendo
> el panel: ni `hint` ni `comment` llegan a verse). Por eso la explicación del
> bloqueo está metida en el texto de arriba de la lista y en la propia etiqueta
> de cada campo, que es lo único que el cliente va a leer en pantalla. Si algún
> día se cambian esas etiquetas, hay que seguir dejando claro ahí que están
> bloqueadas.

### Tampoco se pueden añadir ni borrar tarjetas

Igual que con los grupos, los botones de añadir, borrar, duplicar y reordenar
están desactivados. Son **cuatro tarjetas fijas**, una por cada combinación de
familia y línea comercial, y cada una apunta a una página que existe de verdad.
Una tarjeta nueva creada desde el panel enlazaría a una dirección inventada.

Para **quitar** una tarjeta de la portada se usa el interruptor
**Oculta / Visible**: es reversible y no pierde nada.

### Qué foto subir

| | |
|---|---|
| **Proporción** | **4:3 apaisada** (más ancha que alta) |
| **Tamaño mínimo** | **800 x 600 píxeles**. Recomendado 1200 x 900 |
| **Formato** | **JPG o PNG** |
| **Peso** | Menos de 1 MB, para que la página siga cargando rápido en el móvil |
| **Fondo** | Blanco o gris muy claro, con el producto centrado y aire alrededor |

Dos cosas que conviene saber:

- **Si la foto no es 4:3, el sitio la recorta por el centro** (no la deforma).
  Una foto vertical pierde arriba y abajo. Por eso conviene dejar margen
  alrededor del producto.
- **Por debajo de 800 x 600 la foto se ve borrosa**, porque la tarjeta la
  amplía. Es exactamente el motivo por el que la tarjeta "Conexiones FM" no usa
  una foto: la única disponible era de 300 x 300 y se pixelaba. En su lugar
  lleva un **dibujo vectorial** (`/assets/categories/conexiones-fm.svg`), que se
  ve nítido a cualquier tamaño. Si algún día llega una foto buena del codo de
  HDPE, se sube por aquí y sustituye al dibujo sin tocar nada más.

> **El panel no acepta SVG a propósito.** El selector de archivo sólo ofrece JPG
> y PNG. Un SVG es código que se serviría desde el propio dominio del sitio, así
> que los dibujos vectoriales los pone el equipo técnico, revisados, no se suben
> desde el panel.

### Un detalle del que no hay que preocuparse

Dos de las cuatro tarjetas apuntan hoy a fotos que viven en
`public/assets/products/` en lugar de en `public/assets/categories/`. Funciona
igual: la ruta guardada es la que manda. Las fotos **nuevas** que se suban desde
el panel irán a `public/assets/categories/`, que es la carpeta de las tarjetas.

---

## 4. Qué NO se puede editar desde el panel (y por qué)

Esto es una limitación real y conviene tenerla clara desde el principio.

### Categorías → sigue siendo un cambio de código

Las categorías viven en **`src/data/categories.ts`**, que es TypeScript, o sea
**código, no datos**. Un CMS de archivos como Sveltia sabe editar JSON, YAML o
Markdown, pero no puede editar código sin arriesgarse a romper la compilación
del sitio.

Hoy hay siete categorías y sólo dos están publicadas (`tuberias` y
`conexiones`); las otras cinco tienen `visible: false`. **Publicar una categoría
nueva —o mostrar una de las ocultas— exige tocar ese archivo y volver a
desplegar.** Es un cambio de un minuto para quien programa, pero el cliente no
lo puede hacer solo.

### Certificaciones → también código, y además están apagadas

Las certificaciones viven en **`src/data/certifications.ts`**, TypeScript
igualmente, así que tampoco se pueden editar desde el panel.

Además, la sección entera está **desactivada** con un interruptor:

```ts
// src/data/certifications.ts, línea 60
export const CERTIFICATIONS_ENABLED: boolean = false;
```

Mientras esa constante valga `false`, la lista `visibleCertifications` queda
vacía y la sección no se pinta en ninguna parte de la web. Para encender la
sección hay que ponerla en `true` y volver a desplegar. El propio archivo
explica en sus comentarios (línea 50) los pasos completos.

### Medidas, SKU, materiales y diámetros → vienen del Excel

Están en `src/data/catalog/products.json` y `groups.json`, que el importador
**borra y reescribe enteros** en cada importación. Si se pudieran editar en el
panel, el siguiente Excel se llevaría por delante todo el trabajo sin avisar.
Por eso el panel sólo toca `overrides.json`, que el importador nunca sobreescribe.

---

## 5. Problemas conocidos

### El push falla por culpa del workflow

Si al subir cambios GitHub responde algo como
`refusing to allow ... without 'workflow' scope`, es por el archivo
`.github/workflows/deploy.yml`. **Ya pasó en este repositorio**: el commit
`b23c350`, llamado "push without workflow", lo que hizo fue borrar un
`deploy.yml` anterior para poder subir el resto.

Soluciones, de mejor a peor:

1. Dar el permiso `workflow` al token que se usa para hacer push
   (GitHub → Settings → Developer settings → Personal access tokens).
2. Subir el archivo desde la web de GitHub, que no tiene esa restricción.
3. **No borrarlo:** desde octubre de 2026 ese workflow es el que PUBLICA el
   sitio en el cPanel. Sin él, ningún cambio del panel llega a la web.

### El panel deja de funcionar tras una actualización

`public/admin/index.html` carga Sveltia **sin fijar la versión**, tal como
recomienda la documentación oficial, para recibir correcciones automáticamente.
Si una actualización rompiera algo, se congela la versión editando esa línea:

```html
<script src="https://unpkg.com/@sveltia/cms@0.205.2/dist/sveltia-cms.js"></script>
```

`0.205.2` es la versión que servía unpkg cuando se probó este panel. Si se quiere fijar otra,
la lista de versiones está en <https://www.npmjs.com/package/@sveltia/cms>.

### Editar `config.yml` sin romperlo

El archivo empieza con esta línea, que **no es un comentario decorativo**:

```yaml
# yaml-language-server: $schema=https://unpkg.com/@sveltia/cms/schema/sveltia-cms.json
```

Engancha el archivo al esquema oficial de Sveltia. En VS Code con la extensión
YAML, cualquier opción mal escrita o inventada sale marcada en rojo **antes** de
subirla. Merece la pena instalarla: un `config.yml` inválido deja el panel con la
pantalla "There is an error in the CMS configuration".

---

## 6. Qué se probó de verdad y qué no

Para que nadie dé por bueno algo que no se comprobó:

**Comprobado y funcionando:**

- `npm run build` termina con **0 errores y 7 páginas**, con el panel incluido.
- `dist/admin/index.html` y `dist/admin/config.yml` existen después de compilar.
- `config.yml` es YAML válido y **pasa el esquema JSON oficial de Sveltia CMS**
  sin un solo error. Se comprobó además que ese esquema rechaza opciones
  inventadas en todos los niveles usados, así que la validación tiene valor real.
- El panel **carga en el navegador** en `http://localhost:4321/admin/index.html`,
  sin errores de consola, y muestra la pantalla de entrada con las tres opciones.
- Sveltia **lee y entiende `config.yml`**: la pantalla dice "select the root
  directory of the *wretched-wasp* repository", nombre que sólo puede salir del
  `repo:` configurado. También se verificó por el lado contrario: con un
  `config.yml` roto a propósito, el panel muestra "The configuration file could
  not be parsed".

- **El editor de grupos se abrió y se comprobó campo por campo.** Como el
  diálogo de "Work with Local Repository" es del sistema operativo y no se puede
  automatizar, se hizo la prueba con una copia temporal del panel apuntada al
  backend `test-repo` (en memoria) y sembrada con entradas reales de
  `overrides.json`. Se confirmó que:
  - los grupos salen plegados, uno por fila, titulados por su identificador;
  - **no aparece ningún botón de añadir, borrar, duplicar ni reordenar**
    (las cuatro cerraduras de `config.yml` funcionan);
  - los cinco campos se pintan bien: identificador en gris y bloqueado,
    interruptor con "Oculto" a un lado y "Activo" al otro, subida de PDF, subida
    de imagen y notas, cada uno con su ayuda en español;
  - al pulsar **Save** y volver a abrir, **los identificadores siguen ahí**: los
    campos de sólo lectura sí se guardan y la forma del JSON se conserva.

  La copia temporal se borró; en `public/admin/` sólo quedan `index.html` y
  `config.yml`.

- **El editor de tarjetas de portada se abrió y se comprobó igual**, con el
  mismo montaje de repositorio en memoria. Se confirmó que:
  - la colección **Catálogo** muestra sus **dos** archivos;
  - los ocho campos se pintan con su etiqueta y su ayuda en español: contadores
    de 40 y 70 caracteres en título y subtítulo, subida de imagen **sin** la
    opción de pegar una URL, interruptor con "Oculta" y "Visible", y el número
    de posición;
  - con el `config.yml` real **no aparece el botón "Add Tarjeta"**: la cerradura
    `allow_add: false` funciona, y el único menú de la lista ofrece sólo "Revert
    Changes" (no hay ninguna vía indirecta para añadir o borrar filas);
  - **al pulsar Save, los tres campos bloqueados se guardan intactos.** Se sembró
    el repositorio de pruebas con el `cards.json` real, se cambió un título y se
    volvió a leer el archivo: `slug`, `family` y `line` siguen ahí con su valor,
    y la ruta `.svg` de "Conexiones FM" sobrevive aunque el campo sólo acepte JPG
    y PNG (el filtro `accept` limita lo que se puede subir, no lo ya guardado);
  - **descubrimiento:** en los campos de sólo lectura Sveltia pinta únicamente
    la etiqueta. Se probaron `hint` y `comment` en un campo `readonly` y **no se
    ve ninguno de los dos**. Por eso la explicación de los tres campos
    bloqueados se movió al texto de cabecera de la lista y a las etiquetas.

- **La ilustración `conexiones-fm.svg` se miró en el navegador**, no sólo se
  escribió: en la página `/productos` real (con el realce `img-bright` que el
  sitio aplica a las fotos), junto a las otras tres tarjetas, y suelta a 400 y a
  1200 píxeles de ancho. Se corrigieron tres cosas que sólo se veían al ampliar:
  el reborde de fusión parecía una arandela pegada, el codo quedaba pequeño
  dentro del encuadre, y la sombra de contacto se cortaba en seco dejando una
  raya horizontal (el margen del filtro de desenfoque era más estrecho que el
  propio desenfoque). Las tres se comprobaron midiendo el archivo ya
  rasterizado, no sólo mirándolo.

**NO comprobado (hay que hacerlo a mano):**

- **Ninguna de las dos rutas de OAuth se probó en producción.** El hosting ya
  está decidido (cPanel), pero no hay OAuth App creada ni Worker desplegado. Los pasos de la sección 1
  salen de la documentación oficial de Sveltia y de su autenticador, no de una
  instalación real de este proyecto.
- **No se probó guardar contra GitHub.** Habría hecho falta un token de acceso
  real, y eso lo tiene que hacer una persona con su propia cuenta.
