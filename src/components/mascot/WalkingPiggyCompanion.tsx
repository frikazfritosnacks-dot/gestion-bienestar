import { useCallback, useEffect, useRef, useState } from 'react';
import { FrikazPiggyMascot, PiggyPose } from './FrikazPiggyMascot';

export interface Point {
  x: number;
  y: number;
}

export interface RectBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type PiggySize = 'xs' | 'sm' | 'md';

export interface ModulePerchCandidate {
  x: number;
  y: number;
  size: PiggySize;
  placement: 'top' | 'left' | 'right' | 'peripheral';
  restFacing: 'left' | 'right';
  overlapArea: number;
  clearance: number;
}

interface HoofPrint {
  id: string;
  x: number;
  y: number;
  angleDeg: number;
  side: 'left' | 'right';
}

interface ElementSnapshot {
  rect: RectBox;
  inHeader: boolean;
  inMobileDrawer: boolean;
  inTab: boolean;
  isSectionSwitch: boolean;
  isSubmoduleSwitch: boolean;
}

interface WalkEventDetail extends Partial<ElementSnapshot> {
  element: HTMLElement;
  onArrive?: () => void;
}

interface ResolvedTarget {
  element: HTMLElement | null;
  isModal: boolean;
  signature: string;
}

export interface WalkingPiggyCompanionProps {
  /** Clave global sincronizada con el módulo, submódulo, dimensión o ficha activa */
  activeContextKey?: string;
}

const WALK_NAV_EVENT = 'frikaz:piggy-walk-to';

/**
 * Dimensiones visuales exactas por tamaño:
 * - Para la pose sentada (896x1200):
 *   - seatRatio = 0.722 -> altura sobre el borde = H * (0.722 - 0.135) = 0.587 * H
 *   - piernas colgando bajo el borde = H * (0.935 - 0.722) = 0.213 * H
 */
export const SITTING_SPRITE_METRICS: Record<
  PiggySize,
  { width: number; height: number; aboveSeatH: number; hangBelowH: number }
> = {
  md: { width: 110, height: 147, aboveSeatH: 86, hangBelowH: 31 },
  sm: { width: 84, height: 112, aboveSeatH: 66, hangBelowH: 24 },
  xs: { width: 62, height: 83, aboveSeatH: 49, hangBelowH: 18 },
};

const POSE_ANCHOR_Y_PCT: Record<PiggyPose, number> = {
  standing: 91,
  walking: 91,
  climbing: 84,
  lowering: 72.2,
  sitting: 72.2,
};

function snapshotElementMeta(element: HTMLElement): ElementSnapshot {
  const r = element.getBoundingClientRect();
  const scrollX = typeof window !== 'undefined' ? window.scrollX : 0;
  const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
  const inHeader = Boolean(element.closest('header'));
  const inMobileDrawer = Boolean(element.closest('[data-mobile-drawer="true"]'));
  const inTab = Boolean(element.closest('[role="tab"], [role="tablist"]'));
  const isSectionSwitch =
    element.getAttribute('data-piggy-walk-nav') === 'true' ||
    element.getAttribute('data-piggy-section-nav') === 'true';
  const isSubmoduleSwitch =
    !isSectionSwitch &&
    (inTab ||
      element.getAttribute('data-piggy-submodule') === 'true' ||
      element.getAttribute('data-piggy-target') === 'sub' ||
      element.getAttribute('data-piggy-target') === 'true' ||
      Boolean(element.closest('main')));

  return {
    rect: {
      left: r.left + scrollX,
      top: r.top + scrollY,
      right: r.right + scrollX,
      bottom: r.bottom + scrollY,
    },
    inHeader,
    inMobileDrawer,
    inTab,
    isSectionSwitch,
    isSubmoduleSwitch,
  };
}

/**
 * Solicita al cerdito corporativo acompañar la navegación:
 * se levanta si estaba sentado, gira y camina hacia el nuevo módulo,
 * sube por el borde superior y se sienta erguido encima de él.
 */
