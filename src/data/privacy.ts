/**
 * POLÍTICA DE PRIVACIDAD — página construida pero TODAVÍA NO PUBLICADA.
 *
 * Mismo patrón que src/data/certifications.ts: un flag manda sobre la ruta
 * /politica-de-privacidad/, el enlace del pie y el aviso del formulario. Con
 * el flag en `false` nada de eso llega al HTML publicado.
 *
 * Base: Ley 29733 y su Reglamento (DS 016-2024-JUS, vigente desde el
 * 31-03-2025). Contenido mínimo: art. 18 de la Ley y art. 6.1 del Reglamento.
 * El texto es un BORRADOR para que lo revise un abogado peruano antes de
 * publicarlo.
 *
 * VER EL BORRADOR SIN PUBLICARLO
 *   · `npm run dev` y abrir http://localhost:4321/politica-de-privacidad/
 *   · o compilar con PRIVACY_PREVIEW=1 (nunca en la Action de publicar: el
 *     build se detiene si lo intenta).
 *   En los dos casos la página lleva la franja «Borrador», noindex, y marca en
 *   amarillo lo que falta completar o confirmar.
 *
 * CÓMO PUBLICARLA (en este orden)
 *   1. Completar todo lo marcado «pendiente» abajo (datos de la empresa,
 *      plazos, decisiones) y poner `confirmed: true` en cada destinatario
 *      que la empresa haya confirmado.
 *   2. Inscribir el banco de datos en el Registro Nacional de Protección de
 *      Datos Personales (SIPDP, trámite gratuito, gob.pe/8060), declarando los
 *      destinatarios y los países de abajo, y poner su nombre y código.
 *   3. Que un abogado apruebe el texto; poner la fecha en `updated`.
 *   4. Cambiar `PRIVACY_POLICY_ENABLED` a `true`.
 * Si al publicar queda algo pendiente, el build se detiene con la lista.
 *
 * ENCENDER O APAGAR GA4, CLARITY O GOOGLE ADS cambia lo que dice la política
 * (destinatarios, cookies, transferencias): antes hay que actualizar la
 * inscripción en el RNPDP (Reglamento, art. 44.1), subir la versión, poner la
 * fecha nueva y cambiar POLICY_COVERS_MEASUREMENT. Si no coinciden, el build
 * se detiene.
 */

import { measurementEnabled } from "./measurement";

// `: boolean` a propósito, como en certifications.ts: sin él TypeScript ve el
// literal `false` y daría por muerto el código que sí debe existir con `true`.
export const PRIVACY_POLICY_ENABLED: boolean = false;

/**
 * Vista previa del borrador: sólo en `astro dev` o con PRIVACY_PREVIEW=1 al
 * compilar. Se mira el MODE de Astro y no DEV: DEV sale de NODE_ENV, y un
 * NODE_ENV=development heredado colaría el borrador en un build de producción.
 */
export const PRIVACY_PREVIEW: boolean =
  !PRIVACY_POLICY_ENABLED &&
  (import.meta.env.MODE === "development" || process.env.PRIVACY_PREVIEW === "1");

if (PRIVACY_PREVIEW && process.env.GITHUB_ACTIONS === "true") {
  throw new Error(
    "La vista previa del borrador de la política de privacidad está activa dentro de la Action de publicar " +
      "(¿PRIVACY_PREVIEW=1?). No se publica un borrador."
  );
}

/** Página, enlace del pie y aviso del formulario: publicados o en vista previa. */
export const PRIVACY_VISIBLE = PRIVACY_POLICY_ENABLED || PRIVACY_PREVIEW;

