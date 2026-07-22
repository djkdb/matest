import React from 'react';

/**
 * 진행률 링. 중앙에 children(라벨) 표시.
 * stroke-dashoffset 트랜지션으로 부드럽게 채워진다.
 */
export default function ProgressRing({ pct, size = 96, stroke = 8, children }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped / 100);
  const center = size / 2;

  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="ring-svg">
        <circle cx={center} cy={center} r={r} fill="none" stroke="var(--ring-track)" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(.22,.61,.36,1)' }}
        />
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  );
}
