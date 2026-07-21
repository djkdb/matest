import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mergeStrategies,
  studyDays,
  buildUnits,
  assignUnits,
  generatePlan,
  replanFromToday,
} from '../src/lib/planner.js';
import { addDays, diffDays, dayOfWeek } from '../src/lib/date.js';

const EXAM = {
  id: 'test',
  name: '테스트 시험',
  subjects: ['과목A', '과목B', '과목C'],
  pastExamRounds: 4,
  mockRounds: 2,
};

const TIP_A = {
  strategy: {
    name: 'A',
    phaseWeights: { concept: 0.4, past: 0.4, mock: 0.1, wrap: 0.1 },
    recommendedTotalHours: 40,
  },
};
const TIP_B = {
  strategy: {
    name: 'B',
    phaseWeights: { concept: 0.2, past: 0.6, mock: 0.1, wrap: 0.1 },
    recommendedTotalHours: 60,
  },
};

test('mergeStrategies: 팁 없으면 기본 비중, 합은 1', () => {
  const { weights } = mergeStrategies([]);
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
});

test('mergeStrategies: 두 전략 평균', () => {
  const { weights, recommendedTotalHours, names } = mergeStrategies([TIP_A, TIP_B]);
  assert.ok(Math.abs(weights.concept - 0.3) < 1e-9);
  assert.ok(Math.abs(weights.past - 0.5) < 1e-9);
  assert.equal(recommendedTotalHours, 50);
  assert.deepEqual(names, ['A', 'B']);
});

test('studyDays: 시험 전날까지, 휴식 요일 제외', () => {
  const start = '2026-07-21';
  const exam = '2026-07-28';
  const all = studyDays(start, exam, []);
  assert.equal(all.length, 7); // 21~27
  assert.equal(all[0], '2026-07-21');
  assert.equal(all.at(-1), '2026-07-27');

  const noSunday = studyDays(start, exam, [0]);
  assert.ok(noSunday.every((d) => dayOfWeek(d) !== 0));
  assert.equal(noSunday.length, 6);
});

test('buildUnits: 단계 순서 보장 + 예산 반영', () => {
  const weights = { concept: 0.3, past: 0.4, mock: 0.2, wrap: 0.1 };
  const units = buildUnits(EXAM, weights, 30 * 60); // 30시간
  const order = { concept: 0, past: 1, mock: 2, wrap: 3 };
  for (let i = 1; i < units.length; i++) {
    assert.ok(order[units[i].phase] >= order[units[i - 1].phase], '단계 순서가 유지되어야 함');
  }
  assert.ok(units.some((u) => u.phase === 'concept'));
  assert.ok(units.some((u) => u.phase === 'past'));
  assert.ok(units.some((u) => u.phase === 'mock'));
  assert.ok(units.some((u) => u.phase === 'wrap'));
  // 유닛 시간은 30~180분 범위
  assert.ok(units.every((u) => u.minutes >= 30 && u.minutes <= 180));
});

test('assignUnits: 하루 시간 한도 안에서 배분', () => {
  const units = [
    { id: 'u1', phase: 'concept', title: 'a', minutes: 60 },
    { id: 'u2', phase: 'concept', title: 'b', minutes: 60 },
    { id: 'u3', phase: 'past', title: 'c', minutes: 60 },
  ];
  const { days, unassigned } = assignUnits(units, ['2026-07-21', '2026-07-22'], 120);
  assert.equal(unassigned.length, 0);
  assert.deepEqual(days[0].unitIds, ['u1', 'u2']);
  assert.deepEqual(days[1].unitIds, ['u3']);
});

test('assignUnits: 시간이 모자라면 unassigned로', () => {
  const units = Array.from({ length: 10 }, (_, i) => ({
    id: `u${i}`,
    phase: 'past',
    title: `t${i}`,
    minutes: 120,
  }));
  const { unassigned } = assignUnits(units, ['2026-07-21'], 120);
  assert.ok(unassigned.length > 0);
});

test('generatePlan: 전체 흐름 — 유닛이 전부 날짜에 배정됨', () => {
  const start = '2026-07-21';
  const examKey = addDays(start, 28);
  const plan = generatePlan({
    exam: EXAM,
    tips: [TIP_A],
    startKey: start,
    examKey,
    dailyMinutes: 120,
    restDays: [0],
  });
  assert.ok(plan.days.length > 0);
  assert.ok(plan.days.every((d) => diffDays(d.date, examKey) >= 1), '시험 전날까지만 배정');
  const assigned = plan.days.flatMap((d) => d.unitIds);
  assert.equal(assigned.length + plan.unassigned.length, plan.units.length);
  // 배정 시간이 하루 한도(+30분 오버플로) 이내
  assert.ok(plan.days.every((d) => d.totalMinutes <= 150));
});

test('replanFromToday: 완료 유닛 제외하고 오늘부터 재배분', () => {
  const start = '2026-07-01';
  const examKey = '2026-07-29';
  const plan = generatePlan({
    exam: EXAM,
    tips: [],
    startKey: start,
    examKey,
    dailyMinutes: 120,
    restDays: [],
  });
  const firstDay = plan.days[0];
  const completed = firstDay.unitIds.slice(0, 1);
  const today = '2026-07-10';
  const replanned = replanFromToday(plan, {
    todayKey: today,
    examKey,
    dailyMinutes: 120,
    restDays: [],
    completed,
  });
  const futureIds = replanned.days.filter((d) => d.date >= today).flatMap((d) => d.unitIds);
  assert.ok(!futureIds.includes(completed[0]), '완료 유닛은 다시 배정되지 않음');
  const pastDays = replanned.days.filter((d) => d.date < today);
  assert.ok(
    pastDays.every((d) => d.unitIds.every((id) => completed.includes(id))),
    '과거 날짜에는 완료 기록만 남음'
  );
  const allIds = new Set(replanned.days.flatMap((d) => d.unitIds));
  for (const u of plan.units) {
    assert.ok(allIds.has(u.id) || replanned.unassigned.includes(u.id), `${u.id} 유실되면 안 됨`);
  }
});
