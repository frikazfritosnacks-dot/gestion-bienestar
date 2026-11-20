export type ChipVariant = 'ondulada' | 'lisa' | 'redonda' | 'chip';

interface ChipSvgProps {
  variant: ChipVariant;
  className?: string;
}

/**
 * Ilustraciones vectoriales de papitas fritas inspiradas en la referencia visual de Frikaz S.A.S.:
 * - ondulada: papa rizada con surcos dorados y bordes ondulados
 * - lisa: hojuela curva clásica con brillo dorado y pizcas de sal
 * - redonda: papa circular crocante con borde orgánico tostado
 * - chip: hojuela tipo chip doblada con pliegue y sombra tostada
 */
export function ChipSvg({ variant, className = 'w-9 h-9' }: ChipSvgProps) {
  if (variant === 'ondulada') {
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="chip-ond-grad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="55%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <path
          d="M14 20C16 14 22 10 29 11C35 9 43 11 48 16C54 20 56 28 53 35C54 42 49 50 42 52C35 55 26 54 20 50C13 47 9 40 11 33C9 27 11 23 14 20Z"
          fill="url(#chip-ond-grad)"
          stroke="#6B4214"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M17 22C24 20 38 17 47 18M15 30C24 27 40 24 51 26M14 38C25 35 41 32 51 34M18 46C27 43 40 41 47 43"
          stroke="#B45309"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
        <circle cx="26" cy="23" r="1.2" fill="#78350F" opacity="0.65" />
        <circle cx="40" cy="31" r="1.3" fill="#78350F" opacity="0.65" />
        <circle cx="29" cy="42" r="1.1" fill="#78350F" opacity="0.6" />
      </svg>
    );
  }

  if (variant === 'lisa') {
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="chip-lisa-grad" x1="10" y1="12" x2="54" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <path
          d="M10 28C11 19 21 15 33 17C44 19 54 22 55 31C56 39 48 49 35 49C22 49 9 39 10 28Z"
          fill="url(#chip-lisa-grad)"
          stroke="#6B4214"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M17 26C25 22 38 23 47 28"
          stroke="#FEF9C3"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.85"
        />
        <circle cx="24" cy="34" r="1.3" fill="#78350F" opacity="0.6" />
        <circle cx="38" cy="31" r="1.1" fill="#78350F" opacity="0.65" />
        <circle cx="44" cy="39" r="1.3" fill="#78350F" opacity="0.55" />
        <circle cx="30" cy="41" r="1" fill="#78350F" opacity="0.6" />
      </svg>
    );
  }

  if (variant === 'redonda') {
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="chip-red-grad" cx="42%" cy="38%" r="58%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="65%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </radialGradient>
        </defs>
        <path
          d="M32 10C44 10 54 18 54 31C54 44 45 53 31 53C18 53 10 43 10 31C10 18 19 10 32 10Z"
          fill="url(#chip-red-grad)"
          stroke="#6B4214"
          strokeWidth="2.5"
        />
        <path
          d="M21 20C26 16 34 15 40 18"
          stroke="#FEF9C3"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.8"
        />
        <circle cx="25" cy="29" r="1.2" fill="#78350F" opacity="0.65" />
        <circle cx="39" cy="26" r="1.4" fill="#78350F" opacity="0.6" />
        <circle cx="34" cy="40" r="1.2" fill="#78350F" opacity="0.65" />
        <circle cx="23" cy="39" r="1" fill="#78350F" opacity="0.55" />
      </svg>
    );
  }

  // chip (doblada / kettle-style)
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="chip-fold-grad" x1="12" y1="16" x2="52" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="60%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
      <path
        d="M11 33C13 21 24 14 36 16C48 18 55 25 53 35C51 44 41 49 28 48C17 47 9 42 11 33Z"
        fill="url(#chip-fold-grad)"
        stroke="#6B4214"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M14 34C22 40 37 40 50 32C46 43 35 48 25 46C17 44 13 39 14 34Z"
        fill="#B45309"
        opacity="0.45"
      />
      <path
        d="M21 24C28 21 38 22 44 26"
        stroke="#FEF9C3"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="28" cy="30" r="1.2" fill="#78350F" opacity="0.65" />
      <circle cx="40" cy="33" r="1.2" fill="#78350F" opacity="0.6" />
    </svg>
  );
}

/**
 * Pequeño detalle decorativo de papitas fritas Frikaz para encabezados seleccionados.
 */
export function ChipHeaderAccent({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center -space-x-2 select-none ${className}`} aria-hidden="true">
      <ChipSvg variant="ondulada" className="h-7 w-7 -rotate-12 drop-shadow-xs" />
      <ChipSvg variant="lisa" className="h-8 w-8 rotate-6 drop-shadow-xs" />
      <ChipSvg variant="redonda" className="h-6 w-6 rotate-12 drop-shadow-xs" />
    </div>
  );
}
