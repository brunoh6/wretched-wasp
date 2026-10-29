#!/usr/bin/env node
/**
 * Importador de catálogo: Excel -> JSON.
 *
 * Uso:  node scripts/import-products.mjs <ruta.xlsx> [--permitir-huerfanos]
 *       npm run import:productos -- <ruta.xlsx> [--permitir-huerfanos]
 *
 * POR QUÉ EXISTE ESTE SCRIPT
 * El cliente mantiene los datos masivos del catálogo en Excel (es su herramienta
 * de trabajo y no va a cambiarla). El sitio, en cambio, es estático y necesita
 * JSON. Este importador es el único puente entre ambos mundos: convierte el
 * Excel en `products.json` + `groups.json`, que se REGENERAN COMPLETOS en cada
 * ejecución y por eso NO deben editarse a mano.
 *
 * QUÉ HACE CON `overrides.json`
 * Los datos que edita una persona desde el panel (ficha técnica, foto, si el
 * grupo se publica o no) viven en `overrides.json`, un archivo aparte. Si
 * vivieran dentro de `products.json` se perderían en la siguiente importación,
 * porque ese archivo se reescribe entero.
 *
 * El importador reescribe `overrides.json` como una lista con una fila por
 * grupo del Excel, en el orden del catálogo. De cada fila escribe él mismo lo
 * que sale del Excel (`label`, `family`, `groupKey`) y COPIA TAL CUAL lo que
 * puso el panel (`visible`, `technicalSheet`, `image` y cualquier otra clave
 * que ya tuviera la fila). Los grupos nuevos entran vacíos y visibles.
 *
 * Una fila cuyo grupo ya no está en el Excel ("huérfana") no pinta nada en la
 * web. Si está vacía se retira y se informa. Si tiene datos del panel, el
 * importador SE DETIENE sin escribir nada: casi siempre es un nombre cambiado
 * en el Excel, y seguir dejaría esa ficha/foto/ocultación sin efecto mientras
 * el grupo "nuevo" sale visible y sin ficha. `--permitir-huerfanos` (detrás de
 * la ruta del Excel) sigue adelante y conserva esas filas al final, marcadas.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import * as xlsxModule from "xlsx";

// `xlsx` es un paquete CommonJS sin campo "exports": según cómo lo resuelva
// Node, los métodos pueden llegar en el namespace o en `.default`.
const XLSX = xlsxModule.read ? xlsxModule : xlsxModule.default;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(REPO_ROOT, "src", "data", "catalog");
const PRODUCTS_FILE = path.join(OUT_DIR, "products.json");
const GROUPS_FILE = path.join(OUT_DIR, "groups.json");
const OVERRIDES_FILE = path.join(OUT_DIR, "overrides.json");

/** Cabeceras que el importador necesita sí o sí. Si falta una, es error fatal. */
const REQUIRED_HEADERS = [
  "Marca",
  "Linea_Comercial",
  "Categoria_Web",
  "Solucion_Aplicacion",
  "Material",
  "Clase",
  "Diametro",
  "Unidad_Medida",
  "Presentacion",
  "Longitud",
  "Tipo_Union",
  "Uso_Principal",
  "SKU_Web"
];

/** Cabeceras opcionales: hoy vienen vacías, pero se mapean si algún día traen datos. */
const OPTIONAL_HEADERS = ["Certificacion", "SDR_RDE", "Clase_Presion", "Norma"];

const ALLOW_ORPHANS_OPTION = "--permitir-huerfanos";
const KNOWN_OPTIONS = new Set([ALLOW_ORPHANS_OPTION]);

/**
 * Orden de las claves de cada fila de `overrides.json`. El panel (Sveltia)
 * reescribe el archivo en el orden de los campos de public/admin/config.yml:
 * si ambos coinciden, ni un guardado del panel ni una importación generan
 * diffs de pura reordenación. Las claves que no están aquí (p. ej. `notes`,
 * que salió del panel) se conservan detrás, en su orden original.
 */
const OVERRIDE_KEYS = [
  "label",
  "family",
  "visible",
  "technicalSheet",
  "image",
  "title",
  "description",
  "groupKey"
];

/** Prefijo del `label` de una fila huérfana conservada con --permitir-huerfanos. */
const ORPHAN_LABEL_PREFIX = "(ya no está en el Excel) ";

// ---------------------------------------------------------------------------
// Normalización de texto
// ---------------------------------------------------------------------------

/**
 * Limpieza básica de cualquier celda: quita espacios duros (NBSP), colapsa
 * espacios repetidos y unifica el símbolo de grado.
 *
 * POR QUÉ unificamos `º` (ordinal masculino, U+00BA) con `°` (grado, U+00B0):
 * el Excel real mezcla ambos en medidas como `2" X 45°` y `2" X 45º`. Son
 * visualmente casi idénticos pero distintos para una computadora, así que sin
 * esta normalización la MISMA medida aparecería dos veces en los filtros del
 * catálogo. Verificado sobre el archivo real: unificarlos NO fusiona productos
 * distintos (el total deduplicado no cambia).
 */
