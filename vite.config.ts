import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Increase chunk size warning limit slightly (translations are legitimately large)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate vendor libraries into their own chunks
          if (id.includes('node_modules')) {
            // Split React and React-DOM into separate chunk
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Split Supabase into its own chunk
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // Split Motion (Framer Motion) separately - it's large
            if (id.includes('motion') || id.includes('framer')) {
              return 'motion-vendor';
            }
            // Split Lucide icons separately
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            // Split charts library
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            // Split other UI libraries
            if (id.includes('sonner') || id.includes('date-fns')) {
              return 'ui-vendor';
            }
            // Everything else from node_modules
            return 'vendor';
          }
          
          // Separate translation context into its own chunk (it's large but necessary)
          if (id.includes('LanguageContext')) {
            return 'translations';
          }
          
          // Separate each major tab component into its own chunk (lazy loading)
          if (id.includes('CommunityTab.tsx')) {
            return 'tab-community';
          }
          if (id.includes('ListenTab.tsx')) {
            return 'tab-listen';
          }
          if (id.includes('ShareTab.tsx')) {
            return 'tab-share';
          }
          if (id.includes('ProfileTab.tsx')) {
            return 'tab-profile';
          }
          if (id.includes('CheckInTab.tsx')) {
            return 'tab-checkin';
          }
          
          // Onboarding and Tutorial (only loaded once)
          if (id.includes('Onboarding.tsx') || id.includes('Tutorial.tsx')) {
            return 'onboarding';
          }
          
          // Separate UI components
          if (id.includes('/components/ui/')) {
            return 'ui-components';
          }
          
          // Utils and hooks
          if (id.includes('/utils/') || id.includes('/hooks/')) {
            return 'utils';
          }
        },
      },
    },
    // Optimize chunk sizes
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'], // Remove specific console methods
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});