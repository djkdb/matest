import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PHASES, PHASE_MAP } from '../lib/planner.js';
import { scheduleMarks, nextActionReminder } from '../lib/schedule.js';
import { buildICS } from '../lib/ics.js';
import { celebrate, burstAt } from '../lib/confetti.js';
import ProgressRing from './ProgressRing.jsx';
import AnimatedNumber from './AnimatedNumber.jsx';
import StudyTimer from './StudyTimer.jsx';
import Icon from './Icon.jsx';
import {
  todayKey,
  fromKey,
  toKey,
  diffDays,
  formatKorean,
  formatShort,
  formatMinutes,
  WEEKDAY_LABELS,
} from '../lib/date.js';

/** .ics 문자열을 파일로 다운로드 (브라우저 전용) */
function downloadICS(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const MARK_KIND = {
  'reg-start': { cls: 'reg', short: '접수 시작' },
  'reg-end': { cls: 'reg', short: '접수 마감' },
  pass: { cls: 'pass', short: '합격 발표' },
};

export default function CalendarView({
  exam,
  examDate,
  examMeta,
  plan,
  completed,
  tips,
  studyLog,
  timerStartedAt,
  onTimerStart,
  onTimerStop,
  onToggleUnit,
  onReplan,
  onReset,
}) {
  const today = todayKey();
  const marks = useMemo(() => (examMeta ? scheduleMarks(examMeta) : {}), [examMeta]);
  const reminder = useMemo(() => nextActionReminder(examMeta, today), [examMeta, today]);
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
  const [includeStudy, setIncludeStudy] = useState(true);

  const handleExport = () => {
    const studyDays = includeStudy
      ? plan.days
          .filter((d) => d.unitIds.length > 0)
          .map((d) => ({
            date: d.date,
            minutesLabel: formatMinutes(d.totalMinutes),
            tasks: d.unitIds.map((id) => unitMap.get(id)?.title).filter(Boolean),
          }))
      : [];
    const ics = buildICS({ examName: exam.name, examMeta, studyDays });
    downloadICS(`${exam.name}_공부일정.ics`, ics);
  };

  // 진행률: 완료 유닛 시간 / 전체 유닛 시간
  const progress = useMemo(() => {
    const total = plan.units.reduce((s, u) => s + u.minutes, 0);
    const done = plan.units.filter((u) => doneSet.has(u.id)).reduce((s, u) => s + u.minutes, 0);
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [plan.units, doneSet]);

  // 100% 달성 순간 축하 (한 번만)
  const prevPct = useRef(progress.pct);
  useEffect(() => {
    if (progress.pct === 100 && prevPct.current < 100) {
      celebrate({ count: 180, spread: 1.2 });
    }
    prevPct.current = progress.pct;
  }, [progress.pct]);

  // 체크 시 작은 버스트 (완료로 바뀔 때만)
  const handleToggle = (unitId, e) => {
    const wasDone = doneSet.has(unitId);
    // 완료로 체크할 때, 클릭 좌표가 있으면 작은 컨페티 버스트
    if (!wasDone && e && e.clientX > 0 && e.clientY > 0) burstAt(e.clientX, e.clientY);
    onToggleUnit(unitId);
  };

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
  const rawSelectedDay = dayMap.get(selectedDate);
  const selectedDay = rawSelectedDay && rawSelectedDay.unitIds.length > 0 ? rawSelectedDay : null;

  const moveMonth = (delta) => {
    setMonthCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  return (
    <section className="calendar-wrap">
      <StudyTimer
        studyLog={studyLog}
        startedAt={timerStartedAt}
        onStart={onTimerStart}
        onStop={onTimerStop}
      />
      <div className="cal-header panel">
        <div className="cal-top">
          <div className="cal-title">
            <h2>
              {exam.name}{' '}
              <span className={`dday-badge ${dday <= 7 ? 'urgent' : ''}`}>
                {dday === 0 ? 'D-DAY' : dday > 0 ? <>D-<AnimatedNumber value={dday} /></> : '시험 종료'}
              </span>
            </h2>
            <p className="panel-desc">
              {examMeta?.roundLabel && examMeta.roundLabel !== '직접 입력'
                ? `${examMeta.roundLabel} ${examMeta.stageLabel} · `
                : ''}
              {formatKorean(examDate)} 시험 · 총 {formatMinutes(progress.total)} 계획
              {tips.length > 0 && ` · ${tips.length}개 커뮤니티 전략 반영`}
            </p>
            <p className="progress-text">
              {formatMinutes(progress.done)} 완료 / {formatMinutes(progress.total)}
            </p>
          </div>
          <ProgressRing pct={progress.pct} size={96}>
            <span className="ring-pct">
              <AnimatedNumber value={progress.pct} />%
            </span>
            <span className="ring-sub">완료</span>
          </ProgressRing>
        </div>
        {reminder && (
          <div className={`reg-reminder ${reminder.tone}`}>
            <Icon name="bell" size={16} /> {reminder.text}
          </div>
        )}
        <div className="cal-actions">
          {overdueCount > 0 && (
            <button className="btn warn" onClick={onReplan}>
              <Icon name="refresh" size={15} /> 밀린 {overdueCount}개 재분배
            </button>
          )}
          <button className="btn primary" onClick={handleExport}>
            <Icon name="download" size={16} /> 캘린더 내보내기
          </button>
          <label className="ics-opt">
            <input
              type="checkbox"
              checked={includeStudy}
              onChange={(e) => setIncludeStudy(e.target.checked)}
            />
            공부 일정도 포함
          </label>
          <button className="btn subtle" onClick={onReset}>
            새 계획 만들기
          </button>
        </div>
        <p className="ics-hint">
          내려받은 .ics 파일을 구글·애플·아웃룩 캘린더에서 열면 원서접수 시작·마감, 시험일, 합격발표에
          알림이 자동 등록돼요.
        </p>
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
            <button className="btn small" onClick={() => moveMonth(-1)} aria-label="이전 달">
              ←
            </button>
            <strong aria-live="polite">
              {monthCursor.year}년 {monthCursor.month + 1}월
            </strong>
            <button className="btn small" onClick={() => moveMonth(1)} aria-label="다음 달">
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
              const rawDay = dayMap.get(cell);
              const day = rawDay && rawDay.unitIds.length > 0 ? rawDay : null;
              const isExam = cell === examDate;
              const isToday = cell === today;
              const allDone = day && day.unitIds.every((id) => doneSet.has(id));
              const phases = day ? [...new Set(day.unitIds.map((id) => unitMap.get(id)?.phase))] : [];
              const cellMarks = marks[cell] ?? [];
              const cellLabel = [
                formatKorean(cell),
                isExam && '시험일',
                ...cellMarks.map((m) => MARK_KIND[m.kind]?.short),
                day && (allDone ? '공부 완료' : `공부 ${formatMinutes(day.totalMinutes)}`),
              ]
                .filter(Boolean)
                .join(', ');
              return (
                <button
                  key={cell}
                  aria-label={cellLabel}
                  aria-pressed={cell === selectedDate}
                  className={[
                    'cal-cell',
                    day ? 'has-plan' : '',
                    isToday ? 'today' : '',
                    isExam ? 'exam-day' : '',
                    cellMarks.length ? 'has-mark' : '',
                    cell === selectedDate ? 'selected' : '',
                    allDone ? 'all-done' : '',
                  ].join(' ')}
                  onClick={() => setSelectedDate(cell)}
                >
                  <span className="cal-date">{fromKey(cell).getDate()}</span>
                  {isExam && <span className="cal-exam-mark">시험</span>}
                  {cellMarks.map((m, i) => (
                    <span key={i} className={`cal-mark ${MARK_KIND[m.kind]?.cls}`}>
                      {MARK_KIND[m.kind]?.short}
                    </span>
                  ))}
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
            <p className="exam-day-note">시험 당일! 일찍 자고 수험표·신분증 챙기세요.</p>
          )}
          {(marks[selectedDate] ?? []).map((m, i) => (
            <p key={i} className={`sched-note ${MARK_KIND[m.kind]?.cls}`}>
              {m.kind === 'reg-start' && '원서접수 시작일 — 큐넷에서 시험을 신청하세요.'}
              {m.kind === 'reg-end' && '원서접수 마감일 — 오늘까지 신청해야 해요!'}
              {m.kind === 'pass' && '합격자 발표일'}
            </p>
          ))}
          {!selectedDay && selectedDate !== examDate && (marks[selectedDate] ?? []).length === 0 && (
            <p className="empty-note">
              이 날은 배정된 공부가 없어요.{selectedDate < today ? '' : ' 휴식일이거나 계획 범위 밖이에요.'}
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
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={(e) => handleToggle(id, e.nativeEvent)}
                      />
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
