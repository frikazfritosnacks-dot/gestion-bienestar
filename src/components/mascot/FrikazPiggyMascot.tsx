import { useEffect, useState } from 'react';
import sittingPiggyImgUrl from '../../assets/images/piggy_sitting_official_1795624478168.jpg';
import climbingPiggyImgUrl from '../../assets/images/piggy_climbing_official_1795624478590.jpg';

export type PiggyPose = 'standing' | 'walking' | 'climbing' | 'lowering' | 'sitting';

interface FrikazPiggyMascotProps {
  isWalking?: boolean;
  pose?: PiggyPose;
  facing?: 'left' | 'right';
  pitchDeg?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

export interface ArticulatedPiggyLayers {
  head: string;
  torso: string;
  leftArm: string;
  rightArm: string;
  leftLeg: string;
  rightLeg: string;
  fullCutout: string;
}

interface SittingPiggyLayers {
  upperSeated: string;
  leftLowerLeg: string;
  rightLowerLeg: string;
  fullSeatedCutout: string;
}

const OFFICIAL_PIGGY_SRC = '/assets/aistudio/image_a7cf5f49.png';

let cachedLayers: ArticulatedPiggyLayers | null = null;
let layersPromise: Promise<ArticulatedPiggyLayers | null> | null = null;

let cachedSittingLayers: SittingPiggyLayers | null = null;
let sittingPromise: Promise<SittingPiggyLayers | null> | null = null;

let cachedClimbingCutout: string | null = null;
let climbingPromise: Promise<string | null> | null = null;

function floodFillWhitePaper(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  options?: { lumaMin?: number; chromaMax?: number }
): Uint8Array {
  const lumaMin = options?.lumaMin ?? 224;
  const chromaMax = options?.chromaMax ?? 22;

  const isBg = (idx: number) => {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return r >= lumaMin && g >= lumaMin - 4 && b >= lumaMin - 8 && max - min <= chromaMax;
  };

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const pushIfBg = (x: number, y: number) => {
    const pos = y * w + x;
    if (visited[pos]) return;
    if (isBg(pos * 4)) {
      visited[pos] = 1;
      queue[tail++] = pos;
    }
  };

  for (let x = 0; x < w; x++) {
    pushIfBg(x, 0);
    pushIfBg(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushIfBg(0, y);
    pushIfBg(w - 1, y);
  }

  while (head < tail) {
    const pos = queue[head++];
    data[pos * 4 + 3] = 0;
    const x = pos % w;
    const y = (pos - x) / w;

    if (x > 0) pushIfBg(x - 1, y);
    if (x < w - 1) pushIfBg(x + 1, y);
    if (y > 0) pushIfBg(x, y - 1);
    if (y < h - 1) pushIfBg(x, y + 1);
  }

  return visited;
}

function featherEdgeHalos(data: Uint8ClampedArray, visited: Uint8Array, w: number, h: number) {
  for (let pos = 0; pos < w * h; pos++) {
    if (!visited[pos]) {
      const x = pos % w;
      const y = (pos - x) / w;
      const nearBg =
        (x > 0 && visited[pos - 1]) ||
        (x < w - 1 && visited[pos + 1]) ||
        (y > 0 && visited[pos - w]) ||
        (y < h - 1 && visited[pos + w]);
      if (nearBg) {
        const i = pos * 4;
        const luma = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (luma > 195) {
          data[i + 3] = Math.min(data[i + 3], 88);
        }
      }
    }
  }
}

/**
 * Procesa exactamente la ilustración oficial de Frikaz S.A.S. (image_a7cf5f49.png) en 6 capas articuladas
 * para la caminata y posición erguida de pie.
 */
export function loadArticulatedPiggyLayers(): Promise<ArticulatedPiggyLayers | null> {
  if (cachedLayers) return Promise.resolve(cachedLayers);
  if (layersPromise) return layersPromise;

  layersPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const baseCanvas = document.createElement('canvas');
        baseCanvas.width = w;
        baseCanvas.height = h;
        const baseCtx = baseCanvas.getContext('2d');
        if (!baseCtx) {
          resolve(null);
          return;
        }

        baseCtx.drawImage(img, 0, 0);
        const imageData = baseCtx.getImageData(0, 0, w, h);
        const data = imageData.data;

        const visited = floodFillWhitePaper(data, w, h, { lumaMin: 224, chromaMax: 22 });

        // Retira la sombra ovalada gris estática pintada bajo los zapatos (y >= 88.5%)
        const floorStartY = Math.floor(h * 0.885);
        for (let y = floorStartY; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const pos = y * w + x;
            const i = pos * 4;
            if (data[i + 3] === 0) continue;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const luma = (r + g + b) / 3;
            if (max - min <= 14 && luma >= 152) {
              data[i + 3] = 0;
              visited[pos] = 1;
            }
          }
        }

        featherEdgeHalos(data, visited, w, h);
        baseCtx.putImageData(imageData, 0, 0);
        const fullCutout = baseCanvas.toDataURL('image/png');

        const makeLayer = () => {
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          const ctx = c.getContext('2d');
          return ctx ? { c, ctx, img: ctx.createImageData(w, h) } : null;
        };

        const headL = makeLayer();
        const torsoL = makeLayer();
        const leftArmL = makeLayer();
        const rightArmL = makeLayer();
        const leftLegL = makeLayer();
        const rightLegL = makeLayer();

        if (!headL || !torsoL || !leftArmL || !rightArmL || !leftLegL || !rightLegL) {
          resolve(null);
          return;
        }

        const blazerHardTopY = Math.floor(h * 0.655);
        const blazerMaxY = Math.floor(h * 0.702);
        const legTopY = Math.floor(h * 0.642);
        const midX = Math.floor(w * 0.494);

        const getLeftArmSeamX = (yPct: number) => {
          if (yPct < 0.315) return 0.36 * w;
          if (yPct < 0.39) return 0.392 * w;
          const t = Math.min(1, Math.max(0, (yPct - 0.39) / (0.468 - 0.39)));
          return (0.392 - t * 0.056) * w;
        };

        const getRightArmSeamX = (yPct: number) => {
          if (yPct < 0.31) return 0.785 * w;
          if (yPct < 0.375) return 0.682 * w;
          const t = Math.min(1, Math.max(0, (yPct - 0.375) / (0.468 - 0.375)));
          return (0.682 - t * 0.022) * w;
        };

        const armOverlap = Math.floor(w * 0.024);

        const copyPx = (target: Uint8ClampedArray, i: number, r: number, g: number, b: number, a: number) => {
          target[i] = r;
          target[i + 1] = g;
          target[i + 2] = b;
          target[i + 3] = a;
        };

        for (let y = 0; y < h; y++) {
          const yPct = y / h;
          const leftSeam = getLeftArmSeamX(yPct);
          const rightSeam = getRightArmSeamX(yPct);

          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const a = data[i + 3];
            if (a === 0) continue;

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (yPct < 0.468 && x <= leftSeam + armOverlap) {
              if (yPct >= 0.32 && x > leftSeam) {
                const isPinkFace = r > 175 && g > 105 && g < 195 && b < 165;
                if (!isPinkFace) copyPx(leftArmL.img.data, i, r, g, b, a);
              } else {
                copyPx(leftArmL.img.data, i, r, g, b, a);
              }
            }

            if (yPct < 0.468 && x >= rightSeam - armOverlap) {
              if (yPct >= 0.31 && x < rightSeam) {
                const isPinkFace = r > 175 && g > 105 && g < 195 && b < 165;
                if (!isPinkFace) copyPx(rightArmL.img.data, i, r, g, b, a);
              } else {
                copyPx(rightArmL.img.data, i, r, g, b, a);
              }
            }

            const inHeadHorizontal = x > leftSeam && x < rightSeam;
            const isHeadPink = r > 155 && g > 85 && g < 200 && b < 170;
            const isHeadDark = r < 75 && g < 75 && b < 85;
            if (inHeadHorizontal && (yPct < 0.376 || (yPct < 0.416 && (isHeadPink || isHeadDark)))) {
              copyPx(headL.img.data, i, r, g, b, a);
            }

            const isDarkBlazerHem =
              y < blazerMaxY && ((b > r + 10 && b < 165) || (r < 55 && g < 65 && b < 95));
            const inTorsoBody =
              (yPct >= 0.368 && (y < blazerHardTopY || isDarkBlazerHem)) &&
              (yPct >= 0.468 || (x >= leftSeam - 2 && x <= rightSeam + 2));

            if (inTorsoBody && !(yPct < 0.386 && isHeadPink)) {
              copyPx(torsoL.img.data, i, r, g, b, a);
            }

            if (y >= legTopY) {
              const target = x < midX ? leftLegL.img.data : rightLegL.img.data;
              copyPx(target, i, r, g, b, a);
            }
          }
        }

