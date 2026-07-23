// 서버(크론)가 "지금 이 구독자에게 어떤 알림을 보낼까"를 판단하는 순수 로직.
// 클라이언트 src/lib/reminders.js 와 목적은 같지만, 서버가 아는 데이터만 사용한다:
//   - examMeta(원서접수/시험 날짜) → 날짜 기반 알림
//   - lastStudyDate/streakCount(하트비트로 클라이언트가 갱신) → 시간 기반 알림
//
// record: {
//   subscription, prefs:{study,streak,reg}, examMeta,
//   tzOffsetMinutes, remindTime:'HH:MM',
//   lastStudyDate:'YYYY-MM-DD'|null, streakCount:number,
//   lastSent:{ [id]:'YYYY-MM-DD' }
// }
// ctx: { today:'YYYY-MM-DD'(구독자 로컬), hour:number(구독자 로컬 0-23) }

export function diffDays(a, b) {
  const ms = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / ms);
}

export function dueServerReminders(record, ctx) {
  const out = [];
  if (!record || !record.prefs) return out;
  const { prefs, examMeta } = record;
  const { today, hour } = ctx;
  const remindHour = parseInt(String(record.remindTime || '20:00').split(':')[0], 10) || 20;
  const sent = record.lastSent || {};
  const add = (id, title, body) => {
    if (sent[id] !== today) out.push({ id, title, body });
  };

  if (prefs.reg && examMeta) {
    const stage = examMeta.stageLabel || '';
    if (examMeta.regStart) {
      const d = diffDays(today, examMeta.regStart);
      if (d === 3) add('reg-d3', '원서접수 D-3', `${stage} 원서접수가 3일 뒤 시작돼요`);
      if (d === 0) add('reg-start', '오늘 원서접수 시작', '지금 큐넷에서 시험을 신청하세요');
    }
    if (examMeta.regEnd && diffDays(today, examMeta.regEnd) === 0) {
      add('reg-end', '오늘 원서접수 마감', '오늘까지 신청해야 해요');
    }
  }

  // 시간 기반: 기준 시각 이후 + 오늘 공부 기록 없음
  const studiedToday = record.lastStudyDate === today;
  if (hour >= remindHour && !studiedToday) {
    if (prefs.streak && (record.streakCount || 0) > 0) {
      add('streak', `${record.streakCount}일 연속이 끊길 수 있어요`, '오늘 공부 기록을 남기면 이어져요');
    } else if (prefs.study) {
      add('study', '오늘 공부했나요?', '잠깐이라도 공부하고 기록해보세요');
    }
  }

  return out;
}

/** UTC 기준 시각 + 분offset → 구독자 로컬 { today, hour } */
export function localNow(nowMs, tzOffsetMinutes = 0) {
  // JS getTimezoneOffset()은 (UTC - local)분. 한국(UTC+9)은 -540.
  // 로컬시각 = UTC - offset.
  const local = new Date(nowMs - tzOffsetMinutes * 60 * 1000);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, '0');
  const d = String(local.getUTCDate()).padStart(2, '0');
  return { today: `${y}-${m}-${d}`, hour: local.getUTCHours() };
}
