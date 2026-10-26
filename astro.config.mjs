// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
// Versión fijada EXACTA (3.7.0) en package.json a propósito: es la última de la
// rama compatible con Astro 5. Desde la 3.7.1 la integración pasa a Astro 6
// (y a zod 4), así que un "^3.7.0" acabaría instalando una versión pensada
// para otra versión mayor de Astro en cuanto alguien hiciera `npm install`.
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Dominio canónico (decisión D1: con www). Astro lo usa para construir URLs
  // absolutas: el <link rel="canonical">, og:image y las URLs del sitemap.
  // Sin esto, el build escribía "http://localhost:4321/..." como canonical.
  //
  // OJO: NO se toca `build.format` (queda en 'directory', el valor por defecto)
  // ni `trailingSlash` (queda en 'ignore'). Cada página sale como
  // carpeta/index.html y Apache la sirve con 200 en /ruta/ (decisión D2). Cambiar
  // a 'file' fue justamente lo que dio los 404 del sitio viejo.
  site: 'https://www.dihyc.com.pe',

  integrations: [
    sitemap({
      // La integración ya omite 404/500 por su cuenta, pero lo dejamos explícito
      // para que no dependa de un detalle interno que podría cambiar.
      // /admin vive en public/ (no es una página de Astro) y hoy no entraría,
      // pero si algún día alguien crea src/pages/admin/... tampoco debe
      // aparecer: es el panel interno del CMS.
      filter: (page) => {
        const { pathname } = new URL(page);
        if (/^\/404\/?$/.test(pathname)) return false;
        if (pathname === '/admin' || pathname.startsWith('/admin/')) return false;
        return true;
      }
    })
  ],

  server: {
    host: true, // Esto permite que el servidor sea accesible externamente
    port: 4321, // Puerto fijo de desarrollo
    allowedHosts: true // Esto quita el bloqueo de host de ngrok
  },
  // `astro preview` usa el mismo puerto que `astro dev`.
  preview: {
    host: true,
    port: 4321
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      // Si el 4321 está ocupado, falla en vez de saltar a otro puerto.
      strictPort: true,
      watch: {
        // Recarga automática fiable en macOS y en carpetas sincronizadas.
        usePolling: false
      }
    }
  }
});
