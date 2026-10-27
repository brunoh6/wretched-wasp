// /src/data/services.ts
//
// Los servicios: página /servicios, portada, menú «Servicios» y buscador.
// Fotos y textos se editan desde el panel (/admin → «Servicios») y viven en
// services.json; aquí se validan y se les da forma.
//
// Nada de lo que llega del panel bloquea la publicación: un dato raro se
// arregla solo o se omite y deja un aviso "::warning::" en el run de GitHub
// Actions (como en catalogLines.ts). Las fotos de partida son las de
// src/assets/services/ convertidas a WebP (las mismas que se servían).

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import servicesData from "./services.json";

export type Service = {
  /** Ancla de /servicios/#id. No se edita: la usan el menú, el buscador y los anuncios. */
  id: string;
  /** Nombre corto: menú «Servicios» y botones de arriba de /servicios. */
  label: string;
  title: string;
  /** La descripción, partida en párrafos por las líneas en blanco. */
  paragraphs: string[];
  /** Texto de la tarjeta de portada. Vacío = el servicio no sale en la portada. */
  homeSummary: string;
  /** Ruta pública de la foto, o "" = «Imagen próximamente». */
  image: string;
  href: string;
};

/** Foto lista para <img>: las medidas evitan que el texto salte al cargarla. */
export type ServiceImage = { src: string; width: number; height: number };

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// El salto de línea delante no es estético: la foto se revisa mientras Astro
// escribe "└─ /index.html" sin terminar la línea, y GitHub sólo reconoce
// "::warning" al principio de una.
function warn(message: string) {
  console.log(`\n::warning title=Servicios (panel)::${message}`);
}

const text = (value: unknown) => (typeof value === "string" ? value : "");
const oneLine = (value: unknown) => text(value).replace(/\s+/g, " ").trim();

/** Archivo de public/ al que apunta una ruta pública, o null si no es uno. */
function publicFile(src: string): string | null {
  // El navegador corta la ruta en "#" o "?" y pediría otro archivo.
  if (/[?#]/.test(src)) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(src);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.split("/").includes("..")) {
    return null;
  }
  const file = path.join(process.cwd(), "public", decoded);
  return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}

function checkedImage(value: unknown, id: string): string {
  const src = text(value).trim();
  if (src && !publicFile(src)) {
    const motivo = /[?#]/.test(src)
      ? "lleva «#» o «?» en el nombre y el navegador no la encontraría"
      : "no está en el sitio";
    warn(`La foto de «${id}» (${src}) ${motivo}: se muestra «Imagen próximamente».`);
    return "";
  }
  return src;
}

function toService(raw: Record<string, unknown>, seen: Set<string>): Service | null {
  const id = text(raw.id).trim();
  if (!ID.test(id) || seen.has(id)) {
    warn(`Servicio omitido: el identificador «${id}» está vacío, no es válido o se repite.`);
    return null;
  }
  seen.add(id);

  const title = oneLine(raw.title) || oneLine(raw.label);
  if (!title) {
    warn(`El servicio «${id}» no tiene nombre ni título: se omite.`);
    return null;
  }

  // Una línea en blanco separa párrafos; un salto de línea suelto es un espacio.
  const paragraphs = text(raw.description)
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (!paragraphs.length) warn(`El servicio «${id}» no tiene descripción.`);

  return {
    id,
    label: oneLine(raw.label) || title,
    title,
    paragraphs,
    homeSummary: oneLine(raw.homeSummary),
    image: checkedImage(raw.image, id),
    href: `/servicios/#${id}`
  };
}

const root = servicesData as { services?: unknown } | null;
const rawServices: unknown[] = Array.isArray(root?.services) ? root.services : [];
const seenIds = new Set<string>();

export const services: Service[] = rawServices.flatMap((raw) => {
  const service = raw && typeof raw === "object" ? toService(raw as Record<string, unknown>, seenIds) : null;
  return service ? [service] : [];
});

if (!services.length) warn("services.json no trae ningún servicio: la página Servicios sale vacía.");

// Lo que muestra cualquier navegador. El panel ya convierte todo a WebP; esto
// cubre un archivo dañado o subido a mano (un HEIC, un PDF renombrado...).
const BROWSER_FORMATS = new Set(["jpeg", "png", "webp", "gif", "avif"]);
const images = new Map<string, Promise<ServiceImage | null>>();

/** Foto del servicio con sus medidas, o null si no tiene (sale «Imagen próximamente»). */
export function getServiceImage(service: Service): Promise<ServiceImage | null> {
  const file = service.image && publicFile(service.image);
  if (!file) return Promise.resolve(null);

  // Una vez por foto: la piden /servicios y la portada, y el aviso sale una vez.
  let image = images.get(service.image);
  if (!image) {
    image = sharp(file)
      .metadata()
      .then(({ format, width, height }) =>
        format && BROWSER_FORMATS.has(format) && width && height ? { src: service.image, width, height } : null
      )
      .catch(() => null)
      .then((result) => {
        if (!result) {
          warn(
            `La foto de «${service.id}» (${service.image}) no es una imagen que el navegador pueda mostrar: se muestra «Imagen próximamente».`
          );
        }
        return result;
      });
    images.set(service.image, image);
  }
  return image;
}
