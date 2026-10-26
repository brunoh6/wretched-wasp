// /src/data/catalogMatrix.ts

export type CatalogMatrixItem = {
  category: string;
  subcategory: string;
  material: string;
  materialAliases?: string[];
  typeClass?: string;
  brands: string[];
  sizes?: string[];

  standard?: string;
  webOrder?: number;
  suggestedUrl?: string;

  visible: boolean;
  notes?: string;
};

export const catalogMatrix: CatalogMatrixItem[] = [

  // =========================================================
  // TUBERÍAS → AGUA → PVC
  // =========================================================

  {
    category: "tuberias",
    subcategory: "agua",
    material: "PVC",
    materialAliases: ["PVC"],
    typeClass: "C-5",
    brands: ["Pavco", "Tigre", "Inyectoplast"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '2.1/2"', '3"', '4"', '6"', '8"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "PVC",
    materialAliases: ["PVC"],
    typeClass: "C7.5",
    brands: ["Pavco", "Tigre", "Inyectoplast"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '2.1/2"', '3"', '4"', '6"', '8"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "PVC",
    materialAliases: ["PVC"],
    typeClass: "C10",
    brands: ["Pavco", "Tigre", "Inyectoplast"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '2.1/2"', '3"', '4"', '6"', '8"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "PVC",
    materialAliases: ["PVC"],
    typeClass: "C15",
    brands: ["Pavco", "Tigre", "Inyectoplast"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '2.1/2"', '3"', '4"', '6"', '8"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "PVC",
    materialAliases: ["PVC"],
    typeClass: "SCH-40",
    brands: ["Georg Fischer", "Hidroseal", "Era", "Lesso", "Gerfor"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '2.1/2"', '3"', '4"', '6"', '8"'],
    visible: true,
    notes: "Se normalizó GEORG FISHER como Georg Fischer. Confirmar si GERFPR era Gerfor."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "PVC",
    materialAliases: ["PVC"],
    typeClass: "SCH-80",
    brands: ["Georg Fischer", "Hidroseal", "Era", "Lesso", "Gerfor"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '2.1/2"', '3"', '4"', '6"', '8"'],
    visible: true,
    notes: "Se normalizó GEORG FISHER como Georg Fischer."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "PVC",
    materialAliases: ["PVC"],
    typeClass: "PN5",
    brands: ["Pavco", "Tigre", "Inyectoplast"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '2.1/2"', '3"', '4"', '6"', '8"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "PVC",
    materialAliases: ["PVC"],
    typeClass: "PN7.5",
    brands: ["Pavco", "Tigre", "Inyectoplast"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '2.1/2"', '3"', '4"', '6"', '8"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "PVC",
    materialAliases: ["PVC"],
    typeClass: "PN10",
    brands: ["Pavco", "Tigre", "Inyectoplast"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '2.1/2"', '3"', '4"', '6"', '8"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "PVC",
    materialAliases: ["PVC"],
    typeClass: "PN15",
    brands: ["Pavco", "Tigre", "Inyectoplast"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '2.1/2"', '3"', '4"', '6"', '8"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "PVC",
    materialAliases: ["PVC"],
    typeClass: "PN16",
    brands: ["Pavco", "Tigre", "Inyectoplast"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '2.1/2"', '3"', '4"', '6"', '8"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  // =========================================================
  // TUBERÍAS → AGUA → CPVC
  // =========================================================

  {
    category: "tuberias",
    subcategory: "agua",
    material: "CPVC",
    materialAliases: ["CPVC"],
    typeClass: "CTS",
    brands: ["Pavco", "Era", "Tigre"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/4"', '1.1/2"', '2"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "CPVC",
    materialAliases: ["CPVC", "CORZAN"],
    typeClass: "SCH-80 CORZAN",
    brands: ["Georg Fischer"],
    sizes: ['3/4"', '1"', '1.1/4"', '1.1/2"', '2"', '2.1/2"', '3"', '4"', '6"', '8"'],
    visible: true,
    notes: "Se normalizó GEORG FISHER como Georg Fischer. Validar si CORZAN se maneja como material, sistema o clase técnica."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "CPVC",
    materialAliases: ["CPVC"],
    typeClass: "SCH-80",
    brands: ["Hidroseal", "Era"],
    sizes: ['2"', '2.1/2"', '3"', '4"', '6"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  // =========================================================
  // TUBERÍAS → AGUA → HDPE
  // =========================================================

  {
    category: "tuberias",
    subcategory: "agua",
    material: "HDPE",
    materialAliases: ["HDPE"],
    typeClass: "SDR7",
    brands: ["Pavco", "Tigre", "Global Plast", "Fortiflex"],
    sizes: ['1/2"', '3/4"', '1"', '2"', '3"', '4"', '6"', '8"', '10"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "HDPE",
    materialAliases: ["HDPE"],
    typeClass: "SDR9",
    brands: ["Pavco", "Tigre", "Global Plast", "Fortiflex"],
    sizes: ['1/2"', '3/4"', '1"', '2"', '3"', '4"', '6"', '8"', '10"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "HDPE",
    materialAliases: ["HDPE"],
    typeClass: "SDR11",
    brands: ["Pavco", "Tigre", "Global Plast", "Fortiflex"],
    sizes: ['1/2"', '3/4"', '1"', '2"', '3"', '4"', '6"', '8"', '10"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "HDPE",
    materialAliases: ["HDPE"],
    typeClass: "SDR17",
    brands: ["Pavco", "Tigre", "Global Plast", "Fortiflex"],
    sizes: ['1/2"', '3/4"', '1"', '2"', '3"', '4"', '6"', '8"', '10"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "HDPE",
    materialAliases: ["HDPE"],
    typeClass: "SDR21",
    brands: ["Pavco", "Tigre", "Global Plast", "Fortiflex"],
    sizes: ['1/2"', '3/4"', '1"', '2"', '3"', '4"', '6"', '8"', '10"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  // =========================================================
  // TUBERÍAS → AGUA → PP / PP-H / PP-R
  // =========================================================

  {
    category: "tuberias",
    subcategory: "agua",
    material: "PP-H",
    materialAliases: ["PP-H"],
    typeClass: "SDR11",
    brands: ["Simona"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '3"', '4"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "PP-H",
    materialAliases: ["PP-H"],
    typeClass: "A.C.",
    brands: ["IPS", "Hidro-3"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '3"', '4"'],
    visible: true,
    notes: "Validar nomenclatura A.C. y marcas IPS / Hidro-3."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "PP-R",
    materialAliases: ["PP-R"],
    typeClass: "PN16",
    brands: ["Hakan Plastic"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '3"', '4"'],
    visible: true,
    notes: "Se normalizó HAKAN PLASTIC como Hakan Plastic."
  },

  {
    category: "tuberias",
    subcategory: "agua",
    material: "PP-R",
    materialAliases: ["PP-R"],
    typeClass: "PN20",
    brands: ["Hakan Plastic", "Niron", "Polifusion"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '3"', '4"', '6"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  // =========================================================
  // TUBERÍAS → LUZ
  // =========================================================

  {
    category: "tuberias",
    subcategory: "luz",
    material: "PVC",
    materialAliases: ["PVC"],
    typeClass: "SEL",
    brands: ["Pavco", "Tigre", "Inyectoplast"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '3"', '4"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  {
    category: "tuberias",
    subcategory: "luz",
    material: "PVC",
    materialAliases: ["PVC"],
    typeClass: "SAP",
    brands: ["Pavco", "Tigre", "Inyectoplast"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '3"', '4"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  {
    category: "tuberias",
    subcategory: "luz",
    material: "PVC",
    materialAliases: ["PVC"],
    typeClass: "SAP DSCP",
    brands: ["Pavco", "Tigre", "Inyectoplast"],
    sizes: ['1/2"', '3/4"', '1"', '1.1/2"', '2"', '3"', '4"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  // =========================================================
  // TUBERÍAS → DESAGÜE
  // =========================================================

  {
    category: "tuberias",
    subcategory: "desague",
    material: "PVC",
    materialAliases: ["PVC"],
    typeClass: "SAL DSCL",
    brands: ["Pavco", "Tigre", "Inyectoplast"],
    sizes: ['2"', '3"', '4"', '6"', '8"'],
    visible: true,
    notes: "Medidas temporales de prueba para validación visual con cliente."
  },

  // =========================================================
  // TUBERÍAS → CONTRA INCENDIO
  // =========================================================

  {
    category: "tuberias",
    subcategory: "contra incendio",
    material: "HDPE / FM",
    materialAliases: ["HDPE", "FM"],
    typeClass: "SR9",
    brands: ["Pavco", "Extrucol", "WL Plastics"],
    sizes: ['2"', '3"', '4"', '6"', '8"', '10"', '12"'],
    visible: false,
    notes: "Se normalizó ESTRUCOL como Extrucol y WLPLASTIC como WL Plastics."
  },

  {
    category: "tuberias",
    subcategory: "contra incendio",
    material: "HDPE / FM",
    materialAliases: ["HDPE", "FM"],
    typeClass: "SR11",
    brands: ["Pavco", "Extrucol", "WL Plastics"],
    sizes: ['2"', '3"', '4"', '6"', '8"', '10"', '12"'],
    visible: false,
    notes: "Se normalizó ESTRUCOL como Extrucol y WLPLASTIC como WL Plastics."
  }

];