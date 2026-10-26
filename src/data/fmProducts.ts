// /src/data/fmProducts.ts

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
  technicalSheet?: string;
  productImage?: string;
  rawMaterial: string;
};

const TECH_SHEETS = {
  tuberiaPavco:
    "/assets/fichas-tecnicas/Ficha tecnica de tuberia HDPE PAVCO FM-sistema ACI.pdf#page=5",

  tuberiaWlPlastics:
    "/assets/fichas-tecnicas/ESPECIFICACIONES TUBO HDPE WL130-1018 FM Pipe WL PLASTICS EN ESPAÑOL.pdf",

  tuberiaExtrucol:
    "/assets/fichas-tecnicas/tuberia-hdpe-fm-extrucol.pdf",

  // Anclas #page=N (decisión D5): cada ancla de abajo se verificó renderizando
  // la página del PDF a imagen y mirándola (sept-2026). El texto extraíble de
  // estas fichas sale corrompido por fuentes propias, así que la extracción de
  // texto NO sirve como evidencia. Las fichas Integrity (versión sept-2026)
  // tienen portada y reparten las tablas SDR11/SDR9 en páginas distintas, por
  // eso hay una entrada por variante. Las fichas GF de conexiones son de una
  // sola página: sin ancla.

  // Tee Integrity: pág. 2 = tabla SDR11 (200 PSI), pág. 3 = tabla SDR9 (255 PSI).
  teeIntegritySdr11:
    "/assets/fichas-tecnicas/ESPECIFICACIONES TEE HDPE FM INTEGRITY.pdf#page=2",

  teeIntegritySdr9:
    "/assets/fichas-tecnicas/ESPECIFICACIONES TEE HDPE FM INTEGRITY.pdf#page=3",

  teeGeorgFischer:
    "/assets/fichas-tecnicas/ESPECIFICACIONES TECNICAS TEE HDPE FM GEORG FISCHER.pdf",

  // Reducción Integrity: pág. 3 = SDR11 (200 PSI), pág. 4 = SDR9 (255 PSI);
  // la pág. 2 es SDR17, que no se vende aquí.
  reduccionIntegritySdr11:
    "/assets/fichas-tecnicas/ESPECIFICACIONES REDUCCION HDPE FM INTEGRITY.pdf#page=3",

  reduccionIntegritySdr9:
    "/assets/fichas-tecnicas/ESPECIFICACIONES REDUCCION HDPE FM INTEGRITY.pdf#page=4",

  reduccionGeorgFischer:
    "/assets/fichas-tecnicas/ESPECIFICACIONES TECNICAS REDUCCION HDPE FM GEORG FISCHER.pdf",

  // Flange adapter Integrity: pág. 3 = SDR11 (200 PSI), pág. 4 = SDR9 (255 PSI).
  flangeAdapterIntegritySdr11:
    "/assets/fichas-tecnicas/ESPECIFICACIONES FLANGE ADAPTER HDPE FM INTEGRITY.pdf#page=3",

  flangeAdapterIntegritySdr9:
    "/assets/fichas-tecnicas/ESPECIFICACIONES FLANGE ADAPTER HDPE FM INTEGRITY.pdf#page=4",

  flangeAdapterGeorgFischer:
    "/assets/fichas-tecnicas/ESPECIFICACIONES TECNICAS FLANGE ADAPTER HDPE FM GEORG FISCHER.pdf",

  // Codo 90° Integrity: pág. 2 = SDR11 (200 PSI), pág. 3 = SDR9 (255 PSI).
  codo90IntegritySdr11:
    "/assets/fichas-tecnicas/ESPECIFICACIONES CODO HDPE 90° FM INTEGRITY.pdf#page=2",

  codo90IntegritySdr9:
    "/assets/fichas-tecnicas/ESPECIFICACIONES CODO HDPE 90° FM INTEGRITY.pdf#page=3",

  codo90GeorgFischer:
    "/assets/fichas-tecnicas/ESPECIFICACIONES CODO 90° SDR11 - SDR9 HDPE FM GEORG FISCHER.pdf",

  // Codo 45° Integrity: pág. 2 = SDR11 (200 PSI), pág. 3 = SDR9 (255 PSI).
  codo45IntegritySdr11:
    "/assets/fichas-tecnicas/ESPECIFICACIONES CODO HDPE 45° FM INTEGRITY.pdf#page=2",

  codo45IntegritySdr9:
    "/assets/fichas-tecnicas/ESPECIFICACIONES CODO HDPE 45° FM INTEGRITY.pdf#page=3",

  codo45GeorgFischer:
    "/assets/fichas-tecnicas/ESPECIFICACIONES CODO 45° SDR11 - SDR9 HDPE FM GEORG FISCHER.pdf",

  // Tapón Integrity (ficha nueva sept-2026): pág. 2 = SDR11 (200 PSI),
  // pág. 3 = SDR9 (255 PSI, "FM 250").
  taponIntegritySdr11:
    "/assets/fichas-tecnicas/ESPECIFICACIONES TAPON HDPE FM INTEGRITY.pdf#page=2",

  taponIntegritySdr9:
    "/assets/fichas-tecnicas/ESPECIFICACIONES TAPON HDPE FM INTEGRITY.pdf#page=3",

  // Backing rings Integrity: pág. 1 es portada, la tabla vive en la pág. 2.
  backingRingIntegritySdr11:
    "/assets/fichas-tecnicas/ESPECIFICACIONES BACKING Rings-SDR11 FM -Sell-Sheet-041320 INTEGRITY.pdf#page=2",

  backingRingIntegritySdr7:
    "/assets/fichas-tecnicas/ESPECIFICACIONES BACKING RING FM SDR7-Sell-Sheet-041320 INTEGRITY.pdf#page=2",

  // Backing rings GF: el cliente mandó el catálogo COMPLETO (13 págs.), que
  // contiene las tablas de hierro dúctil de ambas clases: pág. 2 = Class 200
  // (IPS y DIPS), pág. 4 = Class 335 (la pág. 3 es Class 250 y de la 5 en
  // adelante van epoxy/galvanizado/inoxidable). Los PDFs antiguos de CLASE 200
  // y CLASE 335 se quedan en la carpeta porque hay enlaces viejos circulando.
  backingRingGeorgFischerClase200:
    "/assets/fichas-tecnicas/ESPECIFICACIONES BACKING RING FM COMPLETO GEORG FISCHER.pdf#page=2",

  backingRingGeorgFischerClase335:
    "/assets/fichas-tecnicas/ESPECIFICACIONES BACKING RING FM COMPLETO GEORG FISCHER.pdf#page=4"
} as const;

