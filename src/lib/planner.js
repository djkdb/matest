// 공부 계획 생성 엔진.
//
// 흐름:
//  1. 선택한 꿀팁들의 전략(phaseWeights)을 평균 내 최종 단계 비중을 만든다.
//  2. 시험 과목/기출 정보를 바탕으로 "학습 유닛" 풀을 만든다.
//     (개념: 과목별 학습, 기출: 연도별 회차 회독, 모의고사: 실전 리허설, 총정리: 오답·요약)
//  3. 오늘~시험 전날 중 휴식 요일을 뺀 학습 가능일에, 하루 공부 시간에 맞춰
//     유닛을 단계 순서대로 배분한다.
//  4. 시험 직전은 자동으로 총정리(wrap) 유닛이 오도록 단계 순서를 보장한다.
//
// 유닛에는 안정적인 id가 있어 완료 체크가 계획 재생성(밀린 일정 재분배) 후에도 유지된다.

import { addDays, dayOfWeek, diffDays } from './date.js';

export const PHASES = [
  { id: 'concept', label: '개념 학습', color: '#6366f1' },
  { id: 'past', label: '기출 풀이', color: '#f59e0b' },
  { id: 'mock', label: '실전 모의고사', color: '#ec4899' },
  { id: 'wrap', label: '오답 · 총정리', color: '#10b981' },
];

export const PHASE_MAP = Object.fromEntries(PHASES.map((p) => [p.id, p]));

const DEFAULT_WEIGHTS = { concept: 0.3, past: 0.4, mock: 0.2, wrap: 0.1 };

/** 선택된 팁들의 전략 비중을 평균 낸다. 팁이 없으면 기본 비중. */
export function mergeStrategies(tips) {
  const withStrategy = tips.filter((t) => t?.strategy?.phaseWeights);
  if (withStrategy.length === 0) {
    return { weights: { ...DEFAULT_WEIGHTS }, recommendedTotalHours: null, names: [] };
  }
  const sum = { concept: 0, past: 0, mock: 0, wrap: 0 };
  let hours = 0;
  for (const t of withStrategy) {
    for (const k of Object.keys(sum)) sum[k] += t.strategy.phaseWeights[k] ?? 0;
    hours += t.strategy.recommendedTotalHours ?? 0;
  }
  const n = withStrategy.length;
  const weights = {};
  let total = 0;
  for (const k of Object.keys(sum)) total += sum[k];
  for (const k of Object.keys(sum)) weights[k] = total > 0 ? sum[k] / total : DEFAULT_WEIGHTS[k];
  return {
    weights,
    recommendedTotalHours: Math.round(hours / n),
    names: withStrategy.map((t) => t.strategy.name),
  };
}

/** 학습 가능일 목록: startKey ~ examKey 전날, 휴식 요일 제외 */
export function studyDays(startKey, examKey, restDays) {
  const days = [];
  const n = diffDays(startKey, examKey);
  for (let i = 0; i < n; i++) {
    const key = addDays(startKey, i);
    if (!restDays.includes(dayOfWeek(key))) days.push(key);
  }
  return days;
}

/**
 * 시험 정보 + 단계 비중 + 총 가용 시간(분)으로 학습 유닛 풀을 만든다.
 * 유닛 하나는 하루 공부 시간(dailyMinutes)을 넘지 않는다.
 * 반환: [{ id, phase, title, minutes }] — 단계 순서대로 정렬됨.
 */
