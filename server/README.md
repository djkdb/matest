# 시험 마스터 — 웹푸시 발송 서버 (Cloudflare Workers)

앱을 **완전히 닫은 상태에서도** 원서접수·공부·스트릭 리마인더를 보내는 푸시 서버입니다.
Cloudflare Workers + KV + Cron Triggers로 **무료 티어**에서 돌아갑니다(상업적 사용 허용).

- 발송: 표준 Web Push(VAPID) — FCM/APNs/Mozilla 게이트웨이 경유, **발송 수수료 0원**
- 저장: KV(구독 정보)
- 스케줄: Cron Trigger(매시간) → 구독자 로컬 시각 기준으로 도래한 알림 발송
- 크립토: `webpush-webcrypto`(Web Crypto, Node 의존성 없음 → Workers 네이티브)

## 구조

```
server/
├── src/
│   ├── index.js       # Worker: HTTP 라우트(subscribe 등) + scheduled(cron)
│   ├── push.js        # sendPush — VAPID 서명 + 페이로드 암호화 후 발송
│   ├── store.js       # KV 구독 저장/조회/순회
│   └── reminders.js   # ★ "지금 뭘 보낼지" 순수 판단 로직 (테스트됨)
├── scripts/generate-vapid.mjs
├── tests/reminders.test.mjs
└── wrangler.toml
```

## 엔드포인트

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/vapidPublicKey` | 공개키 반환 |
| POST | `/subscribe` | 구독 저장 `{ subscription, prefs, examMeta, tzOffsetMinutes, remindTime }` |
| POST | `/unsubscribe` | `{ endpoint }` 삭제 |
| POST | `/heartbeat` | `{ endpoint, lastStudyDate, streakCount }` — 공부 기록 시 갱신 |
| POST | `/test` | `{ endpoint }` 즉시 테스트 발송 |

크론(`scheduled`)은 매시간 전 구독을 순회하며 `reminders.js` 판단에 따라 발송하고,
만료(404/410) 구독은 자동 삭제합니다.

## 배포 (5단계)

```bash
cd server
npm install
npm run gen-keys                 # 1) VAPID 키 생성 → 출력 복사

npx wrangler kv:namespace create SUBSCRIPTIONS   # 2) KV 생성 → id 복사
#   → wrangler.toml 의 id 와 VAPID_PUBLIC_KEY, VAPID_CONTACT, ALLOWED_ORIGIN 채우기

npx wrangler secret put VAPID_PRIVATE_KEY        # 3) 개인키를 비밀로 등록(붙여넣기)

npm run deploy                   # 4) 배포 → https://exam-master-push.<계정>.workers.dev
```

5) **클라이언트 연결** — 앱 루트의 `.env.local`:

```
VITE_VAPID_PUBLIC_KEY=<gen-keys 로 나온 공개키>
VITE_PUSH_API=https://exam-master-push.<계정>.workers.dev
```

앱을 다시 빌드하면, 알림을 켠 사용자의 구독이 서버에 저장되고 크론이 리마인더를 보냅니다.
(로컬 개발: `npm run dev` 로 Worker 실행, `npx wrangler tail` 로 로그 확인.)

## 비용

- 발송 프로토콜·게이트웨이: **무료**
- Workers/KV/Cron: **무료 티어**(요청 10만/일, KV 읽기 10만/일 등)로 소규모 충분. 상업적 사용 허용.
- 규모가 커지면 유료 전환(Workers Paid $5/월~). 수치는 배포 시점에 Cloudflare 현재 한도 확인.

## 참고

- iOS는 **홈 화면에 설치한 PWA**에서만 웹푸시 수신(Safari 16.4+).
- 시간 기반 알림(공부/스트릭)은 구독의 `tzOffsetMinutes`로 로컬 시각을 계산합니다.
  DST가 있는 지역은 오프셋이 바뀔 수 있으니, 클라이언트가 주기적으로 `/subscribe`를
  다시 호출해 최신 오프셋을 반영하면 정확합니다(한국은 DST 없음).
- 이 서버 로직(`reminders.js`)은 단위 테스트로 검증됩니다: `npm test`.
