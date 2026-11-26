import { useMemo, useState } from 'react';
import {
  BarChart3,
  Camera,
  Check,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  Plus,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { EvidenciaFotografica, RegistroSeguimiento } from '../../types/bienestar';
import { ConfirmModal } from '../ui/ConfirmModal';

function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

/**
 * Apartado dedicado a Seguimiento e Indicadores reales dentro de Programas de Bienestar:
 * calcula KPIs únicamente con los registros persistentes de la plataforma y permite
 * documentar ejecuciones reales con evidencias fotográficas y soporte.
 */
export function SeguimientoIndicadoresView() {
  const { state, addSeguimiento, deleteSeguimiento, notify } = useBienestar();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<RegistroSeguimiento | null>(null);

  const [actividadId, setActividadId] = useState(state.planBienestar[0]?.id || 'act-1');
  const [fecha, setFecha] = useState('2027-02-15');
  const [convocados, setConvocados] = useState(10);
  const [participantes, setParticipantes] = useState(0);
  const [cumplimientoCronograma, setCumplimientoCronograma] = useState(100);
  const [presupuestoEjecutado, setPresupuestoEjecutado] = useState(0);
  const [nivelSatisfaccion, setNivelSatisfaccion] = useState(0);
  const [registroAsistencia, setRegistroAsistencia] = useState('Planilla ASIST-2027 diligenciada');
  const [encuestaSatisfaccion, setEncuestaSatisfaccion] = useState('Encuesta digital registrada');
  const [informeResultados, setInformeResultados] = useState('');
  const [evidencias, setEvidencias] = useState<EvidenciaFotografica[]>([]);
  const [formError, setFormError] = useState('');

  const budgetApproved =
    state.presupuestoGeneral2027.estadoAprobacion === 'Aprobado por Gerencia';

  const kpis = useMemo(() => {
    const acts = state.planBienestar;
    const avgCumplimiento =
      acts.length > 0
        ? Math.round(acts.reduce((acc, a) => acc + (a.porcentajeCumplimiento || 0), 0) / acts.length)
        : 0;
    const realizadas = acts.filter((a) => a.estadoEjecucion === 'Realizada').length;
    const enEjecucion = acts.filter((a) => a.estadoEjecucion === 'En ejecución').length;

    const totalSesionesAsistencia = state.listasAsistencia.length;
    const totalAsistentesReales = state.listasAsistencia.reduce(
      (acc, l) => acc + l.participantes.length,
      0
    );

    const totalEncuestas = state.respuestasEncuestas.length;
    const avgEncuestaReal =
      totalEncuestas > 0
        ? state.respuestasEncuestas.reduce((acc, r) => {
            const vals = Object.values(r.calificaciones);
            return acc + vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
          }, 0) / totalEncuestas
        : 0;

    const executedReal = budgetApproved
      ? state.presupuestoGeneral2027.items.reduce((acc, it) => acc + Math.max(0, it.ejecutado || 0), 0)
      : 0;
    const approvedTotal = budgetApproved
      ? state.presupuestoGeneral2027.presupuestoTotalAprobado
      : 0;

    return {
      avgCumplimiento,
      realizadas,
      enEjecucion,
      totalSesionesAsistencia,
      totalAsistentesReales,
      totalEncuestas,
      avgEncuestaReal,
      executedReal,
      approvedTotal,
    };
  }, [state, budgetApproved]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      notify('La imagen de evidencia no debe superar 1.5 MB.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      setEvidencias((prev) => [
        ...prev,
        {
          id: `ev-${Date.now()}`,
          titulo: file.name,
          fecha,
          dataUrl,
          descripcion: file.name,
        },
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const act = state.planBienestar.find((a) => a.id === actividadId);
    if (!act) {
      setFormError('Selecciona una actividad válida del plan.');
      return;
    }
    if (!fecha || !informeResultados.trim()) {
      setFormError('Completa la fecha y el informe de resultados del seguimiento.');
      return;
    }
    if (participantes > convocados) {
      setFormError('El número de asistentes no puede superar al de convocados.');
      return;
    }
    if (!budgetApproved && presupuestoEjecutado > 0) {
      setFormError(
        'No se puede registrar gasto ejecutado mientras el Presupuesto General siga pendiente de aprobación.'
      );
      return;
    }

    addSeguimiento({
      programaId: act.id,
      nombreActividad: act.actividad,
      fecha,
      convocados,
      participantes,
      nivelSatisfaccion,
      cumplimientoCronograma,
      presupuestoPlaneado: act.presupuesto || 0,
      presupuestoEjecutado: budgetApproved ? presupuestoEjecutado : 0,
      registroAsistencia: registroAsistencia.trim() || 'Sin registro adjunto',
      encuestaSatisfaccion: encuestaSatisfaccion.trim() || 'Sin encuesta adjunta',
      informeResultados: informeResultados.trim(),
      evidenciasFotograficas: evidencias,
    });

    setModalOpen(false);
    setInformeResultados('');
    setEvidencias([]);
    setParticipantes(0);
    setPresupuestoEjecutado(0);
    setNivelSatisfaccion(0);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <section data-submodule-surface="true" className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#D61F26]">
            INDICADORES REALES SIN DATOS SIMULADOS · VIGENCIA 2027
          </p>
          <h2 className="font-display text-xl font-extrabold text-[#0F294A]">
            Seguimiento de Ejecución e Indicadores de Bienestar
          </h2>
          <p className="text-xs text-slate-600">
            Tablero de control calculado en tiempo real a partir de listas de asistencia, encuestas
            de satisfacción, actas de seguimiento y ejecución presupuestal autorizada.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError('');
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#B3161C] cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4 text-[#FACC15]" />
          Registrar seguimiento real
        </button>
      </section>

      {/* 4 KPIs reales */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Cumplimiento del Plan</span>
            <TrendingUp className="h-4 w-4 text-[#D61F26]" />
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold text-[#0F294A] tabular-nums">
            {kpis.avgCumplimiento}%
          </p>
          <p className="mt-1 text-[11px] text-slate-600 tabular-nums">
            {kpis.realizadas} realizadas · {kpis.enEjecucion} en ejecución
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Asistencia Registrada</span>
            <Users className="h-4 w-4 text-[#0F294A]" />
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold text-[#0F294A] tabular-nums">
            {kpis.totalAsistentesReales} registros
          </p>
          <p className="mt-1 text-[11px] text-slate-600 tabular-nums">
            {kpis.totalSesionesAsistencia} jornada(s) documentada(s)
          </p>
        </div>

        <div className="rounded-2xl border border-[#FDE047] bg-[#FFFBEB] p-5">
          <div className="flex items-center justify-between text-xs font-bold text-[#0F294A]">
            <span>Satisfacción Promedio</span>
            <ClipboardCheck className="h-4 w-4 text-[#D61F26]" />
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold text-[#0F294A] tabular-nums">
            {kpis.totalEncuestas > 0 ? `${kpis.avgEncuestaReal.toFixed(2)} / 5.0` : 'Sin datos aún'}
          </p>
          <p className="mt-1 text-[11px] text-slate-600 tabular-nums">
            {kpis.totalEncuestas} encuesta(s) diligenciada(s)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Ejecución Presupuestal</span>
            <DollarSign className="h-4 w-4 text-[#D61F26]" />
          </div>
          <p className="mt-2 font-display text-xl font-extrabold text-[#0F294A] tabular-nums">
            {budgetApproved ? formatCop(kpis.executedReal) : 'Pendiente aprobación'}
          </p>
          <p className="mt-1 text-[11px] text-slate-600 tabular-nums">
            {budgetApproved
              ? `De ${formatCop(kpis.approvedTotal)} aprobados`
              : state.presupuestoGeneral2027.estadoAprobacion}
          </p>
        </div>
      </section>

      {/* Matriz consolidada de indicadores por actividad */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#D61F26]" />
          <h3 className="font-display text-base font-extrabold text-[#0F294A]">
            Indicadores Consolidados por Actividad (Datos Reales)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-xs">
            <thead>
              <tr className="bg-[#0F294A] text-white">
                <th className="border border-slate-300 px-3 py-2.5 text-left">Actividad</th>
                <th className="border border-slate-300 px-3 py-2.5 text-left">Indicador y Meta</th>
                <th className="border border-slate-300 px-3 py-2.5 text-center">Estado</th>
                <th className="border border-slate-300 px-3 py-2.5 text-center">Asistentes</th>
                <th className="border border-slate-300 px-3 py-2.5 text-center">Encuestas</th>
                <th className="border border-slate-300 px-3 py-2.5 text-center">% Cumpl.</th>
              </tr>
            </thead>
            <tbody>
              {state.planBienestar.map((act, idx) => {
                const asistCount = state.listasAsistencia
                  .filter((l) => l.actividadId === act.id)
                  .reduce((acc, l) => acc + l.participantes.length, 0);
                const enc = state.respuestasEncuestas.filter((r) => r.actividadId === act.id);
                const encAvg =
                  enc.length > 0
                    ? (
                        enc.reduce((acc, r) => acc + (r.calificacionGeneral || 0), 0) / enc.length
                      ).toFixed(1)
                    : null;

                return (
                  <tr key={act.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                    <td className="border border-slate-200 px-3 py-2.5 font-bold text-[#0F294A]">
                      #{act.numero} · {act.actividad}
                      <span className="block text-[11px] font-medium text-[#D61F26]">
                        {act.dimension}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-slate-700">
                      <p className="font-semibold text-[#0F294A]">{act.indicador}</p>
                      <p className="text-[11px] text-slate-500">Meta: {act.meta}</p>
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-center font-bold text-[#0F294A]">
                      {act.estadoEjecucion}
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-center font-mono tabular-nums">
                      {asistCount}
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-center font-mono tabular-nums">
                      {encAvg ? `${enc.length} (${encAvg}/5)` : '0'}
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-center font-mono font-extrabold text-[#0F294A] tabular-nums">
                      {act.porcentajeCumplimiento}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Historial de seguimientos y evidencias registradas */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ClipboardList className="h-4 w-4 text-[#0F294A]" />
          <h3 className="font-display text-base font-extrabold text-[#0F294A]">
            Bitácora de Seguimiento y Evidencias Registradas ({state.seguimiento.length})
          </h3>
        </div>

        {state.seguimiento.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-600">
            No hay registros de seguimiento ingresados todavía. Utiliza el botón{' '}
            <strong>Registrar seguimiento real</strong> cuando se ejecute una jornada.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {state.seguimiento.map((seg) => {
              const pctAsist =
                seg.convocados > 0 ? Math.round((seg.participantes / seg.convocados) * 100) : 0;
              return (
                <article
                  key={seg.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-extrabold text-[#D61F26]">{seg.fecha}</p>
                      <h4 className="font-display text-sm font-extrabold text-[#0F294A]">
                        {seg.nombreActividad}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(seg)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-[#FEE2E2] hover:text-[#D61F26] cursor-pointer"
                      aria-label={`Eliminar seguimiento ${seg.nombreActividad}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] tabular-nums text-slate-700">
                    <div>
                      <strong>Asistencia:</strong> {seg.participantes}/{seg.convocados} ({pctAsist}%)
                    </div>
                    <div>
                      <strong>Satisfacción:</strong>{' '}
                      {seg.nivelSatisfaccion > 0 ? `${seg.nivelSatisfaccion}/5` : 'N/A'}
                    </div>
                    <div>
                      <strong>Ejecutado:</strong>{' '}
                      {budgetApproved ? formatCop(seg.presupuestoEjecutado) : 'Pendiente'}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{seg.informeResultados}</p>
                  <p className="text-[11px] text-slate-500">
                    Soportes: {seg.registroAsistencia} · {seg.encuestaSatisfaccion}
                  </p>

                  {seg.evidenciasFotograficas && seg.evidenciasFotograficas.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {seg.evidenciasFotograficas.map((ev) => (
                        <img
                          key={ev.id}
                          src={ev.dataUrl}
                          alt={ev.titulo}
                          className="h-14 w-20 rounded-lg border border-slate-200 object-cover"
                        />
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal de registro de seguimiento */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F294A]/50 p-4 pt-16 backdrop-blur-[1px]">
          <form
            data-piggy-modal-surface="true"
            data-piggy-context="seguimiento:new-modal"
            onSubmit={handleSubmit}
            className="max-h-[calc(100vh-5.5rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-extrabold text-[#0F294A]">
                Registrar Seguimiento de Ejecución 2027
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-[#D61F26] cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div className="sm:col-span-2">
                <label className="mb-1 block font-bold text-[#0F294A]">Actividad *</label>
                <select
                  value={actividadId}
                  onChange={(e) => setActividadId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {state.planBienestar.map((a) => (
                    <option key={a.id} value={a.id}>
                      #{a.numero} · {a.actividad} ({a.dimension})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">Fecha *</label>
                <input
                  type="date"
                  min="2027-01-01"
                  max="2027-12-31"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">
                  Cumplimiento cronograma (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={cumplimientoCronograma}
                  onChange={(e) =>
                    setCumplimientoCronograma(
                      Math.min(100, Math.max(0, Number(e.target.value) || 0))
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">Convocados *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={convocados}
                  onChange={(e) => setConvocados(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">Asistentes reales *</label>
                <input
                  type="number"
                  min={0}
                  max={convocados}
                  required
                  value={participantes}
                  onChange={(e) => setParticipantes(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">
                  Satisfacción (0 - 5.0)
                </label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={nivelSatisfaccion}
                  onChange={(e) =>
                    setNivelSatisfaccion(Math.min(5, Math.max(0, Number(e.target.value) || 0)))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">
                  Gasto ejecutado real (COP)
                </label>
                <input
                  type="number"
                  min={0}
                  disabled={!budgetApproved}
                  value={budgetApproved ? presupuestoEjecutado : 0}
                  onChange={(e) =>
                    setPresupuestoEjecutado(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">
                  Soporte de asistencia
                </label>
                <input
                  type="text"
                  value={registroAsistencia}
                  onChange={(e) => setRegistroAsistencia(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">
                  Soporte de encuesta
                </label>
                <input
                  type="text"
                  value={encuestaSatisfaccion}
                  onChange={(e) => setEncuestaSatisfaccion(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block font-bold text-[#0F294A]">
                  Informe de resultados y observaciones *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe desarrollo de la jornada, logros y compromisos..."
                  value={informeResultados}
                  onChange={(e) => setInformeResultados(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 flex items-center gap-1.5 font-bold text-[#0F294A]">
                  <Camera className="h-3.5 w-3.5 text-[#D61F26]" />
                  Evidencia fotográfica (opcional, máx. 1.5 MB)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#FEF9C3] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#0F294A]"
                />
                {evidencias.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {evidencias.map((ev) => (
                      <img
                        key={ev.id}
                        src={ev.dataUrl}
                        alt={ev.titulo}
                        className="h-12 w-16 rounded border border-slate-200 object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {formError && (
              <p role="alert" className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-xs font-bold text-[#D61F26]">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-[#0F294A] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-xs font-bold text-white hover:bg-[#B3161C] cursor-pointer"
              >
                <Check className="h-4 w-4" />
                Guardar seguimiento
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="¿Eliminar registro de seguimiento?"
        description={`Se eliminará el acta de seguimiento de "${pendingDelete?.nombreActividad}" (${pendingDelete?.fecha}).`}
        confirmLabel="Sí, eliminar"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            deleteSeguimiento(pendingDelete.id);
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
}