function clean(value) {
  return String(value ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\u00BA/g, "\u00B0")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * slug(): minúsculas, sin tildes, sin comillas ni grados, no-alfanumérico -> "-".
 * Es la pieza con la que se arma `groupKey`, así que debe ser estable para
 * siempre: si cambia, los overrides guardados por el CMS dejan de emparejar.
 */
function slug(value) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // marcas de acento ya separadas por NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Quita tildes para comparar valores del Excel sin depender de la acentuación. */
function foldAccents(value) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

/**
 * Diccionario de palabras que el Excel escribe en MAYÚSCULAS y sin tildes.
 * Se aplica palabra por palabra para poder reconstruir nombres correctos en
 * español aunque aparezca una categoría nueva que nadie previó.
 */
const SPANISH_WORDS = {
  UNION: "Unión",
  REDUCCION: "Reducción",
  TAPON: "Tapón",
  VALVULA: "Válvula",
  CONEXION: "Conexión",
  ADAPTADOR: "Adaptador",
  MACHO: "Macho",
  HEMBRA: "Hembra",
  BRIDA: "Brida",
  CIEGA: "Ciega",
  FIJA: "Fija",
  LOCA: "Loca",
  SIMPLE: "Simple",
  UNIVERSAL: "Universal",
  TUBO: "Tubo",
  CODO: "Codo",
  TEE: "Tee",
  YEE: "Yee",
  NIPLE: "Niple",
  BUSHING: "Bushing",
  CRUZ: "Cruz",
  ABRAZADERA: "Abrazadera",
  CANALETA: "Canaleta",
  SIFON: "Sifón",
  REGISTRO: "Registro",
  TRAMPA: "Trampa"
};

/** Convierte una palabra suelta a su forma correcta en español. */
function spanishWord(word) {
  const key = foldAccents(word);
  if (SPANISH_WORDS[key]) return SPANISH_WORDS[key];
  const lower = clean(word).toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Nombre de producto en formato Título español: sólo la primera palabra va en
 * mayúscula, el resto en minúscula, con las tildes correctas.
 * "TAPON HEMBRA" -> "Tapón hembra";  "UNION UNIVERSAL" -> "Unión universal".
 */
function toProductName(value) {
  const words = clean(value).split(" ").filter(Boolean);
  if (!words.length) return "";

  return words
    .map((word, index) => {
      const fixed = spanishWord(word);
      return index === 0 ? fixed : fixed.toLowerCase();
    })
    .join(" ");
}

/**
 * ¿La categoría del Excel describe un codo? Se mira sólo la PRIMERA palabra,
 * no la cadena entera, para que una categoría futura tipo "CODO SANITARIO"
 * siga entrando por aquí sin tener que tocar el importador.
 */
function isElbowCategory(rawCategory) {
  return foldAccents(rawCategory).split(" ")[0] === "CODO";
}

/**
 * Ángulo de un codo, leído del diámetro YA NORMALIZADO por clean().
 *
 * POR QUÉ SE EXTRAE AQUÍ (decisión D5)
 * En el Excel el ángulo no tiene columna propia: viaja dentro de la medida
 * ('2" X 45°', '1" X 90° CR'). Para el cliente eso es UNA sola cosa —la medida
 * que pide por teléfono— pero para el catálogo son DOS: el producto
 * ("Codo 45°", que es como ya se llaman los de la línea FM) y la medida ('2"').
 * Separarlos en el importador hace que ambas líneas compartan nomenclatura, que
 * es justo lo que necesitan el buscador y las facetas para hablar el mismo
 * vocabulario ("Codo 45°" -> slug "codo-45", idéntico al de fmProducts.ts).
 *
 * clean() ya unificó º (U+00BA) con ° (U+00B0), así que basta con un símbolo.
 * Se acepta espacio antes del grado ("45 °") y cualquier cola detrás ("90° CR").
 * Se admiten decimales porque un codo de 22.5° es una medida real del rubro,
 * aunque hoy el archivo sólo traiga 45 y 90.
 *
 * Devuelve el ángulo ya normalizado como texto ("45", "90", "22.5") o null.
 */
const ELBOW_ANGLE_RE = /(\d{1,3}(?:[.,]\d+)?)\s*\u00B0/;

function elbowAngle(diameter) {
  const match = clean(diameter).match(ELBOW_ANGLE_RE);
  // La coma decimal se pasa a punto para que "22,5" y "22.5" no generen dos
  // productos distintos con el mismo significado.
  return match ? match[1].replace(",", ".") : null;
}

/** Marca en formato Título: "GEORG FISCHER" -> "Georg Fischer". */
function toBrand(value) {
  return clean(value)
    .split(" ")
    .filter(Boolean)
    .map((word) => spanishWord(word))
    .join(" ");
}

/**
 * Tipo de unión: se respeta tal cual cuando es una sigla corta (SP), y se pasa
 * a formato Título cuando es una palabra ("ROSCA" -> "Rosca") para que la tabla
 * del catálogo no muestre texto gritado en mayúsculas.
 */
function toJointType(value) {
  const raw = clean(value);
  if (!raw) return "";

  return raw
    .split(" ")
    .map((token) => {
      // Separadores y siglas de 1-3 letras (SP, PVC, HD…) se dejan intactos.
      if (token === "/" || /^[A-Z]{1,3}$/.test(token)) return token;
      return spanishWord(token);
    })
    .join(" ");
}

/** Formato Título simple para unidad y presentación ("PULGADAS" -> "Pulgadas"). */
function toSentence(value) {
  const raw = clean(value);
  if (!raw) return "";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

// ---------------------------------------------------------------------------
// Mapeos obligatorios del contrato de datos
// ---------------------------------------------------------------------------

/** Linea_Comercial -> family. */
function toFamily(value) {
  const key = foldAccents(value);
  if (key.startsWith("TUBER")) return "tuberias";
  if (key.includes("CONEXION") || key.includes("ACCESORIO")) return "conexiones";
  return "";
}

/** Solucion_Aplicacion -> application (y de ahí se deduce la línea comercial). */
function toApplication(value) {
  const key = foldAccents(value);
  if (key === "AGUA FRIA") return "Agua fría";
  if (key === "AGUA CALIENTE") return "Agua caliente";
  if (key === "CONTRA INCENDIO") return "Contra incendio";
  return toSentence(value);
}

/**
 * line: separa la línea nueva de agua de la línea FM (contra incendio) que ya
 * existe en `fmProducts.ts`, para que ambas puedan convivir en el catálogo.
 */
function toLine(application) {
  return foldAccents(application) === "CONTRA INCENDIO" ? "fm" : "agua";
}

/** Material -> material. */
function toMaterial(value) {
  const key = foldAccents(value);
  if (key === "PVC") return "PVC";
  if (key === "CPVC CORZAN") return "CPVC Corzan";
  if (key === "CPVC") return "CPVC";
  if (key === "HDPE") return "HDPE";
  return clean(value);
}

// ---------------------------------------------------------------------------
// Orden por diámetro
// ---------------------------------------------------------------------------

/**
 * Convierte una medida a número. Es la misma lógica que ya usa
 * `src/pages/productos/[category]/[...linea].astro` para ordenar tallas, replicada aquí
 * para que el JSON llegue pre-ordenado y la página no tenga que reordenar.
 * Entiende 1/2, 2.1/2 y 2 1/2.
 */
function parseSizeValue(size) {
  if (!size) return Number.POSITIVE_INFINITY;

  const raw = size.replace(/"/g, "").trim();
  const compact = raw.replace(/\s+/g, "").trim();

  if (/^\d+\.\d+\/\d+$/.test(compact)) {
    const [whole, fraction] = compact.split(".");
    const [num, den] = fraction.split("/").map(Number);
    return Number(whole) + num / den;
  }

  if (/^\d+\s\d+\/\d+$/.test(raw)) {
    const [whole, fraction] = raw.split(" ");
    const [num, den] = fraction.split("/").map(Number);
    return Number(whole) + num / den;
  }

  if (/^\d+\/\d+$/.test(compact)) {
    const [num, den] = compact.split("/").map(Number);
    return num / den;
  }

  const number = parseFloat(compact);
  return Number.isNaN(number) ? Number.POSITIVE_INFINITY : number;
}

/**
 * Medidas compuestas como `3" X 2"` o `2" X 45°` se convierten en una tupla
 * numérica [3, 2] / [2, 45] para ordenar primero por el diámetro principal y
 * después por el secundario (o el ángulo).
 */
function diameterSortKey(diameter) {
  return clean(diameter)
    .split(/\s+X\s+/i)
    .map((part) => parseSizeValue(part));
}

/** Compara dos tuplas de medidas; la más corta va primero si son prefijo. */
function compareDiameter(a, b) {
  const keyA = diameterSortKey(a);
  const keyB = diameterSortKey(b);
  const length = Math.max(keyA.length, keyB.length);

  for (let i = 0; i < length; i += 1) {
    const valueA = keyA[i] ?? -1;
    const valueB = keyB[i] ?? -1;
    if (valueA !== valueB) return valueA - valueB;
  }

  // Desempate textual ASCII (no `localeCompare`) para que el orden sea idéntico
  // en cualquier máquina y el JSON no genere diffs falsos en git.
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Comparación de cadenas independiente del idioma del sistema operativo. */
function compareText(a, b) {
  const keyA = slug(a);
  const keyB = slug(b);
  return keyA < keyB ? -1 : keyA > keyB ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Lectura del Excel
// ---------------------------------------------------------------------------

function readSheet(filePath, warnings) {
  // El build ESM de `xlsx` no trae `fs` incorporado, así que se le pasa el
  // buffer ya leído en vez de usar XLSX.readFile().
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });

  let sheetName = "Sheet1";
  if (!workbook.Sheets[sheetName]) {
    sheetName = workbook.SheetNames[0];
    warnings.push(
      `No se encontró la hoja "Sheet1"; se usó "${sheetName}" (la primera del archivo).`
    );
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return { fatal: `El archivo no contiene ninguna hoja legible.` };
  }

  // `raw: false` fuerza a que todo llegue como texto ya formateado, para que
  // una medida como 1/2 no se convierta en 0.5 ni en una fecha.
  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false
  });

  if (!matrix.length) {
    return { fatal: "La hoja está vacía: no hay ni fila de cabeceras." };
  }

  const headers = matrix[0].map((header) => clean(header));
  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
    blankrows: false
  });

  return { sheetName, headers, rows };
}

