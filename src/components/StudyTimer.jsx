import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { computeStreak, weeklyStats, daySeconds, formatClock, formatDuration } from '../lib/study.js';
import { todayKey } from '../lib/date.js';

/**
 * 공부 타이머 + 스트릭 카드.
 * - 시작/정지로 공부 시간 측정 → 정지 시 studyLog에 누적
 * - startedAt(epoch)이 있으면 새로고침 후에도 진행 중 세션 복원
 * - 연속 학습일(스트릭)과 최근 7일 막대 통계 표시
 */
export default function StudyTimer({ studyLog, startedAt, onStart, onStop }) {
  const today = todayKey();
  const running = startedAt != null;
  const [nowMs, setNowMs] = useState(() => Date.now());

  // 진행 중일 때만 1초 틱
  useEffect(() => {
    if (!running) return;
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const runningSec = running ? Math.max(0, Math.floor((nowMs - startedAt) / 1000)) : 0;
  const todaySec = daySeconds(studyLog, today) + runningSec;

  const streak = computeStreak(
    // 진행 중 시간을 오늘 값에 반영해 스트릭이 즉시 이어지도록
    { ...studyLog, [today]: daySeconds(studyLog, today) + runningSec },
    today
  );
  const week = weeklyStats(studyLog, today);
  const maxSec = Math.max(60, ...week.map((d) => (d.isToday ? todaySec : d.seconds)));

  const toggle = () => {
    if (running) onStop(runningSec);
    else onStart();
  };

  return (
    <section className="panel timer-card" aria-label="공부 타이머">
      <div className="timer-top">
        <div className="timer-left">
          <span className="timer-caption">오늘 공부</span>
          <strong className={`timer-display ${running ? 'live' : ''}`} aria-live="off">
            {running ? formatClock(todaySec) : formatDuration(todaySec)}
          </strong>
        </div>

        <div className="streak-badge" title="연속 학습일">
          <Icon name="flame" size={18} className={streak.count > 0 ? 'flame-on' : 'flame-off'} />
          <b>{streak.count}</b>
          <span>일 연속</span>
        </div>
      </div>

      <button
        className={`btn timer-btn ${running ? 'stop' : 'primary'}`}
        onClick={toggle}
        aria-label={running ? '공부 타이머 정지' : '공부 타이머 시작'}
      >
        <Icon name={running ? 'stop' : 'play'} size={18} />
        {running ? `정지 · ${formatClock(runningSec)}` : '공부 시작'}
      </button>

      {!streak.todayStudied && streak.count > 0 && !running && (
        <p className="streak-hint">오늘 공부하면 {streak.count}일 연속이 이어져요</p>
      )}

      <div className="week-bars" role="img" aria-label={`최근 7일 공부시간, 현재 ${streak.count}일 연속`}>
        {week.map((d) => {
          const sec = d.isToday ? todaySec : d.seconds;
          const h = Math.round((sec / maxSec) * 100);
          return (
            <div className="week-col" key={d.date}>
              <div className="week-bar-track">
                <div
                  className={`week-bar ${d.isToday ? 'today' : ''} ${sec > 0 ? '' : 'empty'}`}
                  style={{ height: `${Math.max(sec > 0 ? 8 : 3, h)}%` }}
                />
              </div>
              <span className={`week-label ${d.isToday ? 'today' : ''}`}>{d.weekday}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
