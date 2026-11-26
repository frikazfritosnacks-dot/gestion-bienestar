import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  DollarSign,
  Eye,
  FileSpreadsheet,
  Pencil,
  TrendingUp,
  X,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { EstadoEjecucion, ProgramaBienestar } from '../../types/bienestar';
import { downloadSingleExcelFormat } from '../../utils/excelFormatsGenerator';

const MONTHS_2027 = [
  'Ene 27', 'Feb 27', 'Mar 27', 'Abr 27', 'May 27', 'Jun 27',
  'Jul 27', 'Ago 27', 'Sep 27', 'Oct 27', 'Nov 27', 'Dic 27',
];
const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const ESTADOS: EstadoEjecucion[] = ['Programada', 'En ejecución', 'Realizada', 'Reprogramada'];

function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

const ESTADO_STYLE: Record<EstadoEjecucion, string> = {
  Programada: 'border-slate-300 bg-slate-100 text-[#0F294A]',
  'En ejecución': 'border-[#FACC15] bg-[#FEF9C3] text-[#0F294A]',
  Realizada: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  Reprogramada: 'border-[#FCA5A5] bg-[#FEF2F2] text-[#D61F26]',
};

/**
 * Cronograma Anual 2027 (enero a diciembre de 2027) con los 15 parámetros obligatorios
 * por actividad y Diagrama de Gantt visual y sencillo para la MiPyme Frikaz S.A.S.
 */
