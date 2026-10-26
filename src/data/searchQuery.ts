/**
 * Inteligencia del buscador.
 *
 * Traduce una consulta natural con varios atributos
 * ("tubo hdpe 200 psi sdr11") a la URL del catálogo con los filtros ya
 * marcados (/productos/tuberias?material=hdpe-fm&tipo=sdr11...).
 *
 * El módulo es PURO (no toca el DOM) para poder ejecutarlo en Node y probarlo
 * sin navegador; el componente SearchBar.astro sólo lo consume.
 */

/* ============================ SLUGS ============================ */

/**
 * Slug canónico compartido con el catálogo. Ambos lados deben producir
 * exactamente el mismo texto o los filtros no se marcarían.
 */
export function slugify(value: string): string {
  return String(value)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // quita tildes
    .replace(/["'\u00b0]/g, '')                          // quita comillas y °
    .replace(/[^a-z0-9]+/g, '-')                          // no alfanumérico -> -
    .replace(/^-+|-+$/g, '');
}

/* ========================= NORMALIZACIÓN ========================= */

/**
 * Deja la consulta en una forma predecible antes de trocearla:
 *
 * - minúsculas, sin tildes, sin comillas ni grados;
 * - une prefijo técnico + número aunque el usuario meta separadores, porque
 *   "sdr 11", "sdr-11", "sdr.11", "sdr_11" y "sdr11" son el mismo filtro;
 * - separa la unidad de presión ("240psi" -> "240 psi") para que el token
 *   numérico sea reconocible por sí mismo;
 * - colapsa espacios.
 */
export function normalizeQuery(raw: string): string {
  return String(raw ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/["'\u00b0]/g, '')
    // 1) Prefijo técnico pegado a su número. Va PRIMERO: si convirtiésemos
    //    antes los separadores en espacios ya no sabríamos que el número
    //    pertenece al prefijo. 'clase' se lista antes que 'c' porque la
    //    alternancia es ordenada y 'c' se comería el prefijo largo.
    .replace(/\b(sdr|rde|clase|sch|dn|pn|sr|c)[\s._-]*(\d+)/g, '$1$2')
    // 2) El resto de la puntuación pasa a espacio ("wl-plastics" -> "wl plastics").
    //    Ya no puede romper "sdr11" porque el paso 1 lo dejó sin separador.
    .replace(/[^a-z0-9]+/g, ' ')
    // 3) La presión siempre como "<número> psi", tanto si venía junta como
    //    separada; así el par número+unidad es un token reconocible.
    .replace(/(\d+)\s*psi\b/g, '$1 psi')
    .replace(/\s+/g, ' ')
    .trim();
}

/* =========================== VOCABULARIO =========================== */

export type Facet =
  | 'material' | 'marca' | 'tipo' | 'producto' | 'presion' | 'aplicacion' | 'linea';

export type ParsedQuery = {
  category?: 'tuberias' | 'conexiones';
  material: string[];   // slugs, p.ej. ['hdpe-fm']
  marca: string[];
  tipo: string[];
  producto: string[];
  presion: string[];
  /**
   * Aplicación concreta: 'agua-fria' | 'agua-caliente'. Es el eje FINO.
   * "Contra incendio" ya no vive aquí: se emite como línea (ver `linea`).
   */
  aplicacion: string[];
  /**
   * Línea comercial: 'fm' (contra incendio) | 'agua'. Es el eje GRUESO, el
   * mismo que usan las cuatro tarjetas de /productos (?linea=fm | ?linea=agua).
   * Nunca viaja junto a `aplicacion` (ver la resolución al final de parseQuery).
   */
  linea: string[];
  leftover: string[];   // tokens que no se reconocieron
  raw: string;
};

type VocabEntry = { facet: Facet; value: string; term: string };

/** Azúcar para declarar "estos sinónimos apuntan a este slug". */
function terms(facet: Facet, value: string, list: string[]): VocabEntry[] {
  return list.map(term => ({ facet, value, term }));
}

/**
 * Sinónimos aceptados por faceta. Los términos ya están escritos tal como los
 * deja normalizeQuery (sin tildes, con "sdr11" pegado).
 */
const VOCABULARY: VocabEntry[] = [
  /* --- producto (faceta webCategory) --- */
  ...terms('producto', 'tubo', ['tubo', 'tubos', 'tuberia', 'tuberias', 'caneria', 'canerias']),
  // Las frases van antes que la palabra suelta sólo por legibilidad: quien
  // decide es PHRASE_INDEX, que siempre se consulta primero.
  ...terms('producto', 'codo-90', ['codo 90', 'codo90', 'codos 90']),
  ...terms('producto', 'codo-45', ['codo 45', 'codo45', 'codos 45']),
  ...terms('producto', 'codo', ['codo', 'codos']),
  ...terms('producto', 'tee', ['tee', 'tees', 'te']),
  ...terms('producto', 'yee', ['yee', 'yees']),
  ...terms('producto', 'reduccion', ['reduccion', 'reducciones', 'reductor', 'reductores']),
  ...terms('producto', 'bushing', ['bushing', 'bushings']),
  ...terms('producto', 'niple', ['niple', 'niples', 'nipple']),
  ...terms('producto', 'tapon-hembra', ['tapon hembra', 'tapa hembra']),
  ...terms('producto', 'tapon-macho', ['tapon macho', 'tapa macho']),
  ...terms('producto', 'tapon', ['tapon', 'tapones', 'tapa', 'tapas']),
  ...terms('producto', 'brida-loca', ['brida loca', 'bridas locas']),
  ...terms('producto', 'brida-fija', ['brida fija', 'bridas fijas']),
  ...terms('producto', 'brida-ciega', ['brida ciega', 'bridas ciegas']),
  ...terms('producto', 'brida-backing-ring', ['backing ring', 'backing']),
  ...terms('producto', 'brida', ['brida', 'bridas']),
  ...terms('producto', 'union-universal', ['union universal', 'uniones universales', 'universal']),
  ...terms('producto', 'union-simple', ['union simple', 'uniones simples']),
  ...terms('producto', 'union', ['union', 'uniones', 'copla', 'coplas']),
  ...terms('producto', 'adaptador-macho', ['adaptador macho', 'adaptadores machos']),
  ...terms('producto', 'adaptador-hembra', ['adaptador hembra', 'adaptadores hembras']),
  ...terms('producto', 'flange-adapter', ['flange adapter', 'flange']),
  ...terms('producto', 'adaptador', ['adaptador', 'adaptadores']),

  /* --- material --- */
  ...terms('material', 'hdpe-fm', ['hdpe', 'pead', 'polietileno']),
  ...terms('material', 'hierro-ductil-fm', ['hierro ductil', 'hierro', 'ductil']),
  // 'cpvc corzan' como frase y cada mitad por separado: en obra se pide
  // indistintamente "cpvc" o "corzan" (la marca comercial del compuesto).
  // 'corsan' es la falta de ortografía habitual; se acepta al filtrar y aun
  // así se corrige en pantalla (ver MISSPELLINGS).
  ...terms('material', 'cpvc-corzan', ['cpvc corzan', 'cpvc', 'corzan', 'corsan']),
  ...terms('material', 'pvc', ['pvc']),

  /* --- aplicación: el eje FINO dentro de la línea de agua --- */
  // Las frases ganan siempre a la palabra suelta (PHRASE_INDEX se consulta
  // primero), así que "agua fria" filtra la aplicación y el "agua" a secas
  // —sin apellido— cae en la línea. Es justo lo que quiere decir cada uno.
  ...terms('aplicacion', 'agua-fria', ['agua fria', 'fria', 'frias']),
  ...terms('aplicacion', 'agua-caliente', ['agua caliente', 'caliente', 'calientes']),

  /* --- línea comercial (eje grueso: ?linea=fm | ?linea=agua) --- */
  // POR QUÉ "contra incendio" emite AHORA `linea=fm` y ya no `aplicacion`:
  //   1. Las dos facetas son de selección única y, para la línea FM, dicen
  //      exactamente lo mismo: los 36 productos FM tienen application
  //      "Contra incendio" y ningún producto de agua la tiene. Mandar las dos
  //      claves sería un filtro redundante y el catálogo pintaría dos chips
  //      que el usuario tendría que quitar por separado.
  //   2. "fm" y "aci" se teclean solos, sin ninguna palabra de aplicación:
  //      necesitan un eje al que apuntar, y ese eje es la línea.
  //   3. Es el mismo parámetro con el que entran las cuatro tarjetas de
  //      /productos, así que un enlace del buscador y uno de una tarjeta son
  //      indistinguibles.
  // Al quedarse "contra-incendio" FUERA del vocabulario de aplicación, ninguna
  // consulta puede ya emitir una aplicación que contradiga a la línea FM.
  ...terms('linea', 'fm', ['contra incendio', 'incendio', 'incendios', 'aci', 'fm', 'fm approved']),
  // 'agua' a secas es la línea entera (fría + caliente), que es algo que la
  // faceta de aplicación —de selección única— no sabe expresar.
  ...terms('linea', 'agua', ['agua', 'aguas']),

  /* --- marca --- */
  ...terms('marca', 'georg-fischer', ['georg fischer', 'george fisher', 'georg', 'fischer', 'fisher', 'george', 'gf']),
  ...terms('marca', 'pavco', ['pavco']),
  ...terms('marca', 'integrity', ['integrity']),
  ...terms('marca', 'wl-plastics', ['wl plastics', 'wl']),
  ...terms('marca', 'extrucol', ['extrucol']),

  /* --- tipo (SDR/RDE de la línea FM, cédula de la línea agua) --- */
  ...terms('tipo', 'sdr11', ['sdr11', 'rde11']),
  ...terms('tipo', 'sdr9', ['sdr9', 'rde9']),
  ...terms('tipo', 'sdr7', ['sdr7', 'rde7']),
  // normalizeQuery() ya pega el prefijo a su número, así que "sch 80",
  // "sch-80", "sch.80" y "sch80" llegan aquí como un único token 'sch80'.
  // El slug del catálogo sí lleva guion ("SCH-80" -> "sch-80").
  // 'schedule' no lo pega la normalización (el prefijo reconocido es 'sch'),
  // por eso se registra como frase de dos palabras.
  ...terms('tipo', 'sch-80', ['sch80', 'cedula80', 'cedula 80', 'schedule 80']),

  /* --- presión: el número solo, con unidad, o como "clase" de catálogo --- */
  ...terms('presion', '200-psi', ['200 psi', '200', 'clase200', 'c200']),
  ...terms('presion', '240-psi', ['240 psi', '240', 'clase240', 'c240']),
  ...terms('presion', '250-psi', ['250 psi', '250', 'clase250', 'c250']),
  ...terms('presion', '290-psi', ['290 psi', '290', 'clase290', 'c290']),
  ...terms('presion', '335-psi', ['335 psi', '335', 'clase335', 'c335'])
];

/**
 * Palabras que sólo indican en qué catálogo mirar, sin ser un filtro.
 * "accesorios hdpe" no dice qué accesorio, pero sí que hay que ir a conexiones.
 *
 * 'codo' no está aquí: es un producto de pleno derecho —hoy repartido en las
 * casillas "Codo 45°" y "Codo 90°" de las dos líneas— y su faceta ya implica
 * la categoría (conexiones).
 */
const CATEGORY_HINTS: Record<string, 'tuberias' | 'conexiones'> = {
  conexion: 'conexiones',
  conexiones: 'conexiones',
  accesorio: 'conexiones',
  accesorios: 'conexiones',
  fitting: 'conexiones',
  fittings: 'conexiones'
};

/**
 * Catálogo donde vive cada marca / material.
 *
 * Los datos actuales están repartidos sin solape: Pavco, WL Plastics y
 * Extrucol sólo fabrican tubería; Georg Fischer e Integrity sólo conexiones;
 * el hierro dúctil sólo existe en conexiones. Sin esta pista, "georg fischer"
 * caería en el catálogo por defecto (tuberías), donde esa casilla ni siquiera
 * se dibuja: el usuario vería el listado completo sin filtrar y sin saber por
 * qué. Sólo se usa cuando la consulta no trae producto ni categoría explícita.
 */
const CATEGORY_BY_VALUE: Record<string, 'tuberias' | 'conexiones'> = {
  pavco: 'tuberias',
  'wl-plastics': 'tuberias',
  extrucol: 'tuberias',
  'georg-fischer': 'conexiones',
  integrity: 'conexiones',
  'hierro-ductil-fm': 'conexiones'
};

/** Palabras de relleno: se descartan sin contarlas como "no reconocidas". */
const FILLERS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'y', 'o', 'con', 'en', 'para', 'por', 'al', 'a'
]);

/**
 * Vocabulario técnico que el catálogo NO expone como faceta: el tipo de unión
 * (rosca, embone, SP) vive dentro de la ficha de cada medida, no en un filtro.
 *
 * Se reconocen igualmente para que "niple pvc rosca" no arrastre 'rosca' a
 * `leftover` ni el corrector la trate como una errata: son palabras correctas,
 * simplemente no filtran nada todavía. Si algún día se publica la faceta,
 * basta con moverlas a VOCABULARY.
 */
const NEUTRAL_TERMS = new Set([
  'rosca', 'roscas', 'roscado', 'roscada', 'nptf', 'npt',
  'embone', 'embones', 'embonar', 'sp', 'espiga', 'campana'
]);

/** Etiquetas legibles para el desplegable del buscador. */
const LABELS: Record<string, string> = {
  // producto
  'tubo': 'Tubo',
  'codo-90': 'Codo 90°',
  'codo-45': 'Codo 45°',
  'codo': 'Codo',
  'tee': 'Tee',
  'yee': 'Yee',
  'reduccion': 'Reducción',
  'bushing': 'Bushing',
  'niple': 'Niple',
  'tapon': 'Tapón',
  'tapon-hembra': 'Tapón hembra',
  'tapon-macho': 'Tapón macho',
  'brida': 'Brida',
  'brida-loca': 'Brida loca',
  'brida-fija': 'Brida fija',
  'brida-ciega': 'Brida ciega',
  'brida-backing-ring': 'Brida / Backing Ring',
  'union': 'Unión',
  'union-simple': 'Unión simple',
  'union-universal': 'Unión universal',
  'adaptador': 'Adaptador',
  'adaptador-macho': 'Adaptador macho',
  'adaptador-hembra': 'Adaptador hembra',
  'flange-adapter': 'Flange Adapter',
  // material
  'hdpe-fm': 'HDPE FM',
  'hierro-ductil-fm': 'Hierro dúctil FM',
  'pvc': 'PVC',
  'cpvc-corzan': 'CPVC Corzan',
  // aplicación
  'agua-fria': 'Agua fría',
  'agua-caliente': 'Agua caliente',
  // línea: el texto es el MISMO que el de la casilla del catálogo, para que la
  // pastilla del desplegable y el chip de filtro activo se lean igual.
  'fm': 'Contra incendio FM',
  'agua': 'Agua',
  // marca
  'georg-fischer': 'Georg Fischer',
  'pavco': 'Pavco',
  'integrity': 'Integrity',
  'wl-plastics': 'WL Plastics',
  'extrucol': 'Extrucol',
  // tipo
  'sdr11': 'SDR11',
  'sdr9': 'SDR9',
  'sdr7': 'SDR7',
  'sch-80': 'SCH-80',
  // presión
  '200-psi': '200 PSI',
  '240-psi': '240 PSI',
  '250-psi': '250 PSI',
  '290-psi': '290 PSI',
  '335-psi': '335 PSI'
};

/* Índices de búsqueda: frases de dos palabras aparte de palabras sueltas,
   porque "codo 90" o "hierro ductil" deben ganar a "codo" o "hierro". */
const PHRASE_INDEX = new Map<string, VocabEntry>();
const WORD_INDEX = new Map<string, VocabEntry>();

for (const entry of VOCABULARY) {
  const target = entry.term.includes(' ') ? PHRASE_INDEX : WORD_INDEX;
  if (!target.has(entry.term)) target.set(entry.term, entry);
}

/**
 * Facetas que el catálogo declara con `single: true`: sólo admiten UNA casilla
 * marcada. El buscador nunca debe emitir dos valores para ellas (ver la
 * resolución al final de parseQuery). `tipo`, `producto`, `marca` y `presion`
 * quedan fuera a propósito: ésas sí son OR de varias casillas.
 */
const SINGLE_CHOICE_FACETS = ['linea', 'aplicacion', 'material'] as const;

/* ============================= PARSEO ============================= */

export function parseQuery(raw: string): ParsedQuery {
  const parsed: ParsedQuery = {
    material: [],
    marca: [],
    tipo: [],
    producto: [],
    presion: [],
    aplicacion: [],
    linea: [],
    leftover: [],
    raw: String(raw ?? '')
  };

  // Los rellenos se quitan ANTES de emparejar frases: así "codo de 90"
  // sigue reconociéndose como la frase "codo 90".
  const tokens = normalizeQuery(parsed.raw)
    .split(' ')
    .filter(token => token && !FILLERS.has(token));

  let hinted: 'tuberias' | 'conexiones' | undefined;

  const push = (entry: VocabEntry) => {
    const bucket = parsed[entry.facet];
    if (!bucket.includes(entry.value)) bucket.push(entry.value);
  };

  let i = 0;
  while (i < tokens.length) {
    const pair = i + 1 < tokens.length ? `${tokens[i]} ${tokens[i + 1]}` : '';
    const phrase = pair ? PHRASE_INDEX.get(pair) : undefined;

    if (phrase) {
      push(phrase);
      i += 2;
      continue;
    }

    const word = WORD_INDEX.get(tokens[i]!);
    if (word) {
      push(word);
      i += 1;
      continue;
    }

    const hint = CATEGORY_HINTS[tokens[i]!];
    if (hint) {
      hinted ??= hint;
      i += 1;
      continue;
    }

    // Palabra técnica conocida pero sin faceta: se consume en silencio.
    if (NEUTRAL_TERMS.has(tokens[i]!)) {
      i += 1;
      continue;
    }

    parsed.leftover.push(tokens[i]!);
    i += 1;
  }

  // 'Tubo' sólo vive en tuberías; cualquier otro producto vive en conexiones.
  if (parsed.producto.includes('tubo')) parsed.category = 'tuberias';
  else if (parsed.producto.length) parsed.category = 'conexiones';
  else if (hinted) parsed.category = hinted;
  else {
    // Última pista: marca o material que sólo existan en un catálogo. Se exige
    // unanimidad para no elegir a ciegas ante consultas contradictorias
    // ("pavco integrity"), donde es preferible el catálogo por defecto.
    const derived = [...parsed.marca, ...parsed.material]
      .map(value => CATEGORY_BY_VALUE[value])
      .filter(Boolean) as Array<'tuberias' | 'conexiones'>;

    if (derived.length && derived.every(category => category === derived[0])) {
      parsed.category = derived[0];
    }
  }

  // ── Coherencia con las facetas de SELECCIÓN ÚNICA ────────────────────────
  // Línea, Aplicación y Material son de selección única en el catálogo: al
  // hidratar la URL sólo marcan el PRIMER valor que exista y descartan el
  // resto. Si el buscador enviase dos ("pvc cpvc", "agua fria y caliente"),
  // la pastilla del desplegable prometería dos filtros y el catálogo aplicaría
  // uno solo: el contador mentiría. Se recorta aquí, en el mismo sitio donde
  // se decide qué entendió la consulta, para que pastillas, URL y casillas
  // marcadas digan siempre lo mismo. Se conserva el primero que se tecleó, que
  // es lo que el usuario tenía en mente antes de dudar, y es además el que
  // ganaría en el catálogo.
  for (const facet of SINGLE_CHOICE_FACETS) {
    parsed[facet] = parsed[facet].slice(0, 1);
  }

  // `aplicacion` (Agua fría / Agua caliente) es el eje FINO y `linea` el
  // GRUESO. Cuando la consulta trae los dos, el segundo sobra siempre:
  //   · "agua caliente" + "agua" -> dirían lo mismo: filtro redundante y dos
  //     chips que hay que quitar por separado;
  //   · "agua caliente" + "fm"   -> se contradicen y, con las dos facetas en
  //     selección única, la tabla saldría vacía.
  // Gana la aplicación por ser la más específica: quien escribe "agua caliente
  // fm" ya dijo qué producto quiere ver, y devolverle cero filas sería peor que
  // ignorar el "fm". Consecuencia: aplicacion y linea NUNCA viajan juntas, ni
  // en la URL ni en las pastillas del desplegable.
  if (parsed.aplicacion.length) parsed.linea = [];

  return parsed;
}

/* ======================= ETIQUETAS Y CONTEO ======================= */

/**
 * Slugs reconocidos en orden de lectura:
 * producto · material · marca · tipo · presión · aplicación · línea.
 *
 * Se devuelven los slugs SIN expandir (ver PRODUCT_URL_ALIASES): el usuario
 * escribió "codo", así que la pastilla del desplegable dice "Codo" y el
 * contador sigue marcando un solo filtro, aunque la URL viaje con dos slugs.
 *
 * La línea va al final porque es el filtro más grueso: se lee "Codo 90° ·
 * HDPE FM · SDR11 · Contra incendio FM", de lo concreto a lo general.
 */
export function parsedValues(parsed: ParsedQuery): string[] {
  return [
    ...parsed.producto,
    ...parsed.material,
    ...parsed.marca,
    ...parsed.tipo,
    ...parsed.presion,
    ...parsed.aplicacion,
    ...parsed.linea
  ];
}

/** Etiquetas legibles ("Tubo", "HDPE FM"…) para mostrar en el desplegable. */
export function parsedLabels(parsed: ParsedQuery): string[] {
  return parsedValues(parsed).map(value => LABELS[value] ?? value);
}

/** Cuántos atributos entendió el buscador (decide si se muestra el atajo). */
export function countAttributes(parsed: ParsedQuery): number {
  return parsedValues(parsed).length;
}

/* =========================== URL DE CATÁLOGO =========================== */

/** Slugs seguros: se unen por coma tal cual, sin escapar de más. */
function joinValues(values: string[]): string {
  return values.map(value => encodeURIComponent(value)).join(',');
}

/**
 * Productos "paraguas": una palabra genérica que en el catálogo se reparte en
 * varias casillas.
 *
 * El usuario que escribe "codo" no está eligiendo entre "Codo 45°" y "Codo 90°":
 * quiere los dos, de la línea que sea. La faceta de producto del catálogo es OR
 * entre los slugs marcados, así que basta con enviarlos todos: los que no
 * existan en esa categoría simplemente no marcan ninguna casilla. La expansión
 * vive AQUÍ y no en parseQuery() para que la etiqueta y el contador del
 * desplegable sigan viendo un único filtro.
 */
const PRODUCT_URL_ALIASES: Record<string, string[]> = {
  // Sin 'codo' a secas: desde que el importador separa los codos de agua en
  // "Codo 45°" y "Codo 90°" (la nomenclatura que ya usaba la línea FM), NINGÚN
  // producto del catálogo se llama "Codo" y ninguna casilla tiene ese slug.
  // Enviarlo sería un filtro muerto en la URL: no marca nada y ensucia el
  // enlace que el usuario copia y comparte. Los otros paraguas SÍ conservan su
  // slug suelto porque su casilla existe de verdad ("Tapón" y "Unión").
  codo: ['codo-90', 'codo-45'],
  tapon: ['tapon', 'tapon-hembra', 'tapon-macho'],
  brida: ['brida-backing-ring', 'brida-loca', 'brida-fija', 'brida-ciega'],
  union: ['union', 'union-simple', 'union-universal'],
  adaptador: ['flange-adapter', 'adaptador-macho', 'adaptador-hembra']
};

function expandProducts(values: string[]): string[] {
  const expanded: string[] = [];

  for (const value of values) {
    for (const slug of PRODUCT_URL_ALIASES[value] ?? [value]) {
      if (!expanded.includes(slug)) expanded.push(slug);
    }
  }

  return expanded;
}

/**
 * Construye
 * /productos/<categoria>/?material=&marca=&tipo=&producto=&presion=&aplicacion=&linea=&q=
 * Devuelve null cuando no hay nada que filtrar ni categoría deducible, para
 * que el buscador pueda caer en su comportamiento clásico.
 */
export function buildCatalogUrl(parsed: ParsedQuery): string | null {
  const pairs: Array<[string, string[]]> = [
    ['material', parsed.material],
    ['marca', parsed.marca],
    ['tipo', parsed.tipo],
    ['producto', expandProducts(parsed.producto)],
    ['presion', parsed.presion],
    ['aplicacion', parsed.aplicacion],
    // parseQuery() ya garantiza que `linea` viene vacía si hay `aplicacion`,
    // así que aquí no hace falta volver a arbitrar entre los dos ejes.
    ['linea', parsed.linea]
  ];

  const hasFilters = pairs.some(([, values]) => values.length > 0);
  if (!parsed.category && !hasFilters) return null;

  // Sin categoría explícita, tuberías es el catálogo por defecto salvo que un
  // producto sólo exista en conexiones.
  const category =
    parsed.category ??
    (parsed.producto.some(value => value !== 'tubo') ? 'conexiones' : 'tuberias');

  const query = pairs
    .filter(([, values]) => values.length > 0)
    .map(([key, values]) => `${key}=${joinValues(values)}`);

  const rawText = parsed.raw.trim().replace(/\s+/g, ' ');
  // 'q' no filtra: sólo alimenta el "Resultados para …" del catálogo.
  if (rawText) query.push(`q=${encodeURIComponent(rawText).replace(/%20/g, '+')}`);

  return `/productos/${category}/${query.length ? `?${query.join('&')}` : ''}`;
}

/* ====================== ¿QUISISTE DECIR…? ====================== */

/**
 * Grafías que queremos CORREGIR aunque el parser las acepte como sinónimo.
 * Si estuvieran en el diccionario, "fisher" se daría por buena y nunca
 * propondríamos la marca bien escrita ("fischer").
 */
const MISSPELLINGS = new Set(['fisher', 'george', 'corsan']);

/** Palabras del sitio que no son filtros pero sí se teclean a menudo. */
const EXTRA_DICTIONARY = [
  'contra', 'fm', 'approved', 'contacto', 'empresa',
  'catalogo', 'ficha', 'tecnica', 'fichas', 'servicios', 'servicio',
  'termofusion', 'electrofusion', 'soldadura', 'carpinteria', 'plastica',
  'alquiler', 'maquinas', 'cotizacion', 'whatsapp', 'precio', 'psi',
  // Palabras de la línea agua que se teclean sueltas y no llegan desde
  // VOCABULARY ('cedula', 'hembra', 'loca'… sí llegan, porque el diccionario
  // trocea también las frases del vocabulario).
  'agua', 'presion', 'medida', 'medidas', 'pulgada', 'pulgadas', 'diametro'
];

const DICTIONARY: string[] = (() => {
  const words = new Set<string>();

  const add = (word: string) => {
    // Los números puros quedan fuera: "300" no debería "corregirse" a "200".
    if (!word || /^\d+$/.test(word)) return;
    if (MISSPELLINGS.has(word)) return;
    words.add(word);
  };

  for (const entry of VOCABULARY) entry.term.split(' ').forEach(add);
  Object.keys(CATEGORY_HINTS).forEach(add);
  // 'rosca' y 'embone' son palabras correctas aunque no filtren: sin ellas el
  // corrector las tomaría por erratas y propondría cualquier parecido.
  NEUTRAL_TERMS.forEach(add);
  EXTRA_DICTIONARY.forEach(add);

  return [...words];
})();

/**
 * Levenshtein por matriz con transposición (Damerau/OSA): el vocabulario es
 * diminuto, no hace falta nada más rápido. Se cuenta la transposición como UN
 * error porque el fallo típico al teclear es cruzar dos letras ("hpde" por
 * "hdpe"); sin ella esa palabra de 4 letras nunca alcanzaría su tolerancia.
 */
function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = [];

  for (let i = 0; i < rows; i++) matrix.push(new Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i++) matrix[i]![0] = i;
  for (let j = 0; j < cols; j++) matrix[0]![j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,      // borrado
        matrix[i]![j - 1]! + 1,      // inserción
        matrix[i - 1]![j - 1]! + cost // sustitución
      );

      // Dos letras cruzadas: un solo error, no dos sustituciones.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i]![j] = Math.min(matrix[i]![j]!, matrix[i - 2]![j - 2]! + 1);
      }
    }
  }

  return matrix[rows - 1]![cols - 1]!;
}

