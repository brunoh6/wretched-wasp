# Cómo se actualiza el catálogo

Este documento explica cómo cargar productos nuevos al sitio a partir de un
Excel. Está dividido en dos partes: la primera no requiere conocimientos
técnicos, la segunda sí.

---

## Parte 1 — Para quien administra el contenido

### Las dos reglas de oro

1. **El Excel manda sobre los datos técnicos.** Medidas, materiales, SKU,
   diámetros, tipo de unión… todo eso se cambia en el Excel, nunca en la web.
2. **El panel de administración (CMS) manda sobre lo visual.** La ficha técnica
   en PDF, la foto del producto y el botón de publicar/ocultar se cambian desde
   el CMS, nunca en el Excel.

Las dos cosas conviven sin pisarse. Puedes mandar un Excel nuevo diez veces y
**las fichas, fotos, textos y ocultaciones que cargaste en el CMS se conservan**,
siempre que el producto siga llamándose igual en el Excel (mismo producto,
material y aplicación). Si el Excel le cambia el nombre a un producto que ya
tenía ficha, foto, texto u ocultación, la importación **se detiene sin tocar nada** y
dice qué producto es y cómo se llama ahora, para que nadie pierda ese trabajo
sin enterarse (ver "Productos que cambian de nombre" en la Parte 2).

### Actualizar el catálogo con un Excel nuevo

Son dos comandos. Se los pasas a la persona técnica, o los ejecutas tú desde la
carpeta del proyecto:

```bash
npm run import:productos -- "/ruta/al/archivo.xlsx"
npm run build
```

El primero convierte el Excel en datos para la web. El segundo publica el sitio.

### Qué NO se toca a mano, nunca

| Archivo | Quién lo escribe |
| --- | --- |
| `src/data/catalog/products.json` | El importador. **Se borra y se reescribe entero en cada importación.** |
| `src/data/catalog/groups.json` | El importador. Igual que el anterior. |
| `src/data/catalog/overrides.json` | **El CMS** (ficha, foto, texto, visible) y el importador (la lista de filas y sus nombres). El importador nunca cambia lo que puso el CMS. |

Si editas `products.json` o `groups.json` a mano, tu cambio desaparecerá la
próxima vez que se importe un Excel. Si quieres cambiar un dato técnico,
cámbialo en el Excel.

### Qué es un "grupo"

El catálogo no gestiona los productos de uno en uno, sino por grupos. Un grupo
es, por ejemplo, **"Codo PVC · Agua fría"**, que reúne todas sus medidas.

Esto importa porque **la ficha técnica y la foto se cargan una vez por grupo**,
no una vez por medida. Con el Excel actual eso significa gestionar 32 fichas en
lugar de 443. Si ocultas un grupo desde el CMS, desaparecen del catálogo todas
sus medidas a la vez.

---

## Parte 2 — Para la persona técnica

### Requisito previo

Astro rechaza Node 18. Si `npm` por defecto apunta a Node 18, antepón la ruta de
Homebrew:

```bash
PATH=/opt/homebrew/bin:$PATH npm run import:productos -- "/ruta/al/archivo.xlsx"
PATH=/opt/homebrew/bin:$PATH npm run build
```

### Arquitectura de datos

```
Excel  ──▶  scripts/import-products.mjs  ──▶  products.json  ─┐
                                          ──▶  groups.json   ─┼─▶  src/data/catalog/index.ts  ──▶  páginas
                       (filas y nombres)  ──▶                 │
CMS    ──────── (ficha, foto, visible) ──▶  overrides.json  ───┘
```

`src/data/catalog/index.ts` es la única puerta de entrada para las páginas.
Fusiona la especificación con los datos del CMS y expone:

- `allProducts`, `allGroups` — todo, con la presentación ya heredada.
- `getProductsByFamily(family)` — sólo productos de grupos visibles.
- `getGroupsByFamily(family)` — sólo grupos visibles.

La unión se hace por `groupKey`, que se construye así:

```
[line, family, slug(productName), slug(material), slug(application)].join("|")
// agua|conexiones|brida-loca|cpvc-corzan|agua-caliente
```

> **`groupKey` es una clave permanente.** Es lo que empareja un override del CMS
> con su grupo. Si cambias la forma de generarla, todas las fichas y fotos
> cargadas quedan huérfanas y hay que volver a asignarlas a mano.

### Forma de `overrides.json`

Una **lista en la raíz** del archivo, con una fila por grupo del Excel, en el
mismo orden que `groups.json` (familia → producto → material → aplicación).
Es la forma que pide la colección de un solo archivo del panel (Sveltia).