// ---------------------------------------------------------------------------
// Filas de overrides.json
// ---------------------------------------------------------------------------

/**
 * ¿La fila tiene algo que puso una persona desde el panel? `notes` cuenta
 * aunque ya no esté en el panel: si alguien la escribió, es trabajo humano.
 */
function hasPanelData(override) {
  return (
    override?.visible === false ||
    Boolean(clean(override?.technicalSheet)) ||
    Boolean(clean(override?.image)) ||
    Boolean(clean(override?.title)) ||
    Boolean(clean(override?.description)) ||
    Boolean(clean(override?.notes))
  );
}

/**
 * Arma una fila con las claves en el orden de OVERRIDE_KEYS. Los datos del
 * panel se copian sin pasar por clean(): una ruta de ficha puede llevar un
 * espacio duro real en el nombre del archivo, y "limpiarla" rompería el enlace.
 * `notes` vacía no se escribe: el campo salió del panel porque el repositorio
 * es público, y una clave vacía sólo invitaría a rellenarla a mano.
 */
function overrideRow({ label, family, groupKey }, previous = {}) {
  const row = {
    label,
    family,
    visible: previous.visible !== false,
    technicalSheet: typeof previous.technicalSheet === "string" ? previous.technicalSheet : "",
    image: typeof previous.image === "string" ? previous.image : "",
    title: typeof previous.title === "string" ? previous.title : "",
    description: typeof previous.description === "string" ? previous.description : "",
    groupKey
  };

  for (const [key, value] of Object.entries(previous)) {
    if (OVERRIDE_KEYS.includes(key)) continue;
    if (key === "notes" && !clean(value)) continue;
    row[key] = value;
  }

  return row;
}

