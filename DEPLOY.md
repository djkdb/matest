# 배포 가이드 — Cloudflare Pages

이 앱은 **정적 PWA**라서 빌드 결과(`dist/`)만 올리면 됩니다. env 없이도 바로 배포·동작하고(데모 일정 + 로컬 알림), 나중에 키를 넣으면 큐넷 실시간 일정·웹푸시가 켜집니다.

빌드 설정 (공통):
- **빌드 명령**: `npm run build`
- **출력 디렉터리**: `dist`
- **Node 버전**: 20 (`.nvmrc`로 지정됨)

## 방법 A — 대시보드 Git 연결 (가장 쉬움, 추천)

1. Cloudflare 대시보드 → **Workers & Pages → Create → Pages → Connect to Git**
2. `djkdb/matest` 저장소 선택
3. 빌드 설정:
   - Framework preset: **Vite** (또는 None)
   - Build command: `npm run build`
   - Build output directory: `dist`
4. (선택) **Environment variables**에 아래를 추가 — 없으면 데모/로컬로 동작:
   | 변수 | 용도 |
   |---|---|
   | `VITE_QNET_API_KEY` | 큐넷 실시간 시험일정 |
   | `VITE_VAPID_PUBLIC_KEY` | 웹푸시(서버 배포 후) |
   | `VITE_PUSH_API` | 푸시 서버 주소(서버 배포 후) |
5. **Save and Deploy** → `https://exam-master.pages.dev` 발급. 이후 **연결된 브랜치에 push하면 자동 배포**됩니다.

> ⚠️ 큐넷 API는 브라우저에서 CORS로 직접 호출이 막힙니다. 배포 환경에서 실시간 일정을 쓰려면 `/api/qnet`를 Cloudflare로 프록시해야 하는데, 이는 별도 설정입니다(미설정 시 자동으로 예시 일정 사용). 상세는 루트 README의 "큐넷 시험일정 API 연동" 참고.

## 방법 B — GitHub Actions 자동 배포 (`.github/workflows/deploy.yml` 포함됨)

1. GitHub 저장소 → **Settings → Secrets and variables → Actions**에 추가:
   - `CLOUDFLARE_API_TOKEN` — 권한: **Cloudflare Pages: Edit** (+ Account: Read)
   - `CLOUDFLARE_ACCOUNT_ID` — 대시보드 우측의 Account ID
   - (선택) `VITE_QNET_API_KEY`, `VITE_VAPID_PUBLIC_KEY`, `VITE_PUSH_API`
2. `main`에 push하거나, **Actions 탭 → Deploy → Run workflow**로 수동 실행 → 자동 빌드·배포.

## 방법 C — 로컬 CLI

```bash
npm run build
npx wrangler login
npx wrangler pages deploy dist --project-name=exam-master
```

## 웹푸시 서버 (선택)

앱을 닫아도 알림이 오게 하려면 [`server/`](./server/README.md)의 Cloudflare Worker를 배포한 뒤,
Pages 환경변수에 `VITE_VAPID_PUBLIC_KEY`·`VITE_PUSH_API`를 넣고 다시 배포하세요.
(서버 없이도 앱을 열 때 로컬 리마인더는 동작합니다.)

## 배포 후 체크

- 홈 화면 설치(안드로이드/크롬 "홈 화면에 추가", iOS 공유→홈 화면에 추가)
- 오프라인 동작(서비스워커) — HTTPS 필수(Pages는 기본 HTTPS)
- 라이트/다크 자동, 캘린더·타이머·복습·알림 정상
