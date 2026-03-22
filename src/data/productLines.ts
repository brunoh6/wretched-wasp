export type ProductVariant = {
  code: string;
  brand: string;
  pressure: string;
  description: string;
  application?: string;
};

export type ProductLine = {
  slug: string;
  name: string;
  category: string;
  material: string;
  description: string;
  image: string;
  keywords: string[];
  variants: ProductVariant[];
};

export const productLines: ProductLine[] = [
  {
    slug: "tubos-cpvc",
    name: "Tubos CPVC",
    category: "tuberias",
    material: "cpvc",
    description:
      "Línea de tubos CPVC para aplicaciones industriales, conducción técnica y sistemas especializados.",
    image: "/assets/products/cpvc.png",
    keywords: [
      "cpvc",
      "tubo cpvc",
      "tubos cpvc",
      "cloruro de polivinilo clorado",
      "sch-40",
      "sch-80",
      "fm",
      "contra incendio"
    ],
    variants: [
      {
        code: "PD09670",
        brand: "AGRU",
        pressure: "FM 1613",
        description: '218 PSI SD11 160MM ISO AGRU'
      },
      {
        code: "PD10124",
        brand: "CANTEX",
        pressure: "SCH-40",
        description: 'UL 3" X 3.05 MTS. CANTEX'
      },
      {
        code: "PD08725",
        brand: "CHARLOTTE",
        pressure: "SCH-80",
        description: '6" X 5.80 MTS SP CHARLOTTE'
      },
      {
        code: "PD04485",
        brand: "ERA",
        pressure: "SCH-80",
        description: '2.1/2" X 6.00MTS SP ERA'
      },
      {
        code: "PD09049",
        brand: "EUROTUBO",
        pressure: "C-5",
        description: '4" X 5 MTS SP EUROTUBO'
      },
      {
        code: "PD10131",
        brand: "EXTRUCOL",
        pressure: "FM CL - 250 SDR 9",
        description: '8" ASTM PE4710 (C/FRANJAS ROJAS) GF-EXTRUCOL',
        application: "contra incendio"
      },
      {
        code: "PD10130",
        brand: "EXTRUCOL",
        pressure: "FM CL - 250 SDR 9",
        description: '6" ASTM PE4710 (C/FRANJAS ROJAS) GF-EXTRUCOL',
        application: "contra incendio"
      },
      {
        code: "PD10129",
        brand: "EXTRUCOL",
        pressure: "FM CL - 200 SDR 11",
        description: '8" ASTM PE4710 (C/FRANJAS ROJAS) GF-EXTRUCOL',
        application: "contra incendio"
      },
      {
        code: "PD10127",
        brand: "EXTRUCOL",
        pressure: "FM CL - 200 SDR 11",
        description: '4" ASTM PE4710 (C/FRANJAS ROJAS) GF-EXTRUCOL',
        application: "contra incendio"
      },
      {
        code: "PD10126",
        brand: "EXTRUCOL",
        pressure: "FM CL - 200 SDR 11",
        description: '3" ASTM PE4710 (C/FRANJAS ROJAS) GF-EXTRUCOL',
        application: "contra incendio"
      },
      {
        code: "PD09948",
        brand: "EXTRUCOL",
        pressure: "FM CL - 200 SDR 11",
        description: '10" ASTM PE4710 (C/FRANJAS ROJAS) EXTRUCOL',
        application: "contra incendio"
      },
      {
        code: "PD10128",
        brand: "EXTRUCOL",
        pressure: "FM CL - 200 SDR 11",
        description: '6" ASTM PE4710 (C/FRANJAS ROJAS) GF-EXTRUCOL',
        application: "contra incendio"
      },
      {
        code: "PD04435",
        brand: "GEORG FISCHER",
        pressure: "SCH-80",
        description: '6" X 6.10MTS SP GEORG FISCHER'
      },
      {
        code: "PD04431",
        brand: "GEORG FISCHER",
        pressure: "SCH-80",
        description: '2" X 6.10MTS SP GEORG FISCHER'
      },
      {
        code: "PD03767",
        brand: "GEORG FISCHER",
        pressure: "CORZAN SCH-80",
        description: '6" X 6.10MTS SP GEORG FISCHER'
      }
    ]
  },

  {
    slug: "tubos-hdpe",
    name: "Tubos HDPE",
    category: "tuberias",
    material: "hdpe",
    description:
      "Línea de tubos HDPE para conducción de fluidos, instalaciones técnicas y uso industrial.",
    image: "/assets/products/hdpe.png",
    keywords: [
      "hdpe",
      "pead",
      "polietileno",
      "tubo hdpe",
      "tubos hdpe",
      "sch-40",
      "sch-80",
      "corzan",
      "gerfor"
    ],
    variants: [
      {
        code: "PD04433",
        brand: "GEORG FISCHER",
        pressure: "SCH-80",
        description: '3" X 6.10MTS SP GEORG FISCHER'
      },
      {
        code: "PD03763",
        brand: "GEORG FISCHER",
        pressure: "CORZAN SCH-80",
        description: '2" X 6.10MTS SP GEORG FISCHER'
      },
      {
        code: "PD03768",
        brand: "GEORG FISCHER",
        pressure: "CORZAN SCH-80",
        description: '8" X 6.10MTS SP GEORG FISCHER'
      },
      {
        code: "PD04436",
        brand: "GEORG FISCHER",
        pressure: "SCH-80",
        description: '8" X 6.10MTS SP GEORG FISCHER'
      },
      {
        code: "PD03765",
        brand: "GEORG FISCHER",
        pressure: "CORZAN SCH-80",
        description: '3" X 6.10MTS SP GEORG FISCHER'
      },
      {
        code: "PD03766",
        brand: "GEORG FISCHER",
        pressure: "CORZAN SCH-80",
        description: '4" X 6.10MTS SP GEORG FISCHER'
      },
      {
        code: "PD04434",
        brand: "GEORG FISCHER",
        pressure: "SCH-80",
        description: '4" X 6.10MTS SP GEORG FISCHER'
      },
      {
        code: "PD03764",
        brand: "GEORG FISCHER",
        pressure: "CORZAN SCH-80",
        description: '2.1/2" X 6.10MTS SP GEORG FISCHER'
      },
      {
        code: "PD04427",
        brand: "GEORG FISCHER",
        pressure: "SCH-80",
        description: '3/4" X 6.10MTS SP GEORG FISCHER'
      },
      {
        code: "PD04419",
        brand: "GERFOR",
        pressure: "SCH-40",
        description: '4" X 3.00MTS. SP GERFOR'
      },
      {
        code: "PD04446",
        brand: "GERFOR",
        pressure: "SCH-80",
        description: '2" X 6.00MTS SP ASTM D1785 GERFOR'
      },
      {
        code: "PD04404",
        brand: "GERFOR",
        pressure: "SCH-40",
        description: '3" X 3.00MTS SP GERFOR'
      },
      {
        code: "PD04416",
        brand: "GERFOR",
        pressure: "SCH-40",
        description: '2" X 3.00MTS. SP GERFOR'
      },
      {
        code: "PD04415",
        brand: "GERFOR",
        pressure: "SCH-40",
        description: '1" X 3.00MTS. SP GERFOR'
      },
      {
        code: "PD04421",
        brand: "GERFOR",
        pressure: "SCH-40",
        description: '6" X 3.00MTS. SP GERFOR'
      }
    ]
  },

  {
    slug: "tubos-pvc",
    name: "Tubos PVC",
    category: "tuberias",
    material: "pvc",
    description:
      "Línea de tubos PVC para aplicaciones de presión, desagüe, conducción y sistemas especializados.",
    image: "/assets/products/pvc.png",
    keywords: [
      "pvc",
      "tubo pvc",
      "tubos pvc",
      "sap",
      "sal",
      "sdr11",
      "sdr17",
      "pn16",
      "sch-40",
      "sch-80",
      "contra incendio"
    ],
    variants: [
      {
        code: "PD04418",
        brand: "GERFOR",
        pressure: "SCH-40",
        description: '3/4" X 3.00MTS. SP GERFOR'
      },
      {
        code: "PD03814",
        brand: "GLOBALPLAST",
        pressure: "SDR11",
        description: '4" ASTM PE4710 (200 PSI)'
      },
      {
        code: "PD03929",
        brand: "GLOBALPLAST",
        pressure: "SDR17 PN10",
        description: "63MM PE100 GP"
      },
      {
        code: "PD03868",
        brand: "GLOBALPLAST",
        pressure: "SDR11 PN16",
        description: "75MM PE100 GP"
      },
      {
        code: "PD04073",
        brand: "HAKAN PLASTIK",
        pressure: "PN16",
        description: "110MM X 4MTS. FUSION HAKAN PLASTIK (COLOR BLANCO)"
      },
      {
        code: "PD04445",
        brand: "HYDROSEAL",
        pressure: "SCH-80",
        description: '2" X 5.80MTS SP HYDROSEAL'
      },
      {
        code: "PD04170",
        brand: "INYECTOPLAST",
        pressure: "C-15",
        description: '3" X 5 MTS. SP INYECTOPLAST'
      },
      {
        code: "PD04375",
        brand: "INYECTOPLAST",
        pressure: "SAP (P-25)",
        description: '1" X 3MTS. SP INYECTOPLAST'
      },
      {
        code: "PD05617",
        brand: "NICOLL",
        pressure: "C-10",
        description: '8" X 5 MTS. SP NICOLL'
      },
      {
        code: "PD09598",
        brand: "PAVCO",
        pressure: "FM CL - 200 SDR 11",
        description: '10" ASTM PE4710 (C/FRANJAS ROJAS) PAVCO',
        application: "contra incendio"
      },
      {
        code: "PD09599",
        brand: "PAVCO",
        pressure: "FM CL - 250 SDR 9",
        description: '10" ASTM PE4710 (C/FRANJAS ROJAS) PAVCO',
        application: "contra incendio"
      },
      {
        code: "PD04109",
        brand: "PAVCO",
        pressure: "C-10",
        description: '3" X 5 MTS. SP PAVCO'
      },
      {
        code: "PD04146",
        brand: "PLASTICA",
        pressure: "C-10",
        description: "31.5MM X 6MTS. UF PLASTICA"
      },
      {
        code: "PD08988",
        brand: "PLASTICA",
        pressure: "SDR17 PN10",
        description: "32MM PE100"
      },
      {
        code: "PD09731",
        brand: "WL PLASTICS",
        pressure: "FM CL - 200 SDR 11",
        description: '2" ASTM PE4710 NEGRO WL PLASTICS'
      }
    ]
  }
];