// 날짜는 전부 'YYYY-MM-DD' 문자열로 다루고, 로컬 타임존 기준으로 계산한다.

export function todayKey() {
  return toKey(new Date());
}

export function toKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/** b - a 일수 (같은 날이면 0) */
export function diffDays(a, b) {
  const MS = 24 * 60 * 60 * 1000;
  return Math.round((fromKey(b) - fromKey(a)) / MS);
}

/** 0=일요일 … 6=토요일 */
export function dayOfWeek(key) {
  return fromKey(key).getDay();
}

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function formatKorean(key) {
  const d = fromKey(key);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY_LABELS[d.getDay()]})`;
}

export function formatShort(key) {
  const d = fromKey(key);
  return `${d.getMonth() + 1}/${d.getDate()} (${WEEKDAY_LABELS[d.getDay()]})`;
}

export function formatMinutes(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}
