import { useCallback, useEffect, useRef, useState } from 'react';
import { FrikazPiggyMascot } from './FrikazPiggyMascot';

interface Point {
  x: number;
  y: number;
}

interface HoofPrint {
  id: string;
  x: number;
  y: number;
  angleDeg: number;
  side: 'left' | 'right';
}

interface WalkEventDetail {
  element: HTMLElement;
  onArrive?: () => void;
}

const WALK_NAV_EVENT = 'frikaz:piggy-walk-to';

/**
 * Solicita al cerdito corporativo caminar hasta un elemento de la interfaz
 * dejando huellas progresivas y ejecutar una acción (como abrir un módulo) al llegar.
 */
export function requestPiggyWalkAndNavigate(element: HTMLElement, onArrive: () => void) {
  if (typeof window === 'undefined') {
    onArrive();
    return;
  }
  const reducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    onArrive();
    return;
  }
  window.dispatchEvent(
    new CustomEvent<WalkEventDetail>(WALK_NAV_EVENT, {
      detail: { element, onArrive },
    })
  );
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/**
 * Huella delicada de patita de cerdito (pezuña bipartida) orientada según la dirección del recorrido.
 */
export function PiggyHoofPrintSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} aria-hidden="true">
      {/* Dos dedos principales de la pezuña del cerdito */}
      <path
        d="M11 3.5 C8 3.5, 6 7, 6.5 11.5 C7 14, 9 14.5, 10.5 13 C11.2 12.2, 11.2 5, 11 3.5 Z"
        fill="#0F294A"
      />
      <path
        d="M13 3.5 C16 3.5, 18 7, 17.5 11.5 C17 14, 15 14.5, 13.5 13 C12.8 12.2, 12.8 5, 13 3.5 Z"
        fill="#0F294A"
      />
      {/* Dos puntitos posteriores de apoyo */}
      <circle cx="8" cy="17.5" r="1.9" fill="#0F294A" />
      <circle cx="16" cy="17.5" r="1.9" fill="#0F294A" />
    </svg>
  );
}

/**
 * Mascota animada integrada a la plataforma.
 * Camina de forma natural hacia los elementos seleccionados, deja pequeñas huellas de
 * patitas sincronizadas con el movimiento que se desvanecen suavemente, y dispara
 * callbacks al llegar cuando navega entre apartados.
 */
