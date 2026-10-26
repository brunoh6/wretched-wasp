/**
 * CERTIFICACIONES — sección construida pero TODAVÍA NO PUBLICADA.
 *
 * H&C manejará dos familias de documentos:
 *   1. `producto`  → certificados de sus proveedores/partners que respaldan los
 *                    productos que distribuye (FM, NSF, ISO del fabricante, etc.).
 *   2. `servicio`  → certificaciones que habilitan a H&C a ejecutar sus servicios
 *                    (termofusión, electrofusión, carpintería plástica y alquiler
 *                    de máquinas).
 *
 * Aún no se cuenta con los PDFs, así que la sección se deja lista pero invisible
 * siguiendo el mismo patrón de `src/data/categories.ts`: un flag de datos manda
 * sobre el menú, el pie y la generación de la ruta estática.
 */

export type CertificationType = "producto" | "servicio";

export type Certification = {
  /** Identificador estable en kebab-case; se usa como `key` y como ancla (#slug). */
  slug: string;
  title: string;
  /** Entidad que emite o acredita el documento. */
  issuer: string;
  type: CertificationType;
  description: string;
  /** Ruta pública al PDF, p. ej. "/assets/certificados/fm-approvals-hdpe.pdf". */
  file?: string;
  /** Miniatura opcional (logo del emisor o portada del certificado). */
  image?: string;
  /** Año de emisión o de vigencia. */
  year?: number;
  /**
   * Igual que en las categorías de producto: una entrada sólo se muestra si su
   * dato está completo y verificado. Permite publicar de a pocos.
   */
  visible: boolean;
};

/* ============================================================================
 * CÓMO PUBLICAR ESTA SECCIÓN (tres pasos, en este orden)
 *
 *   1. Copiar los PDFs recibidos del cliente en `public/assets/certificados/`
 *      (crear la carpeta si no existe). Un archivo por certificado.
 *
 *   2. Rellenar las entradas de `certifications` con los datos reales
 *      —`title`, `issuer`, `year`, `description`— apuntar `file` al PDF
 *      correspondiente (p. ej. "/assets/certificados/fm-approvals-hdpe.pdf")
 *      y poner `visible: true` SÓLO en las que ya estén confirmadas.
 *
 *   3. Cambiar `CERTIFICATIONS_ENABLED` a `true`.
 *
 * Se hace en este orden porque el flag es el último interruptor: mientras esté
 * en `false` la ruta /certificaciones NO se genera en el build y los enlaces del
 * Header y del Footer no llegan siquiera a renderizarse en el HTML, de modo que
 * no queda ninguna página huérfana ni ningún enlace roto publicado.
 * ========================================================================== */
// Se anota `: boolean` a propósito: sin ello TypeScript infiere el tipo literal
// `false` y marcaría como código muerto los bloques del Header, el Footer y la
// página que sí deben existir cuando el flag pase a `true`.
export const CERTIFICATIONS_ENABLED: boolean = false;

/**
 * Entradas de EJEMPLO. Sirven de plantilla y quedan todas en `visible: false`
 * con datos marcados como pendientes: nadie debe publicarlas tal cual.
 */
export const certifications: Certification[] = [
  {
    slug: "certificado-fm-approvals-hdpe",
    title: "Certificado FM Approvals — Tubería HDPE contra incendio",
    issuer: "Por definir",
    type: "producto",
    description:
      "Pendiente: certificado del fabricante que respalda la línea HDPE FM distribuida por H&C para sistemas contra incendio.",
    file: undefined,
    image: undefined,
    year: undefined,
    visible: false
  },
  {
    slug: "certificado-calidad-fabricante-conexiones",
    title: "Certificado de calidad del fabricante — Conexiones HDPE",
    issuer: "Por definir",
    type: "producto",
    description:
      "Pendiente: documento del proveedor que acredita el sistema de calidad bajo el que se fabrican las conexiones HDPE.",
    file: undefined,
    image: undefined,
    year: undefined,
    visible: false
  },
  {
    slug: "acreditacion-termofusion-electrofusion",
    title: "Acreditación de termofusión y electrofusión",
    issuer: "Por definir",
    type: "servicio",
    description:
      "Pendiente: constancia que habilita al personal técnico de H&C para ejecutar uniones por termofusión y electrofusión en obra.",
    file: undefined,
    image: undefined,
    year: undefined,
    visible: false
  }
];

/**
 * Única lista que consumen la página, el Header y el Footer.
 *
 * El flag corta antes que el filtro: aunque alguien deje una entrada en
 * `visible: true` por error, nada se publica hasta habilitar la sección.
 */
export const visibleCertifications: Certification[] = CERTIFICATIONS_ENABLED
  ? certifications.filter((certification) => certification.visible)
  : [];

/** Títulos de los dos grupos que se muestran en la página. */
export const CERTIFICATION_TYPE_LABELS: Record<CertificationType, string> = {
  producto: "Certificados de producto",
  servicio: "Certificaciones de servicio"
};

/** Texto de apoyo bajo cada título de grupo. */
export const CERTIFICATION_TYPE_DESCRIPTIONS: Record<CertificationType, string> = {
  producto:
    "Documentos de nuestros proveedores y socios que respaldan los productos que distribuimos.",
  servicio:
    "Acreditaciones que habilitan a H&C para ejecutar sus servicios de instalación y mantenimiento."
};

/** Orden fijo de los grupos: primero producto, luego servicio. */
export const CERTIFICATION_TYPES: CertificationType[] = ["producto", "servicio"];

/** Certificaciones publicadas de un tipo, respetando el orden del array. */
export function getVisibleCertificationsByType(type: CertificationType): Certification[] {
  return visibleCertifications.filter((certification) => certification.type === type);
}
