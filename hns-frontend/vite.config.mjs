import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import browserslistToEsbuild from 'browserslist-to-esbuild';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['REACT_APP_', 'PUBLIC_URL', 'PORT']);
  const publicUrl = process.env.PUBLIC_URL || env.PUBLIC_URL || '/';
  // Only explicitly public React variables may be embedded in browser code.
  const publicEnv = Object.fromEntries(
    Object.entries({ ...env, ...process.env }).filter(([key]) =>
      key.startsWith('REACT_APP_')
    )
  );

  return {
    plugins: [react()],
    base: publicUrl,
    define: {
      'process.env': JSON.stringify({
        ...publicEnv,
        NODE_ENV: mode === 'production' ? 'production' : 'development',
        PUBLIC_URL: publicUrl === '/' ? '' : publicUrl,
      }),
    },
    build: { outDir: 'build', target: browserslistToEsbuild() },
    server: {
      port: Number(process.env.PORT || env.PORT || 3000),
      strictPort: true,
      proxy: {
        '/api': {
          target: (
            publicEnv.REACT_APP_API_URL || 'http://localhost:8000'
          ).replace(/\/api\/?$/, ''),
          changeOrigin: true,
        },
      },
    },
  };
});