/** Qué datos del panel tiene una fila, en palabras, para los mensajes. */
function describePanelData(override) {
  const parts = [];
  if (clean(override?.technicalSheet)) parts.push(`ficha "${override.technicalSheet}"`);
  if (clean(override?.image)) parts.push(`foto "${override.image}"`);
  if (override?.visible === false) parts.push("OCULTO en la web");
  if (clean(override?.title) || clean(override?.description)) parts.push("texto del producto");
  if (clean(override?.notes)) parts.push("notas");
  return parts.join(", ");
}

// ---------------------------------------------------------------------------
// Escritura idempotente
// ---------------------------------------------------------------------------

/**
 * Escribe sólo si el contenido cambió. Así una segunda ejecución seguida no
 * toca la fecha de modificación ni ensucia `git status`.
 */
function writeJsonIfChanged(filePath, data) {
  const next = `${JSON.stringify(data, null, 2)}\n`;
  const previous = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;

  if (previous === next) return false;

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, next, "utf8");
  return true;
}

// ---------------------------------------------------------------------------
// Programa principal
// ---------------------------------------------------------------------------

function main() {
  const errors = [];
  const warnings = [];

  const args = process.argv.slice(2);
  const options = args.filter((arg) => arg.startsWith("--"));
  const positional = args.filter((arg) => !arg.startsWith("--"));
  const unknownOptions = options.filter((option) => !KNOWN_OPTIONS.has(option));
  const allowOrphans = options.includes(ALLOW_ORPHANS_OPTION);

  if (unknownOptions.length || positional.length > 1) {
    if (unknownOptions.length) {
      console.error(`ERROR FATAL: opción desconocida: ${unknownOptions.join(", ")}.`);
    } else {
      // Lo típico: una ruta con espacios sin comillas llega partida en trozos.
      console.error("ERROR FATAL: se recibió más de una ruta. Si la ruta lleva espacios, ponla entre comillas.");
    }
    console.error(`Uso: node scripts/import-products.mjs <ruta.xlsx> [${ALLOW_ORPHANS_OPTION}]`);
    process.exit(1);
  }

  const inputArg = positional[0];
  if (!inputArg) {
    console.error("ERROR FATAL: falta la ruta del Excel.");
    console.error(`Uso: node scripts/import-products.mjs <ruta.xlsx> [${ALLOW_ORPHANS_OPTION}]`);
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), inputArg);
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR FATAL: no se encontró el archivo "${filePath}".`);
    process.exit(1);
  }

  const { fatal, sheetName, headers, rows } = readSheet(filePath, warnings);
  if (fatal) {
    console.error(`ERROR FATAL: ${fatal}`);
    process.exit(1);
  }

  // --- Validación de cabeceras -------------------------------------------
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length) {
    console.error("ERROR FATAL: faltan cabeceras obligatorias en la fila 1:");
    missingHeaders.forEach((header) => console.error(`  - ${header}`));
    process.exit(1);
  }

  const missingOptional = OPTIONAL_HEADERS.filter((header) => !headers.includes(header));
  if (missingOptional.length) {
    warnings.push(
      `Cabeceras opcionales ausentes (se importarán vacías): ${missingOptional.join(", ")}.`
    );
  }

  // --- Columnas 100% vacías ----------------------------------------------
  const emptyColumns = headers.filter(
    (header) => header && rows.every((row) => clean(row[header]) === "")
  );

  // --- Normalización fila por fila ---------------------------------------
  const bySku = new Map();
  const bySignature = new Map();
  const discarded = [];
  const unknownCategories = new Map();
  // D5: qué ángulo se le asignó a cada codo, indexado por SKU. Se anota durante
  // el recorrido (que es cuando se conoce la fila del Excel) pero se CUENTA más
  // abajo, ya sobre los productos deduplicados: si se contara aquí, el informe
  // diría 56 codos cuando en products.json hay 55, y ese descuadre es justo lo
  // que este informe existe para detectar.
  const elbowInfoBySku = new Map();
  const products = [];

  rows.forEach((row, index) => {
    const excelRow = index + 2; // +1 por la cabecera, +1 porque Excel empieza en 1.
    const sku = clean(row.SKU_Web);

    if (!sku) {
      errors.push(`Fila ${excelRow}: SKU_Web vacío.`);
      return;
    }

    const rawCategory = clean(row.Categoria_Web);
    const family = toFamily(row.Linea_Comercial);

    if (!family) {
      errors.push(
        `Fila ${excelRow} (${sku}): Linea_Comercial "${clean(row.Linea_Comercial)}" no se pudo mapear a tuberias/conexiones.`
      );
      return;
    }

    // Categoría sin entrada explícita en el diccionario: se acentúa con la
    // regla genérica pero se avisa, por si necesita una tilde a mano.
    if (rawCategory && !SPANISH_WORDS[foldAccents(rawCategory).split(" ")[0]]) {
      unknownCategories.set(rawCategory, (unknownCategories.get(rawCategory) ?? 0) + 1);
    }

    const application = toApplication(row.Solucion_Aplicacion);
    const material = toMaterial(row.Material);
    const line = toLine(application);
    const diameter = clean(row.Diametro);

    // D5: el codo se publica separado por ángulo ("Codo 45°" / "Codo 90°").
    // El ángulo SALE del nombre pero SE QUEDA en `diameter`, porque '2" X 45°'
    // es literalmente como figura en el maestro del cliente y como lo pide.
    let productName = toProductName(rawCategory);
    if (isElbowCategory(rawCategory)) {
      const angle = elbowAngle(diameter);
      if (angle) {
        productName = `${productName} ${angle}\u00B0`;
      }
      // Nunca se inventa un ángulo por defecto: un codo sin ángulo legible
      // sigue llamándose "Codo" y se reporta con su SKU para revisión manual.
      if (!elbowInfoBySku.has(sku)) {
        elbowInfoBySku.set(sku, { angle, diameter, excelRow });
      }
    }

    const product = {
      sku,
      groupKey: [line, family, slug(productName), slug(material), slug(application)].join("|"),
      line,
      family,
      productName,
      brand: toBrand(row.Marca),
      material,
      application,
      typeClass: clean(row.Clase),
      pressureClass: clean(row.Clase_Presion),
      certification: clean(row.Certificacion),
      sdrRde: clean(row.SDR_RDE),
      diameter,
      unit: toSentence(row.Unidad_Medida),
      presentation: toSentence(row.Presentacion),
      length: clean(row.Longitud),
      standard: clean(row.Norma),
      jointType: toJointType(row.Tipo_Union),
      mainUse: clean(row.Uso_Principal)
    };

    // Firma de especificación: todo lo que define físicamente al producto,
    // SIN el SKU. Sirve para cazar filas repetidas con códigos distintos.
    const signature = [
      product.line,
      product.family,
      product.productName,
      product.brand,
      product.material,
      product.application,
      product.typeClass,
      product.diameter,
      product.unit,
      product.presentation,
      product.length,
      product.jointType,
      product.mainUse
    ]
      .map((value) => foldAccents(value))
      .join("|");

    // --- Deduplicación 1: por SKU ----------------------------------------
    const previousBySku = bySku.get(sku);
    if (previousBySku) {
      if (previousBySku.signature === signature) {
        discarded.push(
          `${sku} (fila ${excelRow}) — repetido exacto de la fila ${previousBySku.excelRow}.`
        );
      } else {
        discarded.push(
          `${sku} (fila ${excelRow}) — MISMO SKU con especificación distinta a la fila ${previousBySku.excelRow}; se conservó la primera.`
        );
        warnings.push(
          `SKU "${sku}" aparece con dos especificaciones distintas (filas ${previousBySku.excelRow} y ${excelRow}). Revisar el Excel: se conservó la fila ${previousBySku.excelRow}.`
        );
      }
      return;
    }

    // --- Deduplicación 2: por firma de especificación --------------------
    const previousBySignature = bySignature.get(signature);
    if (previousBySignature) {
      discarded.push(
        `${sku} (fila ${excelRow}) — especificación idéntica a ${previousBySignature.sku} (fila ${previousBySignature.excelRow}); se conservó la primera.`
      );
      warnings.push(
        `Dos SKU distintos describen el mismo producto: "${previousBySignature.sku}" y "${sku}" (${product.productName} ${product.material} ${product.diameter}). Se conservó "${previousBySignature.sku}".`
      );
      return;
    }

    bySku.set(sku, { excelRow, signature });
    bySignature.set(signature, { excelRow, sku });
    products.push(product);
  });

  // D5: recuento definitivo, ya sobre los productos que de verdad se publican.
  const elbowAngleCounts = new Map();
  const elbowsWithoutAngle = [];
  for (const product of products) {
    const info = elbowInfoBySku.get(product.sku);
    if (!info) continue; // no es un codo
    if (info.angle) {
      elbowAngleCounts.set(info.angle, (elbowAngleCounts.get(info.angle) ?? 0) + 1);
    } else {
      elbowsWithoutAngle.push({ sku: product.sku, diameter: info.diameter, excelRow: info.excelRow });
    }
  }

  // Un codo sin ángulo legible no es fatal (el producto existe y se publica
  // como "Codo"), pero sí es algo que alguien tiene que mirar en el Excel: por
  // eso sube a AVISOS y hace que el informe termine en "COMPLETADA con avisos".
  if (elbowsWithoutAngle.length) {
    warnings.push(
      `${elbowsWithoutAngle.length} codo(s) sin ángulo legible en Diametro: se publican como "Codo" (sin separar). Revisar el Excel; el detalle está en el bloque "Codos separados por ángulo".`
    );
  }

  if (errors.length) {
    console.error("\nERRORES FATALES:");
    errors.forEach((error) => console.error(`  - ${error}`));
    console.error("\nNo se escribió ningún archivo.");
    process.exit(1);
  }

  // --- Orden estable ------------------------------------------------------
  products.sort(
    (a, b) =>
      compareText(a.family, b.family) ||
      compareText(a.productName, b.productName) ||
      compareText(a.material, b.material) ||
      compareText(a.application, b.application) ||
      compareDiameter(a.diameter, b.diameter) ||
      // El SKU es único, así que garantiza un orden total y por tanto
      // idempotencia: dos ejecuciones producen exactamente el mismo archivo.
      compareText(a.sku, b.sku)
  );

  // --- Grupos -------------------------------------------------------------
  const groupMap = new Map();
  for (const product of products) {
    let group = groupMap.get(product.groupKey);

    if (!group) {
      group = {
        groupKey: product.groupKey,
        label: `${product.productName} ${product.material} · ${product.application}`,
        line: product.line,
        family: product.family,
        productName: product.productName,
        material: product.material,
        application: product.application,
        skuCount: 0,
        diameters: []
      };
      groupMap.set(product.groupKey, group);
    }

    group.skuCount += 1;
    if (!group.diameters.includes(product.diameter)) {
      group.diameters.push(product.diameter);
    }
  }

  const groups = [...groupMap.values()].sort(
    (a, b) =>
      compareText(a.family, b.family) ||
      compareText(a.productName, b.productName) ||
      compareText(a.material, b.material) ||
      compareText(a.application, b.application) ||
      compareText(a.groupKey, b.groupKey)
  );

  groups.forEach((group) => {
    group.diameters.sort(compareDiameter);
  });

  // --- Overrides: datos del panel ------------------------------------------
  let existingOverrides = [];
  let overridesShape = "nuevo";

  if (fs.existsSync(OVERRIDES_FILE)) {
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(OVERRIDES_FILE, "utf8"));
    } catch (error) {
      // Nunca se sobreescribe un overrides.json ilegible: contiene trabajo
      // humano hecho desde el panel que no se puede reconstruir.
      console.error(
        `ERROR FATAL: "${OVERRIDES_FILE}" existe pero no es JSON válido (${error.message}).`
      );
      console.error("No se escribió ningún archivo. Corrige el JSON y vuelve a ejecutar.");
      process.exit(1);
    }

    if (Array.isArray(parsed)) {
      existingOverrides = parsed;
      overridesShape = "lista";
    } else if (Array.isArray(parsed?.overrides)) {
      // Forma anterior a 2026-10: { "overrides": [...] }. Se lee y se pasa a lista.
      existingOverrides = parsed.overrides;
      overridesShape = "antigua { overrides: [...] }";
    } else {
      console.error(
        `ERROR FATAL: "${OVERRIDES_FILE}" no tiene la forma esperada (una lista de grupos).`
      );
      console.error("No se escribió ningún archivo. Revisa el archivo y vuelve a ejecutar.");
      process.exit(1);
    }
  }

  // Si un groupKey aparece dos veces se queda la ÚLTIMA fila, porque es la que
  // usa index.ts (un Map por groupKey): así importar no cambia lo que muestra
  // la web. Se avisa para que una persona revise la que se descarta.
  const existingByKey = new Map();
  const duplicatedKeys = new Set();
  const rowsWithoutKey = [];
  for (const override of existingOverrides) {
    const key = override?.groupKey;
    if (typeof key !== "string" || !key) {
      rowsWithoutKey.push(override);
      continue;
    }
    if (existingByKey.has(key)) duplicatedKeys.add(key);
    existingByKey.set(key, override);
  }
  duplicatedKeys.forEach((key) =>
    warnings.push(
      `overrides.json tenía el grupo "${key}" repetido; se conservó la última fila, que es la que usaba la web.`
    )
  );

  const groupKeys = new Set(groups.map((group) => group.groupKey));
  const keptCount = groups.filter((group) => existingByKey.has(group.groupKey)).length;
  const newGroups = groups.filter((group) => !existingByKey.has(group.groupKey));

  const orphanOverrides = [
    ...[...existingByKey.values()].filter((override) => !groupKeys.has(override.groupKey)),
    ...rowsWithoutKey
  ];
  const orphansWithData = orphanOverrides.filter(hasPanelData);
  const retiredOrphans = orphanOverrides.filter((override) => !hasPanelData(override));

  if (orphansWithData.length && !allowOrphans) {
    // Un parecido es un grupo nuevo que coincide en 4 de las 5 piezas del
    // groupKey: lo normal cuando el Excel reescribe un material o un producto.
    const pieces = (key) => String(key ?? "").split("|");
    console.error("\nERROR FATAL: hay datos del panel en grupos que ya no están en el Excel.");
    console.error("Si se siguiera, esos datos dejarían de verse en la web (y si el grupo sólo cambió de nombre,");
    console.error("el grupo con el nombre nuevo saldría visible y sin ficha ni foto):");
    for (const override of orphansWithData) {
      const orphanPieces = pieces(override?.groupKey);
      const similar = newGroups
        .filter(
          (group) =>
            pieces(group.groupKey).filter((piece, index) => piece === orphanPieces[index]).length >= 4
        )
        .map((group) => `"${group.label}" (${group.groupKey})`);
      console.error(`  - ${override?.groupKey ?? "(fila sin groupKey)"}: ${describePanelData(override)}`);
      if (similar.length) console.error(`      ¿Ahora se llama ${similar.join(" o ")}?`);
    }
    console.error("\nNo se escribió ningún archivo. Hay dos salidas:");
    console.error("  1. Si fue un error del Excel, corrígelo y vuelve a importar.");
    console.error("  2. Si el cambio es correcto, copia esos datos a la fila del grupo nuevo en");
    console.error("     overrides.json (o vuelve a cargarlos desde el panel después) y repite así:");
    console.error(`     npm run import:productos -- "<ruta.xlsx>" ${ALLOW_ORPHANS_OPTION}`);
    process.exit(1);
  }

  // Una fila por grupo del Excel, en el orden del catálogo (el de groups.json):
  // un grupo nuevo queda junto a sus parientes y no al final del archivo.
  const liveOverrides = groups.map((group) => overrideRow(group, existingByKey.get(group.groupKey)));

  // Con --permitir-huerfanos las filas con datos se conservan al final, con
  // un `label` que dice por qué no se ven en la web.
  const keptOrphans = orphansWithData.map((override) => {
    const key = String(override?.groupKey ?? "");
    return overrideRow(
      {
        label: `${ORPHAN_LABEL_PREFIX}${key}`,
        family: override?.family ?? key.split("|")[1] ?? "",
        groupKey: override?.groupKey
      },
      override
    );
  });
  if (keptOrphans.length) {
    warnings.push(
      `${keptOrphans.length} fila(s) del panel sin grupo en el Excel se conservaron por ${ALLOW_ORPHANS_OPTION}: no se ven en la web. Revisa el bloque "Datos del panel".`
    );
  }

  const mergedOverrides = [...liveOverrides, ...keptOrphans];

  // --- Escritura ----------------------------------------------------------
  const sourceName = path.basename(filePath);
  const productsChanged = writeJsonIfChanged(PRODUCTS_FILE, {
    source: sourceName,
    products
  });
  const groupsChanged = writeJsonIfChanged(GROUPS_FILE, { groups });
  const overridesChanged = writeJsonIfChanged(OVERRIDES_FILE, mergedOverrides);

  // --- Informe de validación ---------------------------------------------
  const withoutSheet = liveOverrides.filter((override) => !clean(override.technicalSheet)).length;

  const line = "-".repeat(64);
  console.log(`\n${line}`);
  console.log("INFORME DE VALIDACIÓN DEL CATÁLOGO");
  console.log(line);
  console.log(`Archivo origen ........... ${sourceName}`);
  console.log(`Hoja leída ............... ${sheetName}`);
  console.log(`Filas leídas ............. ${rows.length}`);
  console.log(`Productos importados ..... ${products.length}`);
  console.log(`Duplicados descartados ... ${discarded.length}`);
  discarded.forEach((item) => console.log(`   · ${item}`));
  console.log(`Grupos detectados ........ ${groups.length}`);
  console.log(`Grupos sin ficha técnica . ${withoutSheet} de ${groups.length}`);

  // --- D5: codos separados por ángulo ------------------------------------
  // Se lista lo que se ENCONTRÓ, no lo que se esperaba: si el Excel trae un
  // ángulo nuevo (22.5°, 11.25°…) aparece aquí solo, sin tocar el importador.
  const sortedAngles = [...elbowAngleCounts.entries()].sort(
    (a, b) => Number(a[0]) - Number(b[0])
  );
  const elbowTotal = sortedAngles.reduce((sum, [, count]) => sum + count, 0);

  console.log(`\nCodos separados por ángulo (D5): ${elbowTotal} con ángulo, ${elbowsWithoutAngle.length} sin ángulo`);
  if (sortedAngles.length) {
    sortedAngles.forEach(([angle, count]) => {
      console.log(`   · Codo ${angle}\u00B0 -> ${count} SKU (grupo "${slug(`Codo ${angle}\u00B0`)}")`);
    });
  } else {
    console.log("   · No se detectó ningún codo en este archivo.");
  }
  if (elbowsWithoutAngle.length) {
    console.log(`   · SIN ÁNGULO (se quedan como "Codo", no se inventa ninguno):`);
    elbowsWithoutAngle.forEach((item) =>
      console.log(`       - ${item.sku} (fila ${item.excelRow}) diámetro "${item.diameter}"`)
    );
  }

  console.log(`\nCategorías sin tilde definida en el diccionario: ${unknownCategories.size}`);
  if (unknownCategories.size) {
    [...unknownCategories.entries()].forEach(([category, count]) => {
      console.log(
        `   · "${category}" (${count} filas) -> se importó como "${toProductName(category)}". Revisar acentuación.`
      );
    });
  }

  console.log(`\nColumnas 100% vacías en el Excel: ${emptyColumns.length}`);
  emptyColumns.forEach((column) => console.log(`   · ${column}`));

  console.log(`\nDatos del panel (overrides.json):`);
  console.log(
    overridesShape === "nuevo"
      ? "   · Archivo creado por primera vez."
      : `   · Archivo leído (forma: ${overridesShape}).`
  );
  console.log(
    `   · Conservados ${keptCount} / Retirados ${retiredOrphans.length} / Nuevos ${newGroups.length}`
  );
  console.log(`   · Conservados: grupos que siguen en el Excel, con ficha, foto y visibilidad intactas.`);
  if (retiredOrphans.length) {
    console.log(`   · Retirados (su grupo ya no está en el Excel y la fila estaba vacía):`);
    retiredOrphans.forEach((override) =>
      console.log(`       - ${override?.groupKey ?? "(fila sin groupKey)"}`)
    );
  }
  if (newGroups.length) {
    console.log(`   · Nuevos (entran visibles y sin ficha ni foto):`);
    newGroups.forEach((group) => console.log(`       - ${group.label}`));
  }
  if (keptOrphans.length) {
    console.log(
      `   · Huérfanos CON datos conservados por ${ALLOW_ORPHANS_OPTION} (no se ven en la web): ${keptOrphans.length}`
    );
    orphansWithData.forEach((override) =>
      console.log(`       - ${override?.groupKey ?? "(fila sin groupKey)"}: ${describePanelData(override)}`)
    );
  }

  if (warnings.length) {
    console.log(`\nAVISOS (${warnings.length}):`);
    warnings.forEach((warning) => console.log(`   · ${warning}`));
  } else {
    console.log("\nAVISOS: ninguno.");
  }

  console.log("\nArchivos escritos:");
  console.log(`   · products.json  ${productsChanged ? "actualizado" : "sin cambios"}`);
  console.log(`   · groups.json    ${groupsChanged ? "actualizado" : "sin cambios"}`);
  console.log(`   · overrides.json ${overridesChanged ? "actualizado" : "sin cambios"}`);
  console.log(`${line}`);
  console.log(
    warnings.length
      ? "Resultado: importación COMPLETADA con avisos (revisar arriba)."
      : "Resultado: importación COMPLETADA sin incidencias."
  );
  console.log(`${line}\n`);

  process.exit(0);
}

main();
