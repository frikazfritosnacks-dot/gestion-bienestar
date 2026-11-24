import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  Send,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { ENCUESTAS_POR_ACTIVIDAD } from '../../data/planBienestarData';
import { CriterioEncuestaKey } from '../../types/bienestar';
import {
  buildEncuestaSatisfaccionWorkbook,
  downloadWorkbookAsExcel,
} from '../../utils/excelFormatsGenerator';

interface EncuestasManagerProps {
  initialActividadId?: string;
  onGoToRegistro?: () => void;
}

const LIKERT_OPTIONS = [
  { value: 1, label: '1 · Muy insatisfecho' },
  { value: 2, label: '2 · Insatisfecho' },
  { value: 3, label: '3 · Neutral' },
  { value: 4, label: '4 · Satisfecho' },
  { value: 5, label: '5 · Muy satisfecho' },
];

const INITIAL_RATINGS: Record<CriterioEncuestaKey, number> = {
  organizacion: 0,
  claridad: 0,
  cumplimientoObjetivo: 0,
  materiales: 0,
  participacion: 0,
  duracion: 0,
  utilidad: 0,
  satisfaccionGeneral: 0,
};

/**
 * Formulario de aplicación de encuestas de satisfacción por actividad.
 * Al enviar la encuesta, las respuestas se guardan automáticamente como un registro
 * independiente en el apartado «REGISTRO DE ENCUESTAS DE SATISFACCIÓN».
 */
