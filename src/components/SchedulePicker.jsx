import React, { useEffect, useMemo, useState } from 'react';
import { fetchSchedule } from '../lib/qnetService.js';
import { regStatus, flattenStages, toExamMeta } from '../lib/schedule.js';
import { todayKey, addDays, diffDays, formatKorean, formatShort } from '../lib/date.js';

export default function SchedulePicker({ exam, value, onBack, onNext }) {
  const today = todayKey();
  const [data, setData] = useState(null); // { sessions, live } | null=로딩
  const [pickedId, setPickedId] = useState(null); // `${session.id}::${stage.key}`
  const [pickedMeta, setPickedMeta] = useState(null);
  const [custom, setCustom] = useState('');

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    setData(null);
    fetchSchedule(exam, { year: new Date().getFullYear(), signal: ctrl.signal }).then((res) => {
      if (alive) setData(res);
    });
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [exam.id]);

  // 미래 시험만, 시험일 오름차순
  const rows = useMemo(() => {
    if (!data) return [];
    return flattenStages(data.sessions).filter(({ stage }) => diffDays(today, stage.exam.start) > 0);
  }, [data, today]);

  const effective = custom || pickedMeta?.examStart || null;
  const dday = effective ? diffDays(today, effective) : null;
  const valid = effective && dday >= 1;

  const pickStage = (session, stage) => {
    setPickedId(`${session.id}::${stage.key}`);
    setPickedMeta(toExamMeta(session, stage));
    setCustom('');
  };

  const handleNext = () => {
    if (!valid) return;
    // 직접 입력한 경우엔 메타 없이 시험일만 전달
    const meta = custom ? { examStart: custom, roundLabel: '직접 입력', stageLabel: '시험' } : pickedMeta;
    onNext(effective, meta);
  };

  if (data === null) {
    return (
      <section className="panel">
        <div className="loading">
          <div className="spinner" />
          <h2>{exam.name} 시험 일정을 불러오는 중…</h2>
          <p className="panel-desc">
            {exam.qnet ? '큐넷(국가기술자격 시험일정)에서 회차와 원서접수일을 조회하고 있어요' : '시험 일정을 확인하고 있어요'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>{exam.name}, 어느 회차로 준비하세요?</h2>
      <p className="panel-desc">
        회차를 고르면 <strong>원서접수(시험 신청)일</strong>과 시험일에 맞춰 계획을 짜고, 접수 시작·마감을
        알려드려요.
      </p>

      <div className="source-line">
        {data.live ? (
          <span className="live-badge on">🟢 큐넷 실시간 일정</span>
        ) : (
          <span className="live-badge off">📄 예시 일정</span>
        )}
        {!data.live && (
          <span className="source-note">
            {exam.qnet
              ? '큐넷 인증키(VITE_QNET_API_KEY) 설정 시 실시간 일정으로 표시돼요.'
              : `${exam.organizer}는 큐넷 대상이 아니에요. 실제 일정은 기관 공고를 확인하세요.`}
          </span>
        )}
      </div>

      {rows.length > 0 ? (
        <div className="schedule-list">
          {rows.map(({ session, stage }) => {
            const id = `${session.id}::${stage.key}`;
            const reg = regStatus(stage.reg, today);
            const examDday = diffDays(today, stage.exam.start);
            return (
              <button
                key={id}
                className={`schedule-card stage ${pickedId === id && !custom ? 'selected' : ''}`}
                onClick={() => pickStage(session, stage)}
              >
                <div className="stage-main">
                  <div className="stage-title">
                    <strong>{session.round}</strong>
                    <span className={`stage-tag ${stage.key}`}>{stage.label}</span>
                  </div>
                  <p className="stage-exam">🗓️ 시험 {formatKorean(stage.exam.start)}</p>
                  <div className="stage-lines">
                    <span className={`reg-chip ${reg.state}`}>📝 {reg.label}</span>
                    {stage.reg && (
                      <span className="reg-range">
                        접수 {formatShort(stage.reg.start)} ~ {formatShort(stage.reg.end)}
                      </span>
                    )}
                    {stage.pass && <span className="pass-chip">🏆 발표 {formatShort(stage.pass)}</span>}
                  </div>
                </div>
                <span className={`dday-badge ${examDday <= 7 ? 'urgent' : ''}`}>D-{examDday}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="empty-note">다가오는 회차 정보가 없어요. 아래에서 시험일을 직접 입력해주세요.</p>
      )}

      <div className="custom-date">
        <label htmlFor="custom-date-input">시험일 직접 입력</label>
        <input
          id="custom-date-input"
          type="date"
          min={addDays(today, 1)}
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value);
            setPickedId(null);
          }}
        />
      </div>

      <p className="notice">
        ⚠️ {data.live ? '큐넷 일정도 변동될 수 있으니' : '위 일정은 예시이며'} 실제 접수·시험일은{' '}
        <strong>{exam.organizer}</strong> 공식 공고에서 꼭 확인하세요.
      </p>

      {effective && (
        <div className={`dday-preview ${valid ? '' : 'invalid'}`}>
          {valid ? (
            <>
              {pickedMeta && !custom ? `${pickedMeta.roundLabel} ${pickedMeta.stageLabel} · ` : ''}
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
        <button className="btn primary" disabled={!valid} onClick={handleNext}>
          꿀팁 모으러 가기 →
        </button>
      </div>
    </section>
  );
}