export function buildUnits(exam, weights, totalMinutes, dailyMinutes = 180) {
  const cap = Math.max(30, Math.min(180, dailyMinutes));
  const clamp = (m) => clampMinutes(m, cap);
  const units = [];
  const budget = {
    concept: Math.round(totalMinutes * weights.concept),
    past: Math.round(totalMinutes * weights.past),
    mock: Math.round(totalMinutes * weights.mock),
    wrap: Math.round(totalMinutes * weights.wrap),
  };

  // 개념: 과목별 학습을 회독 단위로. 예산에 맞춰 1~2회독 + 유닛당 시간 조정
  {
    const subjects = exam.subjects;
    const oneRound = subjects.length;
    let rounds = 1;
    if (budget.concept >= oneRound * 120 * 2) rounds = 2;
    const totalUnits = oneRound * rounds;
    const per = clamp(budget.concept / Math.max(totalUnits, 1));
    for (let r = 1; r <= rounds; r++) {
      subjects.forEach((s, i) => {
        units.push({
          id: `concept-r${r}-${i}`,
          phase: 'concept',
          title: rounds > 1 ? `[개념 ${r}회독] ${s}` : `[개념] ${s}`,
          minutes: per,
        });
      });
    }
  }

  // 기출: 최근 회차부터. 예산에 맞춰 회독 수 결정 (최대 3회독)
  {
    const roundsAvail = exam.pastExamRounds;
    const perExam = 90; // 기출 1회분 풀이+채점 기준 시간
    let repeat = Math.max(1, Math.min(3, Math.round(budget.past / (roundsAvail * perExam))));
    const totalUnits = roundsAvail * repeat;
    const per = clamp(budget.past / Math.max(totalUnits, 1));
    for (let r = 1; r <= repeat; r++) {
      for (let i = 1; i <= roundsAvail; i++) {
        units.push({
          id: `past-r${r}-${i}`,
          phase: 'past',
          title: repeat > 1 ? `[기출 ${r}회독] 최신 ${i}회차` : `[기출] 최신 ${i}회차`,
          minutes: per,
        });
      }
    }
  }

  // 모의고사: 실전 리허설
  {
    const count = Math.max(1, Math.min(exam.mockRounds, Math.round(budget.mock / 120)));
    const per = clamp(budget.mock / count);
    for (let i = 1; i <= count; i++) {
      units.push({
        id: `mock-${i}`,
        phase: 'mock',
        title: `[실전] 모의고사 ${i}회 (시간 재고 풀기)`,
        minutes: per,
      });
    }
  }

  // 총정리: 오답 정리 + 핵심 요약 (항상 마지막)
  {
    const count = Math.max(2, Math.min(4, Math.round(budget.wrap / 90)));
    const per = clamp(budget.wrap / count);
    const titles = ['오답노트 정리', '핵심 개념 최종 요약', '빈출 포인트 암기', '시험 전 마지막 점검'];
    for (let i = 0; i < count; i++) {
      units.push({ id: `wrap-${i}`, phase: 'wrap', title: `[총정리] ${titles[i]}`, minutes: per });
    }
  }

  const order = { concept: 0, past: 1, mock: 2, wrap: 3 };
  units.sort((a, b) => order[a.phase] - order[b.phase]);
  return units;
}

function clampMinutes(m, cap = 180) {
  // 유닛당 30분~cap분, 15분 단위 내림 (cap을 넘지 않도록)
  const clamped = Math.max(30, Math.min(cap, m));
  return Math.max(30, Math.floor(clamped / 15) * 15);
}

/**
 * 유닛을 학습 가능일에 순서대로 배분한다.
 * 반환: { days: [{ date, unitIds, totalMinutes }], unassigned: [unitId] }
 */
export function assignUnits(units, dayKeys, dailyMinutes) {
  const days = dayKeys.map((date) => ({ date, unitIds: [], totalMinutes: 0 }));
  const OVERFLOW = 30; // 하루 허용 초과분
  let di = 0;
  const unassigned = [];

  for (const unit of units) {
    while (di < days.length && days[di].totalMinutes + unit.minutes > dailyMinutes + OVERFLOW) {
      // 오늘 칸이 가득 참 → 다음 날로. 단, 빈 날에 유닛이 하루치보다 크면 그냥 넣는다.
      if (days[di].unitIds.length === 0) break;
      di++;
    }
    if (di >= days.length) {
      unassigned.push(unit.id);
      continue;
    }
    days[di].unitIds.push(unit.id);
    days[di].totalMinutes += unit.minutes;
    if (days[di].totalMinutes >= dailyMinutes) di++;
  }
  return { days, unassigned };
}

/**
 * 최종 계획 생성.
 * @returns { units, days, unassigned, weights, totalMinutes, studyDayCount }
 */
export function generatePlan({ exam, tips, startKey, examKey, dailyMinutes, restDays }) {
  const { weights } = mergeStrategies(tips);
  const dayKeys = studyDays(startKey, examKey, restDays);
  const totalMinutes = dayKeys.length * dailyMinutes;
  const units = buildUnits(exam, weights, totalMinutes, dailyMinutes);
  const { days, unassigned } = assignUnits(units, dayKeys, dailyMinutes);
  return {
    units,
    days,
    unassigned,
    weights,
    totalMinutes,
    studyDayCount: dayKeys.length,
  };
}

/**
 * 밀린 일정 재분배: 완료되지 않은 유닛만 모아 오늘부터 다시 배분한다.
 * 완료 체크(completed: Set/배열 of unitId)는 유닛 id 기준이라 그대로 유지된다.
 */
export function replanFromToday(plan, { todayKey, examKey, dailyMinutes, restDays, completed }) {
  const done = new Set(completed);
  const remainingUnits = plan.units.filter((u) => !done.has(u.id));
  const dayKeys = studyDays(todayKey, examKey, restDays);
  const { days, unassigned } = assignUnits(remainingUnits, dayKeys, dailyMinutes);
  // 지난 날들 중 완료 유닛이 있던 날은 기록용으로 유지
  const pastDays = plan.days
    .filter((d) => d.date < todayKey)
    .map((d) => ({
      ...d,
      unitIds: d.unitIds.filter((id) => done.has(id)),
    }))
    .filter((d) => d.unitIds.length > 0);
  return {
    ...plan,
    days: [...pastDays, ...days],
    unassigned,
  };
}
