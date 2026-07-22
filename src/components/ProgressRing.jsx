import React, { useId } from 'react';

/**
 * 그라데이션 스트로크 진행률 링. 중앙에 children(라벨) 표시.
 * stroke-dashoffset 트랜지션으로 부드럽게 채워진다.
 */
export default function ProgressRing({ pct, size = 96, stroke = 9, children }) {
  const id = useId().replace(/:/g, '');
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped / 100);
  const center = size / 2;

  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="ring-svg">
        <defs>
          <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--primary)" />
            <stop offset="1" stopColor="var(--accent-2, #8b5cf6)" />
          </linearGradient>
        </defs>
        <circle cx={center} cy={center} r={r} fill="none" stroke="var(--ring-track)" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={`url(#ring-${id})`}
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
