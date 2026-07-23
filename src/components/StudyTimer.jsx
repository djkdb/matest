import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';
import { computeStreak, weeklyStats, daySeconds, formatClock, formatDuration } from '../lib/study.js';
import { todayKey } from '../lib/date.js';

const PIP_SUPPORTED = typeof window !== 'undefined' && 'documentPictureInPicture' in window;

/**
 * 공부 타이머 + 스트릭 카드.
 * - 시작/정지로 공부 시간 측정 → 정지 시 studyLog에 누적(초 단위 보존)
 * - 진행 중이면 탭 제목에 시간 표시(모든 브라우저)
 * - "미니 타이머": Document Picture-in-Picture로 항상 위에 뜨는 작은 창(크롬/엣지)
 */
export default function StudyTimer({ studyLog, startedAt, onStart, onStop }) {
  const today = todayKey();
  const running = startedAt != null;
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [pipWin, setPipWin] = useState(null);
  const pipRef = useRef(null);
  const baseTitle = useRef(typeof document !== 'undefined' ? document.title : '');

  // 진행 중일 때만 1초 틱
  useEffect(() => {
    if (!running) return;
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const runningSec = running ? Math.max(0, Math.floor((nowMs - startedAt) / 1000)) : 0;
  const todaySec = daySeconds(studyLog, today) + runningSec;

  // 탭 제목에 공부 시간 표시
  useEffect(() => {
    if (running) document.title = `⏱ ${formatClock(runningSec)} 공부 중`;
    else document.title = baseTitle.current;
  }, [running, runningSec]);
  useEffect(() => () => { document.title = baseTitle.current; }, []);

  const streak = computeStreak(
    { ...studyLog, [today]: daySeconds(studyLog, today) + runningSec },
    today
  );
  const week = weeklyStats(studyLog, today);
  const maxSec = Math.max(60, ...week.map((d) => (d.isToday ? todaySec : d.seconds)));

  const toggle = () => {
    if (running) onStop(runningSec);
    else onStart();
  };

  // ─── 미니 타이머 (Document Picture-in-Picture) ───
  const openMini = async () => {
    if (!PIP_SUPPORTED || pipWin) return;
    try {
      const win = await window.documentPictureInPicture.requestWindow({ width: 240, height: 150 });
      // 앱 스타일을 미니 창에 복사
      for (const sheet of document.styleSheets) {
        try {
          const css = Array.from(sheet.cssRules).map((r) => r.cssText).join('');
          const style = win.document.createElement('style');
          style.textContent = css;
          win.document.head.appendChild(style);
        } catch {
          if (sheet.href) {
            const link = win.document.createElement('link');
            link.rel = 'stylesheet';
            link.href = sheet.href;
            win.document.head.appendChild(link);
          }
        }
      }
      win.document.body.classList.add('pip-body');
      win.addEventListener('pagehide', () => setPipWin(null));
      pipRef.current = win;
      setPipWin(win);
    } catch {
      /* 사용자 취소 등 */
    }
  };

  // 컴포넌트 사라질 때 미니 창 닫기
  useEffect(() => () => pipRef.current?.close?.(), []);

  return (
    <section className="panel timer-card" aria-label="공부 타이머">
      <div className="timer-top">
        <div className="timer-left">
          <span className="timer-caption">오늘 공부</span>
          <strong className={`timer-display ${running ? 'live' : ''}`} aria-live="off">
            {running ? formatClock(todaySec) : formatDuration(todaySec)}
          </strong>
        </div>

        <div className="timer-right">
          <div className="streak-badge" title="연속 학습일">
            <Icon name="flame" size={18} className={streak.count > 0 ? 'flame-on' : 'flame-off'} />
            <b>{streak.count}</b>
            <span>일 연속</span>
          </div>
          {PIP_SUPPORTED && (
            <button
              className="mini-open"
              onClick={openMini}
              aria-label="미니 타이머 — 항상 위에 뜨는 작은 창"
            >
              <Icon name="pip" size={15} /> 미니 타이머
            </button>
          )}
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

      {pipWin &&
        createPortal(
          <div className={`mini-timer ${running ? 'live' : ''}`}>
            <span className="mini-cap">{running ? '공부 중' : '오늘 공부'}</span>
            <strong className="mini-time">{formatClock(todaySec)}</strong>
            <button
              className={`btn timer-btn ${running ? 'stop' : 'primary'}`}
              onClick={toggle}
            >
              <Icon name={running ? 'stop' : 'play'} size={16} />
              {running ? '정지' : '시작'}
            </button>
          </div>,
          pipWin.document.body
        )}
    </section>
  );
}
