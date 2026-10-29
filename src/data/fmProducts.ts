// /src/data/fmProducts.ts
//
// Línea contra incendio FM. Aquí viven las ESPECIFICACIONES de cada fila
// (marca, SDR, presión, medidas, norma...), que son datos de ingeniería y sólo
// cambian en código. Lo que se edita desde el panel —ficha técnica, página de
// la ficha, foto y si se ve en la web— vive en src/data/catalog/fm.json, una
// entrada por producto × marca ("Tee HDPE FM · Integrity"), y se une aquí a
// las filas en tiempo de build.

import fmCatalogData from "./catalog/fm.json";

export type FmProduct = {
  productFamily: "tuberias" | "conexiones" | "valvulas";
  internalCode?: string;
  brand: string;
  commercialLine: string;
  webCategory: string;
  solutionApplication: string;
  material: string;
  filterMaterial?: string;
  certification: string;
  sdrRde: string;
  className: string;
  pressureClass: string;
  diameter: string;
  diameters?: string[];
  unit: "Pulgadas" | "MM";
  presentation: string;
  length: string;
  standard: string;
  jointType: string;
  mainUse: string;
  webSku: string;
  suggestedUrl: string;
  /** Ruta del PDF con su ancla "#page=N", o "PENDIENTE". La pone fm.json. */
  technicalSheet?: string;
  productImage?: string;
  /** true = productImage es la foto de respaldo compartida, no una propia de fm.json. */
  productImageIsFallback?: boolean;
  rawMaterial: string;
  /** false = la entrada de fm.json está oculta desde el panel. */
  visible?: boolean;
};

/** Una ficha de una entrada de fm.json. */
export type FmCatalogSheet = {
  /** Texto legible para el panel ("SDR11", "Todas las medidas"). */
  variant: string;
  /** Ruta del PDF SIN ancla. Vacío = «Ficha pendiente». */
  technicalSheet: string;
  /** Página del PDF que se abre. Vacío/null = la primera. */
  page?: number | string | null;
  /** Clave oculta: "todas", "sdr11", "sdr9", "sdr7", "clase-200", "clase-335". */
  key: string;
};

/** Una entrada de fm.json: un producto de una marca, con todas sus filas. */
export type FmCatalogEntry = {
  label: string;
  family: string;
  visible?: boolean;
  /** Ruta de la foto. Vacío = foto compartida de respaldo (FALLBACK_IMAGES). */
  image?: string;
  sheets?: FmCatalogSheet[];
  /** Clave oculta: slug de webCategory + "-" + slug de la marca (fmEntryKey). */
  key: string;
};

// Anclas #page=N de fm.json (decisión D5): cada una se verificó renderizando
// la página del PDF a imagen y mirándola (sept-2026). El texto extraíble de
// estas fichas sale corrompido por fuentes propias, así que la extracción de
// texto NO sirve como evidencia. Registro de lo verificado:
//   · Pavco tubería: pág. 5.
//   · Integrity (versión sept-2026) tienen portada y reparten SDR11 (200 PSI)
//     y SDR9 (255 PSI) en páginas distintas: tee, codo 90°, codo 45° y tapón
//     pág. 2 / 3; reducción y flange adapter pág. 3 / 4 (la pág. 2 de la
//     reducción es SDR17, que no se vende aquí). Backing rings: pág. 2.
//   · Georg Fischer conexiones HDPE: fichas de una sola página, sin ancla.
//   · Backing ring GF: el cliente mandó el catálogo COMPLETO (13 págs.):
//     pág. 2 = Class 200, pág. 4 = Class 335 (la 3 es Class 250 y de la 5 en
//     adelante van epoxy/galvanizado/inoxidable). Los PDF antiguos de CLASE 200
//     y CLASE 335 se quedan en la carpeta porque hay enlaces viejos circulando.
// Si el panel cambia un PDF, la página guardada puede dejar de corresponder:
// el campo página se revisa a la vez que el PDF.

