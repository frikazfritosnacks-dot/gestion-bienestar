import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ChipSvg, ChipVariant } from './ChipGraphics';

interface BurstParticle {
  id: string;
  variant: ChipVariant;
  originX: number;
  originY: number;
  sizePx: number;
  durationMs: number;
  delayMs: number;
  dx: number;
  jumpY: number;
  fallY: number;
  rotStart: number;
  rotPeak: number;
  rotEnd: number;
}

interface ChipBurst {
  id: number;
  particles: BurstParticle[];
}

const CHIP_VARIANTS: ChipVariant[] = ['ondulada', 'lisa', 'redonda', 'chip'];
const MAX_ACTIVE_BURSTS = 4;
const THROTTLE_MS = 75;

function createBurstParticles(
  burstId: number,
  originX: number,
  originY: number,
  buttonWidth: number,
  isMobile: boolean
): BurstParticle[] {
  const isCompactButton = buttonWidth > 0 && buttonWidth < 46;
  const count = isCompactButton ? 4 : isMobile ? 5 : 6;

  return Array.from({ length: count }, (_, idx) => {
    const spreadRatio = count > 1 ? idx / (count - 1) - 0.5 : 0; // -0.5 .. +0.5
    const jitter = ((idx * 17 + burstId * 13) % 15) - 7;
    const dx = Math.round(spreadRatio * (isCompactButton ? 64 : 92) + jitter);
    const jumpY = -(34 + ((idx * 11 + burstId * 7) % 30)); // -34px .. -63px upward
    const fallY = 8 + ((idx * 9 + burstId * 5) % 18); // gentle drop below origin before vanishing

    const sizePx = isCompactButton
      ? 15 + ((idx + burstId) % 4)
      : isMobile
        ? 17 + ((idx * 3 + burstId) % 5)
        : 18 + ((idx * 3 + burstId) % 6);

    // 0.62s - 1.02s duration (+ 0-70ms delay => ~0.62s - 1.09s total)
    const durationMs = 640 + ((idx * 89 + burstId * 53) % 380);
    const delayMs = ((idx * 23 + burstId * 11) % 70);

    const dir = spreadRatio === 0 ? (idx % 2 === 0 ? 1 : -1) : Math.sign(spreadRatio);
    const rotStart = ((idx * 29 + burstId * 17) % 40) - 20;
    const rotPeak = rotStart + dir * (45 + ((idx * 19) % 45));
    const rotEnd = rotPeak + dir * (55 + ((idx * 23) % 55));

    const variant = CHIP_VARIANTS[(idx + burstId) % CHIP_VARIANTS.length];

    return {
      id: `pop-${burstId}-${idx}`,
      variant,
      originX,
      originY,
      sizePx,
      durationMs,
      delayMs,
      dx,
      jumpY,
      fallY,
      rotStart,
      rotPeak,
      rotEnd,
    };
  });
}

/**
 * Capa global no bloqueante que detecta clics sobre cualquier botón de la aplicación
 * (navegación, formularios, tablas, modales) y dispara papitas fritas saltando desde su ubicación.
 */
export function ChipButtonBurstOverlay() {
  const [bursts, setBursts] = useState<ChipBurst[]>([]);
  const nextIdRef = useRef(1);
  const lastClickAtRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      if (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }

      const target = event.target as Element | null;
      if (!target || typeof target.closest !== 'function') return;

      const buttonEl = target.closest('button, [role="button"]') as HTMLElement | null;
      if (!buttonEl) return;

      if (
        (buttonEl as HTMLButtonElement).disabled ||
        buttonEl.getAttribute('aria-disabled') === 'true'
      ) {
        return;
      }

      const now = performance.now();
      if (now - lastClickAtRef.current < THROTTLE_MS) return;
      lastClickAtRef.current = now;

      const rect = buttonEl.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      // Posición exacta del clic dentro del botón (o centro superior si se activó con teclado)
      const hasPointerCoords =
        event.clientX > 0 &&
        event.clientY > 0 &&
        event.clientX >= rect.left - 4 &&
        event.clientX <= rect.right + 4 &&
        event.clientY >= rect.top - 4 &&
        event.clientY <= rect.bottom + 4;

      const rawX = hasPointerCoords ? event.clientX : rect.left + rect.width / 2;
      const rawY = hasPointerCoords
        ? Math.min(event.clientY, rect.top + Math.min(rect.height * 0.45, 18))
        : rect.top + Math.min(rect.height * 0.35, 14);

      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      const originX = Math.max(24, Math.min(vw - 24, rawX));
      const originY = Math.max(24, Math.min(vh - 24, rawY));

      const burstId = nextIdRef.current++;
      const isMobile = vw < 640;
      const particles = createBurstParticles(burstId, originX, originY, rect.width, isMobile);

      setBursts((prev) => [...prev.slice(-(MAX_ACTIVE_BURSTS - 1)), { id: burstId, particles }]);

      const timer = window.setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== burstId));
      }, 1180);
      timersRef.current.push(timer);
    };

    document.addEventListener('click', handleGlobalClick, { capture: true, passive: true });
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  if (bursts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden select-none"
      aria-hidden="true"
    >
      {bursts.map((burst) =>
        burst.particles.map((p) => (
          <div
            key={p.id}
            className="frikaz-chip-particle fixed"
            style={
              {
                left: `${p.originX}px`,
                top: `${p.originY}px`,
                width: `${p.sizePx}px`,
                height: `${p.sizePx}px`,
                marginLeft: `${-p.sizePx / 2}px`,
                marginTop: `${-p.sizePx / 2}px`,
                animationDuration: `${p.durationMs}ms`,
                animationDelay: `${p.delayMs}ms`,
                '--chip-dx': `${p.dx}px`,
                '--chip-jump-y': `${p.jumpY}px`,
                '--chip-fall-y': `${p.fallY}px`,
                '--rot-start': `${p.rotStart}deg`,
                '--rot-peak': `${p.rotPeak}deg`,
                '--rot-end': `${p.rotEnd}deg`,
              } as CSSProperties
            }
          >
            <ChipSvg variant={p.variant} className="h-full w-full drop-shadow-xs" />
          </div>
        ))
      )}
    </div>
  );
}
