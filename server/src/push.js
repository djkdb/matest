// 웹푸시 발송 (Web Crypto 기반, Cloudflare Workers 호환).
// 발송 실패 코드(404/410)는 만료된 구독이므로 호출측에서 삭제한다.

import { ApplicationServerKeys, generatePushHTTPRequest, setWebCrypto } from 'webpush-webcrypto';

let serverKeys = null;

async function keys(env) {
  // Workers 런타임엔 crypto가 전역이라 setWebCrypto는 사실상 no-op이지만 안전하게.
  if (typeof crypto !== 'undefined') setWebCrypto(crypto);
  if (!serverKeys) {
    serverKeys = await ApplicationServerKeys.fromJSON({
      publicKey: env.VAPID_PUBLIC_KEY,
      privateKey: env.VAPID_PRIVATE_KEY,
    });
  }
  return serverKeys;
}

/**
 * 단일 구독에 알림 발송.
 * @returns { ok, status } — status 404/410이면 구독 만료(삭제 대상)
 */
export async function sendPush(subscription, payload, env) {
  const applicationServerKeys = await keys(env);
  const { headers, body, endpoint } = await generatePushHTTPRequest({
    applicationServerKeys,
    payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
    target: subscription,
    adminContact: env.VAPID_CONTACT || 'mailto:admin@example.com',
    ttl: 60 * 60 * 12, // 12시간
    urgency: 'normal',
  });
  const res = await fetch(endpoint, { method: 'POST', headers, body });
  return { ok: res.ok, status: res.status };
}