```json
[
  {
    "label": "Brida loca PVC · Agua fría",
    "family": "conexiones",
    "visible": true,
    "technicalSheet": "/assets/panel/fichas/especificaciones-brida-loca-pvc-georg-fischer.pdf",
    "image": "",
    "title": "",
    "description": "",
    "groupKey": "agua|conexiones|brida-loca|pvc|agua-fria"
  }
]
```

| Clave | Quién la escribe | Para qué |
| --- | --- | --- |
| `label` | Importador (sale de `groups.json`) | Título legible de la fila en el panel. La web no la usa. |
| `family` | Importador | `tuberias` o `conexiones`: enlace de vista previa del panel. La web no la usa. |
| `visible` | CMS | `false` oculta el grupo entero de la web. |
| `technicalSheet` | CMS | Ruta del PDF. Vacío = "Ficha pendiente". |
| `image` | CMS | Ruta de la foto. Vacío = sin foto. |
| `title` | CMS | Título del texto del producto. Vacío = sin título. |
| `description` | CMS | Texto del producto (`src/data/productTexts.ts`). Por ahora sólo lo muestra Tuberías. |
| `groupKey` | Importador | Une la fila con su grupo. No se cambia nunca a mano. |

**El orden de las claves es fijo** (`label, family, visible, technicalSheet,
image, title, description, groupKey`) y debe coincidir con el orden de los campos de la colección en
`public/admin/config.yml`: el panel reescribe el archivo en el orden de su
config, y si ambos coinciden ni un guardado ni una importación generan diffs de
pura reordenación. Si una fila trae otras claves, el importador las conserva
detrás, en su orden.

**Ya no hay `notes`.** El repositorio es público, así que cualquier "nota
interna" se podía leer en GitHub. El campo salió del panel y el importador ya no
escribe `notes` vacías. Si alguna fila tuviera una nota escrita, se conserva
tal cual (es trabajo de alguien), y `index.ts` sigue entregando `notes: ""`
cuando falta, así que la API del catálogo no cambia.

`index.ts` acepta también la forma anterior (`{ "overrides": [...] }`) y el
importador la convierte a lista la primera vez que se ejecuta.

### Productos que cambian de nombre (filas huérfanas)

Una fila es **huérfana** cuando su `groupKey` ya no sale del Excel: casi
siempre porque el Excel cambió el nombre del producto, del material o de la
aplicación (por ejemplo, `CPVC CORZAN` → `CPVC`). Una fila huérfana no pinta
nada en la web. El importador hace esto:

- **Huérfana vacía** (visible, sin ficha, sin foto, sin texto, sin notas): se **retira**
  sola y el informe la lista en "Retirados".
- **Huérfana con datos** (ficha, foto, texto, oculta o notas): la importación **se
  detiene sin escribir ningún archivo**, lista esas filas y sugiere el grupo
  nuevo que más se le parece. Hay dos salidas:
  1. Si fue un error del Excel, corregirlo y volver a importar.
  2. Si el cambio de nombre es correcto, copiar la ficha/foto/visible a la fila
     del grupo nuevo (o volver a cargarlos desde el panel después) y repetir con
     la opción `--permitir-huerfanos`, **escrita después de la ruta del Excel**:

     ```bash
     npm run import:productos -- "/ruta/al/archivo.xlsx" --permitir-huerfanos
     ```

     Con esa opción las huérfanas con datos se conservan al final del archivo,
     con `label` = `(ya no está en el Excel) <groupKey>`, para que se puedan
     revisar o borrar a mano. Una opción mal escrita detiene la importación.

### Garantías del importador

- **Idempotente.** Ejecutarlo dos veces seguidas produce archivos byte a byte
  idénticos; sólo escribe si el contenido cambió, así que no ensucia `git`.
- **No pierde trabajo del CMS en silencio.** De cada fila copia intactos
  `visible`, `technicalSheet` e `image` (y cualquier otra clave que tenga).
  Sólo escribe él `label`, `family` y `groupKey`. Retira únicamente filas
  huérfanas vacías, y se detiene si una huérfana tiene datos.
- **Aborta sin escribir nada** si falta una cabecera obligatoria, si algún
  `SKU_Web` está vacío, si `overrides.json` no es JSON válido o no tiene una
  forma reconocible, o si hay huérfanas con datos y no se pasó
  `--permitir-huerfanos`.

### Normalizaciones que aplica

- Texto a formato español: `GEORG FISCHER` → `Georg Fischer`, `TAPON HEMBRA` →
  `Tapón hembra`, `PULGADAS` → `Pulgadas`.
