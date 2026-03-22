// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://brunoh6.github.io',
  base: '/wretched-wasp',

  output: 'static',

  vite: {
    plugins: [tailwindcss()]
  }
});