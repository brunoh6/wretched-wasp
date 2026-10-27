// /src/data/catalogDisplayItems.ts
//
// Fuente única de las filas que pinta el catálogo (/productos/[category]).
//
// ─────────────────────────────────────────────────────────────────────────────
// LAS DOS LÍNEAS QUE SE FUSIONAN AQUÍ
// ─────────────────────────────────────────────────────────────────────────────
//   "fm"   -> src/data/fmProducts.ts  : 36 productos contra incendio, con
//             certificación FM Approved y ficha técnica en PDF. Cada entrada es
//             una COMBINACIÓN comercial (marca + material + SDR + presión) y
//             lleva su rango de medidas ('2" - 16"').
//   "agua" -> src/data/catalog/*.json : la línea nueva de agua fría / caliente
//             importada del Excel. Llega como 443 SKU (PD00879), uno por medida,
//             y aquí se AGRUPA en combinaciones comerciales igual que la FM, con
//             su rango de medidas. Todavía no tiene certificación ni ficha.
//
// Se publican en la misma tabla porque el usuario compra por familia (tubos,
// conexiones), no por línea comercial. Para que no se confundan, cada fila
// declara `line` y `application` y el catálogo pinta una insignia distinta.
//
// ─────────────────────────────────────────────────────────────────────────────
// POR QUÉ catalogMatrix.ts YA NO ALIMENTA EL CATÁLOGO
// ─────────────────────────────────────────────────────────────────────────────
// `src/data/catalogMatrix.ts` son DATOS DE PRUEBA: sus propias notas lo dicen
// ("Medidas temporales de prueba para validación visual") y sus marcas y medidas
// nunca se verificaron con ningún proveedor.
//
// Hasta hoy no aparecían en producción por accidente, no por diseño:
// `getCatalogDisplayItemsByCategory()` exigía ficha técnica y ninguno de esos
// ~27 registros tiene una. La línea de agua se publica SIN ficha (el CMS las irá
// cargando), así que ese filtro desaparece; si catalogMatrix siguiera enchufado,
// sus filas inventadas saldrían a producción el mismo día que las de agua.
//
// El archivo se conserva en el repo —sus categorías siguen siendo el borrador de
// lo que falta por publicar— pero queda DESCONECTADO del pipeline de
// visualización. Para reactivarlo hay que validar antes cada medida con el
// fabricante y darle ficha técnica.

import { allProducts, type CatalogProduct } from "./catalog";
import { fmProducts } from "./fmProducts";

/**
 * Origen de los datos de la fila. Hoy coincide 1:1 con `line` (cada línea
 * comercial vive en su propio archivo), pero son conceptos distintos: `source`
 * dice de qué archivo salió y `line` es lo que ve el cliente.
 */
export type CatalogDisplaySource = "fm" | "agua";

/** Línea comercial: "fm" = contra incendio, "agua" = agua fría/caliente. */
export type CatalogDisplayLine = "fm" | "agua";

export type CatalogDisplayItem = {
  source: CatalogDisplaySource;
  line: CatalogDisplayLine;
  category: string;
  subcategory: string;
  /** "Contra incendio" | "Agua fría" | "Agua caliente". Alimenta la faceta. */
  application: string;
  brand: string;
  productName: string;
  material: string;
  filterMaterial?: string;
  materialAliases: string[];
  typeClass: string;
  pressureClass?: string;
  certification?: string;
  sizes: string[];
  sizeRange?: string;
  unit?: "Pulgadas" | "MM";
  presentation?: string;
  length?: string;
  standard?: string;
  jointType?: string;
  mainUse?: string;
  rawMaterial?: string;
  technicalSheet?: string;
  suggestedUrl?: string;
  productImage?: string;
  webSku?: string;
  visible: boolean;
  notes?: string;
};

/** "" y "PENDIENTE" significan lo mismo: todavía no hay PDF que enlazar. */
function normalizeTechnicalSheet(value?: string) {
  if (!value || value === "PENDIENTE") return undefined;
  return value;
}