        headL.ctx.putImageData(headL.img, 0, 0);
        torsoL.ctx.putImageData(torsoL.img, 0, 0);
        leftArmL.ctx.putImageData(leftArmL.img, 0, 0);
        rightArmL.ctx.putImageData(rightArmL.img, 0, 0);
        leftLegL.ctx.putImageData(leftLegL.img, 0, 0);
        rightLegL.ctx.putImageData(rightLegL.img, 0, 0);

        cachedLayers = {
          head: headL.c.toDataURL('image/png'),
          torso: torsoL.c.toDataURL('image/png'),
          leftArm: leftArmL.c.toDataURL('image/png'),
          rightArm: rightArmL.c.toDataURL('image/png'),
          leftLeg: leftLegL.c.toDataURL('image/png'),
          rightLeg: rightLegL.c.toDataURL('image/png'),
          fullCutout,
        };
        resolve(cachedLayers);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = OFFICIAL_PIGGY_SRC;
  });

  return layersPromise;
}

/**
 * Procesa la ilustración sentada oficial (misma identidad gráfica de Frikaz S.A.S.)
 * en pose sentada erguida sin inclinación diagonal:
 * - Elimina el fondo blanco y cualquier trazo horizontal auxiliar en los costados de los muslos.
 * - Separa torso/cabeza/brazos/muslos erguidos de las piernas inferiores y zapatos para permitir
 *   un balanceo sutil de los pies mientras la cadera permanece fija y apoyada sobre el módulo.
 */
