interface InstitutionalQualityBoxProps {
  empresa?: string;
  tituloDocumento: string;
  codigo?: string;
  version?: string;
  fecha?: string;
  className?: string;
}

const OFFICIAL_QUALITY_LOGO_SRC = '/assets/aistudio/image_cfb3c074.png';

/**
 * Caja de Calidad institucional única y obligatoria de Frikaz S.A.S.,
 * fiel al formato oficial: fondo blanco limpio, bordes nítidos oscuros y grilla 3x3
 * (logo izquierdo en 3 filas, razón social + título en columna central, CÓDIGO/VERSIÓN/FECHA a la derecha).
 */
export function InstitutionalQualityBox({
  empresa = 'Frikaz S.A.S.',
  tituloDocumento,
  codigo,
  version,
  fecha,
  className = '',
}: InstitutionalQualityBoxProps) {
  const cleanCode = codigo?.trim() || '';
  const cleanVersion = version?.trim() || '';
  const cleanDate = fecha?.trim() || '';

  return (
    <div
      data-quality-box="true"
      className={`w-full overflow-hidden border border-slate-900 bg-white text-slate-900 ${className}`}
      role="region"
      aria-label={`Caja de calidad: ${tituloDocumento}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-[23%_52%_25%]">
        {/* Columna izquierda (3 filas unidas): Logotipo oficial Frikaz S.A.S. */}
        <div className="flex items-center justify-center border-b border-slate-900 bg-white p-2.5 sm:border-b-0 sm:border-r">
          <img
            src={OFFICIAL_QUALITY_LOGO_SRC}
            alt="Logotipo oficial Frikaz S.A.S."
            className="max-h-16 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Columna central (2 filas unidas arriba + 1 fila título abajo) */}
        <div className="flex flex-col border-b border-slate-900 bg-white sm:border-b-0 sm:border-r">
          <div className="flex flex-[2] items-center justify-center border-b border-slate-900 px-3 py-3 text-center">
            <span className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
              {empresa}
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center px-3 py-1.5 text-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-900 sm:text-sm">
              {tituloDocumento}
            </span>
          </div>
        </div>

        {/* Columna derecha (3 filas: CÓDIGO, VERSIÓN, FECHA) */}
        <div className="grid grid-rows-3 divide-y divide-slate-900 bg-white text-xs text-slate-900">
          <div className="flex items-center px-3 py-1.5">
            <span className="font-semibold">CÓDIGO:</span>
            {cleanCode && <span className="ml-1.5 font-mono tabular-nums">{cleanCode}</span>}
          </div>
          <div className="flex items-center px-3 py-1.5">
            <span className="font-semibold">VERSIÓN:</span>
            {cleanVersion && <span className="ml-1.5 font-mono tabular-nums">{cleanVersion}</span>}
          </div>
          <div className="flex items-center px-3 py-1.5">
            <span className="font-semibold">FECHA:</span>
            {cleanDate && <span className="ml-1.5 font-mono tabular-nums">{cleanDate}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
