import React, { useMemo, useState } from 'react';
import { todayKey, addDays, diffDays, formatKorean } from '../lib/date.js';

export default function SchedulePicker({ exam, value, onBack, onNext }) {
  const today = todayKey();
  const [picked, setPicked] = useState(value);
  const [custom, setCustom] = useState(
    value && !exam.upcoming.some((u) => u.date === value) ? value : ''
  );

  const upcoming = useMemo(
    () => exam.upcoming.filter((u) => diffDays(today, u.date) > 0),
    [exam, today]
  );

  const effective = custom || picked;
  const dday = effective ? diffDays(today, effective) : null;
  const valid = effective && dday >= 1;

  return (
    <section className="panel">
      <h2>{exam.name}, 언제 시험 보세요?</h2>
      <p className="panel-desc">
        다가오는 회차를 고르거나 시험일을 직접 입력하세요. 남은 기간에 맞춰 공부 계획을 짜드려요.
      </p>

      {upcoming.length > 0 && (
        <div className="schedule-list">
          {upcoming.map((u) => (
            <button
              key={u.date}
              className={`schedule-card ${picked === u.date && !custom ? 'selected' : ''}`}
              onClick={() => {
                setPicked(u.date);
                setCustom('');
              }}
            >
              <div>
                <strong>{u.label}</strong>
                <p>{formatKorean(u.date)}</p>
              </div>
              <span className="dday-badge">D-{diffDays(today, u.date)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="custom-date">
        <label htmlFor="custom-date-input">직접 입력</label>
        <input
          id="custom-date-input"
          type="date"
          min={addDays(today, 1)}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
      </div>

      <p className="notice">
        ⚠️ 위 회차 정보는 데모용 예시예요. 실제 시험 일정은 <strong>{exam.organizer}</strong> 공고에서
        꼭 확인하세요.
      </p>

      {effective && (
        <div className={`dday-preview ${valid ? '' : 'invalid'}`}>
          {valid ? (
            <>
              시험까지 <strong>D-{dday}</strong> — {formatKorean(effective)}
            </>
          ) : (
            '시험일은 내일 이후 날짜여야 계획을 만들 수 있어요.'
          )}
        </div>
      )}

      <div className="btn-row">
        <button className="btn" onClick={onBack}>
          ← 이전
        </button>
        <button className="btn primary" disabled={!valid} onClick={() => onNext(effective)}>
          꿀팁 모으러 가기 →
        </button>
      </div>
    </section>
  );
}
