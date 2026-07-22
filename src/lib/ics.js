// iCalendar(.ics) 생성 — 구글/애플/아웃룩 캘린더로 내보내기.
//
// 순수 함수(부수효과 없음)라 단위 테스트가 쉽다. 실제 다운로드(Blob/anchor)는
// 컴포넌트에서 처리한다(downloadICS 는 브라우저 전용).
//
// 생성 이벤트
//  - 원서접수 시작일 : 하루 전·3일 전 알림
//  - 원서접수 마감일 : 전날·당일 오전 알림 ("오늘 마감!")
//  - 시험일          : 1주 전·전날·당일 오전 알림
//  - 합격 발표일
//  - (옵션) 하루치 공부 블록 : 그 날의 학습 유닛 목록
//
// 모든 이벤트는 종일(VALUE=DATE) 이벤트로, 알림은 DTSTART 기준 상대 트리거.

const CRLF = '\r\n';

/** 'YYYY-MM-DD' → 'YYYYMMDD' */
export function toICSDate(key) {
  return String(key).replace(/-/g, '');
}

/** Date → 'YYYYMMDDTHHMMSSZ' (UTC, DTSTAMP용) */
export function toICSStamp(date) {
  const p = (n) => String(n).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}` +
    `T${p(date.getUTCHours())}${p(date.getUTCMinutes())}${p(date.getUTCSeconds())}Z`
  );
}

/** iCal TEXT 이스케이프 (역슬래시, 세미콜론, 콤마, 개행) */
export function escapeText(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** 75옥텟 초과 라인 접기(RFC 5545). 이어지는 줄은 공백 1칸으로 시작. */
export function foldLine(line) {
  const enc = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  const bytelen = (str) => (enc ? enc.encode(str).length : str.length);
  if (bytelen(line) <= 75) return line;
  let out = '';
  let cur = '';
  for (const ch of line) {
    if (bytelen(cur + ch) > 75) {
      out += (out ? CRLF + ' ' : '') + cur;
      cur = ch;
    } else {
      cur += ch;
    }
  }
  out += (out ? CRLF + ' ' : '') + cur;
  return out;
}

function alarm(triggerSpec, description) {
  return ['BEGIN:VALARM', `TRIGGER:${triggerSpec}`, 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(description)}`, 'END:VALARM'];
}

function vevent({ uid, dtstamp, date, summary, description, alarms = [] }) {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${toICSDate(date)}`,
    `SUMMARY:${escapeText(summary)}`,
  ];
  if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);
  for (const a of alarms) lines.push(...a);
  lines.push('END:VEVENT');
  return lines;
}

/**
 * 일정 이벤트 목록 생성 (순수).
 * @returns 이벤트 라인 배열들의 배열
 */
export function buildEvents({ examName, examMeta, studyDays = [], dtstamp }) {
  const events = [];
  const uid = (kind, date) => `${slug(examName)}-${kind}-${toICSDate(date)}@exam-master`;
  const m = examMeta || {};

  if (m.regStart) {
    events.push(
      vevent({
        uid: uid('regstart', m.regStart),
        dtstamp,
        date: m.regStart,
        summary: `📝 ${examName} ${m.stageLabel ?? ''} 원서접수 시작`.trim(),
        description: `${examName} 원서접수가 시작됩니다. 큐넷 등에서 시험을 신청하세요.`,
        alarms: [alarm('-P3D', '원서접수 3일 전'), alarm('-P1D', '내일 원서접수 시작')],
      })
    );
  }
  if (m.regEnd) {
    events.push(
      vevent({
        uid: uid('regend', m.regEnd),
        dtstamp,
        date: m.regEnd,
        summary: `⏰ ${examName} ${m.stageLabel ?? ''} 원서접수 마감`.trim(),
        description: '오늘까지 원서접수를 마쳐야 합니다!',
        alarms: [alarm('-P1D', '내일 원서접수 마감'), alarm('PT9H', '오늘 원서접수 마감! 지금 신청하세요')],
      })
    );
  }
  if (m.examStart) {
    const end = m.examEnd && m.examEnd !== m.examStart ? ` ~ ${m.examEnd}` : '';
    events.push(
      vevent({
        uid: uid('exam', m.examStart),
        dtstamp,
        date: m.examStart,
        summary: `🎯 ${examName} ${m.stageLabel ?? '시험'}`.trim(),
        description: `${m.roundLabel ? m.roundLabel + ' ' : ''}시험일${end}. 수험표·신분증을 챙기세요.`,
        alarms: [alarm('-P7D', '시험 1주일 전'), alarm('-P1D', '내일 시험!'), alarm('PT7H', '오늘 시험 — 화이팅!')],
      })
    );
  }
  if (m.passDate) {
    events.push(
      vevent({
        uid: uid('pass', m.passDate),
        dtstamp,
        date: m.passDate,
        summary: `🏆 ${examName} 합격자 발표`,
        description: '합격자 발표일입니다.',
        alarms: [alarm('PT9H', '오늘 합격자 발표')],
      })
    );
  }

  for (const d of studyDays) {
    const tasks = d.tasks ?? [];
    events.push(
      vevent({
        uid: uid('study', d.date),
        dtstamp,
        date: d.date,
        summary: `📚 ${examName} 공부${d.minutesLabel ? ` (${d.minutesLabel})` : ''}`,
        description: tasks.length ? tasks.map((t) => `• ${t}`).join('\n') : '오늘의 공부',
      })
    );
  }

  return events;
}

/**
 * 완성된 .ics 문자열 생성.
 * @param opts { examName, examMeta, studyDays?, now? }
 */
export function buildICS(opts) {
  const now = opts.now ?? new Date();
  const dtstamp = toICSStamp(now);
  const events = buildEvents({ ...opts, dtstamp });
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//시험 마스터//Exam Master//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.flat(),
    'END:VCALENDAR',
  ];
  return lines.map(foldLine).join(CRLF) + CRLF;
}

function slug(s) {
  return String(s).replace(/\s+/g, '-').replace(/[^\w가-힣-]/g, '');
}
