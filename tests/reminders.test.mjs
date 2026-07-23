import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dueReminders } from '../src/lib/reminders.js';

const BASE = {
  enabled: true,
  study: true,
  streak: true,
  reg: true,
  remindTime: '20:00',
  lastNotified: {},
};
const META = { stageLabel: '실기', regStart: '2026-07-25', regEnd: '2026-07-28' };

test('비활성/미허용이면 아무것도 없음', () => {
  assert.equal(dueReminders({ ...BASE, enabled: false }, { today: '2026-07-22' }).length, 0);
});

test('원서접수 D-3', () => {
  const due = dueReminders(BASE, { examMeta: META, today: '2026-07-22', hour: 10, todayStudied: true });
  assert.ok(due.find((n) => n.id === 'reg-d3'));
});

test('원서접수 시작일 당일', () => {
  const due = dueReminders(BASE, { examMeta: META, today: '2026-07-25', hour: 9, todayStudied: true });
  assert.ok(due.find((n) => n.id === 'reg-start'));
});

test('원서접수 마감일 당일', () => {
  const due = dueReminders(BASE, { examMeta: META, today: '2026-07-28', hour: 9, todayStudied: true });
  assert.ok(due.find((n) => n.id === 'reg-end'));
});

test('스트릭 경고: 기준시각 이후 + 오늘 미완 + 스트릭>0', () => {
  const due = dueReminders(BASE, { today: '2026-07-22', hour: 21, todayStudied: false, streakCount: 5 });
  const n = due.find((x) => x.id === 'streak');
  assert.ok(n);
  assert.ok(n.title.includes('5일'));
});

test('스트릭 0이면 일반 공부 리마인더', () => {
  const due = dueReminders(BASE, { today: '2026-07-22', hour: 21, todayStudied: false, streakCount: 0 });
  assert.ok(due.find((x) => x.id === 'study'));
  assert.ok(!due.find((x) => x.id === 'streak'));
});

test('기준시각 전이면 시간기반 알림 없음', () => {
  const due = dueReminders(BASE, { today: '2026-07-22', hour: 15, todayStudied: false, streakCount: 5 });
  assert.ok(!due.find((x) => x.id === 'streak' || x.id === 'study'));
});

test('오늘 이미 공부했으면 시간기반 알림 없음', () => {
  const due = dueReminders(BASE, { today: '2026-07-22', hour: 22, todayStudied: true, streakCount: 5 });
  assert.equal(due.length, 0);
});

test('하루 1회 중복 방지(lastNotified)', () => {
  const prefs = { ...BASE, lastNotified: { streak: '2026-07-22' } };
  const due = dueReminders(prefs, { today: '2026-07-22', hour: 22, todayStudied: false, streakCount: 5 });
  assert.ok(!due.find((x) => x.id === 'streak'));
});

test('카테고리 토글 존중: reg=false면 원서접수 알림 없음', () => {
  const due = dueReminders({ ...BASE, reg: false }, { examMeta: META, today: '2026-07-25', hour: 9, todayStudied: true });
  assert.equal(due.length, 0);
});