/** Fotos compartidas que se usan mientras la entrada no tenga foto propia. */
const FALLBACK_IMAGES = {
  tuboPavco: "/assets/products/tubo_pavco.jpg",
  conexionIntegrity: "/assets/products/codo_integrity.jpg",
  conexionGeorgFischer: "/assets/products/codo_gf.jpg"
} as const;

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[°]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Entrada de fm.json a la que pertenece la fila: "tee-integrity", "tubo-pavco"... */
export function fmEntryKey(product: FmProduct): string {
  return `${slugify(product.webCategory)}-${slugify(product.brand)}`;
}

/**
 * Variante de ficha de la fila. Las fichas Integrity reparten cada SDR en una
 * página distinta, así que la variante es el SDR. Las bridas / backing ring GF
 * son la excepción: su catálogo se organiza por clase de presión, no por SDR.
 */
function fmVariantKey(product: FmProduct): string {
  const isGfBackingRing =
    normalize(product.webCategory).includes("backing ring") &&
    normalize(product.brand) === "georg fischer";

  if (isGfBackingRing) {
    const pressure = product.pressureClass.match(/\d+/)?.[0] ?? "";
    return `clase-${pressure}`;
  }

  return slugify(product.sdrRde);
}

function fallbackImage(product: FmProduct): string | undefined {
  const family = product.productFamily;
  const brand = normalize(product.brand);

  if (family === "tuberias") return FALLBACK_IMAGES.tuboPavco;
  if (family === "conexiones" && brand === "integrity") return FALLBACK_IMAGES.conexionIntegrity;
  if (family === "conexiones" && brand === "georg fischer") return FALLBACK_IMAGES.conexionGeorgFischer;

  return undefined;
}

/** Página válida (entero ≥ 1) o undefined. El panel puede guardar "", null o un texto. */
function parsePage(page: FmCatalogSheet["page"]): number | undefined {
  if (page === null || page === undefined || page === "") return undefined;
  const value = Number(page);
  return Number.isInteger(value) && value >= 1 ? value : undefined;
}

/**
 * Enlace de la ficha de la fila: "ruta#page=N", o undefined («Ficha
 * pendiente»). Si la entrada distingue variantes y la de esta fila no existe,
 * también undefined: mejor «Ficha pendiente» que enlazar a la tabla de otro SDR.
 * La variante "todas" vale para las filas que no tengan una propia.
 */
function sheetHref(entry: FmCatalogEntry, product: FmProduct): string | undefined {
  const sheets = Array.isArray(entry.sheets) ? entry.sheets : [];
  const variant = fmVariantKey(product);
  const sheet =
    sheets.find((item) => item?.key === variant) ?? sheets.find((item) => item?.key === "todas");
  const path = sheet?.technicalSheet?.trim();

  if (!sheet || !path) return undefined;

  // Una ruta que ya trae su ancla se respeta tal cual.
  if (path.includes("#")) return path;

  const page = parsePage(sheet.page);
  return page ? `${path}#page=${page}` : path;
}

const fmEntries = (Array.isArray(fmCatalogData) ? fmCatalogData : []) as unknown as FmCatalogEntry[];
const fmEntriesByKey = new Map(fmEntries.map((entry) => [entry.key, entry]));

