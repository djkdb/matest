// 회차/단계(stage) 일정에 대한 파생 계산 (원서접수 상태, D-day 등).

import { diffDays, formatShort } from './date.js';

/**
 * 원서접수 상태.
 * @returns { state, label, dday? }
 *   state: 'always'(상시) | 'before'(접수 전) | 'open'(접수 중) | 'closed'(마감)
 */
export function regStatus(reg, todayKey) {
  if (!reg || !reg.start) return { state: 'always', label: '상시 접수' };
  const toStart = diffDays(todayKey, reg.start);
  const toEnd = diffDays(todayKey, reg.end);
  if (toStart > 0) return { state: 'before', label: `접수 시작 D-${toStart}`, dday: toStart };
  if (toEnd >= 0) return { state: 'open', label: `접수 중 · ${formatShort(reg.end)} 마감`, dday: toEnd };
  return { state: 'closed', label: '접수 마감' };
}

/** 단계 시험 시작일 기준 D-day (과거면 음수) */
export function stageDday(stage, todayKey) {
  return diffDays(todayKey, stage.exam.start);
}

/** 회차 목록 → { session, stage } 평탄화 (시험일 오름차순) */
export function flattenStages(sessions) {
  const rows = [];
  for (const session of sessions) {
    for (const stage of session.stages) rows.push({ session, stage });
  }
  rows.sort((a, b) => (a.stage.exam.start < b.stage.exam.start ? -1 : 1));
  return rows;
}

/**
 * 계획에 쓸 target 메타 생성. 캘린더/헤더의 원서접수·발표 알림에 사용.
 */
export function toExamMeta(session, stage) {
  return {
    roundLabel: session.round,
    stageLabel: stage.label,
    regStart: stage.reg?.start ?? null,
    regEnd: stage.reg?.end ?? null,
    examStart: stage.exam.start,
    examEnd: stage.exam.end,
    passDate: stage.pass ?? null,
    live: session.source === 'qnet',
  };
}

/**
 * examMeta → 캘린더 특수 표시 맵. { 'YYYY-MM-DD': [{ kind, label }] }
 *   kind: 'reg-start' | 'reg-end' | 'pass'
 */
export function scheduleMarks(meta) {
  const marks = {};
  const push = (date, kind, label) => {
    if (!date) return;
    (marks[date] ??= []).push({ kind, label });
  };
  push(meta.regStart, 'reg-start', '원서접수 시작');
  push(meta.regEnd, 'reg-end', '원서접수 마감');
  push(meta.passDate, 'pass', '합격 발표');
  return marks;
}

/**
 * 헤더/캘린더에 보여줄 "다음 할 일" 알림 문구.
 * @returns { tone, text } | null   tone: 'info' | 'urgent' | 'muted'
 */
export function nextActionReminder(meta, todayKey) {
  if (!meta) return null;
  if (meta.regStart || meta.regEnd) {
    const status = regStatus({ start: meta.regStart, end: meta.regEnd }, todayKey);
    if (status.state === 'before') {
      return {
        tone: status.dday <= 3 ? 'urgent' : 'info',
        text: `${meta.stageLabel} 원서접수 시작까지 D-${status.dday} (${formatShort(meta.regStart)}~${formatShort(meta.regEnd)})`,
      };
    }
    if (status.state === 'open') {
      return {
        tone: 'urgent',
        text: `지금 ${meta.stageLabel} 원서접수 기간! ${formatShort(meta.regEnd)} 마감 — 잊지 말고 접수하세요`,
      };
    }
    if (status.state === 'closed') {
      return { tone: 'muted', text: `${meta.stageLabel} 원서접수는 마감되었어요 (${formatShort(meta.regEnd)})` };
    }
  }
  return null;
}
