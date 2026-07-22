import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dueServerReminders, localNow, diffDays } from '../src/reminders.js';

const REC = {
  subscription: { endpoint: 'https://x/y', keys: {} },
  prefs: { study: true, streak: true, reg: true },
  examMeta: { stageLabel: '실기', regStart: '2026-07-25', regEnd: '2026-07-28' },
  tzOffsetMinutes: -540, // KST
  remindTime: '20:00',
  lastStudyDate: null,
  streakCount: 4,
  lastSent: {},
};

test('diffDays', () => {
  assert.equal(diffDays('2026-07-22', '2026-07-25'), 3);
  assert.equal(diffDays('2026-07-28', '2026-07-28'), 0);
});

test('localNow: KST 변환', () => {
  // 2026-07-22T13:00Z + 9h = 22일 22시(KST)
  const ms = Date.parse('2026-07-22T13:00:00Z');
  assert.deepEqual(localNow(ms, -540), { today: '2026-07-22', hour: 22 });
  // 2026-07-22T16:00Z + 9h = 23일 01시
  assert.deepEqual(localNow(Date.parse('2026-07-22T16:00:00Z'), -540), { today: '2026-07-23', hour: 1 });
});

test('원서접수 D-3', () => {
  const due = dueServerReminders({ ...REC, lastStudyDate: '2026-07-22' }, { today: '2026-07-22', hour: 10 });
  assert.ok(due.find((n) => n.id === 'reg-d3'));
});

test('마감일 당일', () => {
  const due = dueServerReminders({ ...REC, lastStudyDate: '2026-07-28' }, { today: '2026-07-28', hour: 9 });
  assert.ok(due.find((n) => n.id === 'reg-end'));
});

test('스트릭 경고: 기준시각 이후 + 오늘 미학습', () => {
  const due = dueServerReminders(REC, { today: '2026-07-22', hour: 21 });
  const n = due.find((x) => x.id === 'streak');
  assert.ok(n && n.title.includes('4일'));
});

test('오늘 이미 학습(lastStudyDate=today)이면 시간기반 없음', () => {
  const due = dueServerReminders({ ...REC, lastStudyDate: '2026-07-22' }, { today: '2026-07-22', hour: 22 });
  assert.ok(!due.find((x) => x.id === 'streak' || x.id === 'study'));
});

test('스트릭 0이면 일반 공부 리마인더', () => {
  const due = dueServerReminders({ ...REC, streakCount: 0 }, { today: '2026-07-22', hour: 21 });
  assert.ok(due.find((x) => x.id === 'study'));
});

test('중복 방지(lastSent)', () => {
  const rec = { ...REC, streakCount: 4, lastSent: { streak: '2026-07-22' } };
  const due = dueServerReminders(rec, { today: '2026-07-22', hour: 22 });
  assert.ok(!due.find((x) => x.id === 'streak'));
});

test('reg 토글 off면 원서접수 알림 없음', () => {
  const rec = { ...REC, prefs: { ...REC.prefs, reg: false }, lastStudyDate: '2026-07-25' };
  const due = dueServerReminders(rec, { today: '2026-07-25', hour: 9 });
  assert.equal(due.length, 0);
});
