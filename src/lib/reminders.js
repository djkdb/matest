// "지금 어떤 알림을 띄울까"를 판단하는 순수 로직.
// 앱을 열었을 때(백엔드 없이) 또는 서버가 참고할 때 모두 재사용 가능하도록 분리.
//
// prefs: {
//   enabled, study, streak, reg,   // 각 카테고리 on/off
//   remindTime: 'HH:MM',           // 시간 기반 알림 기준 시각
//   lastNotified: { [id]: 'YYYY-MM-DD' }  // 하루 1회 중복 방지
// }
// ctx: { examMeta, streakCount, todayStudied, today, hour }

import { diffDays } from './date.js';

export function dueReminders(prefs, ctx) {
  const out = [];
  if (!prefs || !prefs.enabled) return out;

  const { examMeta, streakCount = 0, todayStudied = false, today, hour = 0 } = ctx || {};
  const remindHour = parseInt(String(prefs.remindTime || '20:00').split(':')[0], 10) || 20;
  const sent = prefs.lastNotified || {};
  const add = (id, title, body) => {
    if (sent[id] !== today) out.push({ id, title, body });
  };

  // 원서접수 알림 (날짜 기반)
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

  // 시간 기반: 기준 시각 이후에도 오늘 공부 기록이 없으면
  if (hour >= remindHour && !todayStudied) {
    if (prefs.streak && streakCount > 0) {
      add('streak', `${streakCount}일 연속이 끊길 수 있어요`, '오늘 공부 기록을 남기면 이어져요');
    } else if (prefs.study) {
      add('study', '오늘 공부했나요?', '잠깐이라도 공부하고 기록해보세요');
    }
  }

  return out;
}
