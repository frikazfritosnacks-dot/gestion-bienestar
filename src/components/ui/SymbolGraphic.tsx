import { FlowchartSymbol } from '../../types/bienestar';

export const SYMBOL_LABELS: Record<FlowchartSymbol, string> = {
  oval: 'Óvalo (Inicio / Fin)',
  rectangle: 'Rectángulo (Actividad)',
  diamond: 'Rombo (Decisión)',
  document: 'Documento (Registro)',
  cylinder: 'Cilindro (Base de datos)',
};

export function SymbolGraphic({
  symbol,
  size = 'sm',
}: {
  symbol: FlowchartSymbol;
  size?: 'sm' | 'md';
}) {
  const dims = size === 'sm' ? 'h-7 w-10' : 'h-9 w-12';

  if (symbol === 'oval') {
    return (
      <svg viewBox="0 0 48 28" className={dims} aria-label="Óvalo">
        <rect
          x="3"
          y="3"
          width="42"
          height="22"
          rx="11"
          fill="#FEE2E2"
          stroke="#D61F26"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (symbol === 'diamond') {
    return (
      <svg viewBox="0 0 48 28" className={dims} aria-label="Rombo de decisión">
        <polygon
          points="24,2 45,14 24,26 3,14"
          fill="#FEF9C3"
          stroke="#D97706"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (symbol === 'document') {
    return (
      <svg viewBox="0 0 48 28" className={dims} aria-label="Documento">
        <path
          d="M4,3 H44 V21 Q34,17 24,22 Q14,27 4,22 Z"
          fill="#EFF6FF"
          stroke="#0F294A"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (symbol === 'cylinder') {
    return (
      <svg viewBox="0 0 48 28" className={dims} aria-label="Base de datos">
        <path
          d="M8,7 C8,3.5 40,3.5 40,7 V21 C40,24.5 8,24.5 8,21 Z"
          fill="#EFF6FF"
          stroke="#0F294A"
          strokeWidth="2"
        />
        <ellipse
          cx="24"
          cy="7"
          rx="16"
          ry="3.5"
          fill="#DBEAFE"
          stroke="#0F294A"
          strokeWidth="2"
        />
      </svg>
    );
  }

  // rectangle
  return (
    <svg viewBox="0 0 48 28" className={dims} aria-label="Actividad">
      <rect
        x="4"
        y="4"
        width="40"
        height="20"
        rx="3"
        fill="#FFFFFF"
        stroke="#0F294A"
        strokeWidth="2"
      />
    </svg>
  );
}
