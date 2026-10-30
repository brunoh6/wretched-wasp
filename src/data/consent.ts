// /src/data/consent.ts
//
// Aviso de cookies (src/components/CookieConsent.astro): qué se pregunta y cómo
// se guarda la respuesta. Una categoría por herramienta ENCENDIDA en el build
// (src/data/measurement.ts); sin ninguna no hay aviso, ni enlace en el pie, ni
// nada que guardar.
//
// Lo que pide la Ley 29733 y su Reglamento (DS 016-2024-JUS), según la
// investigación del 30-10-2026 (README-deploy.md, sección 6):
//   · consentimiento PREVIO y con un clic: ninguna herramienta de medición se
//     pide antes de aceptar (Consent Mode «básico»); cerrar o seguir navegando
//     no es aceptar. (La tipografía también va en el propio sitio, y el mapa
//     de Contacto se carga sólo al pulsar «Ver mapa».);
//   · por finalidad: una casilla por herramienta, todas apagadas al abrir
//     «Configurar» (la ANPD no admite casillas marcadas de antemano);
//   · rechazar tan fácil como aceptar: «Rechazar todas» al lado de «Aceptar
//     todas», con el mismo aspecto;
//   · informado: responsable, finalidades, proveedores (Google LLC y Microsoft
//     Corporation), su envío a Estados Unidos y quién los usa también para
//     sus propios fines, en el mismo aviso; el detalle, en la política;
//   · revocable en cualquier momento desde «Configurar cookies», al pie.
// Las dudas que quedan para el abogado están en README-deploy.md, sección 6.

import { measurementEnabled } from "./measurement";
import { PRIVACY_POLICY_VERSION } from "./privacy";

export type ConsentKey = "medicion" | "sesiones" | "anuncios";

export type ConsentCategory = {
  key: ConsentKey;
  /** Nombre de la casilla. La política usa el mismo en su punto 7. */
  title: string;
  /** Para la frase del aviso: «Con tu permiso usamos cookies para …». */
  purpose: string;
  /** Qué hace, en «Configurar». */
  detail: string;
  provider: string;
  /** Nombre corto de la herramienta, para «… también los usa para sus propios fines». */
  tool: string;
  /** true = el proveedor también usa los datos para sus propios fines (responsable). */
  ownPurposes: boolean;
  cookies: string;
};

const CATEGORIES: (ConsentCategory & { switch: keyof typeof measurementEnabled })[] = [
  {
    key: "medicion",
    switch: "ga4",
    title: "Medición de visitas",
    purpose: "medir las visitas (Google Analytics)",
    detail:
      "Cuenta las visitas y qué páginas, productos, filtros y fichas técnicas se consultan y qué se busca en el buscador (salvo lo que parezca un correo o un teléfono), para mejorar el catálogo. No recibe lo que escribes en el formulario de contacto.",
    provider: "Google LLC (Google Analytics), en Estados Unidos, por encargo nuestro.",
    tool: "Google Analytics",
    ownPurposes: false,
    cookies: "_ga y _ga_…, hasta 2 años."
  },
  {
    key: "sesiones",
    switch: "clarity",
    title: "Grabación de sesiones",
    purpose: "grabar cómo se recorre la web (Microsoft Clarity)",
    detail:
      "Graba clics, desplazamiento y movimientos para ver qué confunde y mejorarlo. Lo que escribes en el formulario y en el buscador se oculta antes de salir de tu navegador, pero lo que buscas puede quedar en la dirección de la página.",
    provider:
      "Microsoft Corporation (Microsoft Clarity), en Estados Unidos. Microsoft también usa estos datos para sus propios fines, incluida su publicidad, y pone sus propias cookies en sus dominios.",
    tool: "Clarity",
    ownPurposes: true,
    cookies: "_clck (1 año) y _clsk (1 día)."
  },
  {
    key: "anuncios",
    switch: "ads",
    title: "Medición de anuncios",
    purpose: "saber qué consultas llegan de nuestros anuncios (Google Ads)",
    detail:
      "Cuenta cuántos contactos (WhatsApp, llamada o formulario) llegan desde nuestros anuncios en Google. No se usa para mostrarte anuncios personalizados.",
    provider:
      "Google LLC (Google Ads), en Estados Unidos. Google también usa estos datos para sus propios fines, según su política, y puede poner sus propias cookies en sus dominios.",
    tool: "Google Ads",
    ownPurposes: true,
    cookies: "_gcl_au y, si llegas desde un anuncio, _gcl_aw: 90 días."
  }
];

/** Las categorías de este build, en el orden del aviso. */
export const consentCategories: ConsentCategory[] = CATEGORIES.filter(
  (category) => measurementEnabled[category.switch]
).map(({ switch: _switch, ...category }) => category);

/** Hay aviso sólo si hay algo que aceptar. */
export const CONSENT_ENABLED = consentCategories.length > 0;

/**
 * La elección vale para esta versión de la política: si la política o el texto
 * del aviso cambian de fondo (otra herramienta, otra finalidad), se sube
 * PRIVACY_POLICY_VERSION y el aviso vuelve a salir. También sale si cambian
 * las categorías que se preguntan (el registro guarda cuáles se ofrecieron).
 */
export const CONSENT_VERSION = PRIVACY_POLICY_VERSION;

/** Pasado este plazo se vuelve a preguntar (la ley no fija uno; es buena práctica). */
export const CONSENT_MAX_AGE_DAYS = 365;

/**
 * Dónde se guarda la elección en el navegador (localStorage). Es «necesaria»:
 * sin ella el aviso saldría en cada página. La política la nombra en el punto 7.
 */
export const CONSENT_STORAGE_KEY = "dihyc_cookies";