function loadSittingPiggyLayers(): Promise<SittingPiggyLayers | null> {
  if (cachedSittingLayers) return Promise.resolve(cachedSittingLayers);
  if (sittingPromise) return sittingPromise;

  sittingPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // 1. Retira fondo blanco exterior
        const visited = floodFillWhitePaper(data, w, h, { lumaMin: 230, chromaMax: 22 });

        // 2. Retira la línea horizontal de referencia en los costados externos de los muslos (x < 21.5% o x > 76.5%, y ~68%..76%)
        const bandTop = Math.floor(h * 0.68);
        const bandBottom = Math.floor(h * 0.765);
        const leftLedgeMaxX = Math.floor(w * 0.214);
        const rightLedgeMinX = Math.floor(w * 0.768);
        for (let y = bandTop; y <= bandBottom; y++) {
          for (let x = 0; x < w; x++) {
            if (x < leftLedgeMaxX || x > rightLedgeMinX) {
              const pos = y * w + x;
              const i = pos * 4;
              if (data[i + 3] > 0) {
                data[i + 3] = 0;
                visited[pos] = 1;
              }
            }
          }
        }

        // También limpia los espacios blancos internos entre los dos muslos/tobillos (y >= 72%)
        for (let y = Math.floor(h * 0.72); y < Math.floor(h * 0.94); y++) {
          for (let x = Math.floor(w * 0.36); x < Math.floor(w * 0.56); x++) {
            const pos = y * w + x;
            const i = pos * 4;
            if (data[i + 3] === 0) continue;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r >= 236 && g >= 236 && b >= 236 && Math.max(r, g, b) - Math.min(r, g, b) <= 14) {
              data[i + 3] = 0;
              visited[pos] = 1;
            }
          }
        }

        featherEdgeHalos(data, visited, w, h);
        ctx.putImageData(imageData, 0, 0);
        const fullSeatedCutout = c.toDataURL('image/png');

        // 3. Separación limpia entre torso/cadera erguida (z-20) y pantorrillas+zapatos colgando (z-10)
        const makeLayer = () => {
          const lc = document.createElement('canvas');
          lc.width = w;
          lc.height = h;
          const lctx = lc.getContext('2d');
          return lctx ? { c: lc, ctx: lctx, img: lctx.createImageData(w, h) } : null;
        };

        const upperL = makeLayer();
        const leftShinL = makeLayer();
        const rightShinL = makeLayer();
        if (!upperL || !leftShinL || !rightShinL) {
          resolve(null);
          return;
        }

        const upperCutY = Math.floor(h * 0.768);
        const shinStartY = Math.floor(h * 0.736);
        const midKneeX = Math.floor(w * 0.455);

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const a = data[i + 3];
            if (a === 0) continue;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (y < upperCutY) {
              upperL.img.data[i] = r;
              upperL.img.data[i + 1] = g;
              upperL.img.data[i + 2] = b;
              upperL.img.data[i + 3] = a;
            }
            if (y >= shinStartY) {
              const target = x < midKneeX ? leftShinL.img.data : rightShinL.img.data;
              target[i] = r;
              target[i + 1] = g;
              target[i + 2] = b;
              target[i + 3] = a;
            }
          }
        }

        upperL.ctx.putImageData(upperL.img, 0, 0);
        leftShinL.ctx.putImageData(leftShinL.img, 0, 0);
        rightShinL.ctx.putImageData(rightShinL.img, 0, 0);

        cachedSittingLayers = {
          upperSeated: upperL.c.toDataURL('image/png'),
          leftLowerLeg: leftShinL.c.toDataURL('image/png'),
          rightLowerLeg: rightShinL.c.toDataURL('image/png'),
          fullSeatedCutout,
        };
        resolve(cachedSittingLayers);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = sittingPiggyImgUrl;
  });

  return sittingPromise;
}

