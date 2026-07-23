import React, { useEffect, useMemo, useState } from 'react';
import { fetchTips } from '../lib/tipService.js';
import { SOURCES } from '../data/tips.js';
import { PHASES } from '../lib/planner.js';
import Reveal from './Reveal.jsx';

export default function TipsBoard({ exam, selectedIds, onChange, onBack, onNext }) {
  const [tips, setTips] = useState(null); // null = 로딩 중
  const [sourceFilter, setSourceFilter] = useState(null);

  useEffect(() => {
    let alive = true;
    setTips(null);
    fetchTips(exam.id).then((list) => {
      if (alive) setTips(list);
    });
    return () => {
      alive = false;
    };
  }, [exam.id]);

  const counts = useMemo(() => {
    const c = {};
    for (const t of tips ?? []) c[t.source] = (c[t.source] ?? 0) + 1;
    return c;
  }, [tips]);

  const visible = useMemo(
    () => (tips ?? []).filter((t) => !sourceFilter || t.source === sourceFilter),
    [tips, sourceFilter]
  );

  const toggle = (id) => {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
    );
  };

  if (tips === null) {
    return (
      <section className="panel">
        <div className="loading">
          <div className="spinner" />
          <h2>커뮤니티에서 꿀팁 수집 중…</h2>
          <p className="panel-desc">
            디시인사이드 · 네이버 카페 · 인스타그램 · 유튜브에서
            <br />
            <strong>{exam.name}</strong> 합격 후기와 공부법을 모으고 있어요
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>{exam.name} 합격 꿀팁 {tips.length}개를 모았어요</h2>
      <p className="panel-desc">
        마음에 드는 공부 전략을 골라주세요 (여러 개 선택 가능). 선택한 전략을 합성해 나만의 계획을
        만들어요. 안 골라도 표준 전략으로 진행돼요.
      </p>

      <div className="chip-row">
        <button
          className={`chip ${sourceFilter === null ? 'on' : ''}`}
          onClick={() => setSourceFilter(null)}
        >
          전체 {tips.length}
        </button>
        {Object.entries(SOURCES)
          .filter(([key]) => counts[key])
          .map(([key, s]) => (
            <button
              key={key}
              className={`chip ${sourceFilter === key ? 'on' : ''}`}
              onClick={() => setSourceFilter(sourceFilter === key ? null : key)}
            >
              {s.label} {counts[key]}
            </button>
          ))}
      </div>

      <div className="tips-list">
        {visible.map((tip, i) => {
          const src = SOURCES[tip.source];
          const on = selectedIds.includes(tip.id);
          return (
            <Reveal key={tip.id} delay={Math.min(i * 40, 320)} as="article" className={`tip-card ${on ? 'selected' : ''}`}>
              <header className="tip-head">
                <span className="source-badge" style={{ background: src.color }}>
                  {src.short}
                </span>
                <span className="tip-board">{tip.board}</span>
                <span className="tip-author">{tip.author}</span>
              </header>
              <h3>{tip.title}</h3>
              <p className="tip-summary">{tip.summary}</p>
              <div className="tip-tags">
                {tip.tags.map((t) => (
                  <span key={t} className="tag">
                    #{t}
                  </span>
                ))}
              </div>
              <footer className="tip-foot">
                <span className="tip-stats">
                  추천 {tip.upvotes.toLocaleString()} · 댓글 {tip.comments}
                </span>
                <button className={`btn small ${on ? 'primary' : ''}`} onClick={() => toggle(tip.id)}>
                  {on ? '✓ 선택됨' : '이 전략 담기'}
                </button>
              </footer>
              {tip.strategy && (
                <div className="strategy-bar" title={`전략: ${tip.strategy.name}`}>
                  <span className="strategy-name">{tip.strategy.name}</span>
                  <span className="weight-bar">
                    {PHASES.map((p) => (
                      <i
                        key={p.id}
                        style={{
                          width: `${(tip.strategy.phaseWeights[p.id] ?? 0) * 100}%`,
                          background: p.color,
                        }}
                        title={`${p.label} ${Math.round((tip.strategy.phaseWeights[p.id] ?? 0) * 100)}%`}
                      />
                    ))}
                  </span>
                  <span className="strategy-hours">권장 총 {tip.strategy.recommendedTotalHours}시간</span>
                </div>
              )}
            </Reveal>
          );
        })}
      </div>

      <div className="btn-row sticky-bottom">
        <button className="btn" onClick={onBack}>
          ← 이전
        </button>
        <button className="btn primary" onClick={onNext}>
          {selectedIds.length > 0
            ? `${selectedIds.length}개 전략으로 공부량 설정 →`
            : '표준 전략으로 공부량 설정 →'}
        </button>
      </div>
    </section>
  );
}