/** Convierte "" en undefined para que las facetas no generen opciones vacías. */
function optional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Alias de material de la línea de agua.
 *
 * "Corzan" es la marca comercial del CPVC de Lubrizol, no un material aparte:
 * si no se desdobla, la leyenda de la tabla mostraría "CPVC CORZAN" sin
 * descripción y la foto genérica caería en la de PVC. Con el alias "CPVC" al
 * frente, leyenda e imagen aciertan sin tocar el dato original.
 */
const AGUA_MATERIAL_ALIASES: Record<string, string[]> = {
  "CPVC Corzan": ["CPVC", "Corzan"],
  PVC: ["PVC"]
};

function aguaMaterialAliases(material: string) {
  return AGUA_MATERIAL_ALIASES[material] ?? [material];
}

function expandFmItems(): CatalogDisplayItem[] {
  return fmProducts.map(product => ({
    source: "fm" as const,
    line: "fm" as const,
    category: product.productFamily,
    subcategory: product.solutionApplication.toLowerCase(),
    application: product.solutionApplication,
    brand: product.brand,
    productName: product.webCategory,
    material: product.material,
    filterMaterial: product.filterMaterial,
    materialAliases: [product.material],
    typeClass: product.sdrRde,
    pressureClass: product.pressureClass,
    certification: product.certification,
    sizes: product.diameters || [],
    sizeRange: product.diameter,
    unit: product.unit,
    presentation: product.presentation,
    length: product.length,
    standard: product.standard,
    jointType: product.jointType,
    mainUse: product.mainUse,
    rawMaterial: product.rawMaterial,
    productImage: product.productImage,
    technicalSheet: normalizeTechnicalSheet(product.technicalSheet),
    suggestedUrl: product.suggestedUrl,
    webSku: product.webSku,
    visible: true
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIDAS: ORDEN Y ETIQUETA
// ─────────────────────────────────────────────────────────────────────────────
// Estas funciones son el gemelo en tiempo de build de las que el catálogo ya usa
// en el navegador (`compareSizes` / `normalizeSizeLabel` en
// src/pages/productos/[category]/[...linea].astro). Tienen que dar EXACTAMENTE el mismo
// orden: aquí se calcula el rango que se pinta en la columna "Medidas
// disponibles" y el navegador reordena esa misma lista al desplegar
// "Ver medidas". Si divergieran, el rango anunciaría una medida mínima que
// luego no encabezaría la lista desplegada.
//
// No se reutiliza el `parseSizeValue` del importador porque mide la cadena
// entera de un tirón: con '1.1/4" EMBONE X 1"' hace parseFloat("1.1/4EMBONE")
// = 1.1 y confunde el 1.1/4" con el 1.1/2". Aquí se mide TRAMO A TRAMO.

/**
 * Parte una medida compuesta en sus tramos comparables.
 * Los separadores del catálogo son la "X" de la línea de agua ('3/4" X 1/2"')
 * y la "a" de las reducciones FM ('3" a 2"'); ambos van aislados entre
 * espacios, así que no parten palabras que los contengan ("EMBONE").
 */
function splitSizeSegments(size: string): string[] {
  return String(size)
    .split(/\s+(?:[x×]|a)\s+/i)
    .map(segment => segment.split(/[-–—]/)[0]);
}

/** Valor numérico de un tramo suelto: '1.1/4"' -> 1.25, '2" EMBONE' -> 2. */
function parseSegmentValue(segment: string): number {
  // Sólo cuentan dígitos, punto y barra; el resto (comillas, °, "EMBONE", "MM")
  // pasa a ser separador para que no contamine el número.
  const raw = String(segment).replace(/[^0-9./]+/g, " ").trim();
  const clean = raw.replace(/\s+/g, "");

  if (!clean) return Number.POSITIVE_INFINITY;

  // '2.1/2' -> 2.5: en el Excel el punto separa entero y fracción.
  if (/^\d+\.\d+\/\d+$/.test(clean)) {
    const [whole, fraction] = clean.split(".");
    const [num, den] = fraction.split("/").map(Number);
    return Number(whole) + num / den;
  }

  // Forma con espacio ('2 1/2"').
  if (/^\d+\s+\d+\/\d+$/.test(raw)) {
    const [whole, fraction] = raw.split(/\s+/);
    const [num, den] = fraction.split("/").map(Number);
    return Number(whole) + num / den;
  }

  if (/^\d+\/\d+$/.test(clean)) {
    const [num, den] = clean.split("/").map(Number);
    return num / den;
  }

  const number = parseFloat(clean);
  return Number.isNaN(number) ? Number.POSITIVE_INFINITY : number;
}

/**
 * Compara dos medidas completas: primero el diámetro principal y, si empatan,
 * el segundo tramo (el diámetro menor de una reducción, o el ángulo del codo).
 * Una medida sin segundo tramo va antes que la misma medida con reducción.
 */
function compareSizes(a: string, b: string): number {
  const left = splitSizeSegments(a).map(parseSegmentValue);
  const right = splitSizeSegments(b).map(parseSegmentValue);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const valueA = index < left.length ? left[index] : Number.NEGATIVE_INFINITY;
    const valueB = index < right.length ? right[index] : Number.NEGATIVE_INFINITY;

    if (valueA === valueB) continue;

    return valueA < valueB ? -1 : 1;
  }

  return 0;
}

/** Medidas únicas y ordenadas de menor a mayor. */
function sortSizes(sizes: string[]): string[] {
  return [...new Set(sizes.filter(Boolean))].sort(compareSizes);
}

/**
 * Etiqueta legible de una medida: '2.1/2"' -> '2 1/2"'.
 * El punto del Excel separa entero y fracción, no es un decimal. Se sustituyen
 * TODOS los que aparezcan, porque una medida compuesta trae dos
 * ('1.1/4" X 1.5/8"'), y se respeta el resto del dato tal cual: las comillas y
 * los grados de '2" X 45°' forman parte de la medida.
 */
function normalizeSizeLabel(size: string): string {
  return String(size).replace(/(\d)\.(\d+\/\d+)/g, "$1 $2").trim();
}

/** Rango legible del grupo. Con una sola medida, esa medida. */
function buildSizeRange(sortedSizes: string[]): string | undefined {
  if (!sortedSizes.length) return undefined;

  const first = normalizeSizeLabel(sortedSizes[0]);
  const last = normalizeSizeLabel(sortedSizes[sortedSizes.length - 1]);

  return first === last ? first : `${first} – ${last}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// AGRUPACIÓN DE LA LÍNEA DE AGUA
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Campos que definen una FILA COMERCIAL de la línea de agua.
 *
 * El tipo de unión entra en la clave a propósito: el mismo diámetro existe en
 * SP y en Rosca con SKU distinto y son productos diferentes que el cliente
 * elige a conciencia. Sin él, las dos variantes caerían en la misma fila y el
 * catálogo perdería justo la decisión de compra.
 *
 * `groupKey` (el del importador) NO sirve como clave: agrupa sólo por
 * línea+familia+producto+material+aplicación, así que mezcla uniones. La clave
 * de aquí es más fina, de modo que cada fila sigue perteneciendo a un único
 * `groupKey` y hereda sin ambigüedad la ficha y la foto que el CMS guarda por
 * grupo.
 */
const AGUA_GROUP_FIELDS = [
  "family",
  "brand",
  "productName",
  "material",
  "application",
  "typeClass",
  "pressureClass",
  "jointType",
  "standard"
] as const;

function aguaGroupParts(product: CatalogProduct): string[] {
  return AGUA_GROUP_FIELDS.map(field => (product[field] ?? "").toString().trim());
}

/** Slug de un tramo de la firma. Nunca devuelve dos guiones seguidos. */
function slugifyPart(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // tildes
    .replace(/["'°]/g, "")             // comillas y grados
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Identificador estable de una fila agrupada.
 *
 * NO puede ser el SKU de uno de sus productos: ese código identifica UNA medida
 * y la fila representa a todas. El panel de cotización usa este valor como
 * identidad de la fila (`getQuoteId`), así que tiene que ser único y repetible
 * entre builds; por eso se deriva de la propia clave de agrupación.
 *
 * Los tramos se unen con DOBLE guion y cada tramo, ya slugificado, nunca
 * contiene dos guiones seguidos: así un campo vacío no puede fundirse con el
 * siguiente y fabricar la firma de otro grupo.
 */
function aguaGroupSku(parts: string[]): string {
  return `agua--${parts.map(slugifyPart).join("--")}`;
}

/**
 * Una fila por COMBINACIÓN COMERCIAL, no por SKU.
 *
 * Antes se emitía una fila por SKU y la línea de agua ocupaba 443 filas: la
 * misma conexión aparecía repetida decenas de veces, una por diámetro, y la
 * tabla era imposible de leer. Se agrupa igual que la línea FM —rango de
 * medidas más desplegable "Ver medidas"— y quedan 47 filas.
 */
function expandAguaItems(): CatalogDisplayItem[] {
  const groups = new Map<string, CatalogProduct[]>();

  allProducts.forEach((product: CatalogProduct) => {
    const key = aguaGroupParts(product).join("|").toLowerCase();
    const bucket = groups.get(key);

    if (bucket) bucket.push(product);
    else groups.set(key, [product]);
  });

  return [...groups.values()].map(products => {
    // Todo lo que no es la medida es idéntico dentro del grupo: o forma parte
    // de la clave, o lo determina un campo que sí forma parte de ella (la
    // presentación y la longitud dependen del producto —un tubo viene en
    // tramos de 6.10 m—, y el uso principal, de la aplicación). Por eso se lee
    // del primer SKU. La ficha, la foto, las notas y el interruptor de
    // publicado los pone el CMS por `groupKey`, y todos los SKU del grupo
    // comparten `groupKey`, así que también valen los del primero.
    const first = products[0];
    const sizes = sortSizes(products.map(product => product.diameter));

    return {
      source: "agua" as const,
      line: "agua" as const,
      category: first.family,
      subcategory: first.application.toLowerCase(),
      application: first.application,
      brand: first.brand,
      productName: first.productName,
      material: first.material,
      filterMaterial: first.material,
      materialAliases: aguaMaterialAliases(first.material),
      typeClass: first.typeClass,
      pressureClass: optional(first.pressureClass),
      // Sin certificación: la línea de agua no la tiene y NO se inventa ninguna.
      certification: optional(first.certification),
      sizes,
      sizeRange: buildSizeRange(sizes),
      unit: first.unit === "MM" ? ("MM" as const) : ("Pulgadas" as const),
      presentation: optional(first.presentation),
      length: optional(first.length),
      standard: optional(first.standard),
      jointType: optional(first.jointType),
      mainUse: optional(first.mainUse),
      // La ficha y la foto las gestiona el CMS por grupo (overrides.json); hoy
      // llegan vacías y la tabla pinta "Ficha pendiente".
      technicalSheet: optional(first.technicalSheet),
      productImage: optional(first.image),
      webSku: aguaGroupSku(aguaGroupParts(first)),
      visible: first.visible,
      notes: optional(first.notes)
    };
  });
}

export const catalogDisplayItems: CatalogDisplayItem[] = [
  ...expandFmItems(),
  ...expandAguaItems()
];

/**
 * Filas publicadas de una categoría.
 *
 * Ya NO se exige ficha técnica: la línea de agua se publica sin PDF y la tabla
 * lo indica con "Ficha pendiente" (ver renderTechnicalSheetLink). Exigirla aquí
 * dejaría toda la línea de agua invisible hasta que el CMS cargue 30 PDFs.
 */
export function getCatalogDisplayItemsByCategory(category: string) {
  return catalogDisplayItems.filter(item =>
    item.category === category &&
    item.visible
  );
}

export function getCatalogDisplayItemsBySource(source: CatalogDisplaySource) {
  return catalogDisplayItems.filter(item => item.source === source && item.visible);
}

/**
 * Selección para la portada: un representante por tipo de producto FM
 * (Tubo, Codo 90°, Tee, …) que tenga imagen y ficha técnica publicada.
 * Sigue siendo sólo FM a propósito: la portada destaca lo certificado.
 */
export function getFeaturedFmProducts(limit = 8): CatalogDisplayItem[] {
  const seen = new Set<string>();

  return catalogDisplayItems
    .filter(item =>
      item.line === "fm" &&
      item.visible &&
      Boolean(item.technicalSheet) &&
      Boolean(item.productImage)
    )
    .filter(item => {
      const key = item.productName.toLowerCase().trim();

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    })
    .slice(0, limit);
}
