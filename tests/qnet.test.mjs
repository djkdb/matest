import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ymdToKey,
  extractItems,
  itemToSession,
  sessionsFromResponse,
} from '../src/lib/qnetService.js';
import { regStatus, flattenStages, toExamMeta, scheduleMarks, nextActionReminder } from '../src/lib/schedule.js';

// ── 큐넷 응답 파싱 ──

test('ymdToKey: YYYYMMDD → YYYY-MM-DD, 빈값/이상값은 null', () => {
  assert.equal(ymdToKey('20260809'), '2026-08-09');
  assert.equal(ymdToKey('2026-08-09'), '2026-08-09');
  assert.equal(ymdToKey(''), null);
  assert.equal(ymdToKey(undefined), null);
  assert.equal(ymdToKey('abc'), null);
});

test('extractItems: 배열/단일/중첩 형태 모두 지원', () => {
  assert.equal(extractItems({ response: { body: { items: [{ a: 1 }, { a: 2 }] } } }).length, 2);
  assert.equal(extractItems({ response: { body: { items: { item: { a: 1 } } } } }).length, 1);
  assert.equal(extractItems({ response: { body: { items: { item: [{ a: 1 }] } } } }).length, 1);
  assert.equal(extractItems({}).length, 0);
});

const QNET_ITEM = {
  description: '2026년 정기 기사 3회',
  implYy: '2026',
  implSeq: 3,
  qualgbNm: '국가기술자격',
  docRegStartDt: '20260616',
  docRegEndDt: '20260619',
  docExamStartDt: '20260809',
  docExamEndDt: '20260827',
  docPassDt: '20260910',
  pracRegStartDt: '20260922',
  pracRegEndDt: '20260925',
  pracExamStartDt: '20261101',
  pracExamEndDt: '20261116',
  pracPassDt: '20261224',
};

test('itemToSession: 필기·실기 단계로 변환 + 날짜 정규화', () => {
  const s = itemToSession(QNET_ITEM, 'jeongcheogi');
  assert.equal(s.id, 'jeongcheogi-2026-3');
  assert.equal(s.round, '2026년 정기 기사 3회');
  assert.equal(s.source, 'qnet');
  assert.equal(s.stages.length, 2);

  const [written, practical] = s.stages;
  assert.equal(written.key, 'written');
  assert.deepEqual(written.reg, { start: '2026-06-16', end: '2026-06-19' });
  assert.equal(written.exam.start, '2026-08-09');
  assert.equal(written.exam.end, '2026-08-27');
  assert.equal(written.pass, '2026-09-10');

  assert.equal(practical.key, 'practical');
  assert.equal(practical.exam.start, '2026-11-01');
});

test('itemToSession: 실기 시험일 없으면 실기 단계 생략', () => {
  const s = itemToSession(
    { ...QNET_ITEM, pracExamStartDt: '', pracExamEndDt: '', pracRegStartDt: '', pracRegEndDt: '' },
    'x'
  );
  assert.equal(s.stages.length, 1);
  assert.equal(s.stages[0].key, 'written');
});

test('itemToSession: 원서접수일 없으면 reg=null(상시)', () => {
  const s = itemToSession({ ...QNET_ITEM, docRegStartDt: '', docRegEndDt: '' }, 'x');
  assert.equal(s.stages[0].reg, null);
});

test('sessionsFromResponse: 등급 키워드로 필터링', () => {
  const json = {
    response: {
      body: {
        items: [
          QNET_ITEM,
          { ...QNET_ITEM, description: '2026년 정기 기능사 3회', implSeq: 3, docExamStartDt: '20260701', docExamEndDt: '20260701' },
        ],
      },
    },
  };
  const exam = { id: 'jeongcheogi', qnet: { qualgbCd: 'T', grade: '기사' } };
  const sessions = sessionsFromResponse(json, exam);
  assert.equal(sessions.length, 1);
  assert.ok(sessions[0].round.includes('기사'));
});

// ── 원서접수 상태/알림 ──

test('regStatus: 접수 전/중/마감/상시', () => {
  const reg = { start: '2026-07-25', end: '2026-07-30' };
  assert.equal(regStatus(reg, '2026-07-22').state, 'before');
  assert.equal(regStatus(reg, '2026-07-22').dday, 3);
  assert.equal(regStatus(reg, '2026-07-27').state, 'open');
  assert.equal(regStatus(reg, '2026-08-01').state, 'closed');
  assert.equal(regStatus(null, '2026-07-22').state, 'always');
});

test('flattenStages: 시험일 오름차순 평탄화', () => {
  const sessions = [
    { id: 's1', round: 'A', stages: [{ key: 'practical', label: '실기', reg: null, exam: { start: '2026-11-01', end: '2026-11-01' }, pass: null }] },
    { id: 's2', round: 'B', stages: [{ key: 'written', label: '필기', reg: null, exam: { start: '2026-08-09', end: '2026-08-09' }, pass: null }] },
  ];
  const rows = flattenStages(sessions);
  assert.equal(rows[0].stage.exam.start, '2026-08-09');
  assert.equal(rows[1].stage.exam.start, '2026-11-01');
});

test('scheduleMarks + nextActionReminder: 접수 임박은 urgent', () => {
  const session = { round: '2026년 정기 기사 3회', source: 'qnet', stages: [] };
  const stage = {
    label: '실기',
    reg: { start: '2026-07-25', end: '2026-07-28' },
    exam: { start: '2026-09-01', end: '2026-09-01' },
    pass: '2026-09-20',
  };
  const meta = toExamMeta(session, stage);
  const marks = scheduleMarks(meta);
  assert.deepEqual(
    marks['2026-07-25'].map((m) => m.kind),
    ['reg-start']
  );
  assert.equal(marks['2026-09-20'][0].kind, 'pass');

  const r = nextActionReminder(meta, '2026-07-22');
  assert.equal(r.tone, 'urgent'); // D-3
  assert.ok(r.text.includes('원서접수 시작까지 D-3'));

  const open = nextActionReminder(meta, '2026-07-26');
  assert.equal(open.tone, 'urgent');
  assert.ok(open.text.includes('접수 기간'));
});