// Medición encendida exige la política: el aviso de cookies remite a ella para
// la duración de cada cookie, los proveedores y los derechos (Ley 29733, art.
// 18). Dentro de la Action la vista previa no existe, así que ahí hace falta
// PRIVACY_POLICY_ENABLED, que a su vez exige la política sin pendientes.
if (Object.values(measurementEnabled).some(Boolean) && !PRIVACY_VISIBLE) {
  throw new Error(
    "Google Ads, GA4 o Clarity tienen su variable puesta, pero la política de privacidad no está publicada " +
      "(PRIVACY_POLICY_ENABLED en src/data/privacy.ts): el aviso de cookies enlaza a ella. Publica primero la " +
      "política o quita la variable en GitHub (README-deploy.md, sección 6)."
  );
}

export const PRIVACY_PATH = "/politica-de-privacidad/";

/**
 * Versión del texto. Viaja oculta con cada formulario (campo
 * `politica_privacidad`, ver ContactForm.astro) para poder probar qué aviso vio
 * la persona (Reglamento, art. IX.2). Subirla con cada cambio de fondo y anotar
 * el cambio en el historial del repositorio.
 */
export const PRIVACY_POLICY_VERSION = "1.0";

/**
 * Herramientas de medición que cubre ESTA versión del texto, ya aprobada y
 * declarada en el RNPDP. Con la política publicada, si lo encendido en el
 * build no coincide, el build se detiene (ver la cabecera).
 */
export const POLICY_COVERS_MEASUREMENT = { ga4: false, clarity: false, ads: false };

/**
 * Para qué se usan los datos del formulario, en una frase. La comparten el
 * aviso junto al botón y el resumen de la política, para que no se separen.
 */
export const PURPOSE_SUMMARY =
  "Usaremos tus datos para responder tu consulta, preparar tu cotización y, si nos compras, atender tu pedido.";

/** Una cadena vacía es un dato pendiente: la página lo marca y el build no deja publicar. */
export const privacyPolicy = {
  /** Fecha de la versión publicada, p. ej. "15 de noviembre de 2026". */
  updated: "",

  owner: {
    /** Tal como figura en el logo; confirmar con la ficha RUC. */
    legalName: "DISTRIBUCIÓN E IMPORTACIONES H&C S.R.L.",
    legalNameConfirmed: false,
    ruc: "",
    /** Domicilio fiscal completo, con distrito. */
    address: "",
    /** Correo para pedidos sobre datos personales (derechos ARCO). Lo atiende alguien con plazo. */
    privacyEmail: ""
  },

  /** Banco de datos inscrito en el RNPDP (Reglamento, art. 6.1.4). */
  database: { name: "", code: "" },

  /** Para qué se pide «DNI / CE / RUC» en el formulario (Ley 29733, arts. 7 y 18). */
  documentPurpose: "",

  /**
   * Base legal de los registros del servidor y la seguridad del sitio. La
   * decide el abogado: el art. 14.5 de la Ley sólo cubre a quien pide una
   * cotización o compra, no a quien sólo navega.
   */
  serverLogsBasis: "",

  /**
   * ¿Usa la empresa los contactos para publicidad o novedades? null =
   * pendiente. `false`: la política dice que no. `true`: hace falta antes una
   * casilla separada, opcional y sin marcar en el formulario (Reglamento,
   * art. 26.1) y un medio de baja.
   */
  marketing: null as boolean | null,

  /**
   * Confirmado en Formspree (formulario xpqlyqok → Settings → Spam
   * protection) que el reCAPTCHA está desactivado. Si estuviera activo, su
   * página de comprobación usaría Google reCAPTCHA, otro destinatario.
   */
  formspreeRecaptchaOff: false,

  /**
   * Qué se hace si alguien pide borrar sus datos de Microsoft Clarity, que no
   * permite borrar las grabaciones de una sola persona (sólo el proyecto
   * entero). Sólo se pide con Clarity encendido.
   */
  claritySuppression: "",

  /** Plazos de conservación concretos (Ley 29733, art. 8; Reglamento, art. 6.1.9). */
  retention: {
    /** Consultas y cotizaciones que no terminan en venta. */
    inquiries: "",
    /** Clientes: mientras dure la relación más el plazo legal que indique su contador. */
    customers: "",
    /** Copia de cada envío en el archivo de Formspree. */
    formspree: "",
    /** Registros de acceso del servidor web (los guarda el hosting). */
    serverLogs: "",
    /** Datos de Google Analytics: 2 o 14 meses, según se configure en GA4. Sólo con GA4. */
    ga4: "",
    /** Datos de conversiones en Google Ads (lo que Google conserve según su política). Sólo con Ads. */
    ads: ""
  }
};

