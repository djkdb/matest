// 공부 시간 기록 · 스트릭(연속 학습일) 계산.
//
// studyLog: { 'YYYY-MM-DD': seconds } — 하루에 누적한 공부 시간(초).
// 순수 함수라 단위 테스트가 쉽다. 타이머의 실시간 틱은 컴포넌트가 담당하고,
// 정지 시점에 이 로그에 초를 누적한다.

import { addDays, fromKey, WEEKDAY_LABELS } from './date.js';

/** 하루라도 '공부했다'고 인정하는 최소 시간(초) */
export const STREAK_MIN_SECONDS = 60;

export function daySeconds(log, key) {
  return log?.[key] ?? 0;
}

export function totalSeconds(log) {
  return Object.values(log ?? {}).reduce((a, b) => a + b, 0);
}

/**
 * 연속 학습일(스트릭).
 * - 오늘 공부했으면 오늘부터 거슬러 연속 카운트.
 * - 오늘 아직 안 했으면 어제부터 카운트(오늘은 '이어갈 수 있음' 상태).
 * @returns { count, todayStudied }
 */
export function computeStreak(log, todayKey, minSeconds = STREAK_MIN_SECONDS) {
  const studied = (k) => daySeconds(log, k) >= minSeconds;
  const todayStudied = studied(todayKey);
  let cursor = todayStudied ? todayKey : addDays(todayKey, -1);
  let count = 0;
  while (studied(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return { count, todayStudied };
}

/**
 * 최근 7일 통계 (막대그래프용). 과거→오늘 순서.
 * @returns [{ date, seconds, weekday, isToday }]
 */
export function weeklyStats(log, todayKey) {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(todayKey, -i);
    out.push({
      date,
      seconds: daySeconds(log, date),
      weekday: WEEKDAY_LABELS[fromKey(date).getDay()],
      isToday: i === 0,
    });
  }
  return out;
}

/** 초 → "1:23:45" 또는 "12:34" (타이머 표시용) */
export function formatClock(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** 초 → "1시간 20분" / "45분" / "0분" (요약 표시용) */
export function formatDuration(totalSec) {
  const min = Math.round(Math.max(0, totalSec) / 60);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}