export function requestPiggyWalkAndNavigate(element: HTMLElement, onArrive?: () => void) {
  if (typeof window === 'undefined') {
    onArrive?.();
    return;
  }
  const meta = snapshotElementMeta(element);
  window.dispatchEvent(
    new CustomEvent<WalkEventDetail>(WALK_NAV_EVENT, {
      detail: {
        element,
        ...meta,
        onArrive,
      },
    })
  );
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function computeRectOverlapArea(a: RectBox, b: RectBox): number {
  const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return ox * oy;
}

/**
 * Caja de colisión real de la pose sentada apoyada en (x, seatY = borde superior del módulo):
 * - Parte superior erguida: [seatY - aboveSeatH, seatY]
 * - Pantorrillas + zapatos colgando suavemente sobre el borde: [seatY, seatY + hangBelowH]
 */
export function getSeatedFootprint(x: number, seatY: number, size: PiggySize): {
  upperBox: RectBox;
  hangBox: RectBox;
  fullBox: RectBox;
} {
  const { width, aboveSeatH, hangBelowH } = SITTING_SPRITE_METRICS[size];
  const halfW = width * 0.44;
  return {
    upperBox: {
      left: x - halfW,
      right: x + halfW,
      top: seatY - aboveSeatH,
      bottom: seatY - 1,
    },
    hangBox: {
      left: x - halfW * 0.85,
      right: x + halfW * 0.85,
      top: seatY + 2,
      bottom: seatY + hangBelowH,
    },
    fullBox: {
      left: x - halfW,
      right: x + halfW,
      top: seatY - aboveSeatH,
      bottom: seatY + hangBelowH,
    },
  };
}

/**
 * Calcula la mejor posición horizontal encima del borde superior del módulo seleccionado (`y = firstCardRect.top`)
 * para que la cadera/nalgas queden apoyadas exactamente sobre el módulo, el torso erguido arriba libre
 * (respetando la altura del encabezado y controles superiores) y los zapatos colgando sin tapar títulos ni botones.
 */
export function selectSmartModulePerch(params: {
  vw: number;
  vh: number;
  headerBottomDoc: number;
  moduleRect: RectBox;
  firstCardRect: RectBox;
  obstacles: RectBox[];
  anchorX: number;
  currentX: number;
}): ModulePerchCandidate {
  const { vw, headerBottomDoc, firstCardRect, obstacles, anchorX, currentX } = params;

  const sizeOrder: PiggySize[] =
    vw >= 1024 ? ['md', 'sm', 'xs'] : vw >= 640 ? ['sm', 'xs'] : ['xs'];

  const seatY = firstCardRect.top;
  const moduleWidth = Math.max(200, firstCardRect.right - firstCardRect.left);
  const filteredSizes: PiggySize[] =
    moduleWidth < 460 ? sizeOrder.filter((s) => s !== 'md') : sizeOrder;

  const candidates: ModulePerchCandidate[] = [];
  const cardCenterX = (firstCardRect.left + firstCardRect.right) * 0.5;

  for (const size of filteredSizes) {
    const { width, aboveSeatH } = SITTING_SPRITE_METRICS[size];
    const halfW = width * 0.5;
    const minX = Math.max(halfW + 12, firstCardRect.left + halfW + 18);
    const maxX = Math.min(vw - halfW - 12, firstCardRect.right - halfW - 18);
    if (maxX < minX) continue;

    const xSet = new Set<number>();
    const preferredAnchors = [
      firstCardRect.right - halfW - 32,
      firstCardRect.left + moduleWidth * 0.68,
      firstCardRect.left + moduleWidth * 0.55,
      cardCenterX,
      Math.max(minX, Math.min(maxX, anchorX)),
      firstCardRect.left + moduleWidth * 0.82,
      minX + 18,
    ];
    for (const px of preferredAnchors) {
      xSet.add(Math.round(Math.max(minX, Math.min(maxX, px))));
    }
    const step = Math.max(24, Math.floor((maxX - minX) / 14));
    for (let x = minX; x <= maxX; x += step) {
      xSet.add(Math.round(x));
    }

    for (const x of xSet) {
      const { upperBox, hangBox } = getSeatedFootprint(x, seatY, size);

      let ceilingY = headerBottomDoc;
      for (const ob of obstacles) {
        if (ob.bottom <= seatY + 2 && ob.right > upperBox.left && ob.left < upperBox.right) {
          if (ob.bottom > ceilingY) ceilingY = ob.bottom;
        }
      }

      const verticalClearance = seatY - ceilingY;
      const requiredClearance = Math.round(SITTING_SPRITE_METRICS[size].height * 0.722) - 4;
      const fitsUnderCeiling = verticalClearance >= requiredClearance;

      let overlapArea = 0;
      if (!fitsUnderCeiling) {
        overlapArea += (requiredClearance - verticalClearance) * width * 1.4;
      }
      for (const ob of obstacles) {
        overlapArea += computeRectOverlapArea(upperBox, ob) * 1.5;
        overlapArea += computeRectOverlapArea(hangBox, ob);
      }

      const restFacing: 'left' | 'right' = x >= cardCenterX ? 'left' : 'right';

      candidates.push({
        x,
        y: Math.round(seatY),
        size,
        placement: 'top',
        restFacing,
        overlapArea,
        clearance: verticalClearance,
      });
    }
  }

  const sizeRank: Record<PiggySize, number> = { md: 3, sm: 2, xs: 1 };

  candidates.sort((a, b) => {
    const aClean = a.overlapArea <= 60;
    const bClean = b.overlapArea <= 60;
    if (aClean !== bClean) return aClean ? -1 : 1;

    if (!aClean && !bClean && Math.abs(a.overlapArea - b.overlapArea) > 90) {
      return a.overlapArea - b.overlapArea;
    }

    if (sizeRank[a.size] !== sizeRank[b.size]) {
      return sizeRank[b.size] - sizeRank[a.size];
    }

    const aIsRightHalf = a.x >= cardCenterX ? 0 : 1;
    const bIsRightHalf = b.x >= cardCenterX ? 0 : 1;
    if (aIsRightHalf !== bIsRightHalf) {
      return aIsRightHalf - bIsRightHalf;
    }

    const anchorDiff = Math.abs(a.x - anchorX) - Math.abs(b.x - anchorX);
    if (Math.abs(anchorDiff) > 45) return anchorDiff;

    return Math.abs(a.x - currentX) - Math.abs(b.x - currentX);
  });

  return (
    candidates[0] || {
      x: Math.round(Math.max(72, Math.min(vw - 72, firstCardRect.right - 84))),
      y: Math.round(seatY),
      size: vw >= 640 ? 'sm' : 'xs',
      placement: 'top',
      restFacing: 'left',
      overlapArea: 0,
      clearance: seatY - headerBottomDoc,
    }
  );
}

function isVisibleContainer(el: HTMLElement | null): el is HTMLElement {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 60 && r.height > 28;
}

/**
 * Resuelve automáticamente el contenedor real del módulo, submódulo, ventana modal
 * o formulario abierto actualmente en pantalla (incluyendo módulos futuros).
 */
export function resolveActiveSurfaceTarget(
  preferSubmodule: boolean,
  activeContextKey?: string
): ResolvedTarget {
  if (typeof document === 'undefined') {
    return { element: null, isModal: false, signature: 'ssr' };
  }

  // 1. Ventanas modales / diálogos activos (excluyendo ConfirmModal de borrado o drawer móvil)
  const explicitModal = document.querySelector(
    '[data-piggy-modal-surface="true"]'
  ) as HTMLElement | null;
  if (isVisibleContainer(explicitModal)) {
    const ctx = explicitModal.getAttribute('data-piggy-context') || explicitModal.tagName;
    return {
      element: explicitModal,
      isModal: true,
      signature: `modal:${ctx}`,
    };
  }

  const overlayDialogs = Array.from(
    document.querySelectorAll('.fixed.inset-0.z-50')
  ) as HTMLElement[];
  for (let i = overlayDialogs.length - 1; i >= 0; i--) {
    const overlay = overlayDialogs[i];
    if (
      overlay.getAttribute('data-piggy-modal-ignore') === 'true' ||
      overlay.getAttribute('data-mobile-drawer') === 'true'
    ) {
      continue;
    }
    const card = overlay.querySelector('form, div[class*="rounded"]') as HTMLElement | null;
    if (isVisibleContainer(card)) {
      const ctx =
        card.getAttribute('data-piggy-context') ||
        card.querySelector('h2, h3')?.textContent?.trim().slice(0, 40) ||
        card.tagName;
      return {
        element: card,
        isModal: true,
        signature: `modal:${ctx}`,
      };
    }
  }

  // 2. Contenedor principal dentro de <main>
  const mainEl = document.querySelector('main');
  if (!mainEl) {
    return { element: null, isModal: false, signature: `${activeContextKey || ''}:nomain` };
  }

  // 2a. Formularios inline abiertos (Agregar norma, Agregar término, Agregar actividad, Agregar recurso...)
  const priorityForm = mainEl.querySelector(
    '[data-submodule-surface="true"][data-piggy-priority="form"]'
  ) as HTMLElement | null;
  if (isVisibleContainer(priorityForm)) {
    const ctx = priorityForm.getAttribute('data-piggy-context') || 'inline-form';
    return {
      element: priorityForm,
      isModal: false,
      signature: `${activeContextKey || ''}:form:${ctx}`,
    };
  }

  // Determinar si el contexto actual corresponde a un submódulo activo específico
  const isNonDefaultSubroute = Boolean(
    activeContextKey &&
      ((activeContextKey.startsWith('manual:') && activeContextKey !== 'manual:introduccion') ||
        (activeContextKey.startsWith('programas:') &&
          activeContextKey !== 'programas:general:ALL:list'))
  );

  if (preferSubmodule || isNonDefaultSubroute) {
    const subSurfaces = Array.from(
      mainEl.querySelectorAll('[data-submodule-surface="true"]')
    ) as HTMLElement[];
    const visibleSub = subSurfaces.find((el) => isVisibleContainer(el)) || null;
    if (visibleSub) {
      const ctx = visibleSub.getAttribute('data-piggy-context') || visibleSub.tagName;
      return {
        element: visibleSub,
        isModal: false,
        signature: `${activeContextKey || ''}:sub:${ctx}`,
      };
    }
  }

  // 2b. Contenedor del módulo principal o fallback universal para módulos actuales/futuros
  const modCandidates = Array.from(
    mainEl.querySelectorAll('[data-module-surface="true"], [data-submodule-surface="true"], section, article')
  ) as HTMLElement[];
  const visibleMod = modCandidates.find((el) => isVisibleContainer(el)) || null;
  const ctx = visibleMod?.getAttribute('data-piggy-context') || visibleMod?.tagName || 'main';
  return {
    element: visibleMod,
    isModal: false,
    signature: `${activeContextKey || ''}:mod:${ctx}`,
  };
}

function collectModuleLayout(
  resolved: ResolvedTarget,
  overrideHeaderBottomDoc?: number
): {
  headerHeight: number;
  headerBottomDoc: number;
  moduleRect: RectBox;
  firstCardRect: RectBox;
  obstacles: RectBox[];
} {
  const vw = window.innerWidth;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  const headerEl = document.querySelector('header');
  const hRect = headerEl ? headerEl.getBoundingClientRect() : null;
  const headerHeight = hRect ? Math.max(60, hRect.height) : 68;
  const headerBottomDoc =
    overrideHeaderBottomDoc !== undefined
      ? overrideHeaderBottomDoc
      : resolved.isModal
        ? scrollY + 4
        : hRect
          ? Math.max(60, hRect.bottom + scrollY)
          : 68 + scrollY;

  const mainEl = document.querySelector('main');
  const scopeRoot = resolved.isModal
    ? resolved.element
    : mainEl;

  if (!scopeRoot) {
    const fallbackRect = { left: 24, top: headerBottomDoc + 96, right: vw - 24, bottom: 600 };
    return {
      headerHeight,
      headerBottomDoc,
      moduleRect: fallbackRect,
      firstCardRect: fallbackRect,
      obstacles: [],
    };
  }

  const mRect = (mainEl || scopeRoot).getBoundingClientRect();
  const moduleRect: RectBox = {
    left: mRect.left + scrollX,
    top: mRect.top + scrollY,
    right: mRect.right + scrollX,
    bottom: mRect.bottom + scrollY,
  };

  const fRect = resolved.element ? resolved.element.getBoundingClientRect() : mRect;
  const firstCardRect: RectBox = {
    left: fRect.left + scrollX,
    top: fRect.top + scrollY,
    right: fRect.right + scrollX,
    bottom: fRect.bottom + scrollY,
  };

  const obstacles: RectBox[] = [];
  const pushDocRect = (
    r: { left: number; top: number; right: number; bottom: number; width: number; height: number },
    pad = 4
  ) => {
    if (r.width <= 2 || r.height <= 2) return;
    const dTop = r.top + scrollY;
    const dBottom = r.bottom + scrollY;
    const dLeft = r.left + scrollX;
    const dRight = r.right + scrollX;
    if (dBottom <= headerBottomDoc) return;
    obstacles.push({
      left: Math.max(0, dLeft - pad),
      top: Math.max(0, dTop - pad),
      right: Math.min(vw, dRight + pad),
      bottom: dBottom + pad,
    });
  };

  const solidNodes = scopeRoot.querySelectorAll(
    'table, form, input, textarea, select, button, [role="tab"], [role="button"], canvas, svg.recharts-surface, [data-quality-box="true"], img'
  );
  solidNodes.forEach((node) => {
    if ((node as HTMLElement).closest('[data-piggy-companion="true"]')) return;
    pushDocRect(node.getBoundingClientRect(), 6);
  });

  const textNodes = scopeRoot.querySelectorAll(
    'h1, h2, h3, h4, p, dt, dd, li, th, td, label, span'
  );
  const range = document.createRange();
  textNodes.forEach((el) => {
    if (!el.textContent || !el.textContent.trim()) return;
    if (el.tagName === 'SPAN' && el.closest('button, a')) return;
    const blockRect = el.getBoundingClientRect();
    if (blockRect.height <= 2 || blockRect.width <= 2) return;
    try {
      range.selectNodeContents(el);
      const textRect = range.getBoundingClientRect();
      if (textRect.width > 2 && textRect.height > 2) {
        pushDocRect(textRect, 8);
      } else {
        pushDocRect(blockRect, 6);
      }
    } catch {
      pushDocRect(blockRect, 6);
    }
  });

  return { headerHeight, headerBottomDoc, moduleRect, firstCardRect, obstacles };
}

/**
 * Huella delicada de patita de cerdito orientada según el recorrido.
 */
export function PiggyHoofPrintSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} aria-hidden="true">
      <path
        d="M11 3.5 C8 3.5, 6 7, 6.5 11.5 C7 14, 9 14.5, 10.5 13 C11.2 12.2, 11.2 5, 11 3.5 Z"
        fill="#0F294A"
      />
      <path
        d="M13 3.5 C16 3.5, 18 7, 17.5 11.5 C17 14, 15 14.5, 13.5 13 C12.8 12.2, 12.8 5, 13 3.5 Z"
        fill="#0F294A"
      />
      <circle cx="8" cy="17.5" r="1.9" fill="#0F294A" />
      <circle cx="16" cy="17.5" r="1.9" fill="#0F294A" />
    </svg>
  );
}