const rawFmProducts: FmProduct[] = [
  {
    productFamily: "tuberias",
    brand: "Pavco",
    commercialLine: "Tubería FM",
    webCategory: "Tubo",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "CLASE 200",
    pressureClass: "200 PSI",
    diameter: '2" - 16"',
    unit: "Pulgadas",
    presentation: "Tramo",
    length: "6m / 12m",
    standard: "FM1613 / ASTM F714",
    jointType: "Termofusión",
    mainUse: "Redes contra incendio enterradas",
    webSku: "tuberia-hdpe-fm-sdr11-pavco",
    suggestedUrl: "/productos/tuberias/contra-incendio/hdpe/sdr11/pavco",
    rawMaterial: "PE4710"
  },
  {
    productFamily: "tuberias",
    brand: "Pavco",
    commercialLine: "Tubería FM",
    webCategory: "Tubo",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR9",
    className: "CLASE 250",
    pressureClass: "250 PSI",
    diameter: '2" - 16"',
    unit: "Pulgadas",
    presentation: "Tramo",
    length: "6m / 12m",
    standard: "FM1613 / ASTM F714",
    jointType: "Termofusión",
    mainUse: "Redes contra incendio enterradas",
    webSku: "tuberia-hdpe-fm-sdr9-pavco",
    suggestedUrl: "/productos/tuberias/contra-incendio/hdpe/sdr9/pavco",
    rawMaterial: "PE4710"
  },
  {
    productFamily: "tuberias",
    brand: "Pavco",
    commercialLine: "Tubería FM",
    webCategory: "Tubo",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "CLASE 240",
    pressureClass: "240 PSI",
    diameter: "63MM - 400MM",
    unit: "MM",
    presentation: "Tramo",
    length: "6m / 12m",
    standard: "FM1613 / ISO 4427",
    jointType: "Termofusión",
    mainUse: "Redes contra incendio enterradas",
    webSku: "tuberia-hdpe-fm-sdr11-pavco-mm",
    suggestedUrl: "/productos/tuberias/contra-incendio/hdpe/sdr11/pavco-mm",
    rawMaterial: "PE100"
  },
  {
    productFamily: "tuberias",
    brand: "Pavco",
    commercialLine: "Tubería FM",
    webCategory: "Tubo",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR9",
    className: "CLASE 290",
    pressureClass: "290 PSI",
    diameter: "63MM - 400MM",
    unit: "MM",
    presentation: "Tramo",
    length: "6m / 12m",
    standard: "FM1613 / ISO 4427",
    jointType: "Termofusión",
    mainUse: "Redes contra incendio enterradas",
    webSku: "tuberia-hdpe-fm-sdr9-pavco-mm",
    suggestedUrl: "/productos/tuberias/contra-incendio/hdpe/sdr9/pavco-mm",
    rawMaterial: "PE100"
  },
  {
    productFamily: "tuberias",
    brand: "WL Plastics",
    commercialLine: "Tubería FM",
    webCategory: "Tubo",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "CLASE 200",
    pressureClass: "200 PSI",
    diameter: '2" - 16"',
    unit: "Pulgadas",
    presentation: "Tramo",
    length: "6m / 12m",
    standard: "FM1613 / AWWA C906",
    jointType: "Termofusión",
    mainUse: "Protección contra incendio",
    webSku: "tuberia-hdpe-fm-sdr11-wlplastics",
    suggestedUrl: "/productos/tuberias/contra-incendio/hdpe/sdr11/wlplastics",
    rawMaterial: "PE4710"
  },
  {
    productFamily: "tuberias",
    brand: "WL Plastics",
    commercialLine: "Tubería FM",
    webCategory: "Tubo",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR9",
    className: "CLASE 250",
    pressureClass: "250 PSI",
    diameter: '2" - 16"',
    unit: "Pulgadas",
    presentation: "Tramo",
    length: "6m / 12m",
    standard: "FM1613 / AWWA C906",
    jointType: "Termofusión",
    mainUse: "Protección contra incendio",
    webSku: "tuberia-hdpe-fm-sdr9-wlplastics",
    suggestedUrl: "/productos/tuberias/contra-incendio/hdpe/sdr9/wlplastics",
    rawMaterial: "PE4710"
  },
  {
    productFamily: "tuberias",
    brand: "WL Plastics",
    commercialLine: "Tubería FM",
    webCategory: "Tubo",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR7",
    className: "CLASE 335",
    pressureClass: "335 PSI",
    diameter: '2" - 16"',
    unit: "Pulgadas",
    presentation: "Tramo",
    length: "6m / 12m",
    standard: "FM1613 / AWWA C906",
    jointType: "Termofusión",
    mainUse: "Protección contra incendio",
    webSku: "tuberia-hdpe-fm-sdr7-wlplastics",
    suggestedUrl: "/productos/tuberias/contra-incendio/hdpe/sdr7/wlplastics",
    rawMaterial: "PE4710"
  },
  {
    productFamily: "tuberias",
    brand: "WL Plastics",
    commercialLine: "Tubería FM",
    webCategory: "Tubo",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "CLASE 200",
    pressureClass: "200 PSI",
    diameter: "63MM - 400MM",
    unit: "MM",
    presentation: "Tramo",
    length: "6m / 12m",
    standard: "FM1613 / UNE EN 12201-2",
    jointType: "Termofusión",
    mainUse: "Protección contra incendio",
    webSku: "tuberia-hdpe-fm-sdr11-wlplastics-mm",
    suggestedUrl: "/productos/tuberias/contra-incendio/hdpe/sdr11/wlplastics-mm",
    rawMaterial: "PE100"
  },
  {
    productFamily: "tuberias",
    brand: "WL Plastics",
    commercialLine: "Tubería FM",
    webCategory: "Tubo",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR9",
    className: "CLASE 290",
    pressureClass: "290 PSI",
    diameter: "63MM - 400MM",
    unit: "MM",
    presentation: "Tramo",
    length: "6m / 12m",
    standard: "FM1613 / UNE EN 12201-2",
    jointType: "Termofusión",
    mainUse: "Protección contra incendio",
    webSku: "tuberia-hdpe-fm-sdr9-wlplastics-mm",
    suggestedUrl: "/productos/tuberias/contra-incendio/hdpe/sdr9/wlplastics-mm",
    rawMaterial: "PE100"
  },

  {
    productFamily: "tuberias",
    brand: "Extrucol",
    commercialLine: "Tubería FM",
    webCategory: "Tubo",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR9",
    className: "CLASE 250",
    pressureClass: "250 PSI",
    diameter: '2" - 16"',
    unit: "Pulgadas",
    presentation: "Tramo",
    length: "6m / 12m",
    standard: "FM1613 / AWWA C906",
    jointType: "Termofusión",
    mainUse: "Protección contra incendio",
    webSku: "tuberia-hdpe-fm-sdr9-extrucol",
    suggestedUrl: "/productos/tuberias/contra-incendio/hdpe/sdr9/extrucol",
    rawMaterial: "PE4710"
  },
  {
    productFamily: "tuberias",
    brand: "Extrucol",
    commercialLine: "Tubería FM",
    webCategory: "Tubo",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "CLASE 200",
    pressureClass: "200 PSI",
    diameter: '2" - 16"',
    unit: "Pulgadas",
    presentation: "Tramo",
    length: "6m / 12m",
    standard: "FM1613 / AWWA C906",
    jointType: "Termofusión",
    mainUse: "Protección contra incendio",
    webSku: "tuberia-hdpe-fm-sdr11-extrucol",
    suggestedUrl: "/productos/tuberias/contra-incendio/hdpe/sdr11/extrucol",
    rawMaterial: "PE4710"
  },
  {
    productFamily: "tuberias",
    brand: "Extrucol",
    commercialLine: "Tubería FM",
    webCategory: "Tubo",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "CLASE 240",
    pressureClass: "240 PSI",
    diameter: "75MM - 400MM",
    unit: "MM",
    presentation: "Tramo",
    length: "6m / 12m",
    standard: "FM1613 / UNE EN 12201-2",
    jointType: "Termofusión / Electrofusión",
    mainUse: "Redes contra incendio enterradas",
    webSku: "tuberia-hdpe-fm-rde11-extrucol",
    suggestedUrl: "/productos/tuberias/contra-incendio/hdpe/rde11/extrucol",
    rawMaterial: "PE100"
  },
  {
    productFamily: "conexiones",
    brand: "Integrity",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Brida / Backing Ring",
    solutionApplication: "Contra incendio",
    material: "Hierro dúctil",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "",
    pressureClass: "200 PSI",
    diameter: '2" - 16"',
    diameters: ['2"', '3"', '4"', '6"', '8"', '10"', '12"', '14"', '16"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "ASTM 536 / ANSI B16.5",
    jointType: "Con pernos",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hierro-ductil-fm-brida-backing-ring-sdr11-integrity",
    suggestedUrl: "/productos/conexiones/contra-incendio/hierro-ductil/brida-backing-ring/sdr11/integrity",
    rawMaterial: "Hierro dúctil"
  },

  {
    productFamily: "conexiones",
    brand: "Integrity",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Brida / Backing Ring",
    solutionApplication: "Contra incendio",
    material: "Hierro dúctil",
    certification: "FM Approved",
    sdrRde: "SDR7",
    className: "",
    pressureClass: "335 PSI",
    diameter: '2" - 16"',
    diameters: ['2"', '3"', '4"', '6"', '8"', '10"', '12"', '14"', '16"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "ASTM 536 / ANSI B16.5",
    jointType: "Con pernos",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hierro-ductil-fm-brida-backing-ring-sdr7-integrity",
    suggestedUrl: "/productos/conexiones/contra-incendio/hierro-ductil/brida-backing-ring/sdr7/integrity",
    rawMaterial: "Hierro dúctil"
  },

  {
    productFamily: "conexiones",
    brand: "Georg Fischer",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Brida / Backing Ring",
    solutionApplication: "Contra incendio",
    material: "Hierro dúctil",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "",
    pressureClass: "200 PSI",
    diameter: '8" - 16"',
    diameters: ['8"', '10"', '12"', '14"', '16"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "ASTM 536 / ANSI B16.5",
    jointType: "Con pernos",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hierro-ductil-fm-brida-backing-ring-sdr11-georg-fischer",
    suggestedUrl: "/productos/conexiones/contra-incendio/hierro-ductil/brida-backing-ring/sdr11/georg-fischer",
    rawMaterial: "Hierro dúctil"
  },

  {
    productFamily: "conexiones",
    brand: "Georg Fischer",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Brida / Backing Ring",
    solutionApplication: "Contra incendio",
    material: "Hierro dúctil",
    certification: "FM Approved",
    sdrRde: "SDR7",
    className: "",
    pressureClass: "335 PSI",
    diameter: '2" - 16"',
    diameters: ['2"', '3"', '4"', '6"', '8"', '10"', '12"', '14"', '16"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "ASTM 536 / ANSI B16.5",
    jointType: "Con pernos",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hierro-ductil-fm-brida-backing-ring-sdr7-georg-fischer",
    suggestedUrl: "/productos/conexiones/contra-incendio/hierro-ductil/brida-backing-ring/sdr7/georg-fischer",
    rawMaterial: "Hierro dúctil"
  },
  {
    productFamily: "conexiones",
    brand: "Integrity",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Codo 90°",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "CLASE 200",
    pressureClass: "200 PSI",
    diameter: '2" - 12"',
    diameters: ['2"', '3"', '4"', '6"', '8"', '10"', '12"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hdpe-fm-codo-90-sdr11-integrity",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/codo-90/sdr11/integrity",
    rawMaterial: "PE4710"
  },

  {
    productFamily: "conexiones",
    brand: "Integrity",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Codo 90°",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR9",
    className: "CLASE 250",
    pressureClass: "250 PSI",
    diameter: '2" - 12"',
    diameters: ['2"', '3"', '4"', '6"', '8"', '10"', '12"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hdpe-fm-codo-90-sdr9-integrity",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/codo-90/sdr9/integrity",
    rawMaterial: "PE4710"
  },

  {
    productFamily: "conexiones",
    brand: "Georg Fischer",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Codo 90°",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "CLASE 200",
    pressureClass: "200 PSI",
    diameter: '4" - 12"',
    diameters: ['4"', '6"', '8"', '10"', '12"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hdpe-fm-codo-90-sdr11-georg-fischer",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/codo-90/sdr11/georg-fischer",
    rawMaterial: "PE4710"
  },

  {
    productFamily: "conexiones",
    brand: "Georg Fischer",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Codo 90°",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR9",
    className: "CLASE 250",
    pressureClass: "250 PSI",
    diameter: '4" - 12"',
    diameters: ['4"', '6"', '8"', '10"', '12"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hdpe-fm-codo-90-sdr9-georg-fischer",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/codo-90/sdr9/georg-fischer",
    rawMaterial: "PE4710"
  },
  {
    productFamily: "conexiones",
    brand: "Integrity",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Codo 45°",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "CLASE 200",
    pressureClass: "200 PSI",
    diameter: '2" - 12"',
    diameters: ['2"', '3"', '4"', '6"', '8"', '10"', '12"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hdpe-fm-codo-45-sdr11-integrity",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/codo-45/sdr11/integrity",
    rawMaterial: "PE4710"
  },

  {
    productFamily: "conexiones",
    brand: "Integrity",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Codo 45°",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR9",
    className: "CLASE 250",
    pressureClass: "250 PSI",
    diameter: '2" - 12"',
    diameters: ['2"', '3"', '4"', '6"', '8"', '10"', '12"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hdpe-fm-codo-45-sdr9-integrity",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/codo-45/sdr9/integrity",
    rawMaterial: "PE4710"
  },

  {
    productFamily: "conexiones",
    brand: "Georg Fischer",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Codo 45°",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "CLASE 200",
    pressureClass: "200 PSI",
    diameter: '4" - 12"',
    diameters: ['4"', '6"', '8"', '10"', '12"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hdpe-fm-codo-45-sdr11-georg-fischer",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/codo-45/sdr11/georg-fischer",
    rawMaterial: "PE4710"
  },

  {
    productFamily: "conexiones",
    brand: "Georg Fischer",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Codo 45°",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR9",
    className: "CLASE 250",
    pressureClass: "250 PSI",
    diameter: '4" - 12"',
    diameters: ['4"', '6"', '8"', '10"', '12"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hdpe-fm-codo-45-sdr9-georg-fischer",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/codo-45/sdr9/georg-fischer",
    rawMaterial: "PE4710"
  },
  {
    productFamily: "conexiones",
    brand: "Integrity",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Flange Adapter",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "CLASE 200",
    pressureClass: "200 PSI",
    diameter: '2" - 12"',
    diameters: ['2"', '3"', '4"', '6"', '8"', '10"', '12"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hdpe-fm-flange-adapter-sdr11-integrity",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/flange-adapter/sdr11/integrity",
    rawMaterial: "PE4710"
  },

  {
    productFamily: "conexiones",
    brand: "Integrity",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Flange Adapter",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR9",
    className: "CLASE 250",
    pressureClass: "250 PSI",
    diameter: '2" - 12"',
    diameters: ['2"', '3"', '4"', '6"', '8"', '10"', '12"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hdpe-fm-flange-adapter-sdr9-integrity",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/flange-adapter/sdr9/integrity",
    rawMaterial: "PE4710"
  },

  {
    productFamily: "conexiones",
    brand: "Georg Fischer",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Flange Adapter",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "CLASE 200",
    pressureClass: "200 PSI",
    diameter: '4" - 12"',
    diameters: ['4"', '6"', '8"', '10"', '12"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hdpe-fm-flange-adapter-sdr11-georg-fischer",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/flange-adapter/sdr11/georg-fischer",
    rawMaterial: "PE4710"
  },

  {
    productFamily: "conexiones",
    brand: "Georg Fischer",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Flange Adapter",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR9",
    className: "CLASE 250",
    pressureClass: "250 PSI",
    diameter: '4" - 12"',
    diameters: ['4"', '6"', '8"', '10"', '12"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hdpe-fm-flange-adapter-sdr9-georg-fischer",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/flange-adapter/sdr9/georg-fischer",
    rawMaterial: "PE4710"
  },
  {
    productFamily: "conexiones",
    brand: "Integrity",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Reducción",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "CLASE 200",
    pressureClass: "200 PSI",
    diameter: '3" a 2" - 12" a 10"',
    diameters: [
      '3" a 2"',
      '4" a 2"',
      '4" a 3"',
      '6" a 3"',
      '6" a 4"',
      '8" a 4"',
      '8" a 6"',
      '10" a 6"',
      '10" a 8"',
      '12" a 6"',
      '12" a 8"',
      '12" a 10"'
    ],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hdpe-fm-reduccion-sdr11-integrity",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/reduccion/sdr11/integrity",
    rawMaterial: "PE4710"
  },

  {
    productFamily: "conexiones",
    brand: "Integrity",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Reducción",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR9",
    className: "CLASE 250",
    pressureClass: "250 PSI",
    diameter: '3" a 2" - 12" a 10"',
    diameters: [
      '3" a 2"',
      '4" a 2"',
      '4" a 3"',
      '6" a 3"',
      '6" a 4"',
      '8" a 4"',
      '8" a 6"',
      '10" a 6"',
      '10" a 8"',
      '12" a 6"',
      '12" a 8"',
      '12" a 10"'
    ],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hdpe-fm-reduccion-sdr9-integrity",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/reduccion/sdr9/integrity",
    rawMaterial: "PE4710"
  },

  {
    productFamily: "conexiones",
    brand: "Georg Fischer",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Reducción",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "CLASE 200",
    pressureClass: "200 PSI",
    diameter: '4" a 2" - 12" a 10"',
    diameters: [
      '4" a 2"',
      '4" a 3"',
      '6" a 3"',
      '6" a 4"',
      '8" a 4"',
      '8" a 6"',
      '10" a 6"',
      '10" a 8"',
      '12" a 6"',
      '12" a 8"',
      '12" a 10"'
    ],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hdpe-fm-reduccion-sdr11-georg-fischer",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/reduccion/sdr11/georg-fischer",
    rawMaterial: "PE4710"
  },

  {
    productFamily: "conexiones",
    brand: "Georg Fischer",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Reducción",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR9",
    className: "CLASE 250",
    pressureClass: "250 PSI",
    diameter: '4" a 2" - 12" a 10"',
    diameters: [
      '4" a 2"',
      '4" a 3"',
      '6" a 3"',
      '6" a 4"',
      '8" a 4"',
      '8" a 6"',
      '10" a 6"',
      '10" a 8"',
      '12" a 6"',
      '12" a 8"',
      '12" a 10"'
    ],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Unir tuberías contra incendio enterradas",
    webSku: "conexion-hdpe-fm-reduccion-sdr9-georg-fischer",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/reduccion/sdr9/georg-fischer",
    rawMaterial: "PE4710"
  },
  {
    productFamily: "conexiones",
    brand: "Integrity",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Tapón",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "CLASE 200",
    pressureClass: "200 PSI",
    diameter: '4" - 12"',
    diameters: ['4"', '6"', '8"', '10"', '12"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Sellado de líneas contra incendio",
    webSku: "conexion-hdpe-fm-tapon-sdr11-integrity",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/tapon/sdr11/integrity",
    rawMaterial: "PE4710"
  },

  {
    productFamily: "conexiones",
    brand: "Integrity",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Tapón",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR9",
    className: "CLASE 250",
    pressureClass: "250 PSI",
    diameter: '4" - 12"',
    diameters: ['4"', '6"', '8"', '10"', '12"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Sellado de líneas contra incendio",
    webSku: "conexion-hdpe-fm-tapon-sdr9-integrity",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/tapon/sdr9/integrity",
    rawMaterial: "PE4710"
  },
  {
    productFamily: "conexiones",
    brand: "Integrity",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Tee",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR11",
    className: "CLASE 200",
    pressureClass: "200 PSI",
    diameter: '2" - 12"',
    diameters: ['2"', '3"', '4"', '6"', '8"', '10"', '12"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Derivación de líneas contra incendio",
    webSku: "conexion-hdpe-fm-tee-sdr11-integrity",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/tee/sdr11/integrity",
    rawMaterial: "PE4710"
  },

  {
    productFamily: "conexiones",
    brand: "Integrity",
    commercialLine: "Conexiones / Accesorios",
    webCategory: "Tee",
    solutionApplication: "Contra incendio",
    material: "HDPE",
    certification: "FM Approved",
    sdrRde: "SDR9",
    className: "CLASE 250",
    pressureClass: "250 PSI",
    diameter: '2" - 12"',
    diameters: ['2"', '3"', '4"', '6"', '8"', '10"', '12"'],
    unit: "Pulgadas",
    presentation: "Unid",
    length: "-",
    standard: "FM1613 / ASTM D-2513",
    jointType: "Termofusión",
    mainUse: "Derivación de líneas contra incendio",
    webSku: "conexion-hdpe-fm-tee-sdr9-integrity",
    suggestedUrl: "/productos/conexiones/contra-incendio/hdpe/tee/sdr9/integrity",
    rawMaterial: "PE4710"
  },
];

// Avisos de build ("::warning::" en GitHub Actions) si fm.json y las filas dejan
// de corresponderse. No bloquean: una fila sin entrada se publica igual, con
// «Ficha pendiente» y la foto de respaldo, en vez de desaparecer.
const usedEntryKeys = new Set<string>();

for (const product of rawFmProducts) {
  const key = fmEntryKey(product);
  const entry = fmEntriesByKey.get(key);
  usedEntryKeys.add(key);

  if (!entry) {
    console.log(`::warning title=Línea FM::${product.webSku} no tiene entrada «${key}» en src/data/catalog/fm.json: sale con «Ficha pendiente».`);
  } else if (
    Array.isArray(entry.sheets) &&
    !entry.sheets.some((sheet) => sheet?.key === fmVariantKey(product) || sheet?.key === "todas")
  ) {
    console.log(`::warning title=Línea FM::${product.webSku}: «${entry.label}» no tiene ficha para la variante «${fmVariantKey(product)}» en fm.json: sale con «Ficha pendiente».`);
  }
}

for (const entry of fmEntries) {
  if (!usedEntryKeys.has(entry.key)) {
    console.log(`::warning title=Línea FM::La entrada «${entry.label}» (${entry.key}) de src/data/catalog/fm.json no corresponde a ninguna fila de fmProducts.ts.`);
  }
}

/** Todas las filas FM, ocultas incluidas, con ficha, foto y visibilidad de fm.json. */
export const allFmProducts: FmProduct[] = rawFmProducts.map((product) => {
  const entry = fmEntriesByKey.get(fmEntryKey(product));
  const image = entry?.image?.trim();

  return {
    ...product,

    filterMaterial:
      product.certification === "FM Approved"
        ? `${product.material} FM`
        : product.material,

    technicalSheet: (entry && sheetHref(entry, product)) || "PENDIENTE",

    productImage: image || fallbackImage(product),
    productImageIsFallback: !image,

    // Sólo un false explícito oculta, igual que en overrides.json (agua).
    visible: entry?.visible !== false
  };
});

/** Filas FM publicadas: las ocultas desde el panel no llegan al buscador ni al catálogo. */
export const fmProducts: FmProduct[] = allFmProducts.filter((product) => product.visible);
