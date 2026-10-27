// Marcadores neutros para una foto que todavía no existe, en lugar del icono
// de imagen rota. Son SVG en data: (la CSP lo permite en img-src) de 640×400
// y van en el HTML, así que se compactan.
const svg = (body: string) =>
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="400" fill="#eef2f8"/>${body}</svg>`
  );

const icon = (cy: number) =>
  `<circle cx="320" cy="${cy}" r="46" fill="none" stroke="#003595" stroke-width="7" opacity="0.45"/>` +
  `<path d="M298 ${cy}h44M320 ${cy - 22}v44" stroke="#003595" stroke-width="7" stroke-linecap="round" opacity="0.45"/>`;

/** Con el texto «Imagen próximamente»: la foto de /servicios, al lado del texto. */
export const IMAGE_PLACEHOLDER = svg(
  icon(176) +
    `<text x="320" y="268" text-anchor="middle" fill="#5b6b85" font-family="Poppins, sans-serif" font-size="21">Imagen próximamente</text>`
);

/**
 * Sólo el icono, arriba: la tarjeta de portada pone su título y su texto
 * sobre la mitad de abajo de la foto, y ahí el texto del marcador se
 * mezclaba con el título.
 */
export const IMAGE_PLACEHOLDER_ICON = svg(icon(120));
