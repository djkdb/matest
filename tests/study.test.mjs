import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeStreak,
  weeklyStats,
  totalSeconds,
  daySeconds,
  formatClock,
  formatDuration,
  STREAK_MIN_SECONDS,
} from '../src/lib/study.js';

test('daySeconds / totalSeconds', () => {
  const log = { '2026-07-20': 600, '2026-07-21': 1200 };
  assert.equal(daySeconds(log, '2026-07-20'), 600);
  assert.equal(daySeconds(log, '2026-07-19'), 0);
  assert.equal(daySeconds(null, 'x'), 0);
  assert.equal(totalSeconds(log), 1800);
});

test('computeStreak: 오늘 포함 연속', () => {
  const log = { '2026-07-20': 600, '2026-07-21': 1200, '2026-07-22': 300 };
  const s = computeStreak(log, '2026-07-22');
  assert.equal(s.count, 3);
  assert.equal(s.todayStudied, true);
});

test('computeStreak: 중간에 빠진 날이면 끊김', () => {
  const log = { '2026-07-19': 600, '2026-07-21': 600, '2026-07-22': 600 };
  const s = computeStreak(log, '2026-07-22');
  assert.equal(s.count, 2); // 22, 21 (20 없음)
});

test('computeStreak: 오늘 아직 공부 안 함 → 어제까지로 계산(유예)', () => {
  const log = { '2026-07-20': 600, '2026-07-21': 600 };
  const s = computeStreak(log, '2026-07-22');
  assert.equal(s.todayStudied, false);
  assert.equal(s.count, 2); // 21, 20 — 오늘 하면 이어짐
});

test('computeStreak: 어제도 안 했으면 0', () => {
  const log = { '2026-07-20': 600 };
  const s = computeStreak(log, '2026-07-22');
  assert.equal(s.count, 0);
});

test('computeStreak: 인정 시간 미만은 미학습 취급', () => {
  const log = { '2026-07-22': STREAK_MIN_SECONDS - 1 };
  assert.equal(computeStreak(log, '2026-07-22').count, 0);
  const log2 = { '2026-07-22': STREAK_MIN_SECONDS };
  assert.equal(computeStreak(log2, '2026-07-22').count, 1);
});

test('weeklyStats: 7일, 과거→오늘, 오늘 표시', () => {
  const log = { '2026-07-22': 600, '2026-07-18': 1200 };
  const w = weeklyStats(log, '2026-07-22');
  assert.equal(w.length, 7);
  assert.equal(w[0].date, '2026-07-16');
  assert.equal(w[6].date, '2026-07-22');
  assert.equal(w[6].isToday, true);
  assert.equal(w[6].seconds, 600);
  // index: 6=07-22, 5=07-21, 4=07-20, 3=07-19, 2=07-18
  assert.equal(w[2].date, '2026-07-18');
  assert.equal(w[2].seconds, 1200);
  assert.equal(w[4].seconds, 0); // 07-20 은 기록 없음
});

test('formatClock', () => {
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(65), '1:05');
  assert.equal(formatClock(3661), '1:01:01');
});

test('formatDuration', () => {
  assert.equal(formatDuration(0), '0분');
  assert.equal(formatDuration(8), '8초'); // 짧은 공부도 안 사라짐
  assert.equal(formatDuration(90), '1분 30초');
  assert.equal(formatDuration(600), '10분');
  assert.equal(formatDuration(3600), '1시간');
  assert.equal(formatDuration(4800), '1시간 20분');
});
