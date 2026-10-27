import { allGroups, allProducts } from "./catalog";
import { fmProducts } from "./fmProducts";
import { visibleCategories } from "./categories";
import { catalogLineHref } from "./catalogLines";
import { services } from "./services";
// Se reutiliza el slug del buscador para que el enlace que genera el índice y
// el que genera parseQuery() sean byte a byte el mismo contrato de URL.
import { slugify } from "./searchQuery";

export type SearchResultType =
  | "product"
  | "category"
  | "brand"
  | "system"
  | "service"
  | "page";

export type SearchItem = {
  title: string;
  href: string;
  category: string;
  description?: string;
  badge?: string;
  meta?: string;
  resultType: SearchResultType;
  keywords: string[];
  /**
   * Tokens normalizados (sin tildes, en minúscula) usados para el autocompletado
   * por prefijo. Se calculan aquí para que el navegador no repita el trabajo.
   */
  terms: string[];
  /** Prioridad base: ordena resultados de relevancia parecida. */
  weight: number;
};

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/["'°]/g, "")
    .replace(/[-_/.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean).map(v => v.trim()))];
}

function compactRange(value?: string) {
  return value?.replace(/\s*-\s*/g, "–").trim();
}

const CATEGORY_LABELS: Record<string, string> = {
  tuberias: "Tuberías",
  conexiones: "Conexiones"
};

const BRAND_LABELS: Record<string, string> = {
  "georg fischer": "Georg Fischer",
  "wl plastics": "WL Plastics",
  extrucol: "Extrucol",
  integrity: "Integrity",
  pavco: "Pavco"
};

const formatCategory = (value: string) => CATEGORY_LABELS[value] ?? value;
const formatBrand = (value: string) => BRAND_LABELS[normalizeText(value)] ?? value;

/**
 * Sinónimos y errores de tecleo frecuentes. La clave es lo que escribe el
 * usuario; el valor son términos extra que también deben hacer match.
 */
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  tubo: ["tuberias", "tubo"],
  tubos: ["tuberias", "tubo"],
  tuberia: ["tuberias", "tubo"],
  caneria: ["tuberias", "tubo"],
  accesorio: ["conexiones", "accesorios"],
  accesorios: ["conexiones", "accesorios"],
  conexion: ["conexiones", "accesorios"],
  conexiones: ["accesorios"],
  fitting: ["conexiones", "accesorios"],
  fittings: ["conexiones", "accesorios"],
  codo: ["codo", "elbow"],
  elbow: ["codo"],
  te: ["tee"],
  ye: ["yee"],
  reduccion: ["reduccion", "reductor", "bushing"],
  reductor: ["reduccion"],
  tapon: ["tapon", "tapon hembra", "tapon macho"],
  tapa: ["tapon"],
  brida: ["brida", "backing ring", "flange", "brida loca", "brida fija"],
  flange: ["flange adapter", "brida"],
  // Vocabulario de la línea agua. Se apunta a la grafía EXACTA que el índice
  // guarda en `terms`, porque expandQuery() sólo compara contra esos tokens.
  // Ojo: NO se apunta de "bushing" a "reduccion". La equivalencia es real en
  // obra, pero las reducciones FM pesan más (3) que los grupos de agua (2) y
  // se colaban por delante del bushing literal. Al revés sí interesa: quien
  // busca "reduccion" ve primero las FM y después los bushings de agua.
  bushing: ["bushing"],
  niple: ["niple"],
  nipple: ["niple"],
  union: ["union", "union simple", "union universal"],
  copla: ["union", "union simple"],
  adaptador: ["adaptador macho", "adaptador hembra", "flange adapter"],
  corzan: ["cpvc corzan", "cpvc"],
  corsan: ["cpvc corzan", "cpvc"],
  cpvc: ["cpvc corzan", "agua caliente"],
  pvc: ["pvc", "agua fria"],
  agua: ["agua fria", "agua caliente"],
  fria: ["agua fria"],
  caliente: ["agua caliente"],
  cedula: ["sch 80", "sch80"],
  schedule: ["sch 80", "sch80"],
  sch: ["sch 80", "sch80"],
  sch80: ["sch 80"],
  embone: ["embone", "conexiones"],
  rosca: ["rosca", "conexiones"],
  gf: ["georg fischer"],
  fisher: ["georg fischer"],
  fischer: ["georg fischer"],
  george: ["georg fischer"],
  incendio: ["contra incendio", "fm", "fm approved"],
  incendios: ["contra incendio", "fm"],
  fm: ["fm approved", "contra incendio"],
  pead: ["hdpe", "polietileno"],
  polietileno: ["hdpe"],
  soldadura: ["termofusion", "electrofusion"],
  maquina: ["alquiler de maquinas"],
  maquinas: ["alquiler de maquinas"],
  cotizacion: ["contacto"],
  precio: ["contacto"],
  ficha: ["ficha tecnica"]
};

