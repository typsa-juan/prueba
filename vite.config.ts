import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc'; // Manteniendo tu configuración de SWC
import cesium from 'vite-plugin-cesium';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cesium()],
  base: "/BIM-GIS/",
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Asegúrate de que los assets se resuelvan correctamente
    assetsInlineLimit: 0
  }
});