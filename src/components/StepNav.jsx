import React from 'react';

const LABELS = {
  exam: '시험 선택',
  date: '시험일 선택',
  tips: '꿀팁 모아보기',
  setup: '공부량 설정',
  calendar: '내 캘린더',
};

export default function StepNav({ steps, current, onJump }) {
  const currentIdx = steps.indexOf(current);
  return (
    <nav className="step-nav">
      {steps.map((step, i) => (
        <button
          key={step}
          className={`step-item ${i === currentIdx ? 'active' : ''} ${i < currentIdx ? 'done' : ''}`}
          onClick={() => onJump(step)}
          disabled={i >= currentIdx}
        >
          <span className="step-num">{i < currentIdx ? '✓' : i + 1}</span>
          <span className="step-label">{LABELS[step]}</span>
        </button>
      ))}
    </nav>
  );
}
