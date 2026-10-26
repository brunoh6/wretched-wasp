// /src/data/catalog/index.ts
//
// Capa de acceso al catálogo importado desde Excel.
//
// ─────────────────────────────────────────────────────────────────────────────
// POR QUÉ HAY TRES ARCHIVOS SEPARADOS Y NO UNO SOLO
// ─────────────────────────────────────────────────────────────────────────────
// `products.json` y `groups.json` los REGENERA POR COMPLETO el importador
// (`scripts/import-products.mjs`) cada vez que llega un Excel nuevo: se borran
// y se vuelven a escribir de cero. Son datos de ingeniería (medidas, materiales,
// SKU) que sólo cambian en el Excel.
//
// `overrides.json`, en cambio, lo edita una PERSONA desde el CMS: la ficha
// técnica en PDF, la foto del producto y el interruptor de publicado/oculto.
// Ese trabajo no está en el Excel y nadie lo puede reconstruir
// automáticamente.
//
// Si esos campos del CMS vivieran dentro de `products.json`, la siguiente
// importación los BORRARÍA sin aviso: bastaría con que el cliente mandara un
// Excel actualizado para perder todas las fichas y todas las fotos cargadas.
// Por eso viven aparte. El importador reescribe `overrides.json` (una fila por
// grupo, con `label` y `family` para el panel) pero copia intactos los datos
// del CMS, y se detiene si un grupo con datos desaparece del Excel. Es aquí
// —en tiempo de build— donde ambas mitades se vuelven a unir.
//
// La unión se hace POR GRUPO, no por producto: un grupo es "Codo PVC · Agua
// fría", con sus ~40 medidas. La ficha técnica y la foto son las mismas para
// todas las medidas del grupo, así que el CMS gestiona 30 fichas en vez de 443.

import groupsData from "./groups.json";
import overridesData from "./overrides.json";
import productsData from "./products.json";

/** Familias publicadas hoy; coinciden con los slugs de `src/data/categories.ts`. */
export type CatalogFamily = "tuberias" | "conexiones";

/** Línea comercial: "fm" = contra incendio, "agua" = agua fría/caliente. */
export type CatalogLine = "fm" | "agua";

/**
 * Datos que aporta el CMS. Se definen en el grupo y los heredan todos sus
 * productos.
 */
export type CatalogPresentation = {
  /** Si es `false`, el grupo entero desaparece del catálogo público. */
  visible: boolean;
  /** Ruta al PDF en /public. Vacío = "Ficha pendiente" en la tabla. */
  technicalSheet: string;
  /** Ruta a la imagen en /public. Vacío = sin foto. */
  image: string;
  notes: string;
};

/** Especificación tal cual la escribe el importador en `products.json`. */
export type CatalogProductSpec = {
  sku: string;
  groupKey: string;
  line: CatalogLine;
  family: CatalogFamily;
  productName: string;
  brand: string;
  material: string;
  application: string;
  typeClass: string;
  pressureClass: string;
  certification: string;
  sdrRde: string;
  diameter: string;
  unit: string;
  presentation: string;
  length: string;
  standard: string;
  jointType: string;
  mainUse: string;
};

/** Especificación del grupo tal cual la escribe el importador en `groups.json`. */
export type CatalogGroupSpec = {
  groupKey: string;
  label: string;
  line: CatalogLine;
  family: CatalogFamily;
  productName: string;
  material: string;
  application: string;
  skuCount: number;
  /** Medidas del grupo, ya ordenadas de menor a mayor por el importador. */
  diameters: string[];
};

/**
 * Una entrada de `overrides.json`: lo que el CMS guarda para un grupo.
 * `label` y `family` los escribe el importador sólo para el panel (título de
 * la fila y enlace de vista previa); aquí no se usan. `notes` salió del panel
 * porque el repositorio es público: puede faltar.
 */
export type CatalogOverride = Omit<CatalogPresentation, "notes"> & {
  groupKey: string;
  notes?: string;
  label?: string;
  family?: string;
};

/** Producto listo para pintar: especificación + datos heredados del CMS. */
export type CatalogProduct = CatalogProductSpec & CatalogPresentation;

/** Grupo listo para pintar: especificación + datos del CMS. */
export type CatalogGroup = CatalogGroupSpec & CatalogPresentation;

/**
 * Valores por defecto cuando un grupo todavía no tiene fila en overrides.json
 * (por ejemplo, si alguien edita el JSON a mano y borra una entrada).
 * El grupo se muestra igualmente: ocultar productos por accidente sería peor
 * que mostrarlos sin ficha, y la tabla ya sabe pintar "Ficha pendiente".
 */
const DEFAULT_PRESENTATION: CatalogPresentation = {
  visible: true,
  technicalSheet: "",
  image: "",
  notes: ""
};

// TypeScript infiere los JSON como `string` genérico y no como nuestras uniones
// ("tuberias" | "conexiones"), así que hace falta afirmar el tipo. El importador
// es quien garantiza la forma: valida las cabeceras y sólo emite estos valores.
const productSpecs = productsData.products as unknown as CatalogProductSpec[];
const groupSpecs = groupsData.groups as unknown as CatalogGroupSpec[];
// overrides.json es una lista en la raíz (así lo pide la colección de un solo
// archivo del panel). Se acepta también la forma anterior `{ overrides: [...] }`
// para que un archivo viejo no tumbe el build.
const overridesRaw = overridesData as unknown;
const overrides = (
  Array.isArray(overridesRaw)
    ? overridesRaw
    : ((overridesRaw as { overrides?: unknown[] } | null)?.overrides ?? [])
) as CatalogOverride[];

/** Índice por groupKey para no recorrer la lista de overrides en cada producto. */
const overridesByGroupKey = new Map<string, CatalogOverride>(
  overrides.map((override) => [override.groupKey, override])
);

/** Normaliza un override a los cuatro campos de presentación, con defaults. */
function presentationFor(groupKey: string): CatalogPresentation {
  const override = overridesByGroupKey.get(groupKey);

  if (!override) return DEFAULT_PRESENTATION;

  return {
    // `visible` sólo es false si el CMS lo dice explícitamente.
    visible: override.visible !== false,
    technicalSheet: override.technicalSheet ?? "",
    image: override.image ?? "",
    notes: override.notes ?? ""
  };
}

/** Archivo de origen del catálogo, útil para depurar qué Excel se importó. */
export const catalogSource: string = productsData.source;

/** Todos los grupos, con los datos del CMS ya fusionados. */
export const allGroups: CatalogGroup[] = groupSpecs.map((group) => ({
  ...group,
  ...presentationFor(group.groupKey)
}));

/** Todos los productos, cada uno heredando la presentación de SU grupo. */
export const allProducts: CatalogProduct[] = productSpecs.map((product) => ({
  ...product,
  ...presentationFor(product.groupKey)
}));

/**
 * Productos de una familia listos para publicar.
 * Excluye los grupos que el CMS marcó como ocultos.
 */
export function getProductsByFamily(family: string): CatalogProduct[] {
  return allProducts.filter((product) => product.family === family && product.visible);
}

/** Grupos publicados de una familia (mismo criterio de visibilidad). */
export function getGroupsByFamily(family: string): CatalogGroup[] {
  return allGroups.filter((group) => group.family === family && group.visible);
}