export type Recipient = {
  id: string;
  /** Razón social del destinatario. */
  name: string;
  /** RUC, si es una empresa peruana (OC 010-2025, párr. 21). */
  ruc?: string;
  /** Domicilio legal (Ley 29733, art. 18; OC 010-2025, concl. 2). Vacío = pendiente. */
  address: string;
  /** Qué hace con los datos, en lenguaje llano. */
  role: string;
  /**
   * true = también los trata como responsable, según su propia política (no
   * sólo por encargo nuestro).
   */
  controller: boolean;
  /** Qué datos recibe. */
  data: string;
  /** Cuándo los recibe. */
  when: string;
  /** País donde se tratan (flujo transfronterizo si no es Perú). */
  country: string;
  /**
   * Garantía o base de la transferencia (Ley 29733, art. 15; Reglamento,
   * arts. 18-21). Vacío = pendiente.
   */
  safeguard: string;
  /** Su política de privacidad. */
  link?: string;
  /** Su lista de subencargados (Reglamento, art. 29.1). */
  subprocessorsLink?: string;
  /** La empresa confirmó proveedor, país y garantía. */
  confirmed: boolean;
  /** Sólo aparece si está en uso en este build. */
  active: boolean;
};

/**
 * Quién recibe datos y dónde. Proveedores y países salen de la auditoría del
 * sitio del 28-10-2026 (DNS, RDAP y documentación de cada proveedor); la
 * empresa debe confirmarlos con sus contratos, y el abogado, los domicilios.
 */
