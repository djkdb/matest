// Cloudflare Worker — 웹푸시 구독 저장 + 크론 리마인더 발송.
//
// 엔드포인트(모두 JSON):
//   GET  /vapidPublicKey            → { publicKey }
//   POST /subscribe   { subscription, prefs, examMeta, tzOffsetMinutes, remindTime }
//   POST /unsubscribe { endpoint }
//   POST /heartbeat   { endpoint, lastStudyDate, streakCount }  // 공부 기록 시 클라이언트가 호출
//   POST /test        { endpoint }                              // 테스트 발송
//
// 크론(scheduled): 매시간 실행 → 각 구독의 로컬 시각/날짜 계산 후 도래한 알림 발송.

import { sendPush } from './push.js';
import {
  saveSubscription,
  deleteByEndpoint,
  updateByEndpoint,
  getByEndpoint,
  iterateSubscriptions,
} from './store.js';
import { dueServerReminders, localNow } from './reminders.js';

function cors(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, env, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(env) },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors(env) });

    try {
      if (request.method === 'GET' && url.pathname === '/vapidPublicKey') {
        return json({ publicKey: env.VAPID_PUBLIC_KEY || null }, env);
      }

      if (request.method === 'POST' && url.pathname === '/subscribe') {
        const body = await request.json();
        if (!body?.subscription?.endpoint) return json({ error: 'subscription 필요' }, env, 400);
        const record = {
          subscription: body.subscription,
          prefs: body.prefs || { study: true, streak: true, reg: true },
          examMeta: body.examMeta || null,
          tzOffsetMinutes: body.tzOffsetMinutes ?? 0,
          remindTime: body.remindTime || '20:00',
          lastStudyDate: body.lastStudyDate || null,
          streakCount: body.streakCount || 0,
          lastSent: {},
        };
        await saveSubscription(env, record);
        return json({ ok: true }, env);
      }

      if (request.method === 'POST' && url.pathname === '/unsubscribe') {
        const { endpoint } = await request.json();
        if (endpoint) await deleteByEndpoint(env, endpoint);
        return json({ ok: true }, env);
      }

      if (request.method === 'POST' && url.pathname === '/heartbeat') {
        const { endpoint, lastStudyDate, streakCount } = await request.json();
        const updated = await updateByEndpoint(env, endpoint, {
          ...(lastStudyDate ? { lastStudyDate } : {}),
          ...(streakCount != null ? { streakCount } : {}),
        });
        return json({ ok: !!updated }, env);
      }

      if (request.method === 'POST' && url.pathname === '/test') {
        const { endpoint } = await request.json();
        const rec = await getByEndpoint(env, endpoint);
        if (!rec) return json({ error: '구독을 찾을 수 없음' }, env, 404);
        const r = await sendPush(rec.subscription, { title: '테스트 알림', body: '서버 푸시가 정상 동작해요', url: '/' }, env);
        if ((r.status === 404 || r.status === 410) && endpoint) await deleteByEndpoint(env, endpoint);
        return json({ ok: r.ok, status: r.status }, env);
      }

      return json({ error: 'not found' }, env, 404);
    } catch (e) {
      return json({ error: String(e && e.message ? e.message : e) }, env, 500);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runReminders(env, Date.now()));
  },
};

export async function runReminders(env, nowMs) {
  let sentCount = 0;
  for await (const { record } of iterateSubscriptions(env)) {
    const { today, hour } = localNow(nowMs, record.tzOffsetMinutes || 0);
    const due = dueServerReminders(record, { today, hour });
    if (!due.length) continue;

    const lastSent = { ...(record.lastSent || {}) };
    let expired = false;
    for (const n of due) {
      const r = await sendPush(record.subscription, { title: n.title, body: n.body, url: '/', tag: n.id }, env);
      if (r.status === 404 || r.status === 410) {
        expired = true;
        break;
      }
      lastSent[n.id] = today;
      sentCount++;
    }
    if (expired) {
      await deleteByEndpoint(env, record.subscription.endpoint);
    } else {
      await updateByEndpoint(env, record.subscription.endpoint, { lastSent });
    }
  }
  return sentCount;
}