/** Tolerancia por longitud: cuanto más corta la palabra, menos margen de error. */
function toleranceFor(word: string): number {
  if (word.length >= 7) return 2;
  if (word.length >= 4) return 1;
  return 0; // 1-3 letras: sólo coincidencia exacta
}

function closestWord(word: string): string | null {
  const tolerance = toleranceFor(word);
  if (tolerance === 0) return null;

  let best: string | null = null;
  let bestDistance = tolerance + 1;

  for (const candidate of DICTIONARY) {
    // Un salto de longitud mayor que la tolerancia nunca puede cumplirla.
    if (Math.abs(candidate.length - word.length) > tolerance) continue;

    const distance = levenshtein(word, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  return bestDistance <= tolerance ? best : null;
}

/**
 * Corrección tipo Google, palabra por palabra.
 * Devuelve null si no hay nada que corregir (o si el resultado sería igual),
 * para que el buscador muestre su mensaje normal de "sin resultados".
 */
export function didYouMean(raw: string): string | null {
  const normalized = normalizeQuery(raw);
  if (!normalized) return null;

  const words = normalized.split(' ').filter(Boolean);
  let corrected = false;

  const suggestion = words.map(word => {
    // Números sueltos ("200") y tokens ya conocidos se dejan intactos.
    if (/^\d+$/.test(word)) return word;
    if (DICTIONARY.includes(word)) return word;

    const best = closestWord(word);
    if (best && best !== word) {
      corrected = true;
      return best;
    }

    return word;
  }).join(' ');

  if (!corrected || suggestion === normalized) return null;

  return suggestion;
}
