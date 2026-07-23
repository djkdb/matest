// 구독 저장소 (Cloudflare KV). 키: sub:<endpoint 해시>.
// 소규모엔 KV로 충분. 규모가 커지면 D1/외부 DB로 교체(같은 인터페이스 유지).

const PREFIX = 'sub:';

async function hashEndpoint(endpoint) {
  const data = new TextEncoder().encode(endpoint);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function keyFor(endpoint) {
  return PREFIX + (await hashEndpoint(endpoint));
}

export async function saveSubscription(env, record) {
  const key = await keyFor(record.subscription.endpoint);
  await env.SUBSCRIPTIONS.put(key, JSON.stringify(record));
  return key;
}

export async function getByEndpoint(env, endpoint) {
  const key = await keyFor(endpoint);
  const raw = await env.SUBSCRIPTIONS.get(key);
  return raw ? JSON.parse(raw) : null;
}

export async function deleteByEndpoint(env, endpoint) {
  await env.SUBSCRIPTIONS.delete(await keyFor(endpoint));
}

export async function updateByEndpoint(env, endpoint, patch) {
  const rec = await getByEndpoint(env, endpoint);
  if (!rec) return null;
  const next = { ...rec, ...patch };
  await env.SUBSCRIPTIONS.put(await keyFor(endpoint), JSON.stringify(next));
  return next;
}

/** 모든 구독 순회 (크론용). KV list는 페이지네이션. */
export async function* iterateSubscriptions(env) {
  let cursor;
  do {
    const res = await env.SUBSCRIPTIONS.list({ prefix: PREFIX, cursor });
    for (const k of res.keys) {
      const raw = await env.SUBSCRIPTIONS.get(k.name);
      if (raw) yield { key: k.name, record: JSON.parse(raw) };
    }
    cursor = res.list_complete ? undefined : res.cursor;
  } while (cursor);
}