export function CronogramaGanttView() {
  const { state, updatePrograma, notify } = useBienestar();
  const [inspecting, setInspecting] = useState<ProgramaBienestar | null>(null);
  const [editing, setEditing] = useState<ProgramaBienestar | null>(null);
  const [exportingKey, setExportingKey] = useState<string | null>(null);

  const summary = useMemo(() => {
    const acts = state.planBienestar;
    const totalBudget = acts.reduce((acc, a) => acc + (a.presupuesto || 0), 0);
    const executedBudget = acts.reduce((acc, a) => acc + (a.presupuestoEjecutado || 0), 0);
    const avgCompliance =
      acts.length > 0
        ? Math.round(acts.reduce((acc, a) => acc + (a.porcentajeCumplimiento || 0), 0) / acts.length)
        : 0;
    const realizadas = acts.filter((a) => a.estadoEjecucion === 'Realizada').length;
    const enEjecucion = acts.filter((a) => a.estadoEjecucion === 'En ejecución').length;
    return {
      totalBudget,
      executedBudget,
      pctBudget: totalBudget > 0 ? Math.round((executedBudget / totalBudget) * 100) : 0,
      avgCompliance,
      realizadas,
      enEjecucion,
      total: acts.length,
    };
  }, [state.planBienestar]);

  const handleStatusChange = (act: ProgramaBienestar, nextEstado: EstadoEjecucion) => {
    const nextPct =
      nextEstado === 'Realizada'
        ? 100
        : nextEstado === 'En ejecución'
          ? Math.max(act.porcentajeCumplimiento, 50)
          : nextEstado === 'Programada'
            ? Math.min(act.porcentajeCumplimiento, 25)
            : act.porcentajeCumplimiento;
    updatePrograma({
      ...act,
      estadoEjecucion: nextEstado,
      porcentajeCumplimiento: nextPct,
    });
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (editing.fechaInicio && editing.fechaFin && editing.fechaFin < editing.fechaInicio) {
      notify('La fecha de finalización no puede ser anterior a la fecha de inicio.', 'warning');
      return;
    }
    updatePrograma(editing);
    setEditing(null);
  };

  const toggleMonthInDraft = (monthNum: number) => {
    if (!editing) return;
    const exists = editing.mesesCronograma.includes(monthNum);
    const nextMonths = exists
      ? editing.mesesCronograma.filter((m) => m !== monthNum)
      : [...editing.mesesCronograma, monthNum].sort((a, b) => a - b);
    setEditing({ ...editing, mesesCronograma: nextMonths });
  };

  const handleExportExcel = async (key: 'cronograma_anual' | 'diagrama_gantt') => {
    if (exportingKey) return;
    setExportingKey(key);
    try {
      const file = await downloadSingleExcelFormat(key, state);
      notify(`Excel descargado: ${file}`);
    } finally {
      setExportingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado de Cronograma 2027 + Exportaciones */}
      <section data-submodule-surface="true" className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#D61F26]">
            VIGENCIA OBLIGATORIA: ENERO A DICIEMBRE DE 2027 · 10 TRABAJADORES
          </p>
          <h2 className="font-display text-xl font-extrabold text-[#0F294A]">
            Cronograma Anual 2027 y Diagrama de Gantt
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Programación anual completa de las 9 actividades con sus 15 parámetros, responsables,
            estados y edición directa de fechas sin alterar la estructura del plan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            data-piggy-ignore="true"
            onClick={() => handleExportExcel('cronograma_anual')}
            disabled={exportingKey !== null}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F294A] border-b-2 border-[#FACC15] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#D61F26] cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#FACC15]" />
            Cronograma (.xlsx)
          </button>
          <button
            type="button"
            data-piggy-ignore="true"
            onClick={() => handleExportExcel('diagrama_gantt')}
            disabled={exportingKey !== null}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#FACC15] bg-[#FEF9C3] px-3.5 py-2 text-xs font-bold text-[#0F294A] hover:bg-[#FDE047] cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#D61F26]" />
            Gantt 2027 (.xlsx)
          </button>
        </div>
      </section>

      {/* Indicadores generales sincronizados */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Cumplimiento General 2027</span>
            <TrendingUp className="h-4 w-4 text-[#D61F26]" />
          </div>
          <p className="mt-2 font-display text-3xl font-extrabold text-[#0F294A] tabular-nums">
            {summary.avgCompliance}%
          </p>
          <p className="mt-1 text-xs text-slate-600 tabular-nums">
            {summary.realizadas} realizadas · {summary.enEjecucion} en ejecución
          </p>
        </div>

        <div className="rounded-2xl border border-[#FDE047] bg-[#FFFBEB] p-5">
          <div className="flex items-center justify-between text-xs font-bold text-[#0F294A]/75">
            <span>
              {state.presupuestoGeneral2027.estadoAprobacion === 'Aprobado por Gerencia'
                ? 'Presupuesto Aprobado 2027'
                : 'Proyección Actividades 2027'}
            </span>
            <DollarSign className="h-4 w-4 text-[#D97706]" />
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold text-[#0F294A] tabular-nums">
            {formatCop(summary.totalBudget)}
          </p>
          <p className="mt-1 text-xs text-[#0F294A]/70">
            {state.presupuestoGeneral2027.estadoAprobacion}
          </p>
        </div>

        <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-5">
          <div className="flex items-center justify-between text-xs font-bold text-[#D61F26]">
            <span>Ejecución Presupuestal Real</span>
            <DollarSign className="h-4 w-4 text-[#D61F26]" />
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold text-[#D61F26] tabular-nums">
            {state.presupuestoGeneral2027.estadoAprobacion === 'Aprobado por Gerencia'
              ? formatCop(summary.executedBudget)
              : 'Pendiente'}
          </p>
          <p className="mt-1 text-xs text-[#0F294A]/80 tabular-nums">
            {state.presupuestoGeneral2027.estadoAprobacion === 'Aprobado por Gerencia'
              ? `${summary.pctBudget}% ejecutado real`
              : 'Requiere aprobación de Gerencia'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Calendario Anual 2027</span>
            <CalendarDays className="h-4 w-4 text-[#0F294A]" />
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold text-[#0F294A]">Ene – Dic 2027</p>
          <p className="mt-1 text-xs text-slate-600">{summary.total} actividades programadas</p>
        </div>
      </div>

      {/* Diagrama de Gantt 2027 sencillo y visual */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-extrabold text-[#0F294A]">
              Diagrama de Gantt Anual 2027 — 9 Actividades
            </h3>
            <p className="mt-0.5 text-xs text-slate-600">
              Actividades continuas y recurrentes representadas por bloques mensuales claros entre
              enero y diciembre de 2027.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-5 rounded bg-[#D61F26]" />
              Periodo continuo
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-5 rounded bg-[#0F294A]" />
              Recurrencia puntual
            </span>
          </div>
        </div>

        <div className="overflow-x-auto p-6 pt-4">
          <table className="w-full min-w-[980px] border-collapse text-xs">
            <thead>
              <tr className="bg-[#0F294A] text-white">
                <th className="border border-slate-300 px-3 py-2.5 text-left w-56">Actividad</th>
                <th className="border border-slate-300 px-3 py-2.5 text-left w-40">Responsable</th>
                <th className="border border-slate-300 px-2 py-2.5 text-center w-28">Estado</th>
                <th className="border border-slate-300 px-2 py-2.5 text-center w-16">% Cumpl.</th>
                {MONTHS_2027.map((m) => (
                  <th key={m} className="border border-slate-300 px-1.5 py-2.5 text-center w-12">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.planBienestar.map((act, idx) => {
                const isContinuous = act.mesesCronograma.length >= 10;
                return (
                  <tr key={act.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                    <td className="border border-slate-200 px-3 py-2.5 font-bold text-[#0F294A]">
                      {act.numero || idx + 1}. {act.actividad}
                      <span className="block text-[11px] font-medium text-[#D61F26]">
                        {act.dimension} · {act.frecuencia}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-[11px] text-slate-700">
                      {act.responsable}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-center">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-[11px] font-bold ${
                          ESTADO_STYLE[act.estadoEjecucion]
                        }`}
                      >
                        {act.estadoEjecucion}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-center font-mono font-extrabold text-[#0F294A] tabular-nums">
                      {act.porcentajeCumplimiento}%
                    </td>
                    {MONTHS_2027.map((m, mIdx) => {
                      const active = act.mesesCronograma.includes(mIdx + 1);
                      return (
                        <td
                          key={m}
                          className="border border-slate-200 p-1 text-center align-middle"
                        >
                          {active ? (
                            <div
                              className={`mx-auto h-5 w-full ${
                                isContinuous
                                  ? 'rounded-sm bg-gradient-to-r from-[#D61F26] to-[#B3161C]'
                                  : 'rounded-md bg-[#0F294A] border border-[#FACC15]'
                              }`}
                              title={`${act.actividad} · ${m}`}
                            />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tabla de Cronograma 2027 con edición de fechas y consulta de los 15 parámetros */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="font-display text-lg font-extrabold text-[#0F294A]">
            Cronograma Detallado 2027 (15 Parámetros Obligatorios)
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Edita fechas definitivas, estado o porcentaje de cumplimiento, o abre el detalle de los
            15 lineamientos de cada actividad.
          </p>
        </div>

        <div className="overflow-x-auto p-6 pt-4">
          <table className="w-full min-w-[1040px] border-collapse text-xs">
            <thead>
              <tr className="bg-[#0F294A] text-white">
                <th className="border border-slate-300 px-3 py-2.5 text-left">Actividad y Dimensión</th>
                <th className="border border-slate-300 px-2.5 py-2.5 text-center">Inicio 2027</th>
                <th className="border border-slate-300 px-2.5 py-2.5 text-center">Fin 2027</th>
                <th className="border border-slate-300 px-3 py-2.5 text-left">Frecuencia y Duración</th>
                <th className="border border-slate-300 px-3 py-2.5 text-right">Presupuesto</th>
                <th className="border border-slate-300 px-2.5 py-2.5 text-left">Estado</th>
                <th className="border border-slate-300 px-2.5 py-2.5 text-center">% Cumpl.</th>
                <th className="border border-slate-300 px-2.5 py-2.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {state.planBienestar.map((act, idx) => (
                <tr key={act.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                  <td className="border border-slate-200 px-3 py-2.5 font-bold text-[#0F294A]">
                    {act.numero || idx + 1}. {act.actividad}
                    <span className="block text-[11px] font-medium text-[#D61F26]">
                      {act.dimension} · {act.responsable}
                    </span>
                  </td>
                  <td className="border border-slate-200 px-2.5 py-2 text-center font-mono tabular-nums text-slate-700">
                    {act.fechaInicio}
                  </td>
                  <td className="border border-slate-200 px-2.5 py-2 text-center font-mono tabular-nums text-slate-700">
                    {act.fechaFin}
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-slate-700">
                    <span className="font-semibold text-[#0F294A] block">{act.frecuencia}</span>
                    <span className="text-[11px] text-slate-500">Duración: {act.duracionEstimada}</span>
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-right font-mono font-bold text-[#0F294A] tabular-nums">
                    {formatCop(act.presupuesto)}
                  </td>
                  <td className="border border-slate-200 px-2.5 py-2">
                    <select
                      value={act.estadoEjecucion}
                      onChange={(e) =>
                        handleStatusChange(act, e.target.value as EstadoEjecucion)
                      }
                      className={`rounded-lg border px-2 py-1.5 text-xs font-bold ${
                        ESTADO_STYLE[act.estadoEjecucion]
                      }`}
                    >
                      {ESTADOS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-slate-200 px-2.5 py-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={act.porcentajeCumplimiento}
                      onChange={(e) =>
                        updatePrograma({
                          ...act,
                          porcentajeCumplimiento: Math.max(
                            0,
                            Math.min(100, Number(e.target.value) || 0)
                          ),
                        })
                      }
                      className="w-14 rounded border border-slate-300 px-1.5 py-1 text-center font-mono font-bold text-[#0F294A] tabular-nums"
                    />
                    <span className="ml-0.5 font-bold text-slate-500">%</span>
                  </td>
                  <td className="border border-slate-200 px-2.5 py-2 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setInspecting(act)}
                        className="rounded-lg border border-slate-200 p-1.5 text-[#0F294A] hover:bg-[#EFF6FF]"
                        title="Ver los 15 parámetros del cronograma"
                        aria-label={`Ver parámetros de ${act.actividad}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(act)}
                        className="rounded-lg border border-[#FACC15] bg-[#FEF9C3] p-1.5 text-[#0F294A] hover:bg-[#FDE047]"
                        title="Editar fechas y cronograma 2027"
                        aria-label={`Editar fechas de ${act.actividad}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Ver los 15 parámetros obligatorios de la actividad en el cronograma */}
      {inspecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F294A]/50 p-4 pt-16 backdrop-blur-[1px]">
          <div
            data-piggy-modal-surface="true"
            data-piggy-context={`cronograma:inspect:${inspecting.id}`}
            className="max-h-[calc(100vh-5.5rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="text-xs font-extrabold text-[#D61F26]">
                  15 PARÁMETROS DEL CRONOGRAMA 2027 · DIMENSIÓN {inspecting.dimension.toUpperCase()}
                </p>
                <h3 className="font-display text-lg font-extrabold text-[#0F294A]">
                  {inspecting.actividad}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspecting(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-[#D61F26]"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              {[
                ['1. Nombre de la actividad', inspecting.actividad],
                ['2. Dimensión', inspecting.dimension],
                ['3. Objetivo específico', inspecting.objetivo],
                ['4. Metodología', inspecting.metodologia],
                ['5. Descripción de la actividad', inspecting.descripcion],
                ['6. Responsable', inspecting.responsable],
                ['7. Recursos necesarios', inspecting.recursosNecesarios],
                ['8. Presupuesto asignado', formatCop(inspecting.presupuesto)],
                ['9. Fecha de inicio', inspecting.fechaInicio],
                ['10. Fecha de finalización', inspecting.fechaFin],
                ['11. Frecuencia', inspecting.frecuencia],
                ['12. Duración estimada', inspecting.duracionEstimada],
                ['13. Indicador de cumplimiento', inspecting.indicador],
                ['14. Evidencia de ejecución', inspecting.evidencias],
                ['15. Estado de la actividad', `${inspecting.estadoEjecucion} (${inspecting.porcentajeCumplimiento}%)`],
              ].map(([label, val]) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <dt className="font-extrabold text-[#0F294A]">{label}</dt>
                  <dd className="mt-1 text-slate-700 leading-relaxed">{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {/* Modal: Editar fechas 2027, meses del Gantt y parámetros de ejecución */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F294A]/50 p-4 pt-16 backdrop-blur-[1px]">
          <form
            data-piggy-modal-surface="true"
            data-piggy-context={`cronograma:edit:${editing.id}`}
            onSubmit={handleSaveSchedule}
            className="max-h-[calc(100vh-5.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-extrabold text-[#0F294A]">
                Editar programación 2027: {editing.actividad}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-[#D61F26]"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">Fecha de inicio (2027)</label>
                <input
                  type="date"
                  min="2027-01-01"
                  max="2027-12-31"
                  required
                  value={editing.fechaInicio}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      fechaInicio: e.target.value,
                      fechaEjecucion: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">Fecha de finalización (2027)</label>
                <input
                  type="date"
                  min="2027-01-01"
                  max="2027-12-31"
                  required
                  value={editing.fechaFin}
                  onChange={(e) => setEditing({ ...editing, fechaFin: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">Frecuencia</label>
                <input
                  type="text"
                  required
                  value={editing.frecuencia}
                  onChange={(e) => setEditing({ ...editing, frecuencia: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">Duración estimada</label>
                <input
                  type="text"
                  required
                  value={editing.duracionEstimada}
                  onChange={(e) => setEditing({ ...editing, duracionEstimada: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block font-bold text-[#0F294A]">
                  Meses activos en el Diagrama de Gantt 2027
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MONTH_SHORT.map((mName, idx) => {
                    const mNum = idx + 1;
                    const active = editing.mesesCronograma.includes(mNum);
                    return (
                      <button
                        key={mName}
                        type="button"
                        onClick={() => toggleMonthInDraft(mNum)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-bold cursor-pointer ${
                          active
                            ? 'bg-[#D61F26] text-white'
                            : 'border border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        {mName}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block font-bold text-[#0F294A]">Indicador de cumplimiento</label>
                <input
                  type="text"
                  required
                  value={editing.indicador}
                  onChange={(e) => setEditing({ ...editing, indicador: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block font-bold text-[#0F294A]">Evidencia de ejecución</label>
                <input
                  type="text"
                  required
                  value={editing.evidencias}
                  onChange={(e) => setEditing({ ...editing, evidencias: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-[#0F294A]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-xs font-bold text-white hover:bg-[#B3161C]"
              >
                <Check className="h-4 w-4" />
                Guardar programación 2027
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