export function EncuestasManager({
  initialActividadId,
  onGoToRegistro,
}: EncuestasManagerProps) {
  const { state, addRespuestaEncuesta, notify } = useBienestar();
  const [selectedActId, setSelectedActId] = useState<string>(
    initialActividadId || ENCUESTAS_POR_ACTIVIDAD[0].actividadId
  );
  const [exportingBlank, setExportingBlank] = useState(false);

  const [nombreParticipante, setNombreParticipante] = useState('');
  const [areaCargo, setAreaCargo] = useState('');
  const [fechaRealizacion, setFechaRealizacion] = useState('');
  const [calificaciones, setCalificaciones] =
    useState<Record<CriterioEncuestaKey, number>>(INITIAL_RATINGS);
  const [loQueMasGusto, setLoQueMasGusto] = useState('');
  const [aspectosMejorar, setAspectosMejorar] = useState('');
  const [otrasActividades, setOtrasActividades] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [lastSavedNumber, setLastSavedNumber] = useState<number | null>(null);

  const currentConfig =
    ENCUESTAS_POR_ACTIVIDAD.find((c) => c.actividadId === selectedActId) ||
    ENCUESTAS_POR_ACTIVIDAD[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missingCriterion = currentConfig.preguntas.find(
      (q) => !calificaciones[q.key] || calificaciones[q.key] < 1
    );
    if (missingCriterion) {
      notify(
        `Selecciona una calificación de 1 a 5 para: "${missingCriterion.criterio}".`,
        'warning'
      );
      return;
    }

    const res = addRespuestaEncuesta({
      actividadId: currentConfig.actividadId,
      actividadNombre: currentConfig.actividadNombre,
      dimension: currentConfig.dimension,
      nombreParticipante: nombreParticipante.trim() || undefined,
      areaCargo: areaCargo.trim() || undefined,
      fechaRealizacion,
      calificaciones,
      loQueMasGusto: loQueMasGusto.trim(),
      aspectosMejorar: aspectosMejorar.trim(),
      otrasActividades: otrasActividades.trim(),
      observaciones: observaciones.trim(),
    });

    if (res.ok && res.record) {
      setLastSavedNumber(res.record.numeroRegistro || state.respuestasEncuestas.length + 1);
      setNombreParticipante('');
      setAreaCargo('');
      setFechaRealizacion('');
      setCalificaciones(INITIAL_RATINGS);
      setLoQueMasGusto('');
      setAspectosMejorar('');
      setOtrasActividades('');
      setObservaciones('');
    }
  };

  const handleDownloadBlankTemplate = async () => {
    if (exportingBlank) return;
    setExportingBlank(true);
    try {
      const wb = await buildEncuestaSatisfaccionWorkbook(state);
      await downloadWorkbookAsExcel(wb, 'Encuesta_Satisfaccion_En_Blanco_Frikaz_2027.xlsx');
      notify('Plantilla en blanco de encuestas descargada en Excel (.xlsx).');
    } finally {
      setExportingBlank(false);
    }
  };

  const countForCurrent = state.respuestasEncuestas.filter(
    (r) => r.actividadId === currentConfig.actividadId
  ).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-extrabold text-[#0F294A]">
              Diligenciar Encuesta de Satisfacción por Actividad
            </h2>
            <p className="text-xs text-slate-600">
              Cada respuesta enviada se guarda automáticamente como un registro independiente en el
              apartado «Registro de Encuestas de Satisfacción» (escala 1 a 5).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onGoToRegistro && (
              <button
                type="button"
                onClick={onGoToRegistro}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F294A] px-4 py-2 text-xs font-bold text-[#FACC15] hover:bg-[#163A66] cursor-pointer"
              >
                <Database className="h-4 w-4" />
                Ir a Registro de Encuestas ({state.respuestasEncuestas.length})
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadBlankTemplate}
              disabled={exportingBlank}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#FACC15] bg-[#FEF9C3] px-4 py-2 text-xs font-bold text-[#0F294A] hover:bg-[#FDE047] cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#D61F26]" />
              {exportingBlank ? 'Generando...' : 'Plantilla en blanco (.xlsx)'}
            </button>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full max-w-xl">
            <label className="mb-1.5 block text-xs font-bold text-[#0F294A]">
              Selecciona la actividad del Plan Anual:
            </label>
            <select
              value={selectedActId}
              onChange={(e) => {
                setSelectedActId(e.target.value);
                setLastSavedNumber(null);
              }}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/70 px-3.5 py-2.5 text-sm font-semibold text-[#0F294A] focus:border-[#0F294A] focus:bg-white focus:outline-none"
            >
              {ENCUESTAS_POR_ACTIVIDAD.map((cfg, idx) => (
                <option key={cfg.actividadId} value={cfg.actividadId}>
                  {idx + 1}. {cfg.actividadNombre} — Dimensión {cfg.dimension}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs font-semibold text-slate-600 tabular-nums">
            Respuestas almacenadas para esta actividad:{' '}
            <strong className="text-[#D61F26]">{countForCurrent}</strong>
          </div>
        </div>
      </section>

      {lastSavedNumber !== null && (
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-950 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" />
            <span>
              Respuesta{' '}
              <strong className="font-mono">
                ENC-2027-{String(lastSavedNumber).padStart(3, '0')}
              </strong>{' '}
              guardada permanentemente sin sobrescribir encuestas anteriores. El formulario quedó en
              blanco para el siguiente trabajador.
            </span>
          </div>
          {onGoToRegistro && (
            <button
              type="button"
              onClick={onGoToRegistro}
              className="inline-flex items-center gap-1 self-start rounded-lg bg-emerald-700 px-3 py-1.5 font-bold text-white hover:bg-emerald-800 shrink-0 cursor-pointer"
            >
              Consultar en Registro <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-7"
      >
        <div className="rounded-xl border border-[#FDE047] bg-[#FFFBEB] p-4 space-y-1">
          <p className="text-xs font-extrabold text-[#D61F26]">
            DIMENSIÓN {currentConfig.dimension.toUpperCase()}
          </p>
          <h3 className="font-display text-lg font-extrabold text-[#0F294A]">
            Encuesta: {currentConfig.actividadNombre}
          </h3>
          <p className="text-xs text-[#0F294A]/80">{currentConfig.introduccion}</p>
        </div>

        {/* Información del participante (campos completamente en blanco) */}
        <div className="space-y-3">
          <h4 className="font-display text-sm font-extrabold text-[#0F294A]">
            1. Información del participante
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Nombre del participante (opcional)
              </label>
              <input
                type="text"
                value={nombreParticipante}
                onChange={(e) => setNombreParticipante(e.target.value)}
                placeholder="Opcional / Anónimo"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Actividad evaluada
              </label>
              <input
                type="text"
                readOnly
                value={currentConfig.actividadNombre}
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-[#0F294A]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Fecha de realización *
              </label>
              <input
                type="date"
                required
                min="2027-01-01"
                max="2027-12-31"
                value={fechaRealizacion}
                onChange={(e) => setFechaRealizacion(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Área o cargo (opcional)
              </label>
              <input
                type="text"
                value={areaCargo}
                onChange={(e) => setAreaCargo(e.target.value)}
                placeholder="Ej. Producción, Logística..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* 8 preguntas sin selección previa */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-[#D61F26]" />
            <h4 className="font-display text-sm font-extrabold text-[#0F294A]">
              2. Preguntas de evaluación * (1 = Muy insatisfecho · 5 = Muy satisfecho)
            </h4>
          </div>
          <div className="space-y-4">
            {currentConfig.preguntas.map((q, qIdx) => (
              <div
                key={q.key}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
              >
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#D61F26]">
                    {qIdx + 1}. {q.criterio}
                  </span>
                  <p className="mt-0.5 text-sm font-semibold text-[#0F294A]">{q.enunciado}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {LIKERT_OPTIONS.map((opt) => {
                    const checked = calificaciones[q.key] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setCalificaciones({ ...calificaciones, [q.key]: opt.value })
                        }
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                          checked
                            ? 'border-[#D61F26] bg-[#D61F26] text-white'
                            : 'border-slate-200 bg-white text-[#0F294A] hover:border-[#FACC15] hover:bg-[#FEF9C3]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4 preguntas abiertas */}
        <div className="space-y-4">
          <h4 className="font-display text-sm font-extrabold text-[#0F294A]">
            3. Preguntas abiertas y sugerencias
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                ¿Qué fue lo que más le gustó de la actividad? *
              </label>
              <textarea
                rows={2}
                required
                value={loQueMasGusto}
                onChange={(e) => setLoQueMasGusto(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                ¿Qué aspectos considera que se pueden mejorar? *
              </label>
              <textarea
                rows={2}
                required
                value={aspectosMejorar}
                onChange={(e) => setAspectosMejorar(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                ¿Qué otras actividades le gustaría que se realizaran?
              </label>
              <textarea
                rows={2}
                value={otrasActividades}
                onChange={(e) => setOtrasActividades(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                Observaciones o recomendaciones adicionales
              </label>
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-[#D61F26] border-b-2 border-[#FACC15] px-6 py-3 text-sm font-extrabold text-white hover:bg-[#B3161C] cursor-pointer"
          >
            <Send className="h-4 w-4 text-[#FACC15]" />
            Enviar encuesta y guardar en registro
          </button>
        </div>
      </form>
    </div>
  );
}
