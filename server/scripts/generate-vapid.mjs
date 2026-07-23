// VAPID 키 쌍 생성. 출력값을 wrangler.toml(공개키)와 secret(개인키), 그리고
// 클라이언트 .env(VITE_VAPID_PUBLIC_KEY)에 넣으세요.
//
//   npm run gen-keys
//
import { ApplicationServerKeys, setWebCrypto } from 'webpush-webcrypto';
import { webcrypto } from 'node:crypto';

setWebCrypto(webcrypto);

const keys = await ApplicationServerKeys.generate();
const { publicKey, privateKey } = await keys.toJSON();

console.log('# --- VAPID 키 (안전하게 보관) ---');
console.log('VAPID_PUBLIC_KEY=' + publicKey);
console.log('VAPID_PRIVATE_KEY=' + privateKey);
console.log('');
console.log('# 클라이언트 .env.local:  VITE_VAPID_PUBLIC_KEY=' + publicKey);
console.log('# 서버 개인키 등록:        wrangler secret put VAPID_PRIVATE_KEY');
