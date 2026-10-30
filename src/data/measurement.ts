// /src/data/measurement.ts
//
// Medición: Google Ads, Google Analytics 4 y Microsoft Clarity (README-deploy.md,
// sección 6). Cada una se activa SÓLO con su variable del build; sin ninguna no
// se carga nada de Google ni de Microsoft. Lo leen BaseLayout (las etiquetas) y
// la política de privacidad (que explica sólo lo que está encendido). Los
// mismos IDs amplían la CSP de dist/.htaccess (scripts/csp-medicion.mjs): si se
// cambia una validación aquí, cambiarla allí. Acceso estático a cada variable:
// Vite sólo sustituye `import.meta.env.X` escrito tal cual.

const limpiar = (valor: unknown) => String(valor ?? "").trim();

export const adsId = limpiar(import.meta.env.PUBLIC_GOOGLE_ADS_ID);
export const ga4Id = limpiar(import.meta.env.PUBLIC_GA4_ID);
export const clarityId = limpiar(import.meta.env.PUBLIC_CLARITY_ID);
export const adsEtiquetas = {
  whatsapp: limpiar(import.meta.env.PUBLIC_ADS_LABEL_WHATSAPP),
  formulario: limpiar(import.meta.env.PUBLIC_ADS_LABEL_FORMULARIO),
  llamada: limpiar(import.meta.env.PUBLIC_ADS_LABEL_LLAMADA)
};

// Un valor mal copiado debe parar el build: si no, la campaña arrancaría sin
// medir y nadie lo notaría hasta ver cero conversiones o cero visitas.
if (adsId && !/^AW-\d+$/.test(adsId)) {
  throw new Error(`PUBLIC_GOOGLE_ADS_ID="${adsId}" no tiene la forma AW-123456789`);
}
for (const [tipo, etiqueta] of Object.entries(adsEtiquetas)) {
  if (etiqueta && !/^[A-Za-z0-9_-]+$/.test(etiqueta)) {
    throw new Error(`La etiqueta de conversión de ${tipo} ("${etiqueta}") sólo puede llevar letras, números, - y _`);
  }
}
// GA4: el «ID de medición» del flujo web (G- y mayúsculas/números). El ID de
// la propiedad o del flujo (sólo números) NO sirve.
if (ga4Id && !/^G-[A-Z0-9]+$/.test(ga4Id)) {
  throw new Error(`PUBLIC_GA4_ID="${ga4Id}" no tiene la forma G-XXXXXXXXXX (el «ID de medición» del flujo web)`);
}
// Clarity: el «ID del proyecto», 10 letras minúsculas y números (p. ej. el
// proyecto de demostración de la documentación de Microsoft, 3t0wlogvdz).
if (clarityId && !/^[a-z0-9]{10}$/.test(clarityId)) {
  throw new Error(`PUBLIC_CLARITY_ID="${clarityId}" no tiene la forma de un ID de proyecto de Clarity (10 letras minúsculas y números)`);
}

/**
 * Aviso de cookies («Rechazar todas / Aceptar todas / Configurar»): existe
 * desde el 30-10-2026 (src/components/CookieConsent.astro, src/data/consent.ts).
 *
 * Con la Ley 29733 y su Reglamento (DS 016-2024-JUS) estas herramientas tratan
 * identificadores en línea (art. III.4) y ninguna excepción del art. 14 de la
 * Ley las cubre: necesitan el consentimiento PREVIO del visitante, con una
 * acción positiva y antes de instalarse (criterio de la ANPD en la RD
 * 100-2024-JUS/DGTAIPD, párrs. 47 y 50). Por eso BaseLayout sólo define cómo
 * cargar cada herramienta y el aviso la carga cuando el visitante la acepta.
 * Si algún día el aviso se quitara, esto vuelve a `false` y el build se
 * detiene con cualquier ID puesto. Además, privacy.ts exige la política
 * publicada para encender cualquier herramienta: el aviso enlaza a ella.
 */
export const CONSENT_BANNER_READY: boolean = true;

if ((adsId || ga4Id || clarityId) && !CONSENT_BANNER_READY) {
  throw new Error(
    "Google Ads, GA4 o Clarity tienen su variable puesta, pero la web todavía no tiene el aviso de cookies " +
      "que pide la Ley 29733: se cargarían sin el consentimiento previo del visitante. Quita la variable " +
      "(GOOGLE_ADS_ID, GA4_ID o CLARITY_ID) en GitHub o construye primero el aviso (README-deploy.md, sección 6)."
  );
}

/** Qué herramientas están encendidas en este build. */
export const measurementEnabled = {
  ads: Boolean(adsId),
  ga4: Boolean(ga4Id),
  clarity: Boolean(clarityId)
};
