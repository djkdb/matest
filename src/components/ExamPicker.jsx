import React, { useMemo, useState } from 'react';
import { EXAMS, CATEGORIES } from '../data/exams.js';
import Reveal from './Reveal.jsx';

export default function ExamPicker({ selectedId, onSelect }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(null);

  const filtered = useMemo(() => {
    let list = EXAMS;
    if (category) list = list.filter((e) => e.category === category);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    // 인기 시험 먼저
    return [...list].sort((a, b) => Number(b.popular) - Number(a.popular));
  }, [query, category]);

  return (
    <section className="panel">
      <h2>어떤 시험을 준비하세요?</h2>
      <p className="panel-desc">시험을 고르면 커뮤니티 곳곳의 합격 꿀팁을 모아서 보여드려요.</p>

      <input
        className="search-input"
        type="search"
        placeholder="시험 이름 검색 (예: 정보처리기사, 토익)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="chip-row">
        <button className={`chip ${category === null ? 'on' : ''}`} onClick={() => setCategory(null)}>
          전체
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`chip ${category === c.id ? 'on' : ''}`}
            onClick={() => setCategory(category === c.id ? null : c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="exam-grid">
        {filtered.map((exam, i) => (
          <Reveal key={exam.id} delay={Math.min(i * 45, 360)}>
            <button
              className={`exam-card ${selectedId === exam.id ? 'selected' : ''}`}
              onClick={() => onSelect(exam.id)}
            >
              <div className="exam-card-top">
                <h3>{exam.name}</h3>
                {exam.popular && <span className="badge hot">인기</span>}
              </div>
              <p className="exam-organizer">{exam.organizer}</p>
              <div className="exam-meta">
                <span className={`badge diff-${exam.difficulty}`}>난이도 {exam.difficulty}</span>
                <span className="badge">평균 준비 {exam.avgPrepWeeks}주</span>
              </div>
            </button>
          </Reveal>
        ))}
        {filtered.length === 0 && (
          <p className="empty-note">
            검색 결과가 없어요. 다른 키워드로 찾아보세요. (지원 시험은 계속 추가될 예정)
          </p>
        )}
      </div>
    </section>
  );
}
