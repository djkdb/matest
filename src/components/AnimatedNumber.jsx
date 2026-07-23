import React, { useEffect, useRef, useState } from 'react';

/**
 * 값이 바뀌면 이전 값에서 목표 값까지 부드럽게 카운트업.
 * @param format 표시 포맷 (기본: 반올림 정수)
 */
export default function AnimatedNumber({ value, duration = 900, format = (n) => Math.round(n) }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(0);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const from = fromRef.current;
    if (reduce || from === value) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(from + (value - from) * eased);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <>{format(display)}</>;
}