/**
 * Procesa la ilustración oficial en pose de subida (apoyando manos y elevando la pierna hacia el borde superior).
 */
function loadClimbingPiggyCutout(): Promise<string | null> {
  if (cachedClimbingCutout) return Promise.resolve(cachedClimbingCutout);
  if (climbingPromise) return climbingPromise;

  climbingPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        const visited = floodFillWhitePaper(data, w, h, { lumaMin: 230, chromaMax: 22 });
        featherEdgeHalos(data, visited, w, h);
        ctx.putImageData(imageData, 0, 0);

        cachedClimbingCutout = c.toDataURL('image/png');
        resolve(cachedClimbingCutout);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = climbingPiggyImgUrl;
  });

  return climbingPromise;
}

/**
 * Mascota oficial de Frikaz S.A.S. con poses reales y consistentes:
 * - standing / walking: versión oficial articulada en 6 capas anatómicas (brazos y piernas opuestos).
 * - climbing: pose de subida apoyando manos y elevando la pierna sobre el borde.
 * - lowering / sitting: pose sentada erguida (torso vertical, cabeza derecha, brazos relajados,
 *   rodillas flexionadas y zapatos cafés colgando con sutil movimiento sobre el borde del módulo).
 */
export function FrikazPiggyMascot({
  isWalking = false,
  pose,
  facing = 'right',
  pitchDeg = 0,
  size = 'md',
  className = '',
}: FrikazPiggyMascotProps) {
  const [layers, setLayers] = useState<ArticulatedPiggyLayers | null>(cachedLayers);
  const [sittingLayers, setSittingLayers] = useState<SittingPiggyLayers | null>(cachedSittingLayers);
  const [climbingCutout, setClimbingCutout] = useState<string | null>(cachedClimbingCutout);

  useEffect(() => {
    let mounted = true;
    if (!cachedLayers) {
      loadArticulatedPiggyLayers().then((res) => {
        if (mounted && res) setLayers(res);
      });
    }
    if (!cachedSittingLayers) {
      loadSittingPiggyLayers().then((res) => {
        if (mounted && res) setSittingLayers(res);
      });
    }
    if (!cachedClimbingCutout) {
      loadClimbingPiggyCutout().then((res) => {
        if (mounted && res) setClimbingCutout(res);
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  const effectivePose: PiggyPose = pose ?? (isWalking ? 'walking' : 'standing');
  const isSeatedVariant = effectivePose === 'sitting' || effectivePose === 'lowering';
  const isClimbing = effectivePose === 'climbing';

  const aspectClass =
    isSeatedVariant || isClimbing ? 'aspect-[896/1200]' : 'aspect-[1123/1400]';

  const widthClass =
    size === 'hero'
      ? 'w-56 sm:w-64'
      : size === 'lg'
        ? 'w-32'
        : size === 'sm'
          ? isSeatedVariant || isClimbing
            ? 'w-[84px]'
            : 'w-[78px]'
          : size === 'xs'
            ? isSeatedVariant || isClimbing
              ? 'w-[62px]'
              : 'w-[58px]'
            : isSeatedVariant || isClimbing
              ? 'w-[110px]'
              : 'w-[104px]';

  const poseClass =
    effectivePose === 'walking'
      ? 'frikaz-piggy-walking'
      : effectivePose === 'climbing'
        ? 'frikaz-piggy-climbing'
        : effectivePose === 'lowering'
          ? 'frikaz-piggy-lowering'
          : effectivePose === 'sitting'
            ? 'frikaz-piggy-sitting'
            : 'frikaz-piggy-idle';

  // En posición sentada o en subida, nunca se inclina diagonalmente ni se deforma
  const safePitch =
    effectivePose === 'walking' ? Math.max(-1.8, Math.min(1.8, pitchDeg)) : 0;
  const flipScale = isSeatedVariant ? 1 : facing === 'left' ? -1 : 1;

  return (
    <div
      className={`relative flex flex-col items-center justify-end select-none ${widthClass} ${aspectClass} ${poseClass} ${className}`}
      style={{
        transform: `scaleX(${flipScale}) rotate(${safePitch.toFixed(1)}deg)`,
        transition: 'transform 220ms ease-out, width 240ms ease-out',
      }}
      aria-hidden="true"
    >
      <div className="piggy-sprite-wrap relative h-full w-full drop-shadow-sm">
        {isSeatedVariant ? (
          <>
            {sittingLayers ? (
              <>
                <img
                  src={sittingLayers.leftLowerLeg}
                  alt=""
                  className="piggy-seated-left-leg pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
                  draggable={false}
                />
                <img
                  src={sittingLayers.rightLowerLeg}
                  alt=""
                  className="piggy-seated-right-leg pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
                  draggable={false}
                />
                <img
                  src={sittingLayers.upperSeated}
                  alt="Mascota oficial Frikaz S.A.S. sentada sobre el módulo"
                  className="piggy-seated-upper pointer-events-none absolute inset-0 z-20 h-full w-full object-contain"
                  draggable={false}
                />
              </>
            ) : (
              <img
                src={sittingPiggyImgUrl}
                alt="Mascota oficial Frikaz S.A.S. sentada sobre el módulo"
                className="piggy-seated-upper pointer-events-none relative z-20 h-full w-full object-contain mix-blend-multiply"
                draggable={false}
              />
            )}
            {/* Sombra de apoyo de la cadera directamente sobre el borde superior del módulo */}
            <div className="piggy-shadow-layer pointer-events-none absolute left-1/2 top-[71.5%] z-0 h-2.5 w-[56%] -translate-x-1/2 rounded-full bg-[#0F294A]/30 blur-[2px]" />
          </>
        ) : isClimbing ? (
          <>
            <img
              src={climbingCutout ?? climbingPiggyImgUrl}
              alt="Mascota oficial Frikaz S.A.S. subiendo al módulo"
              className={`piggy-climbing-cutout pointer-events-none relative z-20 h-full w-full object-contain ${
                climbingCutout ? '' : 'mix-blend-multiply'
              }`}
              draggable={false}
            />
          </>
        ) : layers ? (
          <>
            <img
              src={layers.leftArm}
              alt=""
              className="piggy-limb piggy-left-arm pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
              draggable={false}
            />
            <img
              src={layers.rightArm}
              alt=""
              className="piggy-limb piggy-right-arm pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
              draggable={false}
            />
            <img
              src={layers.leftLeg}
              alt=""
              className="piggy-limb piggy-left-leg pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
              draggable={false}
            />
            <img
              src={layers.rightLeg}
              alt=""
              className="piggy-limb piggy-right-leg pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
              draggable={false}
            />
            <img
              src={layers.torso}
              alt=""
              className="piggy-limb piggy-torso pointer-events-none absolute inset-0 z-20 h-full w-full object-contain"
              draggable={false}
            />
            <img
              src={layers.head}
              alt="Mascota oficial Frikaz S.A.S."
              className="piggy-limb piggy-head pointer-events-none absolute inset-0 z-30 h-full w-full object-contain"
              draggable={false}
            />
          </>
        ) : (
          <img
            src={OFFICIAL_PIGGY_SRC}
            alt="Mascota oficial Frikaz S.A.S."
            className="piggy-torso relative z-20 h-full w-full object-contain mix-blend-multiply"
            draggable={false}
          />
        )}
      </div>

      {/* Sombra en el suelo durante caminata o posición de pie */}
      {!isSeatedVariant && !isClimbing && (
        <div className="piggy-shadow-layer pointer-events-none -mt-2.5 h-3 w-3/5 rounded-full bg-[#0F294A]/25 blur-[2px]" />
      )}
    </div>
  );
}
