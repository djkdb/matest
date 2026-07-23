import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildICS, buildEvents, escapeText, foldLine, toICSDate, toICSStamp } from '../src/lib/ics.js';

const NOW = new Date('2026-07-22T00:00:00Z');
const META = {
  roundLabel: '2026년 정기 기사 3회',
  stageLabel: '실기',
  regStart: '2026-09-22',
  regEnd: '2026-09-25',
  examStart: '2026-11-01',
  examEnd: '2026-11-16',
  passDate: '2026-12-24',
};

test('toICSDate / toICSStamp 형식', () => {
  assert.equal(toICSDate('2026-09-22'), '20260922');
  assert.equal(toICSStamp(NOW), '20260722T000000Z');
});

test('escapeText: 특수문자 이스케이프', () => {
  assert.equal(escapeText('a,b;c\\d'), 'a\\,b\\;c\\\\d');
  assert.equal(escapeText('line1\nline2'), 'line1\\nline2');
});

test('foldLine: 75옥텟 초과 시 CRLF+space 로 접기', () => {
  const short = 'SUMMARY:hello';
  assert.equal(foldLine(short), short);
  const long = 'SUMMARY:' + 'x'.repeat(100);
  const folded = foldLine(long);
  assert.ok(folded.includes('\r\n '));
  // 첫 줄은 75옥텟 이하
  assert.ok(folded.split('\r\n')[0].length <= 75);
});

test('buildEvents: 접수시작/마감/시험/발표 4개 이벤트', () => {
  const events = buildEvents({ examName: '정보처리기사', examMeta: META, dtstamp: '20260722T000000Z' });
  assert.equal(events.length, 4);
  const flat = events.flat().join('\n');
  assert.ok(flat.includes('DTSTART;VALUE=DATE:20260922')); // 접수 시작
  assert.ok(flat.includes('DTSTART;VALUE=DATE:20260925')); // 접수 마감
  assert.ok(flat.includes('DTSTART;VALUE=DATE:20261101')); // 시험
  assert.ok(flat.includes('DTSTART;VALUE=DATE:20261224')); // 발표
});

test('buildEvents: 원서접수 마감 이벤트에 당일/전날 알림', () => {
  const events = buildEvents({ examName: 'X', examMeta: META, dtstamp: '20260722T000000Z' });
  const regEnd = events.find((e) => e.join('\n').includes('20260925')).join('\n');
  assert.ok(regEnd.includes('TRIGGER:-P1D'));
  assert.ok(regEnd.includes('TRIGGER:PT9H'));
  assert.ok(regEnd.includes('BEGIN:VALARM'));
});

test('buildEvents: 공부 일정 포함', () => {
  const studyDays = [
    { date: '2026-07-22', minutesLabel: '2시간', tasks: ['[개념] 소프트웨어 설계', '[기출] 1회차'] },
  ];
  const events = buildEvents({ examName: 'X', examMeta: null, studyDays, dtstamp: '20260722T000000Z' });
  assert.equal(events.length, 1);
  const flat = events[0].join('\n');
  assert.ok(flat.includes('📚'));
  assert.ok(flat.includes('소프트웨어 설계'));
});

test('buildICS: 유효한 VCALENDAR 골격 + CRLF', () => {
  const ics = buildICS({ examName: '정보처리기사', examMeta: META, now: NOW });
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.includes('VERSION:2.0'));
  assert.ok(ics.trimEnd().endsWith('END:VCALENDAR'));
  // BEGIN/END VEVENT 짝 맞음
  const begins = (ics.match(/BEGIN:VEVENT/g) || []).length;
  const ends = (ics.match(/END:VEVENT/g) || []).length;
  assert.equal(begins, ends);
  assert.equal(begins, 4);
  // 모든 라인 CRLF
  assert.ok(!/[^\r]\n/.test(ics), '모든 개행은 CRLF여야 함');
});

test('buildICS: examMeta 없이도(직접입력 시험일만) 안전', () => {
  const ics = buildICS({ examName: 'X', examMeta: { examStart: '2026-08-09', stageLabel: '시험' }, now: NOW });
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20260809'));
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 1);
});

test('buildICS: UID는 이벤트별 고유', () => {
  const ics = buildICS({ examName: '정보처리기사', examMeta: META, now: NOW });
  const uids = [...ics.matchAll(/UID:(.+)/g)].map((m) => m[1].trim());
  assert.equal(new Set(uids).size, uids.length);
});
