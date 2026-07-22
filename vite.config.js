import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 큐넷 국가기술자격 시험일정 API 프록시.
// 브라우저에서 apis.data.go.kr 직접 호출은 CORS로 막히므로 개발 중에는
// '/api/qnet/*' 요청을 공공데이터포털로 프록시한다. (인증키는 요청 쿼리에 포함)
export default defineConfig({
  plugins: [react()],
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
