export type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  image: string;
};

export const categories = [
  "Todos",
  "Tubos",
  "Conexiones",
  "Planchas",
  "Válvulas",
  "Pegamentos",
  "Perfiles",
  "Mangueras",
  "Soldaduras"
];

export const brands = [
  "GF+",
  "Hakan Plastik",
  "Simona",
  "FIP",
  "Cepex",
  "Plasson",
  "Wavin",
  "IPEX",
  "Friatec",
  "Agru"
] as const;

export const products: Product[] = [
  {
    id: "p1",
    name: "Tubos HDPE",
    category: "Tubos",
    brand: "GF+",
    image: "/assets/products/product3.png"
  },
  {
    id: "p2",
    name: "Conexiones PP",
    category: "Conexiones",
    brand: "Hakan Plastik",
    image: "/assets/products/product2.png"
  },
  {
    id: "p3",
    name: "Válvulas",
    category: "Válvulas",
    brand: "Simona",
    image: "/assets/products/product1.png"
  }
];