export function WalkingPiggyCompanion() {
  const [pos, setPos] = useState<Point>(() => {
    if (typeof window === 'undefined') return { x: 112, y: 180 };
    return {
      x: Math.min(window.innerWidth - 76, 110),
      y: Math.min(window.innerHeight - 96, 175),
    };
  });
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [isWalking, setIsWalking] = useState(false);
  const [hoofPrints, setHoofPrints] = useState<HoofPrint[]>([]);

  const livePosRef = useRef<Point>(pos);
  const rafRef = useRef<number | null>(null);
  const lastStepPosRef = useRef<Point>(pos);
  const lastStepTimeRef = useRef<number>(0);
  const stepSideRef = useRef<'left' | 'right'>('left');
  const timeoutsRef = useRef<number[]>([]);

  const animRef = useRef<{
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    startTime: number;
    duration: number;
    onArrive?: () => void;
  } | null>(null);

  const spawnHoofPrint = useCallback((x: number, y: number, dx: number, dy: number) => {
    const angleRad = Math.atan2(dy, dx);
    // Rotar SVG cuya punta apunta hacia arriba (-90deg en rad = 0deg visual)
    const angleDeg = (angleRad * 180) / Math.PI + 90;
    const side = stepSideRef.current;
    stepSideRef.current = side === 'left' ? 'right' : 'left';

    // Desplazamiento lateral alternado izquierdo/derecho respecto a la dirección del paso
    const perpOffset = side === 'left' ? -8 : 8;
    const norm = Math.hypot(dx, dy) || 1;
    const px = x + (-dy / norm) * perpOffset;
    const py = y + 18 + (dx / norm) * perpOffset;

    const id = `hoof-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setHoofPrints((prev) => [...prev.slice(-22), { id, x: px, y: py, angleDeg, side }]);

    const timer = window.setTimeout(() => {
      setHoofPrints((prev) => prev.filter((item) => item.id !== id));
    }, 2800);
    timeoutsRef.current.push(timer);
  }, []);

  const computeTargetForElement = useCallback((interactiveEl: HTMLElement): Point | null => {
    const rect = interactiveEl.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mascotRadius = 56;

    const isBigCard = rect.width > 180 && rect.height > 100;
    let rawTargetX: number;
    let rawTargetY: number;

    if (isBigCard) {
      rawTargetX = Math.min(vw - mascotRadius, rect.left + rect.width * 0.82);
      rawTargetY = Math.max(82, Math.min(vh - 60, rect.top + rect.height * 0.65));
    } else {
      const preferRight = rect.right + 40 < vw - mascotRadius;
      rawTargetX = preferRight
        ? rect.right + 22
        : Math.max(mascotRadius, rect.left - 28);
      rawTargetY = rect.top + Math.min(rect.height * 0.55, 36);
    }

    return {
      x: Math.max(mascotRadius, Math.min(vw - mascotRadius, rawTargetX)),
      y: Math.max(82, Math.min(vh - 60, rawTargetY)),
    };
  }, []);

  const startWalkTo = useCallback(
    (targetX: number, targetY: number, onArrive?: () => void, customMaxMs = 4200) => {
      const reducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const cur = livePosRef.current;
      const dx = targetX - cur.x;
      const dy = targetY - cur.y;
      const dist = Math.hypot(dx, dy);

      if (Math.abs(dx) > 4) {
        setFacing(dx >= 0 ? 'right' : 'left');
      }

      if (reducedMotion || dist < 12) {
        livePosRef.current = { x: targetX, y: targetY };
        setPos({ x: targetX, y: targetY });
        setIsWalking(false);
        if (onArrive) onArrive();
        return;
      }

      // Velocidad pausada, tranquila y natural (~120 px/s) sin aceleraciones repentinas
      const duration = Math.max(1200, Math.min(customMaxMs, (dist / 120) * 1000));
      const nowStart = performance.now();
      lastStepPosRef.current = { ...cur };
      lastStepTimeRef.current = nowStart;
      animRef.current = {
        startX: cur.x,
        startY: cur.y,
        targetX,
        targetY,
        startTime: nowStart,
        duration,
        onArrive,
      };
      setIsWalking(true);

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      const tick = (now: number) => {
        const active = animRef.current;
        if (!active) return;
        const elapsed = now - active.startTime;
        const rawProgress = Math.min(1, elapsed / active.duration);
        const eased = easeInOutSine(rawProgress);

        const nextX = active.startX + (active.targetX - active.startX) * eased;
        const nextY = active.startY + (active.targetY - active.startY) * eased;

        const stepDist = Math.hypot(
          nextX - lastStepPosRef.current.x,
          nextY - lastStepPosRef.current.y
        );
        const sinceLastStep = now - lastStepTimeRef.current;
        // Sincronizar huellas con cada paso lento del ciclo de caminata (~520ms / 42px)
        if (stepDist >= 42 && sinceLastStep >= 420 && rawProgress < 0.94) {
          spawnHoofPrint(
            nextX,
            nextY,
            nextX - lastStepPosRef.current.x,
            nextY - lastStepPosRef.current.y
          );
          lastStepPosRef.current = { x: nextX, y: nextY };
          lastStepTimeRef.current = now;
        }

        livePosRef.current = { x: nextX, y: nextY };
        setPos({ x: nextX, y: nextY });

        if (rawProgress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          const arrivalCallback = active.onArrive;
          animRef.current = null;
          rafRef.current = null;
          setIsWalking(false);
          if (arrivalCallback) arrivalCallback();
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [spawnHoofPrint]
  );

  useEffect(() => {
    const handleCustomWalkNav = (e: Event) => {
      const detail = (e as CustomEvent<WalkEventDetail>).detail;
      if (!detail || !detail.element) return;
      const point = computeTargetForElement(detail.element);
      if (!point) {
        detail.onArrive?.();
        return;
      }
      startWalkTo(point.x, point.y, detail.onArrive, 2200);
    };

    const handleGlobalNavigationClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target || typeof target.closest !== 'function') return;

      const interactiveEl = target.closest(
        'button, [role="button"], [data-piggy-target]'
      ) as HTMLElement | null;
      if (!interactiveEl) return;
      if (interactiveEl.getAttribute('data-piggy-ignore') === 'true') return;
      if (interactiveEl.getAttribute('data-piggy-walk-nav') === 'true') return;
      if (
        (interactiveEl as HTMLButtonElement).disabled ||
        interactiveEl.getAttribute('aria-disabled') === 'true'
      ) {
        return;
      }

      const point = computeTargetForElement(interactiveEl);
      if (!point) return;
      startWalkTo(point.x, point.y);
    };

    const handleResize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const clamped = {
        x: Math.max(48, Math.min(vw - 48, livePosRef.current.x)),
        y: Math.max(74, Math.min(vh - 54, livePosRef.current.y)),
      };
      livePosRef.current = clamped;
      setPos(clamped);
    };

    window.addEventListener(WALK_NAV_EVENT, handleCustomWalkNav);
    document.addEventListener('click', handleGlobalNavigationClick, {
      capture: true,
      passive: true,
    });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener(WALK_NAV_EVENT, handleCustomWalkNav);
      document.removeEventListener('click', handleGlobalNavigationClick, { capture: true });
      window.removeEventListener('resize', handleResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, [computeTargetForElement, startWalkTo]);

  return (
    <>
      {/* Huellas progresivas del cerdito que aparecen al caminar y se desvanecen suavemente */}
      <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true">
        {hoofPrints.map((print) => (
          <div
            key={print.id}
            className="frikaz-hoof-print pointer-events-none absolute left-0 top-0"
            style={{
              left: `${Math.round(print.x)}px`,
              top: `${Math.round(print.y)}px`,
              transform: `translate(-50%, -50%) rotate(${Math.round(print.angleDeg)}deg)`,
            }}
          >
            <PiggyHoofPrintSvg />
          </div>
        ))}
      </div>

      {/* Cerdito corporativo visible caminando por la interfaz */}
      <div
        className="pointer-events-none fixed left-0 top-0 z-40 select-none"
        style={{
          transform: `translate3d(${Math.round(pos.x)}px, ${Math.round(pos.y)}px, 0) translate(-50%, -62%)`,
          willChange: 'transform',
        }}
        aria-hidden="true"
      >
        <FrikazPiggyMascot isWalking={isWalking} facing={facing} size="md" />
      </div>
    </>
  );
}