export const recipients: Recipient[] = [
  {
    id: "formspree",
    name: "Formspree, Inc.",
    address: "",
    role: "Recibe el formulario de contacto, filtra el spam y lo reenvía a nuestro correo. Guarda una copia en su archivo.",
    controller: false,
    data: "Lo que escribes en el formulario y, como en toda conexión, tu dirección IP, tu navegador y la dirección de nuestro sitio, que registra para evitar fraudes y abusos.",
    when: "Cuando envías el formulario.",
    country: "Estados Unidos (servidores de Amazon Web Services)",
    safeguard: "",
    link: "https://formspree.io/legal/privacy-policy/",
    subprocessorsLink: "https://formspree.io/legal/subprocessors",
    confirmed: false,
    active: true
  },
  {
    id: "correo",
    name: "Proveedor de nuestro correo corporativo (por confirmar: PerúLinux)",
    address: "",
    role: "Aloja los buzones donde recibimos tus correos y los avisos del formulario.",
    controller: false,
    data: "Tus correos y el contenido del formulario.",
    when: "Cuando nos escribes o envías el formulario.",
    country: "Francia (servidor en París, por confirmar)",
    safeguard: "",
    confirmed: false,
    active: true
  },
  {
    id: "hosting",
    name: "Latinoamérica Hosting (por confirmar), con servidor de OVH",
    address: "",
    role: "Aloja este sitio web y guarda los registros técnicos de cada visita.",
    controller: false,
    data: "Dirección IP, página visitada (con lo buscado y los filtros del catálogo), navegador, página de procedencia, fecha y hora.",
    when: "En cada visita.",
    country: "Canadá (servidor en Beauharnois, Quebec)",
    safeguard: "",
    confirmed: false,
    active: true
  },
  {
    id: "google-recursos",
    name: "Google LLC",
    address: "1600 Amphitheatre Parkway, Mountain View, CA 94043, Estados Unidos",
    role: "Sirve el mapa de la página Contacto (Google Maps).",
    controller: true,
    data: "Dirección IP, navegador, la página desde la que se pide y lo que hagas en el mapa; Google puede usar sus cookies.",
    when: "Sólo si pulsas «Ver mapa» en la página Contacto.",
    country: "Estados Unidos",
    safeguard: "",
    link: "https://policies.google.com/privacy",
    confirmed: false,
    active: true
  },
  {
    id: "whatsapp",
    name: "WhatsApp LLC (Meta)",
    address: "1601 Willow Road, Menlo Park, CA 94025, Estados Unidos",
    role: "Presta el servicio de mensajería cuando decides escribirnos por WhatsApp.",
    controller: true,
    data: "Tu número, tu perfil y los mensajes.",
    when: "Sólo si nos escribes por WhatsApp.",
    country: "Estados Unidos",
    safeguard: "",
    link: "https://www.whatsapp.com/legal/privacy-policy",
    confirmed: false,
    active: true
  },
  {
    id: "google-analytics",
    name: "Google LLC (Google Analytics)",
    address: "1600 Amphitheatre Parkway, Mountain View, CA 94043, Estados Unidos",
    role: "Mide cómo se usa el sitio, sólo si lo aceptas en el aviso de cookies.",
    controller: false,
    data: "Identificador de la cookie, dirección IP, páginas vistas, búsquedas y clics del sitio, dispositivo y navegador.",
    when: "Sólo si aceptas la medición de visitas.",
    country: "Estados Unidos",
    safeguard: "Tu consentimiento en el aviso de cookies (Ley 29733, art. 15.7) y los términos de tratamiento de datos de Google.",
    link: "https://policies.google.com/technologies/partner-sites",
    confirmed: true,
    active: measurementEnabled.ga4
  },
  {
    id: "clarity",
    name: "Microsoft Corporation (Microsoft Clarity)",
    address: "One Microsoft Way, Redmond, WA 98052, Estados Unidos",
    // No llamarlo «anónimo»: Microsoft lo desaconseja y trata identificadores.
    role: "Graba cómo se recorre el sitio (clics, desplazamiento) y arma mapas de calor, sólo si lo aceptas.",
    controller: true,
    data: "Identificadores de sus cookies, dirección IP, dispositivo, navegador, las direcciones de las páginas (con lo buscado en el catálogo) y lo que haces en ellas. Lo que escribes en el formulario y en el buscador se oculta antes de enviarse.",
    when: "Sólo si aceptas la grabación de sesiones.",
    country: "Estados Unidos",
    safeguard: "Tu consentimiento en el aviso de cookies (Ley 29733, art. 15.7) y los términos de Microsoft Clarity.",
    link: "https://privacy.microsoft.com/es-es/privacystatement",
    confirmed: true,
    active: measurementEnabled.clarity
  },
  {
    id: "google-ads",
    name: "Google LLC (Google Ads)",
    address: "1600 Amphitheatre Parkway, Mountain View, CA 94043, Estados Unidos",
    role: "Cuenta cuántos contactos llegan desde nuestros anuncios, sólo si lo aceptas.",
    controller: true,
    data: "Identificador de la cookie o del clic en el anuncio, dirección IP, navegador, las páginas que visitas y el tipo de contacto (WhatsApp, llamada o formulario).",
    when: "Sólo si aceptas la medición de anuncios.",
    country: "Estados Unidos",
    safeguard: "Tu consentimiento en el aviso de cookies (Ley 29733, art. 15.7) y los términos de tratamiento de datos de Google Ads.",
    link: "https://policies.google.com/technologies/ads",
    confirmed: true,
    active: measurementEnabled.ads
  }
];

/** Destinatarios que aparecen: en vista previa, todos (con su condición a la vista). */
export const visibleRecipients = recipients.filter((recipient) => recipient.active || PRIVACY_PREVIEW);