const PRODUCT_IMAGES = {
  tuboPavco: "/assets/products/tubo_pavco.jpg",
  conexionIntegrity: "/assets/products/codo_integrity.jpg",
  conexionGeorgFischer: "/assets/products/codo_gf.jpg"
} as const;

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[°]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveTechnicalSheet(product: FmProduct): string | undefined {
  const brand = normalize(product.brand);
  const webCategory = normalize(product.webCategory);
  const family = product.productFamily;
  const sdr = normalize(product.sdrRde);
  const pressure = normalize(product.pressureClass);

  if (family === "tuberias" && brand === "pavco") {
    return TECH_SHEETS.tuberiaPavco;
  }

  if (family === "tuberias" && brand === "wl plastics") {
    return TECH_SHEETS.tuberiaWlPlastics;
  }

  if (family === "tuberias" && brand === "extrucol") {
    return TECH_SHEETS.tuberiaExtrucol;
  }

  // Las fichas Integrity de conexiones son compartidas entre SDR11 y SDR9,
  // pero cada variante tiene su tabla en una página distinta (ver TECH_SHEETS),
  // así que aquí se distingue por el campo sdrRde del producto. El orden de
  // los chequeos da igual porque "sdr11" no contiene "sdr9" ni al revés; si apareciera
  // un SDR nuevo sin ancla verificada, se devuelve undefined y el producto
  // queda como "PENDIENTE" en vez de enlazar a una página equivocada.
  if (webCategory.includes("tee") && brand === "integrity") {
    if (sdr.includes("sdr11")) return TECH_SHEETS.teeIntegritySdr11;
    if (sdr.includes("sdr9")) return TECH_SHEETS.teeIntegritySdr9;
    return undefined;
  }

  if (webCategory.includes("tee") && brand === "georg fischer") {
    return TECH_SHEETS.teeGeorgFischer;
  }

  if (webCategory.includes("reduccion") && brand === "integrity") {
    if (sdr.includes("sdr11")) return TECH_SHEETS.reduccionIntegritySdr11;
    if (sdr.includes("sdr9")) return TECH_SHEETS.reduccionIntegritySdr9;
    return undefined;
  }

  if (webCategory.includes("reduccion") && brand === "georg fischer") {
    return TECH_SHEETS.reduccionGeorgFischer;
  }

  if (webCategory.includes("flange adapter") && brand === "integrity") {
    if (sdr.includes("sdr11")) return TECH_SHEETS.flangeAdapterIntegritySdr11;
    if (sdr.includes("sdr9")) return TECH_SHEETS.flangeAdapterIntegritySdr9;
    return undefined;
  }

  if (webCategory.includes("flange adapter") && brand === "georg fischer") {
    return TECH_SHEETS.flangeAdapterGeorgFischer;
  }

  if (webCategory.includes("codo 90") && brand === "integrity") {
    if (sdr.includes("sdr11")) return TECH_SHEETS.codo90IntegritySdr11;
    if (sdr.includes("sdr9")) return TECH_SHEETS.codo90IntegritySdr9;
    return undefined;
  }

  if (webCategory.includes("codo 90") && brand === "georg fischer") {
    return TECH_SHEETS.codo90GeorgFischer;
  }

  if (webCategory.includes("codo 45") && brand === "integrity") {
    if (sdr.includes("sdr11")) return TECH_SHEETS.codo45IntegritySdr11;
    if (sdr.includes("sdr9")) return TECH_SHEETS.codo45IntegritySdr9;
    return undefined;
  }

  if (webCategory.includes("codo 45") && brand === "georg fischer") {
    return TECH_SHEETS.codo45GeorgFischer;
  }

  // normalize() quita tildes: "Tapón" llega aquí como "tapon".
  if (webCategory.includes("tapon") && brand === "integrity") {
    if (sdr.includes("sdr11")) return TECH_SHEETS.taponIntegritySdr11;
    if (sdr.includes("sdr9")) return TECH_SHEETS.taponIntegritySdr9;
    return undefined;
  }

  if (webCategory.includes("backing ring") && brand === "integrity" && sdr.includes("sdr11")) {
    return TECH_SHEETS.backingRingIntegritySdr11;
  }

  if (webCategory.includes("backing ring") && brand === "integrity" && sdr.includes("sdr7")) {
    return TECH_SHEETS.backingRingIntegritySdr7;
  }

  if (webCategory.includes("backing ring") && brand === "georg fischer" && pressure.includes("200")) {
    return TECH_SHEETS.backingRingGeorgFischerClase200;
  }

  if (webCategory.includes("backing ring") && brand === "georg fischer" && pressure.includes("335")) {
    return TECH_SHEETS.backingRingGeorgFischerClase335;
  }

  return undefined;
}

function resolveProductImage(product: FmProduct): string | undefined {
  const family = product.productFamily;
  const brand = normalize(product.brand);

  if (family === "tuberias") {
    return PRODUCT_IMAGES.tuboPavco;
  }

  if (family === "conexiones" && brand === "integrity") {
    return PRODUCT_IMAGES.conexionIntegrity;
  }

  if (family === "conexiones" && brand === "georg fischer") {
    return PRODUCT_IMAGES.conexionGeorgFischer;
  }

  return undefined;
}

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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "/assets/fichas-tecnicas/tuberia-hdpe-fm-extrucol.pdf",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
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
    technicalSheet: "PENDIENTE",
    rawMaterial: "PE4710"
  },
];

export const fmProducts: FmProduct[] = rawFmProducts.map((product) => ({
  ...product,

  filterMaterial:
  product.certification === "FM Approved"
    ? `${product.material} FM`
    : product.material,

  technicalSheet:
    product.technicalSheet && product.technicalSheet !== "PENDIENTE"
      ? product.technicalSheet
      : resolveTechnicalSheet(product) || "PENDIENTE",

  productImage:
    product.productImage || resolveProductImage(product)
}));