/** Tokens de un item: frases completas + palabras sueltas, para prefijos. */
function buildTerms(parts: string[]) {
  const phrases = unique(parts.map(normalizeText).filter(Boolean));
  const words = phrases.flatMap(phrase => phrase.split(" ")).filter(w => w.length > 1);

  return [...new Set([...phrases, ...words])];
}

/* ================= PRODUCTOS FM ================= */
/* Agrupados por tipo + material + SDR para no repetir filas casi idénticas. */

type FmGroup = {
  webCategory: string;
  productFamily: string;
  material: string;
  sdrRde: string;
  certification: string;
  brands: string[];
  diameters: string[];
  pressures: string[];
  applications: string[];
  standards: string[];
  extras: string[];
};

const fmGroups = new Map<string, FmGroup>();

for (const product of fmProducts) {
  const key = normalizeText(
    `${product.productFamily} ${product.webCategory} ${product.material} ${product.sdrRde}`
  );

  const group = fmGroups.get(key) ?? {
    webCategory: product.webCategory,
    productFamily: product.productFamily,
    material: product.material,
    sdrRde: product.sdrRde,
    certification: product.certification,
    brands: [],
    diameters: [],
    pressures: [],
    applications: [],
    standards: [],
    extras: []
  };

  group.brands.push(formatBrand(product.brand));
  if (product.diameter) group.diameters.push(product.diameter);
  if (product.pressureClass) group.pressures.push(product.pressureClass);
  if (product.solutionApplication) group.applications.push(product.solutionApplication);
  if (product.standard) group.standards.push(product.standard);
  group.extras.push(
    product.className,
    product.jointType,
    product.mainUse,
    product.rawMaterial,
    product.presentation,
    ...(product.diameters ?? [])
  );

  fmGroups.set(key, group);
}

const fmSearchItems: SearchItem[] = [...fmGroups.values()].map(group => {
  const brands = unique(group.brands);
  const categoryLabel = formatCategory(group.productFamily);
  const title = `${group.webCategory} ${group.material} FM ${group.sdrRde}`.trim();
  const diameter = compactRange(unique(group.diameters)[0]);

  return {
    title,
    // El resultado enlaza al catálogo YA FILTRADO por este producto, igual que
    // hacen los items de la línea agua y el atajo "Ver N filtros aplicados".
    // Antes apuntaba a la familia desnuda: pulsar "Codo 90° HDPE FM SDR11"
    // aterrizaba en las 69 filas de /productos/conexiones sin ningún filtro,
    // justo debajo de un atajo que sí llevaba la consulta completa.
    // Va a la página de la línea FM de su familia, que equivale a ?linea=fm.
    href: catalogLineHref(
      group.productFamily,
      "fm",
      `producto=${slugify(group.webCategory)}` +
        (group.sdrRde ? `&tipo=${slugify(group.sdrRde)}` : "")
    ),
    category: categoryLabel,
    description: `${brands.join(" · ")}${diameter ? ` · ${diameter}` : ""}`,
    badge: "FM",
    meta: `${categoryLabel}${diameter ? ` · ${diameter}` : ""}`,
    resultType: "product",
    weight: 3,
    keywords: unique([
      group.webCategory,
      group.material,
      group.sdrRde,
      group.certification,
      categoryLabel,
      group.productFamily,
      "FM",
      "FM Approved",
      ...brands,
      ...unique(group.applications),
      ...unique(group.pressures),
      ...unique(group.standards),
      ...unique(group.extras)
    ]),
    // Sólo términos identificativos. Los campos descriptivos largos
    // (mainUse, standard…) quedan en `keywords` pero fuera del autocompletado,
    // porque generaban coincidencias ruidosas.
    terms: buildTerms([
      title,
      group.webCategory,
      group.material,
      group.sdrRde,
      categoryLabel,
      group.productFamily,
      "fm approved",
      ...brands,
      ...unique(group.applications),
      ...unique(group.pressures)
    ])
  };
});

