export type Category = {
  slug: string;
  name: string;
  image: string;
};

export const categories: Category[] = [
  {
    slug: "tuberias",
    name: "Tuberías",
    image: "/assets/categories/tuberias.jpg"
  },
  {
    slug: "conexiones",
    name: "Conexiones",
    image: "/assets/categories/conexiones.jpg"
  },
  {
    slug: "valvulas",
    name: "Válvulas",
    image: "/assets/categories/valvulas.jpg"
  },
  {
    slug: "planchas",
    name: "Planchas",
    image: "/assets/categories/planchas.jpg"
  }
];