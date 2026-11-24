import { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  FileText,
  Layers,
  MapPin,
  Pencil,
  Repeat,
  Target,
  Users,
  X,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { DIMENSIONES_BIENESTAR } from '../../data/planBienestarData';
import { EstadoAprobacion, EstadoEjecucion, ProgramaBienestar } from '../../types/bienestar';

interface ActividadFichaDetailProps {
  actividad: ProgramaBienestar;
  asistentesCount: number;
  encuestasCount: number;
  promedioSatisfaccion: number;
  onBack: () => void;
  onUpdate: (updated: ProgramaBienestar) => void;
  onOpenEncuesta: (actividadId: string) => void;
  onOpenAsistencia: (actividadId: string) => void;
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

/**
 * Ficha técnica individual completa con los 16 parámetros exigidos para cada actividad
 * del Plan Anual de Bienestar Social Laboral de Frikaz S.A.S.
 */
export function ActividadFichaDetail({
  actividad,
  asistentesCount,
  encuestasCount,
  promedioSatisfaccion,
  onBack,
  onUpdate,
  onOpenEncuesta,
  onOpenAsistencia,
}: ActividadFichaDetailProps) {
  const { state, notify } = useBienestar();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProgramaBienestar>(actividad);
  const isBudgetApproved =
    state.presupuestoGeneral2027.estadoAprobacion === 'Aprobado por Gerencia';
  const costItems = state.presupuestoGeneral2027.items.filter(
    (item) => item.actividadId === actividad.id
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.fechaInicio && draft.fechaFin && draft.fechaFin < draft.fechaInicio) {
      notify('La fecha de finalización no puede ser anterior a la fecha de inicio.', 'warning');
      return;
    }
    onUpdate({
      ...draft,
      presupuestoEjecutado: isBudgetApproved ? draft.presupuestoEjecutado : 0,
    });
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Barra superior de retorno y acciones de la ficha */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#0F294A] transition-colors hover:border-[#0F294A] hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-[#D61F26]" />
          Volver a Dimensiones y Actividades
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenEncuesta(actividad.id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#FACC15] bg-[#FEF9C3] px-3.5 py-2 text-xs font-bold text-[#0F294A] hover:bg-[#FDE047] cursor-pointer"
          >
            <ClipboardCheck className="h-4 w-4 text-[#D61F26]" />
            Ir a Encuesta ({encuestasCount})
          </button>
          <button
            type="button"
            onClick={() => onOpenAsistencia(actividad.id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F294A]/20 bg-[#EFF6FF] px-3.5 py-2 text-xs font-bold text-[#0F294A] hover:bg-[#DBEAFE] cursor-pointer"
          >
            <ClipboardList className="h-4 w-4 text-[#0F294A]" />
            Ir a Lista de Asistencia ({asistentesCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(actividad);
              setEditing(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-xs font-bold text-white hover:bg-[#B3161C] cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar ficha
          </button>
        </div>
      </div>

      {/* Encabezado principal de la ficha (1. Nombre, 2. Dimensión, Estado y Frecuencia) */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="absolute inset-x-0 top-0 flex h-2">
          <div className="w-2/3 bg-[#D61F26]" />
          <div className="w-1/3 bg-[#FACC15]" />
        </div>
        <div className="flex flex-col gap-4 pt-1 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-[#D61F26]">
              <span className="font-mono text-[#0F294A]">ACTIVIDAD #{actividad.numero}</span>
              <span aria-hidden="true">·</span>
              <span>DIMENSIÓN: {actividad.dimension.toUpperCase()}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#0F294A]">{actividad.frecuencia}</span>
            </div>
            <h2 className="font-display text-2xl font-extrabold text-[#0F294A] sm:text-3xl">
              {actividad.actividad}
            </h2>
            <p className="text-sm font-semibold text-[#0F294A]/75">{actividad.nombrePrograma}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-right">
              <p className="text-[11px] font-semibold text-slate-500">Estado de ejecución</p>
              <p className="text-sm font-extrabold text-[#0F294A]">
                {actividad.estadoEjecucion} · {actividad.porcentajeCumplimiento}%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bloques estructurados con los 16 parámetros de planificación */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 3. Objetivo general del programa y 6. Objetivo específico */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Target className="h-5 w-5 text-[#D61F26]" />
            <h3 className="font-display text-base font-extrabold text-[#0F294A]">
              Objetivos y Justificación
            </h3>
          </div>
          <div className="space-y-4 text-sm leading-relaxed">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]/70">
                3. Objetivo general del programa
              </h4>
              <p className="mt-1 text-slate-700">{actividad.objetivoGeneralPrograma}</p>
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-[#D61F26]">
                6. Objetivo específico de la actividad
              </h4>
              <p className="mt-1 text-slate-700">{actividad.objetivo}</p>
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]/70">
                13. Justificación
              </h4>
              <p className="mt-1 text-slate-700">{actividad.justificacion}</p>
            </div>
          </div>
        </section>

        {/* 4. Metodología, 5. Descripción general y 7. Descripción detallada */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <FileText className="h-5 w-5 text-[#0F294A]" />
            <h3 className="font-display text-base font-extrabold text-[#0F294A]">
              Metodología y Desarrollo
            </h3>
          </div>
          <div className="space-y-4 text-sm leading-relaxed">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]/70">
                4. Metodología
              </h4>
              <p className="mt-1 text-slate-700">{actividad.metodologia}</p>
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]/70">
                5. Descripción general
              </h4>
              <p className="mt-1 text-slate-700">{actividad.descripcion}</p>
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]/70">
                7. Descripción detallada de la actividad
              </h4>
              <p className="mt-1 text-slate-700">{actividad.descripcionDetallada}</p>
            </div>
          </div>
        </section>

        {/* 8. Responsables, 9. Materiales e insumos, 10. Participantes, 11. Presupuesto */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Layers className="h-5 w-5 text-[#D97706]" />
            <h3 className="font-display text-base font-extrabold text-[#0F294A]">
              Recursos, Responsables y Presupuesto
            </h3>
          </div>

          <dl className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D61F26]" />
              <div>
                <dt className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]/70">
                  8. Responsables
                </dt>
                <dd className="mt-0.5 text-slate-700">{actividad.responsable}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#0F294A]" />
              <div>
                <dt className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]/70">
                  10. Participantes o población beneficiaria
                </dt>
                <dd className="mt-0.5 text-slate-700">{actividad.poblacionParticipante}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-[#0F294A]" />
              <div>
                <dt className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]/70">
                  9. Materiales o insumos requeridos
                </dt>
                <dd className="mt-0.5 text-slate-700">{actividad.recursosNecesarios}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-[#FDE047] bg-[#FFFBEB] p-3.5">
              <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-[#D61F26]" />
              <div className="w-full space-y-2">
                <dt className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]">
                  11. Presupuesto y desglose detallado 2027
                </dt>
                <dd className="text-slate-700 tabular-nums">
                  <strong>{isBudgetApproved ? 'Aprobado:' : 'Proyectado:'}</strong>{' '}
                  {formatCop(actividad.presupuesto)} ·{' '}
                  <strong>Ejecutado:</strong>{' '}
                  {isBudgetApproved ? formatCop(actividad.presupuestoEjecutado) : 'Pendiente de aprobación'}
                </dd>
                <dd className="text-xs font-semibold text-[#0F294A]/80">
                  Estado presupuestal:{' '}
                  {isBudgetApproved
                    ? actividad.presupuestoEstado
                    : state.presupuestoGeneral2027.estadoAprobacion}
                </dd>
                {costItems.length > 0 && (
                  <dd className="mt-2 space-y-1 border-t border-[#FDE047]/70 pt-2 text-xs text-[#0F294A]/90">
                    {costItems.map((it) => (
                      <div key={it.id} className="flex items-center justify-between gap-2 tabular-nums">
                        <span className="truncate">
                          {it.recursoMaterial} ({it.cantidad} {it.unidadMedida})
                        </span>
                        <span className="font-mono font-bold shrink-0">
                          {formatCop(it.cantidad * it.valorUnitario)}
                        </span>
                      </div>
                    ))}
                  </dd>
                )}
              </div>
            </div>
          </dl>
        </section>

        {/* 12. Cronograma, 14. Encuesta, 15. Lista de asistencia, 16. Frecuencia */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Calendar className="h-5 w-5 text-[#D61F26]" />
            <h3 className="font-display text-base font-extrabold text-[#0F294A]">
              Cronograma, Frecuencia e Instrumentos Vinculados
            </h3>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]/70">
                12. Cronograma
              </h4>
              <p className="mt-1 text-slate-700">{actividad.cronogramaTexto}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {MONTH_NAMES.map((m, idx) => {
                  const active = actividad.mesesCronograma.includes(idx + 1);
                  return (
                    <span
                      key={m}
                      className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                        active
                          ? 'bg-[#D61F26] text-white'
                          : 'border border-slate-200 bg-slate-50 text-slate-400'
                      }`}
                    >
                      {m}
                    </span>
                  );
                })}
              </div>
              <div className="mt-2.5 grid grid-cols-1 gap-1.5 text-xs text-slate-600 font-mono tabular-nums sm:grid-cols-2">
                <span>Inicio: {actividad.fechaInicio || actividad.fechaEjecucion}</span>
                <span>Fin: {actividad.fechaFin || '2027-12-31'}</span>
                <span>
                  Horario: {actividad.horaInicio} - {actividad.horaFin}
                </span>
                <span>Duración: {actividad.duracionEstimada || 'Según jornada'}</span>
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600">
                <MapPin className="h-3.5 w-3.5 text-[#D61F26]" />
                {actividad.lugar}
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <Repeat className="mt-0.5 h-4 w-4 shrink-0 text-[#0F294A]" />
              <div className="space-y-1.5">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]/70">
                    16. Frecuencia
                  </h4>
                  <p className="mt-0.5 font-semibold text-[#0F294A]">{actividad.frecuencia}</p>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p>
                    <strong className="text-[#0F294A]">Indicador:</strong> {actividad.indicador}
                  </p>
                  <p>
                    <strong className="text-[#0F294A]">Evidencia:</strong> {actividad.evidencias}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
              <button
                type="button"
                onClick={() => onOpenEncuesta(actividad.id)}
                className="flex flex-col justify-between rounded-xl border border-[#FACC15] bg-[#FFFBEB] p-3.5 text-left transition-colors hover:bg-[#FEF9C3] cursor-pointer"
              >
                <span className="text-xs font-extrabold text-[#0F294A]">
                  14. Encuesta de satisfacción
                </span>
                <span className="mt-1 text-xs text-slate-700 tabular-nums">
                  {encuestasCount > 0
                    ? `${encuestasCount} respuestas · Promedio ${promedioSatisfaccion.toFixed(1)}/5`
                    : 'Encuesta específica lista para aplicar'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAsistencia(actividad.id)}
                className="flex flex-col justify-between rounded-xl border border-[#0F294A]/20 bg-[#EFF6FF] p-3.5 text-left transition-colors hover:bg-[#DBEAFE] cursor-pointer"
              >
                <span className="text-xs font-extrabold text-[#0F294A]">
                  15. Lista de asistencia
                </span>
                <span className="mt-1 text-xs text-slate-700 tabular-nums">
                  {asistentesCount} participantes registrados · Abrir formato
                </span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Modal limpio de edición completa */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F294A]/50 p-4 backdrop-blur-[1px]">
          <form
            onSubmit={handleSave}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-extrabold text-[#0F294A]">
                Editar ficha de planificación
              </h3>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-[#D61F26]"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Nombre de la actividad
                </label>
                <input
                  type="text"
                  required
                  value={draft.actividad}
                  onChange={(e) => setDraft({ ...draft, actividad: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">Dimensión</label>
                <select
                  value={draft.dimension}
                  onChange={(e) => setDraft({ ...draft, dimension: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {DIMENSIONES_BIENESTAR.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">Metodología</label>
                <textarea
                  rows={2}
                  required
                  value={draft.metodologia}
                  onChange={(e) => setDraft({ ...draft, metodologia: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Objetivo específico
                </label>
                <textarea
                  rows={2}
                  required
                  value={draft.objetivo}
                  onChange={(e) => setDraft({ ...draft, objetivo: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Descripción detallada
                </label>
                <textarea
                  rows={2}
                  required
                  value={draft.descripcionDetallada}
                  onChange={(e) => setDraft({ ...draft, descripcionDetallada: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">Justificación</label>
                <textarea
                  rows={2}
                  required
                  value={draft.justificacion}
                  onChange={(e) => setDraft({ ...draft, justificacion: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">Responsables</label>
                <input
                  type="text"
                  required
                  value={draft.responsable}
                  onChange={(e) => setDraft({ ...draft, responsable: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">Frecuencia</label>
                <input
                  type="text"
                  required
                  value={draft.frecuencia}
                  onChange={(e) => setDraft({ ...draft, frecuencia: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Presupuesto programado (COP)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={draft.presupuesto}
                  onChange={(e) =>
                    setDraft({ ...draft, presupuesto: Number(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Presupuesto ejecutado (COP)
                </label>
                <input
                  type="number"
                  min={0}
                  disabled={!isBudgetApproved}
                  required
                  value={isBudgetApproved ? draft.presupuestoEjecutado : 0}
                  onChange={(e) =>
                    setDraft({ ...draft, presupuestoEjecutado: Number(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Estado aprobación
                </label>
                <select
                  value={draft.estadoAprobacion}
                  onChange={(e) =>
                    setDraft({ ...draft, estadoAprobacion: e.target.value as EstadoAprobacion })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Aprobado">Aprobado</option>
                  <option value="Pendiente de aprobación">Pendiente de aprobación</option>
                  <option value="En ajuste">En ajuste</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Estado ejecución
                </label>
                <select
                  value={draft.estadoEjecucion}
                  onChange={(e) =>
                    setDraft({ ...draft, estadoEjecucion: e.target.value as EstadoEjecucion })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Programada">Programada</option>
                  <option value="En ejecución">En ejecución</option>
                  <option value="Realizada">Realizada</option>
                  <option value="Reprogramada">Reprogramada</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Fecha de inicio (2027)
                </label>
                <input
                  type="date"
                  min="2027-01-01"
                  max="2027-12-31"
                  required
                  value={draft.fechaInicio || draft.fechaEjecucion}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      fechaInicio: e.target.value,
                      fechaEjecucion: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Fecha de finalización (2027)
                </label>
                <input
                  type="date"
                  min="2027-01-01"
                  max="2027-12-31"
                  required
                  value={draft.fechaFin || '2027-12-31'}
                  onChange={(e) => setDraft({ ...draft, fechaFin: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Duración estimada
                </label>
                <input
                  type="text"
                  required
                  value={draft.duracionEstimada || ''}
                  onChange={(e) => setDraft({ ...draft, duracionEstimada: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Indicador de medición
                </label>
                <input
                  type="text"
                  required
                  value={draft.indicador}
                  onChange={(e) => setDraft({ ...draft, indicador: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Materiales o insumos requeridos
                </label>
                <input
                  type="text"
                  required
                  value={draft.recursosNecesarios}
                  onChange={(e) => setDraft({ ...draft, recursosNecesarios: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Evidencia documental esperada
                </label>
                <input
                  type="text"
                  required
                  value={draft.evidencias}
                  onChange={(e) => setDraft({ ...draft, evidencias: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-[#0F294A]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-xs font-bold text-white hover:bg-[#B3161C]"
              >
                <Check className="h-4 w-4" />
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