/* ================= LÍNEA AGUA (fría / caliente) ================= */
/*
 * Se indexa UN item por GRUPO (≈30), no por SKU (443).
 *
 * Un grupo es "Bushing PVC · Agua fría" con sus ~50 medidas: todas comparten
 * nombre, material, cédula y aplicación, así que como resultado de búsqueda
 * son indistinguibles. Meter las 443 filas multiplicaría por quince el JSON
 * que viaja al navegador y llenaría el desplegable de casi-duplicados
 * ("Bushing PVC 1/2 X 1/4", "Bushing PVC 1/2 X 3/8"…) que además apuntarían
 * todos al mismo sitio. La medida concreta se elige ya dentro del catálogo.
 */

/** Datos que sólo están en products.json y hacen falta para titular el grupo. */
type WaterGroupFacts = { typeClasses: string[]; brands: string[] };

const waterFactsByGroup = new Map<string, WaterGroupFacts>();

for (const product of allProducts) {
  const facts = waterFactsByGroup.get(product.groupKey) ?? { typeClasses: [], brands: [] };

  if (product.typeClass) facts.typeClasses.push(product.typeClass);
  if (product.brand) facts.brands.push(formatBrand(product.brand));

  waterFactsByGroup.set(product.groupKey, facts);
}

const waterSearchItems: SearchItem[] = allGroups
  // `visible` ya viene fusionado con overrides.json: si el CMS oculta un grupo
  // tampoco debe poder encontrarse desde el buscador.
  .filter(group => group.visible)
  .map(group => {
    const facts = waterFactsByGroup.get(group.groupKey);
    const typeClass = unique(facts?.typeClasses ?? [])[0] ?? "";
    const brands = unique(facts?.brands ?? []);
    const categoryLabel = formatCategory(group.family);

    // "Bushing PVC SCH-80 Agua fría": el mismo orden en el que se pide en obra.
    const title = [group.productName, group.material, typeClass, group.application]
      .filter(Boolean)
      .join(" ");

    // El enlace lleva la familia MÁS los filtros del grupo. Aterrizar en
    // /productos/conexiones a secas obligaría a repetir a mano la selección
    // que el usuario ya había expresado al escribir; el catálogo hidrata estas
    // tres claves desde la URL igual que hace el atajo "Ver N filtros".
    const href =
      `/productos/${group.family}/` +
      `?producto=${slugify(group.productName)}` +
      `&material=${slugify(group.material)}` +
      `&aplicacion=${slugify(group.application)}`;

    return {
      title,
      href,
      category: categoryLabel,
      description: `${brands.join(" · ")}${brands.length ? " · " : ""}${group.skuCount} medidas`,
      // El distintivo marca la LÍNEA, igual que "FM" en los productos contra
      // incendio: una sola palabra que no estrangula el título truncado a
      // 375 px. Fría o caliente ya se lee en el propio título.
      badge: "Agua",
      meta: `${categoryLabel} · ${group.application}`,
      resultType: "product" as const,
      // Por debajo de los productos FM (3) y muy por debajo de categorías (9)
      // y marcas (8): son 30 items nuevos y no deben desplazar a los enlaces
      // canónicos del sitio cuando la consulta es genérica.
      weight: 2,
      keywords: unique([
        group.productName,
        group.material,
        group.application,
        typeClass,
        categoryLabel,
        "agua",
        ...brands
      ]),
      // Sin la marca: los 443 productos son de Georg Fischer, así que indexarla
      // haría que "gf" empatase 30 grupos de agua con los productos FM y
      // llenase el desplegable (6 filas) de bushings y niples. La ficha de
      // marca seguiría primera, pero detrás no quedaría nada útil. La marca se
      // sigue viendo en la descripción de cada fila.
      terms: buildTerms([
        title,
        group.productName,
        group.material,
        group.application,
        typeClass,
        // "sch80" pegado: el autocompletado no une prefijo y número como sí
        // hace normalizeQuery(), así que se indexan las dos grafías.
        typeClass.replace(/[\s-]+/g, ""),
        categoryLabel,
        group.family,
        "agua"
      ])
    };
  });