/**
 * Acompañante visual global oficial de Frikaz S.A.S.:
 * Se sincroniza automáticamente con el módulo, submódulo, dimensión, formulario o modal abierto
 * en toda la plataforma. Cada cambio ejecuta: levantarse -> caminar -> aproximarse -> subir ->
 * acomodarse -> sentarse erguido encima del borde superior real del contenedor y permanecer allí.
 */
export function WalkingPiggyCompanion({ activeContextKey = 'inicio' }: WalkingPiggyCompanionProps) {
  const initialPoint: Point =
    typeof window === 'undefined'
      ? { x: 140, y: 148 }
      : {
          x: Math.max(70, Math.min(window.innerWidth - 72, 140)),
          y: 148,
        };

  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [pitchDeg, setPitchDeg] = useState<number>(0);
  const [piggySize, setPiggySize] = useState<PiggySize>(() =>
    typeof window !== 'undefined' && window.innerWidth < 640
      ? 'xs'
      : typeof window !== 'undefined' && window.innerWidth < 1024
        ? 'sm'
        : 'md'
  );
  const [pose, setPose] = useState<PiggyPose>('standing');
  const [onModalLayer, setOnModalLayer] = useState<boolean>(false);
  const [hoofPrints, setHoofPrints] = useState<HoofPrint[]>([]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const livePosRef = useRef<Point>(initialPoint);
  const poseRef = useRef<PiggyPose>('standing');
  const currentSizeRef = useRef<PiggySize>(piggySize);
  const facingRef = useRef<'left' | 'right'>('right');
  const rafRef = useRef<number | null>(null);
  const stabilityRafRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const resizeDebounceRef = useRef<number | null>(null);
  const mutationRafRef = useRef<number | null>(null);
  const lastStepPosRef = useRef<Point>(initialPoint);
  const lastStepTimeRef = useRef<number>(0);
  const stepSideRef = useRef<'left' | 'right'>('left');
  const hoofTimersRef = useRef<number[]>([]);
  const walkSequenceRef = useRef<number>(0);

  const preferSubmoduleRef = useRef<boolean>(false);
  const waitingForTargetRef = useRef<boolean>(false);
  const activeContextRef = useRef<string>(activeContextKey);
  const perchedElRef = useRef<HTMLElement | null>(null);
  const perchedIsModalRef = useRef<boolean>(false);
  const lastSignatureRef = useRef<string>('');
  const lastClickAnchorRef = useRef<{
    rect: RectBox;
    inHeader: boolean;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    activeContextRef.current = activeContextKey;
  }, [activeContextKey]);

  const applyTransform = useCallback((x: number, y: number, activePose: PiggyPose) => {
    livePosRef.current = { x, y };
    if (wrapperRef.current) {
      const anchorY = POSE_ANCHOR_Y_PCT[activePose] ?? 91;
      wrapperRef.current.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, -${anchorY}%)`;
    }
  }, []);

  const updatePose = useCallback(
    (nextPose: PiggyPose) => {
      poseRef.current = nextPose;
      setPose(nextPose);
      applyTransform(livePosRef.current.x, livePosRef.current.y, nextPose);
    },
    [applyTransform]
  );

  const spawnHoofPrint = useCallback((x: number, y: number, dx: number, dy: number) => {
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI + 90;
    const side = stepSideRef.current;
    stepSideRef.current = side === 'left' ? 'right' : 'left';

    const perpOffset = side === 'left' ? -8 : 8;
    const norm = Math.hypot(dx, dy) || 1;
    const px = x + (-dy / norm) * perpOffset;
    const py = y - 3 + (dx / norm) * perpOffset;

    const id = `hoof-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setHoofPrints((prev) => [...prev.slice(-15), { id, x: px, y: py, angleDeg, side }]);

    const timer = window.setTimeout(() => {
      setHoofPrints((prev) => prev.filter((item) => item.id !== id));
    }, 2400);
    hoofTimersRef.current.push(timer);
  }, []);

  const cancelOngoingMotion = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (stabilityRafRef.current !== null) {
      cancelAnimationFrame(stabilityRafRef.current);
      stabilityRafRef.current = null;
    }
    while (timersRef.current.length > 0) {
      const tid = timersRef.current.pop();
      if (tid !== undefined) window.clearTimeout(tid);
    }
  }, []);

  const scheduleStep = useCallback((fn: () => void, delayMs: number, seqId: number) => {
    const tid = window.setTimeout(() => {
      if (walkSequenceRef.current !== seqId) return;
      fn();
    }, delayMs);
    timersRef.current.push(tid);
  }, []);

  const animatePositionTo = useCallback(
    (
      targetX: number,
      targetY: number,
      durationMs: number,
      activePose: PiggyPose,
      options: {
        seqId: number;
        easing?: (t: number) => number;
        spawnPrints?: boolean;
        arcLiftPx?: number;
        onComplete?: () => void;
      }
    ) => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const startX = livePosRef.current.x;
      const startY = livePosRef.current.y;
      const startTime = performance.now();
      const easing = options.easing ?? easeInOutSine;
      const arcLift = options.arcLiftPx ?? 0;
      lastStepPosRef.current = { x: startX, y: startY };
      lastStepTimeRef.current = startTime;

      const tick = (now: number) => {
        if (walkSequenceRef.current !== options.seqId) {
          rafRef.current = null;
          return;
        }
        const elapsed = now - startTime;
        const rawProgress = durationMs <= 0 ? 1 : Math.min(1, elapsed / durationMs);
        const eased = easing(rawProgress);

        const nextX = startX + (targetX - startX) * eased;
        const arcOffset = arcLift !== 0 ? -Math.sin(Math.PI * rawProgress) * arcLift : 0;
        const nextY = startY + (targetY - startY) * eased + arcOffset;

        if (options.spawnPrints) {
          const stepDist = Math.hypot(
            nextX - lastStepPosRef.current.x,
            nextY - lastStepPosRef.current.y
          );
          const sinceLastStep = now - lastStepTimeRef.current;
          if (stepDist >= 28 && sinceLastStep >= 340 && rawProgress < 0.94) {
            spawnHoofPrint(
              nextX,
              nextY,
              nextX - lastStepPosRef.current.x,
              nextY - lastStepPosRef.current.y
            );
            lastStepPosRef.current = { x: nextX, y: nextY };
            lastStepTimeRef.current = now;
          }
        }

        applyTransform(nextX, nextY, activePose);

        if (rawProgress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
          options.onComplete?.();
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [applyTransform, spawnHoofPrint]
  );

  /**
   * Secuencia progresiva completa sobre un contenedor real resuelto:
   * caminar -> detenerse frente al contenedor -> aproximarse al borde ->
   * subir apoyando manos y elevando la pierna -> acomodarse -> bajar la cadera -> sentarse erguido.
   */
  const runClimbAndSitSequence = useCallback(
    (
      perch: ModulePerchCandidate,
      targetEl: HTMLElement | null,
      isModal: boolean,
      seqId: number,
      onArrive?: () => void
    ) => {
      if (walkSequenceRef.current !== seqId) return;

      perchedElRef.current = targetEl;
      perchedIsModalRef.current = isModal;
      setOnModalLayer(isModal);

      const vw = window.innerWidth;
      const cur = livePosRef.current;
      const approachSide = cur.x <= perch.x ? -1 : 1;
      const approachOffsetX = currentSizeRef.current === 'xs' ? 38 : 52;
      const approachX = Math.max(36, Math.min(vw - 36, perch.x + approachSide * approachOffsetX));
      const approachY = perch.y + 42;
      const edgeX = Math.max(36, Math.min(vw - 36, perch.x + approachSide * 18));
      const edgeClimbStartY = perch.y + 38;

      const distToApproach = Math.hypot(approachX - cur.x, approachY - cur.y);
      const walkDuration = Math.max(480, Math.min(1550, (distToApproach / 180) * 1000));

      const dirToApproach: 'left' | 'right' = approachX >= cur.x ? 'right' : 'left';
      facingRef.current = dirToApproach;
      setFacing(dirToApproach);
      setPitchDeg(0);

      // Etapa 1: Camina hacia el contenedor del módulo o submódulo seleccionado
      updatePose('walking');
      animatePositionTo(approachX, approachY, walkDuration, 'walking', {
        seqId,
        spawnPrints: true,
        onComplete: () => {
          // Etapa 2: Se detiene erguido frente al contenedor
          setPitchDeg(0);
          updatePose('standing');
          const climbFacing: 'left' | 'right' = perch.x >= approachX ? 'right' : 'left';
          facingRef.current = climbFacing;
          setFacing(climbFacing);

          scheduleStep(() => {
            // Etapa 3: Se aproxima suavemente al borde superior
            updatePose('walking');
            animatePositionTo(edgeX, edgeClimbStartY, 165, 'walking', {
              seqId,
              easing: easeOutCubic,
              onComplete: () => {
                // Etapa 4 y 5: Subida realista apoyando manos y piernas hasta la superficie
                updatePose('climbing');
                currentSizeRef.current = perch.size;
                setPiggySize(perch.size);

                animatePositionTo(perch.x, perch.y + 8, 470, 'climbing', {
                  seqId,
                  easing: easeInOutSine,
                  arcLiftPx: 14,
                  onComplete: () => {
                    // Recalcula la coordenada exacta viva del contenedor para contacto perfecto sin flotar
                    const liveTarget =
                      targetEl && document.contains(targetEl) && isVisibleContainer(targetEl)
                        ? targetEl
                        : resolveActiveSurfaceTarget(
                            preferSubmoduleRef.current,
                            activeContextRef.current
                          ).element;

                    let exactSeatY = perch.y;
                    let exactSeatX = perch.x;
                    if (liveTarget) {
                      const lr = liveTarget.getBoundingClientRect();
                      const halfW = SITTING_SPRITE_METRICS[perch.size].width * 0.5;
                      const minX = Math.max(halfW + 12, lr.left + window.scrollX + halfW + 16);
                      const maxX = Math.min(
                        window.innerWidth - halfW - 12,
                        lr.right + window.scrollX - halfW - 16
                      );
                      exactSeatY = Math.round(lr.top + window.scrollY);
                      if (maxX >= minX) {
                        exactSeatX = Math.round(Math.max(minX, Math.min(maxX, perch.x)));
                      }
                      perchedElRef.current = liveTarget;
                    }

                    // Etapa 6: Acomoda el cuerpo erguido sobre el borde superior
                    applyTransform(exactSeatX, exactSeatY - 8, 'lowering');
                    updatePose('lowering');

                    scheduleStep(() => {
                      // Etapa 7: Flexiona las rodillas y apoya la cadera sobre la superficie
                      animatePositionTo(exactSeatX, exactSeatY, 230, 'lowering', {
                        seqId,
                        easing: easeOutCubic,
                        onComplete: () => {
                          // Etapa 8: Permanece sentado erguido encima del módulo sin devolverse
                          setPitchDeg(0);
                          facingRef.current = perch.restFacing;
                          setFacing(perch.restFacing);
                          updatePose('sitting');
                          applyTransform(exactSeatX, exactSeatY, 'sitting');
                          onArrive?.();
                        },
                      });
                    }, 80, seqId);
                  },
                });
              },
            });
          }, 100, seqId);
        },
      });
    },
    [animatePositionTo, applyTransform, scheduleStep, updatePose]
  );

  /**
   * Espera mediante requestAnimationFrame a que el contenedor destino esté montado y estable
   * (e.g. al concluir transiciones AnimatePresence) antes de calcular el borde exacto de subida.
   */
  const waitForStableTargetAndClimb = useCallback(
    (
      seqId: number,
      preferSubmodule: boolean,
      anchorCenterX: number,
      onArrive?: () => void
    ) => {
      const startedAt = performance.now();
      let lastTop: number | null = null;
      let lastLeft: number | null = null;
      let stableFrames = 0;

      const checkFrame = () => {
        if (walkSequenceRef.current !== seqId) return;
        const resolved = resolveActiveSurfaceTarget(preferSubmodule, activeContextRef.current);
        const elapsed = performance.now() - startedAt;

        if (resolved.element) {
          const r = resolved.element.getBoundingClientRect();
          const curTop = r.top + window.scrollY;
          const curLeft = r.left + window.scrollX;

          if (
            lastTop !== null &&
            lastLeft !== null &&
            Math.abs(curTop - lastTop) < 1.2 &&
            Math.abs(curLeft - lastLeft) < 1.2
          ) {
            stableFrames += 1;
          } else {
            stableFrames = 0;
          }
          lastTop = curTop;
          lastLeft = curLeft;

          // Listo tras 2 frames consecutivos estables (o al límite de 620ms)
          if ((stableFrames >= 2 && elapsed >= 90) || elapsed >= 620) {
            stabilityRafRef.current = null;
            waitingForTargetRef.current = false;
            lastSignatureRef.current = resolved.signature;

            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const preliminary = collectModuleLayout(resolved);
            let effectiveHeaderBottomDoc: number | undefined;

            if (!resolved.isModal) {
              const curScrollY = window.scrollY;
              const visibleTopBound = curScrollY + preliminary.headerHeight + 92;
              const visibleBottomBound = curScrollY + vh - 110;
              const shouldScroll =
                preliminary.firstCardRect.top < visibleTopBound ||
                preliminary.firstCardRect.top > visibleBottomBound;
              const nextScrollY = Math.max(
                0,
                Math.round(preliminary.firstCardRect.top - preliminary.headerHeight - 118)
              );
              if (shouldScroll) {
                window.scrollTo({
                  top: nextScrollY,
                  behavior: 'smooth',
                });
                effectiveHeaderBottomDoc = nextScrollY + preliminary.headerHeight;
              }
            }

            const layout =
              effectiveHeaderBottomDoc !== undefined
                ? collectModuleLayout(resolved, effectiveHeaderBottomDoc)
                : preliminary;

            const perch = selectSmartModulePerch({
              vw,
              vh,
              headerBottomDoc: layout.headerBottomDoc,
              moduleRect: layout.moduleRect,
              firstCardRect: layout.firstCardRect,
              obstacles: layout.obstacles,
              anchorX: anchorCenterX,
              currentX: livePosRef.current.x,
            });

            runClimbAndSitSequence(perch, resolved.element, resolved.isModal, seqId, onArrive);
            return;
          }
        } else if (elapsed >= 700) {
          stabilityRafRef.current = null;
          waitingForTargetRef.current = false;
          return;
        }

        stabilityRafRef.current = requestAnimationFrame(checkFrame);
      };

      stabilityRafRef.current = requestAnimationFrame(checkFrame);
    },
    [runClimbAndSitSequence]
  );

  const triggerWalkAndSit = useCallback(
    (options?: {
      meta?: ElementSnapshot;
      force?: boolean;
      onArrive?: () => void;
    }) => {
      const meta = options?.meta;
      const preferSubmodule = meta
        ? Boolean(meta.isSubmoduleSwitch && !meta.isSectionSwitch)
        : preferSubmoduleRef.current;
      preferSubmoduleRef.current = preferSubmodule;

      // Verificar si el destino ya está sentado y sin cambios (cuando no es clic explícito)
      if (!options?.force) {
        const preResolved = resolveActiveSurfaceTarget(preferSubmodule, activeContextRef.current);
        if (
          preResolved.element &&
          preResolved.element === perchedElRef.current &&
          preResolved.signature === lastSignatureRef.current &&
          (poseRef.current === 'sitting' || poseRef.current === 'lowering')
        ) {
          return;
        }
      }

      cancelOngoingMotion();
      waitingForTargetRef.current = true;
      const seqId = ++walkSequenceRef.current;

      const vw = window.innerWidth;
      const recentClick =
        lastClickAnchorRef.current && Date.now() - lastClickAnchorRef.current.timestamp < 1200
          ? lastClickAnchorRef.current
          : null;
      const anchorRect = meta?.rect || recentClick?.rect;
      const clickedCenterX = anchorRect
        ? (anchorRect.left + anchorRect.right) * 0.5
        : vw * 0.65;
      const inHeader = meta?.inHeader ?? recentClick?.inHeader ?? false;

      const wasSeated = poseRef.current === 'sitting' || poseRef.current === 'lowering';

      const startWalkPhase = () => {
        if (walkSequenceRef.current !== seqId) return;

        setOnModalLayer(false);
        const cur = livePosRef.current;
        const previewX = Math.max(56, Math.min(vw - 56, clickedCenterX));
        const previewY = anchorRect
          ? inHeader
            ? Math.max(125, anchorRect.bottom + 95)
            : Math.max(125, anchorRect.top + 28)
          : cur.y;

        const initialDx = previewX - cur.x;
        if (Math.abs(initialDx) > 8) {
          const turnDir = initialDx >= 0 ? 'right' : 'left';
          facingRef.current = turnDir;
          setFacing(turnDir);
        }

        updatePose('walking');

        const prelimX = cur.x + (previewX - cur.x) * 0.38;
        const prelimY = cur.y + (previewY - cur.y) * 0.38;
        if (Math.hypot(prelimX - cur.x, prelimY - cur.y) > 20) {
          animatePositionTo(prelimX, prelimY, 260, 'walking', {
            seqId,
            spawnPrints: true,
          });
        }

        waitForStableTargetAndClimb(seqId, preferSubmodule, clickedCenterX, options?.onArrive);
      };

      // Si estaba sentado sobre el módulo o modal anterior, primero se levanta
      if (wasSeated) {
        const cur = livePosRef.current;
        setOnModalLayer(false);
        updatePose('standing');
        applyTransform(cur.x, cur.y + 34, 'standing');
        animatePositionTo(cur.x, cur.y + 42, 175, 'standing', {
          seqId,
          easing: easeOutCubic,
          onComplete: startWalkPhase,
        });
      } else {
        startWalkPhase();
      }
    },
    [
      animatePositionTo,
      applyTransform,
      cancelOngoingMotion,
      updatePose,
      waitForStableTargetAndClimb,
    ]
  );

  // Sincronización automática global ante cualquier cambio de activeContextKey (módulo/submódulo/dimensión/ficha)
  const prevContextKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevContextKeyRef.current === null) {
      prevContextKeyRef.current = activeContextKey;
      return;
    }
    if (prevContextKeyRef.current === activeContextKey) return;
    prevContextKeyRef.current = activeContextKey;

    const isSubRoute =
      (activeContextKey.startsWith('manual:') && activeContextKey !== 'manual:introduccion') ||
      (activeContextKey.startsWith('programas:') &&
        activeContextKey !== 'programas:general:ALL:list');
    if (isSubRoute) {
      preferSubmoduleRef.current = true;
    }

    // Si ya hay una transición en espera de estabilización del DOM, recogerá el contexto sin reiniciar
    if (waitingForTargetRef.current || stabilityRafRef.current !== null) {
      return;
    }

    triggerWalkAndSit({ force: false });
  }, [activeContextKey, triggerWalkAndSit]);

  // Montaje inicial, escucha global de navegación, MutationObserver universal, scroll sticky/modal y resize
  useEffect(() => {
    applyTransform(livePosRef.current.x, livePosRef.current.y, poseRef.current);

    // Entrada inicial a la plataforma: espera a que la portada salga y camina al contenedor inicial
    const introTimer = window.setTimeout(() => {
      const seqId = ++walkSequenceRef.current;
      preferSubmoduleRef.current = false;
      waitForStableTargetAndClimb(seqId, false, window.innerWidth * 0.72);
    }, 340);
    timersRef.current.push(introTimer);

    const handleCustomWalkNav = (e: Event) => {
      const detail = (e as CustomEvent<WalkEventDetail>).detail;
      if (!detail || !detail.element) return;
      const fallbackMeta = snapshotElementMeta(detail.element);
      const rect = detail.rect ?? fallbackMeta.rect;
      const inHeader = detail.inHeader ?? fallbackMeta.inHeader;
      lastClickAnchorRef.current = { rect, inHeader, timestamp: Date.now() };
      triggerWalkAndSit({
        meta: {
          rect,
          inHeader,
          inMobileDrawer: detail.inMobileDrawer ?? fallbackMeta.inMobileDrawer,
          inTab: detail.inTab ?? fallbackMeta.inTab,
          isSectionSwitch: detail.isSectionSwitch ?? fallbackMeta.isSectionSwitch,
          isSubmoduleSwitch: detail.isSubmoduleSwitch ?? fallbackMeta.isSubmoduleSwitch,
        },
        force: true,
        onArrive: detail.onArrive,
      });
    };

    const handleGlobalNavigationClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target || typeof target.closest !== 'function') return;

      if (target.closest('input, textarea, select, option, label, [aria-live="polite"]')) {
        return;
      }

      const clickable = target.closest(
        'button, [role="tab"], [role="button"], a[href]'
      ) as HTMLElement | null;
      if (!clickable) return;
      if (clickable.getAttribute('data-piggy-ignore') === 'true') return;
      if (clickable.getAttribute('data-piggy-walk-nav') === 'true') return;
      if (
        (clickable as HTMLButtonElement).disabled ||
        clickable.getAttribute('aria-disabled') === 'true'
      ) {
        return;
      }

      // Guardar coordenadas del clic para orientar el giro del cerdito
      const meta = snapshotElementMeta(clickable);
      lastClickAnchorRef.current = {
        rect: meta.rect,
        inHeader: meta.inHeader,
        timestamp: Date.now(),
      };

      // Excluir clics internos puramente utilitarios (enviar formulario, cerrar, cancelar, eliminar, reordenar)
      if ((clickable as HTMLButtonElement).type === 'submit') return;
      const aria = (clickable.getAttribute('aria-label') || '').trim();
      if (/^(cerrar|cancelar|eliminar|quitar|subir |bajar )/i.test(aria)) return;
      const btnText = (clickable.textContent || '').trim();
      if (/^(cancelar|cerrar|guardar|eliminar|quitar)$/i.test(btnText)) return;

      const isExplicitTrigger =
        clickable.getAttribute('data-piggy-submodule') === 'true' ||
        clickable.getAttribute('data-piggy-section-nav') === 'true' ||
        Boolean(clickable.getAttribute('data-piggy-target')) ||
        Boolean(clickable.closest('[role="tab"], [role="tablist"], nav'));

      if (isExplicitTrigger) {
        triggerWalkAndSit({ meta, force: true });
      } else {
        // Para botones secundarios que abren modales o formularios ("Editar...", "Agregar...", "Registrar...", "Revisión..."),
        // dejar que el MutationObserver detecte el nuevo contenedor real montado y dispare la caminata con dirección del clic.
        preferSubmoduleRef.current = true;
      }
    };

    const syncSeatedPerchPosition = () => {
      if (poseRef.current !== 'sitting' || rafRef.current !== null) return;
      const activeEl = perchedElRef.current;
      if (!activeEl || !document.contains(activeEl) || !isVisibleContainer(activeEl)) {
        const resolved = resolveActiveSurfaceTarget(
          preferSubmoduleRef.current,
          activeContextRef.current
        );
        if (resolved.element) {
          perchedElRef.current = resolved.element;
          perchedIsModalRef.current = resolved.isModal;
          setOnModalLayer(resolved.isModal);
        } else {
          return;
        }
      }

      const targetEl = perchedElRef.current!;
      const resolvedForTarget: ResolvedTarget = {
        element: targetEl,
        isModal: perchedIsModalRef.current,
        signature: lastSignatureRef.current,
      };
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const layout = collectModuleLayout(resolvedForTarget);
      const perch = selectSmartModulePerch({
        vw,
        vh,
        headerBottomDoc: layout.headerBottomDoc,
        moduleRect: layout.moduleRect,
        firstCardRect: layout.firstCardRect,
        obstacles: layout.obstacles,
        anchorX: livePosRef.current.x,
        currentX: livePosRef.current.x,
      });

      currentSizeRef.current = perch.size;
      setPiggySize(perch.size);
      applyTransform(perch.x, perch.y, 'sitting');
      facingRef.current = perch.restFacing;
      setFacing(perch.restFacing);
    };

    const handleResize = () => {
      if (resizeDebounceRef.current !== null) {
        window.clearTimeout(resizeDebounceRef.current);
      }
      resizeDebounceRef.current = window.setTimeout(() => {
        resizeDebounceRef.current = null;
        syncSeatedPerchPosition();
      }, 180);
    };

    // Mantener el contacto exacto si el contenedor sentado es sticky o modal y el usuario hace scroll
    const handleScroll = () => {
      if (poseRef.current !== 'sitting' || rafRef.current !== null) return;
      const el = perchedElRef.current;
      if (!el || !document.contains(el)) return;
      const r = el.getBoundingClientRect();
      const docTop = Math.round(r.top + window.scrollY);
      if (Math.abs(docTop - livePosRef.current.y) >= 1) {
        applyTransform(livePosRef.current.x, docTop, 'sitting');
      }
    };

    // Observador global DOM: detecta automáticamente cualquier módulo, submódulo, formulario o modal nuevo
    const observer = new MutationObserver((mutations) => {
      const relevant = mutations.some((m) => {
        const node = m.target as HTMLElement | null;
        if (!node || typeof node.closest !== 'function') return false;
        if (node.closest('[data-piggy-companion="true"], [data-piggy-hoof-overlay="true"], [aria-live="polite"]')) {
          return false;
        }
        if (m.type === 'attributes') return true;
        return m.addedNodes.length > 0 || m.removedNodes.length > 0;
      });
      if (!relevant) return;

      if (mutationRafRef.current !== null) cancelAnimationFrame(mutationRafRef.current);
      mutationRafRef.current = requestAnimationFrame(() => {
        mutationRafRef.current = null;
        // Ignorar durante la intro inicial o mientras estamos esperando estabilizar el contenedor actual
        if (walkSequenceRef.current === 0) return;
        if (waitingForTargetRef.current || stabilityRafRef.current !== null) return;

        const resolved = resolveActiveSurfaceTarget(
          preferSubmoduleRef.current,
          activeContextRef.current
        );
        if (!resolved.element) return;

        const isNewTarget =
          resolved.element !== perchedElRef.current ||
          resolved.signature !== lastSignatureRef.current ||
          resolved.isModal !== perchedIsModalRef.current;

        if (isNewTarget) {
          triggerWalkAndSit({ force: false });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'data-piggy-context',
        'data-piggy-priority',
        'data-submodule-surface',
        'data-module-surface',
        'data-piggy-modal-surface',
      ],
    });

    window.addEventListener(WALK_NAV_EVENT, handleCustomWalkNav);
    document.addEventListener('click', handleGlobalNavigationClick, {
      capture: true,
      passive: true,
    });
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    let mainObserver: ResizeObserver | null = null;
    const mainEl = document.querySelector('main');
    if (mainEl && typeof ResizeObserver !== 'undefined') {
      mainObserver = new ResizeObserver(() => {
        handleResize();
      });
      mainObserver.observe(mainEl);
    }

    return () => {
      observer.disconnect();
      if (mutationRafRef.current !== null) cancelAnimationFrame(mutationRafRef.current);
      window.removeEventListener(WALK_NAV_EVENT, handleCustomWalkNav);
      document.removeEventListener('click', handleGlobalNavigationClick, { capture: true });
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      mainObserver?.disconnect();
      cancelOngoingMotion();
      if (resizeDebounceRef.current !== null) window.clearTimeout(resizeDebounceRef.current);
      hoofTimersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, [
    applyTransform,
    cancelOngoingMotion,
    triggerWalkAndSit,
    waitForStableTargetAndClimb,
  ]);

  return (
    <>
      <div
        data-piggy-hoof-overlay="true"
        className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
        aria-hidden="true"
      >
        {hoofPrints.map((print) => (
          <div
            key={print.id}
            className="pointer-events-none absolute left-0 top-0"
            style={{
              left: `${Math.round(print.x)}px`,
              top: `${Math.round(print.y)}px`,
              transform: `translate(-50%, -50%) rotate(${Math.round(print.angleDeg)}deg)`,
            }}
          >
            <div className="frikaz-hoof-print">
              <PiggyHoofPrintSvg />
            </div>
          </div>
        ))}
      </div>

      <div
        ref={wrapperRef}
        data-piggy-companion="true"
        data-piggy-pose={pose}
        data-piggy-pitch={pitchDeg}
        data-testid="frikaz-walking-companion"
        className={`pointer-events-none absolute left-0 top-0 select-none ${
          onModalLayer ? 'z-[60]' : 'z-40'
        }`}
        style={{
          transform: `translate3d(${Math.round(initialPoint.x)}px, ${Math.round(initialPoint.y)}px, 0) translate(-50%, -91%)`,
          willChange: 'transform',
        }}
        aria-hidden="true"
      >
        <FrikazPiggyMascot
          pose={pose}
          facing={facing}
          pitchDeg={pitchDeg}
          size={piggySize}
        />
      </div>
    </>
  );
}
