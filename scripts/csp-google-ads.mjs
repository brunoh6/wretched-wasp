// Amplía la Content-Security-Policy de dist/.htaccess para la etiqueta de
// Google Ads, SÓLO si el build se hizo con PUBLIC_GOOGLE_ADS_ID.
//
//   node scripts/csp-google-ads.mjs [carpeta]     (por defecto: dist)
//
// Va enganchado a "npm run build" (package.json): activar la medición es sólo
// crear las variables en GitHub (README-deploy.md). public/.htaccess no se toca:
// sin ID el sitio sale con la CSP de siempre, sin ningún dominio de Google Ads.
//
// Dominios: guía oficial de Google, "Use a Content Security Policy", apartado
// Google Ads (conversiones, remarketing y vinculador de conversiones):
// https://developers.google.com/tag-platform/security/guides/csp
// Cada dominio google.<TLD> se lista aparte (CSP no admite comodines a la
// derecha del nombre): los visitantes son de Perú, de ahí www.google.com.pe.
// Si algún día se añade GA4, sumar lo que la misma guía pide para Analytics.
//
// Idempotente: cada dominio se añade sólo si falta, así que correrlo dos veces
// deja el mismo archivo.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ADS = [
  "https://www.googletagmanager.com",
  "https://www.googleadservices.com",
  "https://googleads.g.doubleclick.net",
  "https://pagead2.googlesyndication.com",
  "https://www.google.com",
  "https://www.google.com.pe"
];
const DOMINIOS = {
  "script-src": ["https://www.googletagmanager.com", "https://www.googleadservices.com", "https://www.google.com"],
  "img-src": ADS,
  "connect-src": [...ADS, "https://ad.doubleclick.net"],
  "frame-src": ["https://www.googletagmanager.com"]
};

const id = (process.env.PUBLIC_GOOGLE_ADS_ID ?? "").trim();
if (!id) {
  console.log("CSP de Google Ads: sin PUBLIC_GOOGLE_ADS_ID, no se toca dist/.htaccess.");
  process.exit(0);
}
// La misma validación que src/layouts/BaseLayout.astro.
if (!/^AW-\d+$/.test(id)) {
  console.error(`CSP de Google Ads: PUBLIC_GOOGLE_ADS_ID="${id}" no tiene la forma AW-123456789.`);
  process.exit(1);
}

const archivo = join(process.argv[2] ?? "dist", ".htaccess");
const texto = readFileSync(archivo, "utf8");

// La CSP de las páginas es la única con default-src 'self' (la de los SVG
// lleva default-src 'none' y no debe cambiar).
const patron = /^(\s*Header always set Content-Security-Policy ")(default-src 'self';[^"]*)(" env=DIHYC\s*)$/gm;
const encontradas = [...texto.matchAll(patron)];
if (encontradas.length !== 1) {
  console.error(`CSP de Google Ads: esperaba UNA línea de CSP con default-src 'self' en ${archivo} y hay ${encontradas.length}.`);
  process.exit(1);
}

function ampliar(politica) {
  const directivas = politica.split(";").map((d) => d.trim()).filter(Boolean);
  for (const [nombre, dominios] of Object.entries(DOMINIOS)) {
    const i = directivas.findIndex((d) => d.split(/\s+/)[0] === nombre);
    if (i === -1) {
      console.error(`CSP de Google Ads: la CSP no tiene ${nombre}; revisar public/.htaccess.`);
      process.exit(1);
    }
    const fuentes = directivas[i].split(/\s+/);
    for (const dominio of dominios) if (!fuentes.includes(dominio)) fuentes.push(dominio);
    directivas[i] = fuentes.join(" ");
  }
  return directivas.join("; ");
}

const nuevo = texto.replace(patron, (_, antes, politica, despues) => antes + ampliar(politica) + despues);
if (nuevo === texto) {
  console.log(`CSP de Google Ads: ${archivo} ya tenía los dominios de Google Ads (${id}).`);
} else {
  writeFileSync(archivo, nuevo);
  console.log(`CSP de Google Ads: ${archivo} ampliado para ${id}.`);
}
