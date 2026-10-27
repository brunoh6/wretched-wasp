// /src/data/catalogLines.ts
//
// Páginas del catálogo por LÍNEA comercial: /productos/<familia>/<línea>/.
//
//   /productos/tuberias/contra-incendio-fm/    /productos/conexiones/contra-incendio-fm/
//   /productos/tuberias/agua-pvc-cpvc/         /productos/conexiones/agua-pvc-cpvc/
//
// Son la URL final de los grupos de anuncios de Google Ads (contra incendio FM
// y agua PVC/CPVC). Las pinta la MISMA página que /productos/<familia>/
// (src/pages/productos/[category]/[...linea].astro) con el catálogo ya
// recortado a su línea; aquí sólo viven sus textos y su dirección.
//
// Estas cuatro rutas son un contrato compartido con la campaña: si se cambia un
// slug, los anuncios que apuntan a él acaban en la 404.

import { visibleCategories } from "./categories";
import {
  getCatalogDisplayItemsByCategory,
  type CatalogDisplayItem,
  type CatalogDisplayLine
} from "./catalogDisplayItems";

/** Segmento de URL de cada línea. */
export const LINE_SLUGS: Record<CatalogDisplayLine, string> = {
  fm: "contra-incendio-fm",
  agua: "agua-pvc-cpvc"
};

type ClaimField =
  | "brand"
  | "productName"
  | "material"
  | "application"
  | "typeClass"
  | "certification"
  | "standard"
  | "jointType"
  | "sizeRange";

/**
 * Una afirmación del texto y la fila del catálogo que la respalda.
 * En `match`, un array acepta cualquiera de sus valores y una RegExp se busca
 * dentro del campo.
 */
type LandingClaim = {
  /** Lo que dice el texto; sólo se usa en el mensaje de error. */
  says: string;
  match?: Partial<Record<ClaimField, string | string[] | RegExp>>;
  /** La fila debe tener ficha técnica publicada. */
  sheet?: boolean;
  /** true: TODAS las filas de la línea deben cumplirla; si no, basta con una. */
  every?: boolean;
};

export type CatalogLanding = {
  family: "tuberias" | "conexiones";
  line: CatalogDisplayLine;
  /** Segmento de la URL (ver LINE_SLUGS). */
  slug: string;
  /** Último tramo de la miga de pan. */
  label: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  /** Párrafo bajo el H1, renderizado en el servidor. */
  intro: string;
  claims: LandingClaim[];
};

// ─────────────────────────────────────────────────────────────────────────────
// TEXTOS
// ─────────────────────────────────────────────────────────────────────────────
// Nombran lo que se anuncia (HDPE FM Approved contra incendio; PVC y CPVC
// SCH-80 para agua) y SÓLO lo que el catálogo publica: cada marca, clase,
// producto o medida que aparece en el texto lleva su `claims`, y el build se
// detiene si alguna deja de existir (ver verifyClaims). Así un cambio en
// fmProducts.ts, un Excel nuevo o un grupo ocultado desde el panel no dejan una
// página de anuncio prometiendo algo que ya no está: Google Ads penaliza la
// página de destino que no cumple lo que anuncia.

