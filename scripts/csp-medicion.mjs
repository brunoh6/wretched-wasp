// Amplía la Content-Security-Policy de dist/.htaccess para la medición que el
// build lleve activa: Google Ads (PUBLIC_GOOGLE_ADS_ID), Google Analytics 4
// (PUBLIC_GA4_ID) y Microsoft Clarity (PUBLIC_CLARITY_ID).
//
//   node scripts/csp-medicion.mjs [carpeta]     (por defecto: dist)
//
// Va enganchado a "npm run build" (package.json): activar la medición es sólo
// crear las variables en GitHub (README-deploy.md, sección 6). public/.htaccess
// no se toca: sin ningún ID el sitio sale con la CSP de siempre, sin dominios
// de Google ni de Microsoft.
//
// Fuentes de los dominios:
//   - Google Ads y GA4: guía oficial de Google, "Use a Content Security Policy"
//     https://developers.google.com/tag-platform/security/guides/csp
//     (apartados "Google Ads" y "Google Analytics"; revisada en octubre 2026).
//     Para GA4 se usa la variante completa, la que incluye los dominios de las
//     funciones publicitarias: la guía la recomienda "during initial setup" para
//     no tener que tocar la CSP al vincular Google Ads (README-deploy.md lo pide).
//     La guía pide *.google-analytics.com y *.google.com; este último cubre
//     también region1.analytics.google.com (un comodín CSP vale para cualquier
//     nivel de subdominio). Cada dominio google.<TLD> se lista aparte (CSP no
//     admite comodines a la derecha del nombre): los visitantes son de Perú, de
//     ahí www.google.com.pe (Ads) y *.google.com.pe (GA4).
//     La guía habla de script-src-elem; esta CSP sólo tiene script-src, que es
//     la directiva de la que script-src-elem hereda.
//   - Clarity: guía oficial de Microsoft, "Clarity Content Security Policy"
//     https://learn.microsoft.com/clarity/setup-and-installation/clarity-csp
//     Pide https://*.clarity.ms y https://c.bing.com (su ejemplo los pone en
//     default-src). Aquí van en script-src, img-src y connect-src porque esta
//     CSP define esas tres directivas y entonces default-src no se aplica a
//     ellas: ponerlos sólo en default-src no serviría.
//
// Idempotente: cada dominio se añade sólo si falta, así que correrlo dos veces
// deja el mismo archivo.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const GTM = "https://www.googletagmanager.com";
const ADS = [
  GTM,
  "https://www.googleadservices.com",
  "https://googleads.g.doubleclick.net",
  "https://pagead2.googlesyndication.com",
  "https://www.google.com",
  "https://www.google.com.pe"
];
const GA4 = [
  GTM,
  "https://*.google-analytics.com",
  "https://*.google.com",
  "https://*.google.com.pe",
  "https://*.g.doubleclick.net"
];
const CLARITY = ["https://*.clarity.ms", "https://c.bing.com"];

// Las validaciones son las mismas que src/layouts/BaseLayout.astro.
const MEDICIONES = [
  {
    nombre: "Google Ads",
    variable: "PUBLIC_GOOGLE_ADS_ID",
    formato: /^AW-\d+$/,
    ejemplo: "AW-123456789",
    dominios: {
      "script-src": [GTM, "https://www.googleadservices.com", "https://www.google.com"],
      "img-src": ADS,
      "connect-src": [...ADS, "https://ad.doubleclick.net"],
      "frame-src": [GTM]
    }
  },
  {
    nombre: "Google Analytics 4",
    variable: "PUBLIC_GA4_ID",
    formato: /^G-[A-Z0-9]+$/,
    ejemplo: "G-XXXXXXXXXX",
    dominios: {
      "script-src": [GTM],
      "img-src": GA4,
      "connect-src": [...GA4, "https://pagead2.googlesyndication.com"],
      "frame-src": [GTM]
    }
  },
  {
    nombre: "Clarity",
    variable: "PUBLIC_CLARITY_ID",
    formato: /^[a-z0-9]{10}$/,
    ejemplo: "10 letras minúsculas y números",
    dominios: {
      "script-src": CLARITY,
      "img-src": CLARITY,
      "connect-src": CLARITY
    }
  }
];

const activas = [];
for (const m of MEDICIONES) {
  const id = (process.env[m.variable] ?? "").trim();
  if (!id) continue;
  if (!m.formato.test(id)) {
    console.error(`CSP de medición: ${m.variable}="${id}" no tiene la forma ${m.ejemplo}.`);
    process.exit(1);
  }
  activas.push({ ...m, id });
}
if (activas.length === 0) {
  console.log("CSP de medición: sin IDs de Google Ads, GA4 ni Clarity, no se toca dist/.htaccess.");
  process.exit(0);
}

const archivo = join(process.argv[2] ?? "dist", ".htaccess");
const texto = readFileSync(archivo, "utf8");

// La CSP de las páginas es la única con default-src 'self' (la de los SVG
// lleva default-src 'none' y no debe cambiar).
const patron = /^(\s*Header always set Content-Security-Policy ")(default-src 'self';[^"]*)(" env=DIHYC\s*)$/gm;
const encontradas = [...texto.matchAll(patron)];
if (encontradas.length !== 1) {
  console.error(`CSP de medición: esperaba UNA línea de CSP con default-src 'self' en ${archivo} y hay ${encontradas.length}.`);
  process.exit(1);
}

function ampliar(politica) {
  const directivas = politica.split(";").map((d) => d.trim()).filter(Boolean);
  for (const m of activas) {
    for (const [nombre, dominios] of Object.entries(m.dominios)) {
      const i = directivas.findIndex((d) => d.split(/\s+/)[0] === nombre);
      if (i === -1) {
        console.error(`CSP de medición: la CSP no tiene ${nombre}; revisar public/.htaccess.`);
        process.exit(1);
      }
      const fuentes = directivas[i].split(/\s+/);
      for (const dominio of dominios) if (!fuentes.includes(dominio)) fuentes.push(dominio);
      directivas[i] = fuentes.join(" ");
    }
  }
  return directivas.join("; ");
}

const resumen = activas.map((m) => `${m.nombre} ${m.id}`).join(", ");
const nuevo = texto.replace(patron, (_, antes, politica, despues) => antes + ampliar(politica) + despues);
if (nuevo === texto) {
  console.log(`CSP de medición: ${archivo} ya tenía los dominios de ${resumen}.`);
} else {
  writeFileSync(archivo, nuevo);
  console.log(`CSP de medición: ${archivo} ampliado para ${resumen}.`);
}
