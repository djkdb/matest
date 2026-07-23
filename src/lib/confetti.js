// 의존성 없는 초경량 캔버스 컨페티. 축하 순간에만 잠깐 실행되고 스스로 정리한다.
// prefers-reduced-motion 사용자에겐 실행하지 않는다.

function reducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#38bdf8'];

/**
 * @param {object} opts
 *   origin: {x, y} 0~1 비율 (기본 중앙 상단)
 *   count: 입자 수
 *   spread: 퍼짐(px/s 규모)
 */
export function celebrate(opts = {}) {
  if (reducedMotion() || typeof document === 'undefined') return;

  const { origin = { x: 0.5, y: 0.32 }, count = 120, spread = 1 } = opts;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '9999',
  });
  document.body.appendChild(canvas);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const ox = origin.x * W;
  const oy = origin.y * H;
  const particles = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const velocity = (6 + Math.random() * 9) * spread;
    return {
      x: ox,
      y: oy,
      vx: Math.cos(angle) * velocity * (0.6 + Math.random()),
      vy: Math.sin(angle) * velocity - (6 + Math.random() * 6),
      size: 5 + Math.random() * 7,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.4,
      life: 1,
      decay: 0.008 + Math.random() * 0.01,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    };
  });

  const gravity = 0.35;
  const drag = 0.99;
  let raf;

  const frame = () => {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    for (const p of particles) {
      if (p.life <= 0) continue;
      alive = true;
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      p.life -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (alive) {
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
      canvas.remove();
    }
  };
  raf = requestAnimationFrame(frame);

  // 안전장치: 4초 뒤 강제 정리
  setTimeout(() => {
    cancelAnimationFrame(raf);
    if (canvas.isConnected) canvas.remove();
  }, 4000);
}

/** 작은 버스트 (유닛 완료 체크 등) — 특정 화면 좌표(px) 기준 */
export function burstAt(clientX, clientY) {
  if (typeof window === 'undefined') return;
  celebrate({
    origin: { x: clientX / window.innerWidth, y: clientY / window.innerHeight },
    count: 28,
    spread: 0.7,
  });
}