const landings: CatalogLanding[] = [
  {
    family: "tuberias",
    line: "fm",
    slug: LINE_SLUGS.fm,
    label: "Contra incendio FM",
    h1: "Tubería HDPE FM Approved para redes contra incendio",
    seoTitle: "Tubería HDPE FM Approved para redes contra incendio | DIHYC",
    seoDescription:
      "Tubería HDPE FM Approved para redes contra incendio: Pavco, WL Plastics y Extrucol en SDR 11, 9 y 7, de 2\" a 16\" y de 63 a 400 mm. Ficha técnica y cotización.",
    intro:
      "Distribuimos en Lima tubería de polietileno de alta densidad (HDPE) certificada FM Approved según la norma FM 1613 para redes contra incendio. Trabajamos las marcas Pavco, WL Plastics y Extrucol en SDR 11, SDR 9 y SDR 7, de 2\" a 16\" y de 63 a 400 mm, con unión por termofusión y ficha técnica descargable en cada producto. Marca «Cotizar» en los que necesites y envía la lista por WhatsApp.",
    claims: [
      {
        says: "tubería HDPE FM Approved contra incendio",
        every: true,
        match: { productName: "Tubo", material: "HDPE", certification: "FM Approved", application: "Contra incendio" }
      },
      { says: "norma FM 1613", every: true, match: { standard: /FM ?1613/ } },
      { says: "unión por termofusión", every: true, match: { jointType: /Termofusión/ } },
      { says: "ficha técnica descargable en cada producto", every: true, sheet: true },
      { says: "Pavco", match: { brand: "Pavco" } },
      { says: "WL Plastics", match: { brand: "WL Plastics" } },
      { says: "Extrucol", match: { brand: "Extrucol" } },
      { says: "SDR 11", match: { typeClass: "SDR11" } },
      { says: "SDR 9", match: { typeClass: "SDR9" } },
      { says: "SDR 7", match: { typeClass: "SDR7" } },
      { says: "de 2\" a 16\"", match: { sizeRange: "2\" - 16\"" } },
      { says: "de 63 a 400 mm", match: { sizeRange: "63MM - 400MM" } }
    ]
  },
  {
    family: "conexiones",
    line: "fm",
    slug: LINE_SLUGS.fm,
    label: "Contra incendio FM",
    h1: "Conexiones HDPE FM Approved para redes contra incendio",
    seoTitle: "Conexiones HDPE FM Approved para redes contra incendio | DIHYC",
    seoDescription:
      "Conexiones HDPE FM Approved contra incendio: codos de 90° y 45°, tees, reducciones, tapones, flange adapter y bridas backing ring de Integrity y Georg Fischer.",
    intro:
      "Distribuimos en Lima conexiones certificadas FM Approved para redes contra incendio: codos de 90° y 45°, tees, reducciones, tapones y flange adapter de HDPE en SDR 11 y SDR 9, con unión por termofusión, y bridas / backing ring de hierro dúctil para las uniones con brida. Marcas Integrity y Georg Fischer, de 2\" a 16\", con ficha técnica descargable en cada producto. Marca «Cotizar» en los que necesites y envía la lista por WhatsApp.",
    claims: [
      {
        says: "conexiones FM Approved contra incendio",
        every: true,
        match: { certification: "FM Approved", application: "Contra incendio" }
      },
      { says: "ficha técnica descargable en cada producto", every: true, sheet: true },
      { says: "codos de 90° de HDPE", match: { productName: "Codo 90°", material: "HDPE" } },
      { says: "codos de 45° de HDPE", match: { productName: "Codo 45°", material: "HDPE" } },
      { says: "tees de HDPE", match: { productName: "Tee", material: "HDPE" } },
      { says: "reducciones de HDPE", match: { productName: "Reducción", material: "HDPE" } },
      { says: "tapones de HDPE", match: { productName: "Tapón", material: "HDPE" } },
      { says: "flange adapter de HDPE", match: { productName: "Flange Adapter", material: "HDPE" } },
      { says: "HDPE en SDR 11", match: { material: "HDPE", typeClass: "SDR11" } },
      { says: "HDPE en SDR 9", match: { material: "HDPE", typeClass: "SDR9" } },
      { says: "HDPE con unión por termofusión", match: { material: "HDPE", jointType: "Termofusión" } },
      {
        says: "bridas / backing ring de hierro dúctil",
        match: { productName: "Brida / Backing Ring", material: "Hierro dúctil" }
      },
      { says: "Integrity", match: { brand: "Integrity" } },
      { says: "Georg Fischer", match: { brand: "Georg Fischer" } },
      { says: "de 2\" a 16\"", match: { sizeRange: "2\" - 16\"" } }
    ]
  },
  {
    family: "tuberias",
    line: "agua",
    slug: LINE_SLUGS.agua,
    label: "Agua PVC y CPVC",
    h1: "Tubería PVC y CPVC SCH-80 para agua fría y caliente",
    seoTitle: "Tubería PVC y CPVC SCH-80 para agua fría y caliente | DIHYC",
    seoDescription:
      "Tubería SCH-80 de Georg Fischer: PVC para agua fría de 1/8\" a 16\" y CPVC Corzan para agua caliente de 1/4\" a 12\". Cotiza por WhatsApp desde el catálogo.",
    intro:
      "Distribuimos en Lima tubería SCH-80 de Georg Fischer para instalaciones de agua: PVC para agua fría, de 1/8\" a 16\", y CPVC Corzan para agua caliente, de 1/4\" a 12\". Marca «Cotizar» en los productos que necesites y envía la lista por WhatsApp.",
    claims: [
      {
        says: "tubería SCH-80 de Georg Fischer",
        every: true,
        match: { productName: "Tubo", brand: "Georg Fischer", typeClass: "SCH-80" }
      },
      {
        says: "PVC para agua fría, de 1/8\" a 16\"",
        match: { material: "PVC", application: "Agua fría", sizeRange: "1/8\" – 16\"" }
      },
      {
        says: "CPVC Corzan para agua caliente, de 1/4\" a 12\"",
        match: { material: "CPVC Corzan", application: "Agua caliente", sizeRange: "1/4\" – 12\"" }
      }
    ]
  },
  {
    family: "conexiones",
    line: "agua",
    slug: LINE_SLUGS.agua,
    label: "Agua PVC y CPVC",
    h1: "Conexiones PVC y CPVC SCH-80 para agua fría y caliente",
    seoTitle: "Conexiones PVC y CPVC SCH-80 para agua fría y caliente | DIHYC",
    seoDescription:
      "Conexiones SCH-80 de Georg Fischer en PVC para agua fría y CPVC Corzan para agua caliente: codos, tees, reducciones, bushings, uniones, adaptadores y bridas.",
    intro:
      "Distribuimos en Lima conexiones SCH-80 de Georg Fischer para instalaciones de agua: PVC para agua fría y CPVC Corzan para agua caliente. Codos de 90° y 45°, tees, yees, reducciones, bushings, niples, uniones universales, adaptadores macho y hembra, tapones y bridas. Marca «Cotizar» en los productos que necesites y envía la lista por WhatsApp.",
    claims: [
      {
        says: "conexiones SCH-80 de Georg Fischer",
        every: true,
        match: { brand: "Georg Fischer", typeClass: "SCH-80" }
      },
      { says: "PVC para agua fría", match: { material: "PVC", application: "Agua fría" } },
      {
        says: "CPVC Corzan para agua caliente",
        match: { material: "CPVC Corzan", application: "Agua caliente" }
      },
      { says: "codos de 90°", match: { productName: "Codo 90°" } },
      { says: "codos de 45°", match: { productName: "Codo 45°" } },
      { says: "tees", match: { productName: "Tee" } },
      { says: "yees", match: { productName: "Yee" } },
      { says: "reducciones", match: { productName: "Reducción" } },
      { says: "bushings", match: { productName: "Bushing" } },
      { says: "niples", match: { productName: "Niple" } },
      { says: "uniones universales", match: { productName: "Unión universal" } },
      { says: "adaptadores macho", match: { productName: "Adaptador macho" } },
      { says: "adaptadores hembra", match: { productName: "Adaptador hembra" } },
      { says: "tapones", match: { productName: ["Tapón hembra", "Tapón macho"] } },
      { says: "bridas", match: { productName: ["Brida fija", "Brida loca", "Brida ciega"] } }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// PUBLICACIÓN Y COMPROBACIÓN
// ─────────────────────────────────────────────────────────────────────────────

function rowsOf(landing: CatalogLanding): CatalogDisplayItem[] {
  return getCatalogDisplayItemsByCategory(landing.family).filter(
    (item) => item.line === landing.line
  );
}

function rowMatches(row: CatalogDisplayItem, claim: LandingClaim): boolean {
  if (claim.sheet && !row.technicalSheet) return false;

  return Object.entries(claim.match ?? {}).every(([field, expected]) => {
    const value = String(row[field as ClaimField] ?? "");

    if (expected instanceof RegExp) return expected.test(value);
    if (Array.isArray(expected)) return expected.includes(value);
    return value === expected;
  });
}

function verifyClaims(landing: CatalogLanding, rows: CatalogDisplayItem[]): string[] {
  return landing.claims
    .filter((claim) =>
      claim.every
        ? !rows.every((row) => rowMatches(row, claim))
        : !rows.some((row) => rowMatches(row, claim))
    )
    .map((claim) => `/productos/${landing.family}/${landing.slug}/ dice «${claim.says}»`);
}

/**
 * Páginas por línea que se publican: las de una familia visible
 * (categories.ts) cuya línea tiene productos. Si una línea se queda sin filas,
 * su página no se genera y los enlaces vuelven a /productos/<familia>/?linea=.
 */
export const publishedCatalogLandings: CatalogLanding[] = landings.filter(
  (landing) =>
    visibleCategories.some((category) => category.slug === landing.family) &&
    rowsOf(landing).length > 0
);

// Se detiene el build (igual que contactInfo.telHref con un teléfono sin código
// de área): publicar una página de anuncio con un texto que el catálogo ya no
// respalda es peor que no publicar el cambio.
const unbackedClaims = publishedCatalogLandings.flatMap((landing) =>
  verifyClaims(landing, rowsOf(landing))
);

if (unbackedClaims.length) {
  throw new Error(
    "catalogLines: el texto de estas páginas por línea nombra algo que el catálogo ya no publica:\n  - " +
      unbackedClaims.join("\n  - ") +
      "\nCorrige el texto (h1, seoTitle, seoDescription, intro) y su `claims` en src/data/catalogLines.ts."
  );
}

export function getCatalogLanding(family: string, slug: string): CatalogLanding | undefined {
  return publishedCatalogLandings.find(
    (landing) => landing.family === family && landing.slug === slug
  );
}

/**
 * Enlace al catálogo de una familia ya recortado a una línea. `query` son
 * parámetros extra del contrato del catálogo, sin "?" ("producto=codo-90").
 *
 * Con página propia: /productos/conexiones/contra-incendio-fm/?producto=codo-90
 * Sin ella (familia o línea sin página): /productos/conexiones/?linea=fm&producto=codo-90
 */
export function catalogLineHref(family: string, line: string, query = ""): string {
  const landing = publishedCatalogLandings.find(
    (item) => item.family === family && item.line === line
  );

  if (landing) {
    return `/productos/${family}/${landing.slug}/${query ? `?${query}` : ""}`;
  }

  return `/productos/${family}/?linea=${encodeURIComponent(line)}${query ? `&${query}` : ""}`;
}
