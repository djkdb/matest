import React, { useMemo, useState } from 'react';
import { PHASES, PHASE_MAP } from '../lib/planner.js';
import {
  todayKey,
  fromKey,
  toKey,
  diffDays,
  formatKorean,
  formatMinutes,
  WEEKDAY_LABELS,
} from '../lib/date.js';

export default function CalendarView({
  exam,
  examDate,
  plan,
  completed,
  tips,
  onToggleUnit,
  onReplan,
  onReset,
}) {
  const today = todayKey();
  const unitMap = useMemo(() => new Map(plan.units.map((u) => [u.id, u])), [plan.units]);
  const dayMap = useMemo(() => new Map(plan.days.map((d) => [d.date, d])), [plan.days]);
  const doneSet = useMemo(() => new Set(completed), [completed]);

  const firstPlanDay = plan.days.find((d) => d.date >= today)?.date ?? plan.days[0]?.date ?? today;
  const [selectedDate, setSelectedDate] = useState(
    dayMap.has(today) ? today : firstPlanDay
  );
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = fromKey(dayMap.has(today) ? today : firstPlanDay);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // 진행률: 완료 유닛 시간 / 전체 유닛 시간
  const progress = useMemo(() => {
    const total = plan.units.reduce((s, u) => s + u.minutes, 0);
    const done = plan.units.filter((u) => doneSet.has(u.id)).reduce((s, u) => s + u.minutes, 0);
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [plan.units, doneSet]);

  // 밀린 유닛: 오늘 이전 날짜에 배정됐지만 미완료
  const overdueCount = useMemo(
    () =>
      plan.days
        .filter((d) => d.date < today)
        .flatMap((d) => d.unitIds)
        .filter((id) => !doneSet.has(id)).length,
    [plan.days, today, doneSet]
  );

  const weeks = useMemo(() => buildMonthGrid(monthCursor.year, monthCursor.month), [monthCursor]);
  const dday = diffDays(today, examDate);
  const selectedDay = dayMap.get(selectedDate);

  const moveMonth = (delta) => {
    setMonthCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  return (
    <section className="calendar-wrap">
      <div className="cal-header panel">
        <div className="cal-title">
          <h2>
            {exam.name} <span className={`dday-badge ${dday <= 7 ? 'urgent' : ''}`}>
              {dday === 0 ? 'D-DAY' : dday > 0 ? `D-${dday}` : '시험 종료'}
            </span>
          </h2>
          <p className="panel-desc">
            {formatKorean(examDate)} 시험 · 총 {formatMinutes(progress.total)} 계획
            {tips.length > 0 && ` · ${tips.length}개 커뮤니티 전략 반영`}
          </p>
        </div>
        <div className="progress-block">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress.pct}%` }} />
          </div>
          <span className="progress-text">
            {progress.pct}% 완료 ({formatMinutes(progress.done)} / {formatMinutes(progress.total)})
          </span>
        </div>
        <div className="cal-actions">
          {overdueCount > 0 && (
            <button className="btn warn" onClick={onReplan}>
              ⏰ 밀린 {overdueCount}개 일정 재분배
            </button>
          )}
          <button className="btn subtle" onClick={onReset}>
            새 계획 만들기
          </button>
        </div>
        {plan.unassigned.length > 0 && (
          <p className="fit-note low">
            시간이 부족해 {plan.unassigned.length}개 학습 유닛이 배정되지 못했어요. 하루 공부 시간을
            늘려 새 계획을 만들어보세요.
          </p>
        )}
      </div>

      <div className="cal-body">
        <div className="panel cal-grid-panel">
          <div className="cal-nav">
            <button className="btn small" onClick={() => moveMonth(-1)}>
              ←
            </button>
            <strong>
              {monthCursor.year}년 {monthCursor.month + 1}월
            </strong>
            <button className="btn small" onClick={() => moveMonth(1)}>
              →
            </button>
          </div>

          <div className="cal-grid">
            {WEEKDAY_LABELS.map((w, i) => (
              <div key={w} className={`cal-dow ${i === 0 ? 'sun' : ''} ${i === 6 ? 'sat' : ''}`}>
                {w}
              </div>
            ))}
            {weeks.flat().map((cell, idx) => {
              if (!cell) return <div key={`x${idx}`} className="cal-cell empty" />;
              const day = dayMap.get(cell);
              const isExam = cell === examDate;
              const isToday = cell === today;
              const allDone = day && day.unitIds.length > 0 && day.unitIds.every((id) => doneSet.has(id));
              const phases = day ? [...new Set(day.unitIds.map((id) => unitMap.get(id)?.phase))] : [];
              return (
                <button
                  key={cell}
                  className={[
                    'cal-cell',
                    day ? 'has-plan' : '',
                    isToday ? 'today' : '',
                    isExam ? 'exam-day' : '',
                    cell === selectedDate ? 'selected' : '',
                    allDone ? 'all-done' : '',
                  ].join(' ')}
                  onClick={() => setSelectedDate(cell)}
                >
                  <span className="cal-date">{fromKey(cell).getDate()}</span>
                  {isExam && <span className="cal-exam-mark">🎯 시험</span>}
                  {day && (
                    <>
                      <span className="cal-dots">
                        {phases.map((p) => (
                          <i key={p} style={{ background: PHASE_MAP[p]?.color }} />
                        ))}
                      </span>
                      <span className="cal-min">{allDone ? '✓ 완료' : formatMinutes(day.totalMinutes)}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          <div className="phase-legend">
            {PHASES.map((p) => (
              <span key={p.id}>
                <i style={{ background: p.color }} /> {p.label}
              </span>
            ))}
          </div>
        </div>

        <div className="panel day-detail">
          <h3>{formatKorean(selectedDate)}</h3>
          {selectedDate === examDate && (
            <p className="exam-day-note">🎯 시험 당일! 일찍 자고 수험표·신분증 챙기세요.</p>
          )}
          {!selectedDay && selectedDate !== examDate && (
            <p className="empty-note">
              이 날은 배정된 공부가 없어요. {selectedDate < today ? '' : '휴식일이거나 계획 범위 밖이에요. 🌴'}
            </p>
          )}
          {selectedDay && (
            <ul className="unit-list">
              {selectedDay.unitIds.map((id) => {
                const u = unitMap.get(id);
                if (!u) return null;
                const done = doneSet.has(id);
                return (
                  <li key={id} className={done ? 'done' : ''}>
                    <label>
                      <input type="checkbox" checked={done} onChange={() => onToggleUnit(id)} />
                      <span className="unit-phase" style={{ background: PHASE_MAP[u.phase]?.color }}>
                        {PHASE_MAP[u.phase]?.label}
                      </span>
                      <span className="unit-title">{u.title}</span>
                      <span className="unit-min">{formatMinutes(u.minutes)}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          {selectedDay && (
            <p className="day-total">
              이 날 총 {formatMinutes(selectedDay.totalMinutes)} ·{' '}
              {selectedDay.unitIds.filter((id) => doneSet.has(id)).length}/{selectedDay.unitIds.length}{' '}
              완료
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/** 해당 월의 주 단위 그리드. 빈 칸은 null, 날짜는 'YYYY-MM-DD'. */
function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(toKey(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
