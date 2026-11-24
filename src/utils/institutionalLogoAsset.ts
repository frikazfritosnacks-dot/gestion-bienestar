export interface QualityLogoAsset {
  bytes: Uint8Array;
  base64: string;
  width: number;
  height: number;
}

const QUALITY_LOGO_PATH = '/assets/aistudio/image_cfb3c074.png';

let cachedAsset: QualityLogoAsset | null = null;
let loadingPromise: Promise<QualityLogoAsset | null> | null = null;

function bytesToBase64DataUrl(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:image/png;base64,${btoa(binary)}`;
}

function measureImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || 512;
      const height = img.naturalHeight || 288;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: 512, height: 288 });
    };
    img.src = objectUrl;
  });
}

/**
 * Carga y almacena en caché la imagen oficial proporcionada para la Caja de Calidad
 * de Frikaz S.A.S., preservando su proporción original para incrustarla en Word y Excel.
 */
export async function loadInstitutionalQualityLogo(): Promise<QualityLogoAsset | null> {
  if (cachedAsset) return cachedAsset;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const response = await fetch(QUALITY_LOGO_PATH);
      if (!response.ok) return null;
      const blob = await response.blob();
      const [buffer, dims] = await Promise.all([
        blob.arrayBuffer(),
        measureImageDimensions(blob),
      ]);
      const bytes = new Uint8Array(buffer);
      cachedAsset = {
        bytes,
        base64: bytesToBase64DataUrl(bytes),
        width: dims.width,
        height: dims.height,
      };
      return cachedAsset;
    } catch {
      return null;
    }
  })();

  return loadingPromise;
}

/**
 * Calcula ancho y alto manteniendo exactamente la proporción original dentro de una caja máxima.
 */
export function fitAspectDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (!naturalWidth || !naturalHeight) {
    return { width: maxWidth, height: Math.round(maxWidth * 0.56) };
  }
  const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight);
  return {
    width: Math.max(1, Math.round(naturalWidth * scale)),
    height: Math.max(1, Math.round(naturalHeight * scale)),
  };
}