/** Lo que falta para poder publicar, en palabras de la empresa. */
export function pendingItems(): string[] {
  const p = privacyPolicy;
  const items: string[] = [];
  if (!p.owner.legalNameConfirmed) items.push("Confirmar la razón social exacta (ficha RUC).");
  if (!p.owner.ruc) items.push("RUC de la empresa.");
  if (!p.owner.address) items.push("Domicilio fiscal completo, con distrito.");
  if (!p.owner.privacyEmail) items.push("Correo para pedidos sobre datos personales y quién lo atiende.");
  if (!p.database.name || !p.database.code) items.push("Nombre y código del banco de datos inscrito en el RNPDP.");
  if (!p.documentPurpose) items.push("Para qué se pide DNI / CE / RUC en el formulario (o quitar el DNI).");
  if (!p.serverLogsBasis) items.push("Base legal de los registros del servidor y la seguridad del sitio (la decide el abogado).");
  if (p.marketing === null) items.push("Si se usarán los contactos para publicidad o novedades.");
  if (!p.formspreeRecaptchaOff) {
    items.push("Confirmar en Formspree que el reCAPTCHA del formulario está desactivado (o declarar Google reCAPTCHA).");
  }
  if (measurementEnabled.clarity && !p.claritySuppression) {
    items.push("Qué se hace si alguien pide borrar sus datos de Clarity (no permite borrar a una sola persona).");
  }
  const retention: Array<[keyof typeof p.retention, string, boolean]> = [
    ["inquiries", "consultas y cotizaciones sin venta", true],
    ["customers", "datos de clientes", true],
    ["formspree", "copia en el archivo de Formspree", true],
    ["serverLogs", "registros del servidor web", true],
    ["ga4", "datos de Google Analytics (2 o 14 meses)", measurementEnabled.ga4],
    ["ads", "datos de conversiones de Google Ads", measurementEnabled.ads]
  ];
  for (const [key, label, applies] of retention) {
    if (applies && !p.retention[key]) items.push(`Plazo de conservación: ${label}.`);
  }
  for (const recipient of recipients.filter((r) => r.active)) {
    const name = recipient.name.replace(/\.?$/, ".");
    if (!recipient.confirmed || /por confirmar/i.test(recipient.name + recipient.country)) {
      items.push(`Confirmar proveedor y país: ${name}`);
    }
    if (!recipient.address) items.push(`Domicilio del destinatario: ${name}`);
    if (!recipient.safeguard) items.push(`Garantía de la transferencia internacional: ${name}`);
  }
  if (!p.updated) items.push("Fecha de la versión (al aprobarla el abogado).");
  return items;
}

if (PRIVACY_POLICY_ENABLED) {
  const pending = pendingItems();
  if (pending.length) {
    throw new Error(
      `La política de privacidad está activada pero le falta:\n- ${pending.join("\n- ")}\n` +
        "Complétalo en src/data/privacy.ts o vuelve a poner PRIVACY_POLICY_ENABLED en false."
    );
  }
  if (privacyPolicy.marketing) {
    throw new Error(
      "privacy.ts dice que habrá publicidad, pero el formulario no tiene la casilla separada y sin marcar que pide el art. 26.1 del Reglamento."
    );
  }
  for (const tool of ["ga4", "clarity", "ads"] as const) {
    if (measurementEnabled[tool] !== POLICY_COVERS_MEASUREMENT[tool]) {
      throw new Error(
        `${tool} está ${measurementEnabled[tool] ? "encendido" : "apagado"}, pero la política v${PRIVACY_POLICY_VERSION} dice lo contrario. ` +
          "Antes de publicar: actualiza la inscripción del banco en el RNPDP (art. 44.1), sube PRIVACY_POLICY_VERSION, " +
          `pon la fecha nueva en privacyPolicy.updated y cambia POLICY_COVERS_MEASUREMENT.${tool}.`
      );
    }
  }
}