/* ================= CATEGORÍAS PUBLICADAS ================= */

const categorySearchItems: SearchItem[] = visibleCategories.map(category => {
  const alias = category.navLabel ?? category.name;

  return {
    title: category.name,
    href: `/productos/${category.slug}/`,
    category: "Catálogo",
    // Sin el "FM": la página de familia ya publica las DOS líneas (contra
    // incendio y agua) y se separan con la faceta Línea, no con la ruta.
    // `terms` sí conserva "catalogo fm", que se sigue tecleando.
    description: `Ver todo el catálogo de ${category.name.toLowerCase()}: contra incendio FM y agua.`,
    badge: alias,
    meta: "Catálogo",
    resultType: "category",
    weight: 9,
    keywords: unique([category.name, alias, category.slug, "catalogo", "fm"]),
    terms: buildTerms([category.name, alias, category.slug, "catalogo fm"])
  };
});

/* ================= SERVICIOS, MARCAS Y PÁGINAS ================= */

/**
 * Lo que el buscador sabe de cada servicio además de su título y su nombre
 * corto, que vienen del panel (services.json): si el gerente los cambia, el
 * buscador encuentra el nombre nuevo sin perder las palabras de siempre.
 */
const SERVICE_SEARCH: Record<string, { description: string; keywords: string[]; terms: string[] }> = {
  termofusion: {
    description: "Unión de tuberías plásticas mediante calor controlado.",
    keywords: ["termofusion", "soldadura", "union", "servicio"],
    terms: ["termofusion", "soldadura", "servicio"]
  },
  electrofusion: {
    description: "Unión con accesorios de resistencia eléctrica integrada.",
    keywords: ["electrofusion", "soldadura", "servicio"],
    terms: ["electrofusion", "soldadura", "servicio"]
  },
  "carpinteria-plastica": {
    description: "Fabricación de elementos industriales a medida.",
    keywords: ["carpinteria plastica", "fabricacion", "a medida", "servicio"],
    terms: ["fabricacion a medida", "servicio"]
  },
  "alquiler-maquinas": {
    description: "Equipos de termofusión y electrofusión en alquiler.",
    keywords: ["alquiler de maquinas", "maquinas", "equipos", "servicio"],
    terms: ["maquinas", "equipos", "servicio"]
  }
};

const serviceSearchItems: SearchItem[] = services.map((service) => {
  const extra = SERVICE_SEARCH[service.id];
  return {
    title: service.title,
    href: service.href,
    category: "Servicios",
    description: extra?.description ?? (service.homeSummary || undefined),
    badge: "Servicio",
    meta: "Servicios",
    resultType: "service",
    weight: 5,
    keywords: extra?.keywords ?? unique([normalizeText(service.label), "servicio"]),
    terms: buildTerms([service.title, service.label, ...(extra?.terms ?? ["servicio"])])
  };
});

