// 웹 알림/푸시 클라이언트 유틸.
//
// - showNotification: 로컬 알림 (서비스워커 등록이 있으면 그걸로, 없으면 Notification)
//   → 백엔드 없이도 "테스트 알림", "앱 열 때 리마인더"가 즉시 동작.
// - subscribeToPush: VAPID 공개키로 푸시 구독 생성 (서버 연동 시 이 구독을
//   백엔드에 저장하고 web-push로 발송). 키가 없으면 안전하게 null 반환.

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'Notification' in window &&
    'PushManager' in window
  );
}

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function permissionState() {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

export async function requestPermission() {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

const DEFAULTS = {
  icon: '/icons/icon-192.png',
  badge: '/icons/icon-192.png',
};

/** 로컬 알림 표시. 성공 시 true. */
export async function showNotification(title, options = {}) {
  if (permissionState() !== 'granted') return false;
  const opts = { ...DEFAULTS, ...options };
  try {
    const reg = navigator.serviceWorker && (await navigator.serviceWorker.getRegistration());
    if (reg && reg.showNotification) {
      await reg.showNotification(title, opts);
      return true;
    }
    // 서비스워커가 없으면(개발 등) 폴백
    new Notification(title, opts);
    return true;
  } catch {
    return false;
  }
}

/** 'base64url' VAPID 공개키 → Uint8Array (PushManager.subscribe 요구 형식) */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/**
 * 푸시 구독 생성 (서버 발송용). VAPID 공개키는 VITE_VAPID_PUBLIC_KEY 로 주입.
 * 키가 없거나 미지원이면 null (로컬 알림 기능은 그대로 동작).
 * @returns PushSubscription | null
 */
export async function subscribeToPush() {
  const key =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_VAPID_PUBLIC_KEY) ||
    '';
  if (!pushSupported() || !key) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;
    return await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
    // 실서비스: 여기서 fetch('/api/push/subscribe', { body: JSON.stringify(sub) })
  } catch {
    return null;
  }
}
