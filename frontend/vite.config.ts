import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import postcssConfig from './postcss.config.ts';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: './tailwind.config.ts' }), 
        autoprefixer,
        ...postcssConfig.plugins, 
      ],
    },
  },
})