- Espacios duros (NBSP) y espacios repetidos.
- El símbolo `º` (ordinal, U+00BA) se unifica con `°` (grado, U+00B0). El Excel
  mezcla ambos en medidas como `2" X 45°` y `2" X 45º`; sin esto, la misma
  medida aparecería duplicada en los filtros del catálogo.
- Orden estable: familia → producto → material → aplicación → diámetro
  ascendente → SKU. El diámetro se ordena numéricamente entendiendo `1/2`,
  `2.1/2` y compuestos como `3" X 2"`.

### El informe de validación

Cada ejecución imprime un informe. Qué mirar:

| Línea | Qué significa |
| --- | --- |
| `Filas leídas` | Filas de datos del Excel (sin la cabecera). |
| `Productos importados` | Los que quedaron tras deduplicar. |
| `Duplicados descartados` | Filas repetidas, con su SKU y su número de fila en el Excel. |
| `Grupos detectados` | Grupos únicos. Debería coincidir con lo que ve el CMS. |
| `Grupos sin ficha técnica` | Cuántos grupos están pendientes de PDF. Se publican igual, mostrando "Ficha pendiente". |
| `Categorías sin tilde definida` | Una categoría nueva del Excel que el diccionario no conocía. Se acentúa con una regla genérica: **conviene revisarla a ojo**. |
| `Columnas 100% vacías` | Columnas del Excel sin ningún dato. Informativo. |
| `Datos del panel` | `Conservados N / Retirados M / Nuevos K`: filas cuyo grupo sigue en el Excel (con sus datos intactos), huérfanas vacías retiradas y grupos nuevos (entran visibles y sin ficha). Lista los retirados y los nuevos por nombre. |
| `AVISOS` | No detienen la importación, pero indican datos sucios en el Excel que alguien debería corregir. |

**Códigos de salida:** `0` si todo fue bien (aunque haya avisos), `1` si hubo un
error fatal. En caso de error fatal no se escribe ningún archivo.

#### Duplicados: los dos tipos

El importador deduplica por dos criterios distintos, y conviene entender la
diferencia porque se corrigen de forma distinta:

1. **Mismo SKU repetido.** Dos filas con el mismo `SKU_Web`. Se conserva la
   primera. Si además las dos filas describen productos *distintos*, se emite un
   aviso: es un error de datos que hay que arreglar en el Excel.
2. **Misma especificación con SKU distinto.** Dos filas que describen
   exactamente el mismo producto físico pero con códigos diferentes. Se conserva
   la primera y se avisa, porque significa que hay un SKU duplicado en el
   maestro de productos.

En el Excel `23-08-26-Products.xlsx` hay exactamente un caso de cada tipo: 445
filas leídas, 443 productos importados.

---

## Fichas técnicas pendientes de producto (sept-2026)

Con el lote de fichas de septiembre 2026 llegaron **tres PDFs de productos que
no existen en el Excel maestro**. Por la regla de oro n.º 1 (el Excel es la
única fuente de productos), **no se crearon productos nuevos para ellos**: los
PDFs se copiaron a `public/assets/fichas-tecnicas/` y quedan aquí registrados
a la espera de que el producto aparezca en un Excel futuro.

| Ficha (en `public/assets/fichas-tecnicas/`) | Producto que falta en el Excel |
| --- | --- |
| `ESPECIFICACIONES TAPON HDPE FM SDR9 GEORG FISCHER.pdf` | Tapón HDPE FM Georg Fischer (sólo existe el tapón Integrity) |
| `ESPECIFICACIONES ACOPLE FM ELECTROFUSION_ Coupling -360000936 GEORG FISCHER.pdf` | Acople por electrofusión HDPE FM Georg Fischer. **Ojo:** el nombre real del archivo lleva un espacio duro (NBSP, U+00A0) invisible entre `Coupling` y `-360000936`; se copió tal cual llegó del cliente. Al enlazarlo, copiar el nombre desde el propio archivo, no desde esta tabla. |
| `ESPECIFICACIONES TEE Reducing-Tee-Sell-Sheet-041320-1 FM INTEGRITY.pdf` | Tee reducida HDPE FM Integrity (la tee del Excel es la tee igual) |

Cuando alguno de estos productos entre en el Excel, basta con importar el Excel
y enlazar la ficha ya publicada (en la línea FM se enlaza vía
`TECH_SHEETS`/`resolveTechnicalSheet` en `src/data/fmProducts.ts`; recuerda la
regla de anclas: verificar con los ojos en qué página está la tabla antes de
añadir `#page=N`).
