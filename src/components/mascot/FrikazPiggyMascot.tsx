import { useEffect, useState } from 'react';

interface FrikazPiggyMascotProps {
  isWalking?: boolean;
  facing?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

const OFFICIAL_PIGGY_SRC = '/assets/aistudio/image_a7cf5f49.png';

let cachedCutoutDataUrl: string | null = null;
let cutoutPromise: Promise<string> | null = null;

/**
 * Extrae limpiamente el fondo uniforme exterior del archivo oficial adjunto
 * conservando al 100 % la ilustración original del cerdito, su vestuario y colores.
 */
function loadTransparentPiggyCutout(): Promise<string> {
  if (cachedCutoutDataUrl) return Promise.resolve(cachedCutoutDataUrl);
  if (cutoutPromise) return cutoutPromise;

  cutoutPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(OFFICIAL_PIGGY_SRC);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(OFFICIAL_PIGGY_SRC);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        const isPaperBg = (idx: number) => {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          return r >= 224 && g >= 220 && b >= 212 && max - min <= 20;
        };

        const visited = new Uint8Array(w * h);
        const queue = new Int32Array(w * h);
        let head = 0;
        let tail = 0;

        const pushIfBg = (x: number, y: number) => {
          const pos = y * w + x;
          if (visited[pos]) return;
          if (isPaperBg(pos * 4)) {
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

        // Suavizado fino en borde de 1px para evitar halos blancos sobre fondos oscuros
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
                data[i + 3] = Math.min(data[i + 3], 105);
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
        cachedCutoutDataUrl = canvas.toDataURL('image/png');
        resolve(cachedCutoutDataUrl);
      } catch {
        resolve(OFFICIAL_PIGGY_SRC);
      }
    };
    img.onerror = () => resolve(OFFICIAL_PIGGY_SRC);
    img.src = OFFICIAL_PIGGY_SRC;
  });

  return cutoutPromise;
}

/**
 * Mascota oficial y obligatoria de Frikaz S.A.S. basada directamente en la imagen
 * proporcionada por la empresa, con animación natural por capas al desplazarse.
 */
export function FrikazPiggyMascot({
  isWalking = false,
  facing = 'right',
  size = 'md',
  className = '',
}: FrikazPiggyMascotProps) {
  const [src, setSrc] = useState<string>(cachedCutoutDataUrl || OFFICIAL_PIGGY_SRC);

  useEffect(() => {
    let mounted = true;
    if (!cachedCutoutDataUrl) {
      loadTransparentPiggyCutout().then((url) => {
        if (mounted) setSrc(url);
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  const sizeClass =
    size === 'hero'
      ? 'w-64 h-72 sm:w-72 sm:h-80'
      : size === 'lg'
        ? 'w-36 h-40'
        : size === 'sm'
          ? 'w-20 h-24'
          : 'w-28 h-32';

  const isCutoutReady = src !== OFFICIAL_PIGGY_SRC;

  return (
    <div
      className={`relative flex flex-col items-center justify-end select-none ${sizeClass} ${
        isWalking ? 'frikaz-piggy-walking' : 'frikaz-piggy-idle'
      } ${className}`}
      style={{
        transform: facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
        transition: 'transform 180ms ease-out',
      }}
      aria-hidden="true"
    >
      {/* Imagen oficial animada por capas conservando 100 % la ilustración original */}
      <img
        src={src}
        alt="Mascota oficial Frikaz S.A.S."
        className={`piggy-sprite-layer relative z-10 h-full w-full object-contain drop-shadow-md ${
          isCutoutReady ? '' : 'mix-blend-multiply'
        }`}
        draggable={false}
      />
      {/* Sombra dinámica en el piso sincronizada con el paso */}
      <div className="piggy-shadow-layer pointer-events-none -mt-3 h-3 w-3/5 rounded-full bg-[#0F294A]/25 blur-[2px]" />
    </div>
  );
}
