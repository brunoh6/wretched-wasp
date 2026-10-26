export type Category = {
  slug: string;
  name: string;
  /** Etiqueta corta usada en el menú de navegación. Por defecto usa `name`. */
  navLabel?: string;
  image: string;
  /**
   * Única fuente de verdad para mostrar/ocultar una categoría en TODO el sitio
   * (menú de escritorio, menú móvil, índice de productos y rutas generadas).
   *
   * Hoy están publicadas tuberías y conexiones, que es donde vive TODO el
   * catálogo real: la línea contra incendio FM y la línea de agua fría/caliente.
   * El resto permanece oculto hasta contar con su data (válvulas, planchas,
   * pegamentos, perfiles y máquinas siguen sin importar): para publicarlas basta
   * con cambiar `visible` a `true` en esta lista.
   *
   * Ojo: ya NO hace falta esperar a las fichas técnicas para publicar. El
   * catálogo muestra los productos sin PDF y marca "Ficha pendiente"; las fichas
   * las va cargando el CMS por grupo (src/data/catalog/overrides.json).
   */
  visible: boolean;
  /**
   * Textos de la página /productos/<slug>/ (destino de los anuncios de Google
   * Ads): `<title>`, meta description y el párrafo que va bajo el H1, que se
   * renderiza en el servidor para que Google lo lea sin ejecutar el script.
   * Deben nombrar sólo lo que el catálogo publica de verdad (materiales,
   * clases y productos). Sin ellos la página usa "Nombre | DIHYC" y la
   * description por defecto de BaseLayout.
   */
  seoTitle?: string;
  seoDescription?: string;
  intro?: string;
};

export const categories: Category[] = [
  {
    slug: "tuberias",
    name: "Tuberías",
    navLabel: "Tubos",
    image: "/assets/categories/tuberias.png",
    visible: true,
    seoTitle: "Tuberías HDPE FM Approved, PVC y CPVC en Lima | DIHYC",
    seoDescription:
      "Tuberías HDPE certificadas FM Approved para redes contra incendio y tuberías PVC y CPVC para agua fría y caliente. Fichas técnicas y cotización por WhatsApp.",
    intro:
      "Distribuimos en Lima tuberías de HDPE certificadas FM Approved para redes contra incendio y de PVC y CPVC SCH-80 para agua fría y caliente. Marca «Cotizar» en los productos que necesites y envía la lista por WhatsApp."
  },
  {
    slug: "conexiones",
    name: "Conexiones",
    navLabel: "Accesorios",
    image: "/assets/categories/conexiones.png",
    visible: true,
    seoTitle: "Conexiones HDPE FM Approved, PVC y CPVC SCH-80 | DIHYC",
    seoDescription:
      "Conexiones HDPE certificadas FM Approved para redes contra incendio y conexiones PVC y CPVC SCH-80 para agua fría y caliente: codos, tees, reducciones, bridas y adaptadores. Fichas técnicas y cotización por WhatsApp.",
    intro:
      "Distribuimos en Lima conexiones de HDPE certificadas FM Approved para redes contra incendio y de PVC y CPVC SCH-80 para agua fría y caliente: codos, tees, reducciones, bridas y adaptadores. Marca «Cotizar» en los productos que necesites y envía la lista por WhatsApp."
  },
  {
    slug: "valvulas",
    name: "Válvulas",
    image: "/assets/categories/valvulas.jpg",
    visible: false
  },
  {
    slug: "planchas",
    name: "Planchas",
    image: "/assets/categories/planchas.jpg",
    visible: false
  },
  {
    slug: "pegamentos",
    name: "Pegamentos",
    image: "/assets/categories/pegamentos.jpg",
    visible: false
  },
  {
    slug: "perfiles",
    name: "Perfiles",
    image: "/assets/categories/perfiles.jpg",
    visible: false
  },
  {
    slug: "maquinas",
    name: "Máquinas",
    image: "/assets/categories/maquinas.jpg",
    visible: false
  }
];

/** Categorías publicadas: alimentan el menú, el índice y las rutas estáticas. */
export const visibleCategories = categories.filter((category) => category.visible);
