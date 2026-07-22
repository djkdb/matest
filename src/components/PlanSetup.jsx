import React, { useMemo, useState } from 'react';
import { mergeStrategies, studyDays, PHASES } from '../lib/planner.js';
import { todayKey, diffDays, formatKorean, formatMinutes, WEEKDAY_LABELS } from '../lib/date.js';

export default function PlanSetup({ exam, examDate, tips, initial, onBack, onGenerate }) {
  const [dailyMinutes, setDailyMinutes] = useState(initial.dailyMinutes ?? 120);
  const [restDays, setRestDays] = useState(initial.restDays ?? []);

  const today = todayKey();
  const dday = diffDays(today, examDate);
  const merged = useMemo(() => mergeStrategies(tips), [tips]);
  const days = useMemo(
    () => studyDays(today, examDate, restDays),
    [today, examDate, restDays]
  );
  const totalMinutes = days.length * dailyMinutes;
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  const fit = useMemo(() => {
    if (!merged.recommendedTotalHours) return null;
    const ratio = totalHours / merged.recommendedTotalHours;
    if (ratio < 0.7) return { level: 'low', text: '선택한 전략 대비 공부량이 부족해요. 하루 시간을 늘리거나 휴식일을 줄여보세요.' };
    if (ratio > 1.6) return { level: 'high', text: '전략 대비 여유가 커요. 회독 수를 늘려 더 탄탄하게 준비할 수 있어요.' };
    return { level: 'ok', text: '선택한 전략과 잘 맞는 공부량이에요.' };
  }, [totalHours, merged.recommendedTotalHours]);

  const toggleRest = (dow) => {
    setRestDays((r) => (r.includes(dow) ? r.filter((x) => x !== dow) : [...r, dow]));
  };

  const canGenerate = days.length >= 1;

  return (
    <section className="panel">
      <h2>남은 {dday}일, 얼마나 공부할 수 있어요?</h2>
      <p className="panel-desc">
        {exam.name} · {formatKorean(examDate)} 시험. 입력한 공부량에 맞춰 시험 전날까지의 캘린더를
        자동으로 짜드려요.
      </p>

      {merged.names.length > 0 && (
        <div className="merged-strategy">
          <strong>합성된 전략</strong>
          <p>{merged.names.join(' + ')}</p>
          <span className="weight-bar big">
            {PHASES.map((p) => (
              <i
                key={p.id}
                style={{ width: `${merged.weights[p.id] * 100}%`, background: p.color }}
              />
            ))}
          </span>
          <div className="weight-legend">
            {PHASES.map((p) => (
              <span key={p.id}>
                <i style={{ background: p.color }} /> {p.label} {Math.round(merged.weights[p.id] * 100)}%
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="setup-field">
        <label htmlFor="daily-minutes">
          하루 공부 시간: <strong>{formatMinutes(dailyMinutes)}</strong>
        </label>
        <input
          id="daily-minutes"
          type="range"
          min={30}
          max={480}
          step={30}
          value={dailyMinutes}
          onChange={(e) => setDailyMinutes(Number(e.target.value))}
        />
        <div className="range-labels">
          <span>30분</span>
          <span>8시간</span>
        </div>
      </div>

      <div className="setup-field">
        <label>쉬는 요일 (공부 안 하는 날)</label>
        <div className="chip-row">
          {WEEKDAY_LABELS.map((label, dow) => (
            <button
              key={dow}
              className={`chip ${restDays.includes(dow) ? 'on rest' : ''}`}
              onClick={() => toggleRest(dow)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="plan-summary">
        <div className="summary-item">
          <span>학습 가능일</span>
          <strong>{days.length}일</strong>
        </div>
        <div className="summary-item">
          <span>총 공부 시간</span>
          <strong>{totalHours}시간</strong>
        </div>
        {merged.recommendedTotalHours && (
          <div className="summary-item">
            <span>전략 권장 시간</span>
            <strong>{merged.recommendedTotalHours}시간</strong>
          </div>
        )}
      </div>

      {fit && <p className={`fit-note ${fit.level}`}>{fit.text}</p>}
      {!canGenerate && (
        <p className="fit-note low">학습 가능일이 없어요. 휴식일을 줄이거나 시험일을 확인해주세요.</p>
      )}

      <div className="btn-row">
        <button className="btn" onClick={onBack}>
          ← 이전
        </button>
        <button
          className="btn primary big"
          disabled={!canGenerate}
          onClick={() => onGenerate({ dailyMinutes, restDays })}
        >
          공부 캘린더 만들기
        </button>
      </div>
    </section>
  );
}
