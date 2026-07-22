// 스페이스드 리피티션(간격 반복) 복습 스케줄.
//
// 개념/기출 유닛을 '완료'하면 완료일 기준 1·3·7·16일 뒤에 복습 아이템을 만든다.
// (분산 연습 + 인출 연습 = 학습효과 최상위, 딥리서치 반영)
// 계획(planner)과 분리된 별도 구조라 밀린 일정 재분배와 무관하게 완료일에 고정된다.
//
// 복습 아이템: { id, sourceUnitId, sourceTitle, interval, date, minutes }

import { addDays, diffDays } from './date.js';

export const REVIEW_INTERVALS = [1, 3, 7, 16];
export const REVIEW_PHASES = ['concept', 'past']; // 복습 대상 단계(모의고사·총정리 제외)
export const REVIEW_COLOR = '#12b886';
export const REVIEW_MINUTES = 20;

export function isReviewable(unit) {
  return !!unit && REVIEW_PHASES.includes(unit.phase);
}

/** "[개념] 소프트웨어 설계" → "소프트웨어 설계" */
export function stripTag(title) {
  return String(title ?? '').replace(/^\[[^\]]*\]\s*/, '');
}

/** 완료된 유닛 → 복습 아이템 배열 (완료일 기준 간격, 시험 전날까지만) */
export function buildReviews(unit, completedKey, examKey, intervals = REVIEW_INTERVALS) {
  if (!isReviewable(unit)) return [];
  const out = [];
  for (const iv of intervals) {
    const date = addDays(completedKey, iv);
    if (diffDays(date, examKey) < 1) continue; // 시험 당일·이후 제외
    out.push({
      id: `rev-${unit.id}-${iv}`,
      sourceUnitId: unit.id,
      sourceTitle: stripTag(unit.title),
      interval: iv,
      date,
      minutes: REVIEW_MINUTES,
    });
  }
  return out;
}

/** id 기준 병합(중복 제거) */
export function mergeReviews(existing, incoming) {
  const map = new Map(existing.map((r) => [r.id, r]));
  for (const r of incoming) map.set(r.id, r);
  return [...map.values()];
}

export function removeReviewsForSource(existing, sourceUnitId) {
  return existing.filter((r) => r.sourceUnitId !== sourceUnitId);
}

/** { 'YYYY-MM-DD': [review...] } (날짜 내 간격 순 정렬) */
export function reviewsByDate(reviews) {
  const map = {};
  for (const r of reviews) (map[r.date] ??= []).push(r);
  for (const k of Object.keys(map)) map[k].sort((a, b) => a.interval - b.interval);
  return map;
}

/** 오늘까지 도래했고 아직 안 한 복습 수 (지난 것 포함) */
export function dueReviewCount(reviews, reviewDone, todayKey) {
  const done = new Set(reviewDone);
  return reviews.filter((r) => r.date <= todayKey && !done.has(r.id)).length;
}
