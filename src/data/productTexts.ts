// /src/data/productTexts.ts
//
// Textos de producto que se escriben en el panel: un título y una descripción
// por entrada de fm.json (línea FM, p. ej. «Tubería HDPE FM · Pavco») y por
// grupo de overrides.json (línea de agua, p. ej. «Tubo PVC · Agua fría»).
//
// Hoy sólo los pinta Tuberías, en la cabecera de cada marca junto a la foto
// grande ([...linea].astro). Se escriben en el HTML desde aquí, no desde el
// script del navegador, para que Google los lea sin ejecutar JavaScript.
//
// Formato de la descripción (lo explica la ayuda del panel):
//   · una línea en blanco separa párrafos; un salto de línea suelto es un
//     espacio, como en los servicios;
//   · una línea que empieza por «•» o «- » es una viñeta. Si la viñeta empieza
//     por «Algo:», ese «Algo» sale en negrita.
// Texto plano: Astro lo escapa, así que «<» o «&» salen tal cual.

import fmCatalogData from "./catalog/fm.json";
import { catalogOverrides } from "./catalog";

export type ProductTextItem = { label?: string; text: string };

export type ProductTextBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: ProductTextItem[] };

export type ProductText = {
  /** fmTextKey(entrada) en la línea FM; el groupKey en la de agua. */
  key: string;
  title: string;
  blocks: ProductTextBlock[];
};

/** Clave de texto de una entrada de fm.json ("tubo-pavco" → "fm:tubo-pavco"). */
export function fmTextKey(entryKey: string): string {
  return `fm:${entryKey}`;
}

// Caracteres invisibles que llegan al pegar desde WhatsApp o Word: el «®️» de
// emoji (U+FE0F), el «•⁠ ⁠» con unión de palabras (U+2060) y similares.
const INVISIBLE = /[​-‍⁠️﻿]/g;
// «•», «·», «▪»... seguidos o no de espacio; «-», «–», «*» sólo con espacio
// detrás, para no tomar por viñeta un «-20 °C» al principio de una línea.
const BULLET = /^(?:[•·▪●◦]\s*|[-–—*]\s+)/;
// «Resistencia térmica: Soporta...» → etiqueta en negrita. Sólo si lo de antes
// de los dos puntos es corto y no es una frase (sin punto).
const ITEM_LABEL = /^([^:.]{2,40}):\s+(\S.*)$/;

function cleanText(value: unknown): string {
  return typeof value === "string"
    ? value.replace(INVISIBLE, "").replace(/ /g, " ").replace(/\r\n?/g, "\n")
    : "";
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function toItem(line: string): ProductTextItem {
  const match = line.match(ITEM_LABEL);
  return match ? { label: match[1].trim(), text: match[2] } : { text: line };
}

export function parseProductText(raw: unknown): ProductTextBlock[] {
  const blocks: ProductTextBlock[] = [];

  for (const chunk of cleanText(raw).split(/\n\s*\n/)) {
    let paragraph: string[] = [];
    let items: ProductTextItem[] = [];

    const flushParagraph = () => {
      if (paragraph.length) blocks.push({ type: "p", text: paragraph.join(" ") });
      paragraph = [];
    };
    const flushList = () => {
      if (items.length) blocks.push({ type: "ul", items });
      items = [];
    };

    for (const rawLine of chunk.split("\n")) {
      const line = oneLine(rawLine);
      if (!line) continue;

      if (BULLET.test(line)) {
        flushParagraph();
        const item = oneLine(line.replace(BULLET, ""));
        if (item) items.push(toItem(item));
      } else {
        flushList();
        paragraph.push(line);
      }
    }

    flushParagraph();
    flushList();
  }

  return blocks;
}

function toProductText(key: string, entry: { title?: unknown; description?: unknown }) {
  const title = oneLine(cleanText(entry.title));
  const blocks = parseProductText(entry.description);
  return title || blocks.length ? { key, title, blocks } : undefined;
}

type FmTextEntry = { key?: unknown; title?: unknown; description?: unknown };
const fmEntries = (Array.isArray(fmCatalogData) ? fmCatalogData : []) as FmTextEntry[];

/** Textos con contenido, por clave. Las entradas sin título ni descripción no están. */
export const productTexts: ReadonlyMap<string, ProductText> = new Map(
  [
    ...fmEntries.map((entry) =>
      typeof entry.key === "string" ? toProductText(fmTextKey(entry.key), entry) : undefined
    ),
    ...catalogOverrides.map((override) => toProductText(override.groupKey, override))
  ]
    .filter((text): text is ProductText => Boolean(text))
    .map((text) => [text.key, text])
);
