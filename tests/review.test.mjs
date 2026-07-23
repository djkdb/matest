import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReviews,
  isReviewable,
  stripTag,
  mergeReviews,
  removeReviewsForSource,
  reviewsByDate,
  dueReviewCount,
} from '../src/lib/review.js';

const CONCEPT = { id: 'concept-r1-0', phase: 'concept', title: '[개념] 소프트웨어 설계' };
const PAST = { id: 'past-r1-1', phase: 'past', title: '[기출] 최신 1회차' };
const MOCK = { id: 'mock-1', phase: 'mock', title: '[실전] 모의고사 1회' };

test('isReviewable: 개념/기출만', () => {
  assert.equal(isReviewable(CONCEPT), true);
  assert.equal(isReviewable(PAST), true);
  assert.equal(isReviewable(MOCK), false);
  assert.equal(isReviewable(null), false);
});

test('stripTag', () => {
  assert.equal(stripTag('[개념] 소프트웨어 설계'), '소프트웨어 설계');
  assert.equal(stripTag('[기출 2회독] 최신 3회차'), '최신 3회차');
  assert.equal(stripTag('태그없음'), '태그없음');
});

test('buildReviews: 1·3·7·16일 뒤, 시험 전날까지', () => {
  // 완료 07-01, 시험 07-20 → 07-02, 07-04, 07-08, 07-17 (모두 <20)
  const rs = buildReviews(CONCEPT, '2026-07-01', '2026-07-20');
  assert.deepEqual(rs.map((r) => r.date), ['2026-07-02', '2026-07-04', '2026-07-08', '2026-07-17']);
  assert.deepEqual(rs.map((r) => r.interval), [1, 3, 7, 16]);
  assert.equal(rs[0].sourceTitle, '소프트웨어 설계');
  assert.equal(rs[0].id, 'rev-concept-r1-0-1');
});

test('buildReviews: 시험 당일·이후 간격은 제외', () => {
  // 완료 07-01, 시험 07-09 → 16일뒤(07-17)·7일뒤(07-08 ok)·... 07-08<09 ok, 07-17 제외, 07-04 ok, 07-02 ok
  const rs = buildReviews(CONCEPT, '2026-07-01', '2026-07-09');
  assert.deepEqual(rs.map((r) => r.date), ['2026-07-02', '2026-07-04', '2026-07-08']);
});

test('buildReviews: 비대상 유닛은 빈 배열', () => {
  assert.deepEqual(buildReviews(MOCK, '2026-07-01', '2026-07-20'), []);
});

test('mergeReviews: id 중복 제거', () => {
  const a = buildReviews(CONCEPT, '2026-07-01', '2026-07-20');
  const merged = mergeReviews(a, a); // 같은 것 다시
  assert.equal(merged.length, a.length);
});

test('removeReviewsForSource', () => {
  const a = buildReviews(CONCEPT, '2026-07-01', '2026-07-20');
  const b = buildReviews(PAST, '2026-07-01', '2026-07-20');
  const all = mergeReviews(a, b);
  const left = removeReviewsForSource(all, CONCEPT.id);
  assert.ok(left.every((r) => r.sourceUnitId === PAST.id));
  assert.equal(left.length, b.length);
});

test('reviewsByDate: 날짜별 그룹 + 간격 정렬', () => {
  const rs = [
    { id: 'x', date: '2026-07-05', interval: 7 },
    { id: 'y', date: '2026-07-05', interval: 1 },
    { id: 'z', date: '2026-07-06', interval: 3 },
  ];
  const map = reviewsByDate(rs);
  assert.deepEqual(map['2026-07-05'].map((r) => r.interval), [1, 7]);
  assert.equal(map['2026-07-06'].length, 1);
});

test('dueReviewCount: 오늘까지 도래 + 미완료', () => {
  const rs = [
    { id: 'a', date: '2026-07-20' },
    { id: 'b', date: '2026-07-22' },
    { id: 'c', date: '2026-07-25' },
  ];
  assert.equal(dueReviewCount(rs, [], '2026-07-22'), 2); // a,b 도래
  assert.equal(dueReviewCount(rs, ['a'], '2026-07-22'), 1); // a 완료 → b만
});
