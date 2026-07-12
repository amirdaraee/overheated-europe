import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: process.env.ASTRO_SITE ?? 'https://amirdaraee.github.io',
  base: process.env.ASTRO_BASE
    ? (process.env.ASTRO_BASE.endsWith('/') ? process.env.ASTRO_BASE : process.env.ASTRO_BASE + '/')
    : '/',
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  build: { assets: 'assets' },
});