const staticSearchItems: SearchItem[] = [
  ...serviceSearchItems,
  {
    title: "Sistemas contra incendio FM",
    // Misma página que la tarjeta "Tuberías FM" de /productos: la de la línea
    // FM de tuberías, que equivale a /productos/tuberias/?linea=fm.
    href: catalogLineHref("tuberias", "fm"),
    category: "Sistemas",
    description: "Tuberías y conexiones HDPE certificadas FM Approved.",
    badge: "Sistema",
    meta: "FM · HDPE",
    resultType: "system",
    weight: 7,
    keywords: [
      "contra incendio", "incendio", "fm", "fm approved",
      "red contra incendio", "sistema contra incendio", "hdpe fm", "aci"
    ],
    terms: buildTerms([
      "sistemas contra incendio fm", "contra incendio", "incendio",
      "fm approved", "red contra incendio", "hdpe", "aci"
    ])
  },
  {
    title: "Georg Fischer",
    href: "/productos/conexiones/",
    category: "Marca",
    // Georg Fischer ya no es sólo la marca de las conexiones FM: es también la
    // ÚNICA marca de los 443 SKU de la línea agua (PVC y CPVC Corzan). Decir
    // "Conexiones HDPE FM" dejaba fuera la mayor parte de su catálogo y
    // contradecía la propia ficha, que enlaza a /productos/conexiones sin
    // filtro de línea.
    description: "Conexiones de Georg Fischer: HDPE contra incendio FM y PVC / CPVC para agua.",
    badge: "Marca",
    meta: "Conexiones · FM y agua",
    resultType: "brand",
    weight: 8,
    keywords: ["georg fischer", "george fisher", "gf", "fischer", "fisher"],
    terms: buildTerms(["georg fischer", "george fisher", "gf", "fischer"])
  },
  {
    title: "Integrity",
    href: "/productos/conexiones/",
    category: "Marca",
    description: "Conexiones HDPE FM de Integrity.",
    badge: "Marca",
    meta: "Conexiones · FM",
    resultType: "brand",
    weight: 8,
    keywords: ["integrity", "conexiones", "fm"],
    terms: buildTerms(["integrity", "conexiones fm"])
  },
  {
    title: "Pavco",
    href: "/productos/tuberias/",
    category: "Marca",
    description: "Tubería HDPE FM de Pavco.",
    badge: "Marca",
    meta: "Tuberías · FM",
    resultType: "brand",
    weight: 8,
    keywords: ["pavco", "tuberias", "fm"],
    terms: buildTerms(["pavco", "tuberias fm"])
  },
  {
    title: "Contacto",
    href: "/contacto/",
    category: "Página",
    description: "Teléfonos, correos, WhatsApp y ubicación.",
    badge: "Página",
    meta: "Atención al cliente",
    resultType: "page",
    weight: 1,
    keywords: ["contacto", "telefono", "correo", "whatsapp", "cotizacion", "direccion"],
    terms: buildTerms(["contacto", "telefono", "correo", "whatsapp", "cotizacion", "ubicacion"])
  },
  {
    title: "Quiénes somos",
    href: "/empresa/",
    category: "Página",
    description: "Trayectoria, misión, visión y valores de H&C.",
    badge: "Página",
    meta: "Empresa",
    resultType: "page",
    weight: 1,
    keywords: ["empresa", "quienes somos", "nosotros", "historia", "mision", "vision"],
    terms: buildTerms(["quienes somos", "empresa", "nosotros", "mision", "vision"])
  }
];

/* ================= ÍNDICE FINAL ================= */

export const searchIndex: SearchItem[] = [
  ...categorySearchItems,
  ...fmSearchItems,
  ...waterSearchItems,
  ...staticSearchItems
];

/** Sugerencias mostradas al enfocar el buscador sin haber escrito nada. */
export const popularSearches = [
  "Tubos",
  "Accesorios",
  "Codo 90°",
  "Contra incendio",
  "Agua fría",
  "Georg Fischer"
];
