import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// 큐넷 국가기술자격 시험일정 API 프록시.
// 브라우저에서 apis.data.go.kr 직접 호출은 CORS로 막히므로 개발 중에는
// '/api/qnet/*' 요청을 공공데이터포털로 프록시한다. (인증키는 요청 쿼리에 포함)
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'favicon-32.png'],
      manifest: {
        name: '시험 마스터 — 자격증 공부 플래너',
        short_name: '시험 마스터',
        description: '커뮤니티 꿀팁 모아보고, 시험일까지 공부 캘린더를 자동 생성하는 자격증 준비 앱',
        lang: 'ko',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#3182f6',
        categories: ['education', 'productivity'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 앱 셸 프리캐시 → 오프라인에서도 실행. 폰트는 용량이 커서 런타임 캐시로.
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/qnet'),
            handler: 'NetworkOnly',
          },
          {
            // Pretendard 폰트: 처음 로드 후 캐시 → 이후 오프라인에서도 표시
            urlPattern: ({ url }) => url.pathname.startsWith('/fonts/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api/qnet': {
        target: 'https://apis.data.go.kr/B490007/qualExamSchdInfoService',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/qnet/, ''),
      },
    },
  },
});
