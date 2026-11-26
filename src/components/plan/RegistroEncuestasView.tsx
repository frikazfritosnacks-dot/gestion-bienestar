import { useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileSpreadsheet,
  Filter,
  Lightbulb,
  Lock,
  MessageSquare,
  Pencil,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { DIMENSIONES_BIENESTAR, ENCUESTAS_POR_ACTIVIDAD } from '../../data/planBienestarData';
import { CriterioEncuestaKey, RespuestaEncuesta } from '../../types/bienestar';
import {
  buildEncuestasRegistroWorkbook,
  downloadWorkbookAsExcel,
} from '../../utils/excelFormatsGenerator';

const AUTHORIZED_PIN = '2027';

const CRITERIO_LABELS: Record<CriterioEncuestaKey, string> = {
  organizacion: 'Organización',
  claridad: 'Claridad',
  cumplimientoObjetivo: 'Cumplimiento del objetivo',
  materiales: 'Materiales / recursos',
  participacion: 'Participación',
  duracion: 'Duración',
  utilidad: 'Utilidad',
  satisfaccionGeneral: 'Satisfacción general',
};

function calcAverage(r: RespuestaEncuesta): number {
  if (typeof r.calificacionGeneral === 'number') return r.calificacionGeneral;
  const vals = Object.values(r.calificaciones);
  return vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
}

/**
 * Sección independiente: REGISTRO DE ENCUESTAS DE SATISFACCIÓN.
 * Funciona como base de datos permanente con listado general, vista individual,
 * consolidado por actividad, consolidado general, filtros, cálculos automáticos,
 * corrección autorizada y descargas reales en Excel.
 */
export function RegistroEncuestasView() {
  const { state, updateRespuestaEncuestaAuthorized, notify } = useBienestar();
  const [filterActividadId, setFilterActividadId] = useState<string>('ALL');
  const [filterDimension, setFilterDimension] = useState<string>('ALL');
  const [filterFecha, setFilterFecha] = useState<string>('');
  const [viewMode, setViewMode] = useState<'listado' | 'porActividad' | 'consolidado'>('listado');
  const [selectedRecord, setSelectedRecord] = useState<RespuestaEncuesta | null>(null);
  const [editingRecord, setEditingRecord] = useState<RespuestaEncuesta | null>(null);
  const [authPinModalOpen, setAuthPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [autorizadorNombre, setAutorizadorNombre] = useState('');
  const [pendingEditTarget, setPendingEditTarget] = useState<RespuestaEncuesta | null>(null);
  const [exporting, setExporting] = useState(false);

  const actDimMap = useMemo(
    () => new Map(state.planBienestar.map((a) => [a.id, a.dimension])),
    [state.planBienestar]
  );

  // Respuestas filtradas organizadas por fecha más reciente y número de registro
  const filteredResponses = useMemo(() => {
    return state.respuestasEncuestas
      .filter((r) => {
        const dim = r.dimension || actDimMap.get(r.actividadId) || '';
        if (filterActividadId !== 'ALL' && r.actividadId !== filterActividadId) return false;
        if (filterDimension !== 'ALL' && dim !== filterDimension) return false;
        if (filterFecha && r.fechaRealizacion !== filterFecha) return false;
        return true;
      })
      .sort((a, b) => {
        const dateCmp = (b.fechaRealizacion || '').localeCompare(a.fechaRealizacion || '');
        if (dateCmp !== 0) return dateCmp;
        return (b.numeroRegistro || 0) - (a.numeroRegistro || 0);
      });
  }, [state.respuestasEncuestas, filterActividadId, filterDimension, filterFecha, actDimMap]);

  // Cálculos automáticos sobre las respuestas filtradas y sobre el total global del Plan
  const analytics = useMemo(() => {
    const computeMetrics = (rows: RespuestaEncuesta[]) => {
      const total = rows.length;
      if (total === 0) {
        return {
          total: 0,
          promedio: 0,
          porcentaje: 0,
          byCriterion: (Object.keys(CRITERIO_LABELS) as CriterioEncuestaKey[]).map((k) => ({
            key: k,
            label: CRITERIO_LABELS[k],
            promedio: 0,
            porcentaje: 0,
          })),
          mejoresPreguntas: [] as Array<{ label: string; promedio: number }>,
          aspectosMejoraPreguntas: [] as Array<{ label: string; promedio: number }>,
          comentarios: [] as Array<{
            id: string;
            reg: string;
            actividad: string;
            fecha: string;
            aspectosMejorar: string;
            otrasActividades: string;
            observaciones: string;
          }>,
        };
      }

      const avg = rows.reduce((acc, r) => acc + calcAverage(r), 0) / total;
      const byCriterion = (Object.keys(CRITERIO_LABELS) as CriterioEncuestaKey[]).map((key) => {
        const cAvg =
          rows.reduce((acc, r) => acc + (r.calificaciones[key] || 0), 0) / total;
        return {
          key,
          label: CRITERIO_LABELS[key],
          promedio: cAvg,
          porcentaje: Math.round((cAvg / 5) * 100),
        };
      });

      const sortedDesc = [...byCriterion].sort((a, b) => b.promedio - a.promedio);
      const sortedAsc = [...byCriterion].sort((a, b) => a.promedio - b.promedio);

      const comentarios = rows.map((r, idx) => ({
        id: r.id,
        reg: `ENC-2027-${String(r.numeroRegistro ?? idx + 1).padStart(3, '0')}`,
        actividad: r.actividadNombre,
        fecha: r.fechaRealizacion,
        aspectosMejorar: r.aspectosMejorar,
        otrasActividades: r.otrasActividades,
        observaciones: r.observaciones,
      }));

      return {
        total,
        promedio: avg,
        porcentaje: Math.round((avg / 5) * 100),
        byCriterion,
        mejoresPreguntas: sortedDesc.slice(0, 3),
        aspectosMejoraPreguntas: sortedAsc.slice(0, 3),
        comentarios,
      };
    };

    const filteredStats = computeMetrics(filteredResponses);
    const globalStats = computeMetrics(state.respuestasEncuestas);

    const byActivity = state.planBienestar.map((act) => {
      const rows = filteredResponses.filter((r) => r.actividadId === act.id);
      const st = computeMetrics(rows);
      return {
        actividadId: act.id,
        actividad: act.actividad,
        dimension: act.dimension,
        total: st.total,
        promedio: st.promedio,
        porcentaje: st.porcentaje,
        mejorCriterio: st.mejoresPreguntas[0]?.label || '—',
        aMejorar: st.aspectosMejoraPreguntas[0]?.label || '—',
      };
    });

    return { filteredStats, globalStats, byActivity };
  }, [filteredResponses, state.respuestasEncuestas, state.planBienestar]);

  const handleDownloadExcel = async (mode: 'todas' | 'filtradas' | 'consolidado') => {
    if (exporting) return;
    const rowsToExport =
      mode === 'filtradas' ? filteredResponses : state.respuestasEncuestas;

    if (rowsToExport.length === 0) {
      notify(
        'Aún no hay respuestas registradas para descargar con los criterios seleccionados.',
        'warning'
      );
      return;
    }

    setExporting(true);
    try {
      const desc =
        mode === 'filtradas'
          ? 'Resultados filtrados del Registro de Encuestas'
          : mode === 'consolidado'
            ? 'Consolidado general de satisfacción del Plan de Bienestar 2027'
            : 'Base completa de respuestas registradas';
      const wb = await buildEncuestasRegistroWorkbook(
        rowsToExport,
        state.planBienestar,
        desc
      );
      const filename =
        mode === 'filtradas'
          ? 'Registro_Encuestas_Filtradas_Frikaz_2027.xlsx'
          : mode === 'consolidado'
            ? 'Consolidado_General_Encuestas_Frikaz_2027.xlsx'
            : 'Base_Completa_Encuestas_Satisfaccion_Frikaz_2027.xlsx';
      await downloadWorkbookAsExcel(wb, filename);
      notify(`Archivo descargado: ${filename}`);
    } finally {
      setExporting(false);
    }
  };

  const requestAuthorizedEdit = (record: RespuestaEncuesta) => {
    setPendingEditTarget(record);
    setPinInput('');
    setAuthPinModalOpen(true);
  };

  const confirmAuthorization = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() !== AUTHORIZED_PIN) {
      notify('Clave de autorización incorrecta. Solo Talento Humano autorizado puede corregir registros.', 'warning');
      return;
    }
    if (!autorizadorNombre.trim()) {
      notify('Ingresa el nombre del responsable que autoriza la corrección.', 'warning');
      return;
    }
    setAuthPinModalOpen(false);
    if (pendingEditTarget) {
      setEditingRecord({ ...pendingEditTarget });
      setPendingEditTarget(null);
    }
  };

  const saveAuthorizedCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    updateRespuestaEncuestaAuthorized(editingRecord, autorizadorNombre);
    setSelectedRecord(editingRecord);
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado del apartado independiente */}
      <section
        data-submodule-surface="true"
        data-piggy-context={`reg-encuestas:${viewMode}`}
        className="rounded-2xl border-2 border-[#0F294A]/15 bg-white p-6 shadow-xs space-y-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold tracking-wide text-[#D61F26]">
              <ClipboardCheck className="h-4 w-4" />
              <span>BASE DE DATOS PERMANENTE · REGISTROS INDEPENDIENTES</span>
            </div>
            <h2 className="font-display text-2xl font-extrabold text-[#0F294A]">
              REGISTRO DE ENCUESTAS DE SATISFACCIÓN
            </h2>
            <p className="text-xs leading-relaxed text-slate-600 max-w-2xl">
              Almacenamiento permanente de cada respuesta enviada por los trabajadores. Ninguna
              encuesta sobrescribe registros anteriores; consulta respuestas individuales, consolidado
              por actividad y resultados globales en Excel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-piggy-ignore="true"
              onClick={() => handleDownloadExcel('todas')}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#B3161C] cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#FACC15]" />
              Descargar todas (.xlsx)
            </button>
            <button
              type="button"
              data-piggy-ignore="true"
              onClick={() => handleDownloadExcel('filtradas')}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#FACC15] bg-[#FEF9C3] px-3.5 py-2.5 text-xs font-bold text-[#0F294A] hover:bg-[#FDE047] cursor-pointer"
            >
              <Filter className="h-4 w-4 text-[#D61F26]" />
              Descargar filtradas (.xlsx)
            </button>
            <button
              type="button"
              data-piggy-ignore="true"
              onClick={() => handleDownloadExcel('consolidado')}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F294A] px-3.5 py-2.5 text-xs font-bold text-[#FACC15] hover:bg-[#163A66] cursor-pointer"
            >
              <BarChart3 className="h-4 w-4" />
              Consolidado general (.xlsx)
            </button>
          </div>
        </div>

        {/* Filtros por actividad, dimensión y fecha */}
        <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#0F294A]">
              Filtrar por actividad
            </label>
            <select
              value={filterActividadId}
              onChange={(e) => setFilterActividadId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-[#0F294A]"
            >
              <option value="ALL">Todas las actividades (9)</option>
              {ENCUESTAS_POR_ACTIVIDAD.map((a) => (
                <option key={a.actividadId} value={a.actividadId}>
                  {a.actividadNombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#0F294A]">
              Filtrar por dimensión
            </label>
            <select
              value={filterDimension}
              onChange={(e) => setFilterDimension(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-[#0F294A]"
            >
              <option value="ALL">Todas las dimensiones (8)</option>
              {DIMENSIONES_BIENESTAR.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#0F294A]">
              Filtrar por fecha exacta
            </label>
            <input
              type="date"
              value={filterFecha}
              onChange={(e) => setFilterFecha(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-[#0F294A]"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setFilterActividadId('ALL');
                setFilterDimension('ALL');
                setFilterFecha('');
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#0F294A] hover:bg-slate-50 cursor-pointer"
            >
              Limpiar filtros ({filteredResponses.length} de {state.respuestasEncuestas.length})
            </button>
          </div>
        </div>
      </section>

      {/* Tarjetas de resultados automáticos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold text-slate-500">Total de encuestas recibidas</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-[#0F294A] tabular-nums">
            {analytics.filteredStats.total}
          </p>
          <p className="mt-1 text-xs text-slate-600 tabular-nums">
            Global histórico: {analytics.globalStats.total} respuestas
          </p>
        </div>
        <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-5">
          <p className="text-xs font-bold text-[#D61F26]">Promedio de satisfacción</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-[#D61F26] tabular-nums">
            {analytics.filteredStats.total > 0
              ? analytics.filteredStats.promedio.toFixed(2)
              : '—'}
            <span className="text-sm font-semibold text-[#0F294A]/60"> / 5.0</span>
          </p>
          <p className="mt-1 text-xs text-[#0F294A]/70">Escala oficial 1 a 5</p>
        </div>
        <div className="rounded-2xl border border-[#FDE047] bg-[#FFFBEB] p-5">
          <p className="text-xs font-bold text-[#0F294A]/80">Porcentaje de satisfacción</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-[#0F294A] tabular-nums">
            {analytics.filteredStats.total > 0
              ? `${analytics.filteredStats.porcentaje}%`
              : '—'}
          </p>
          <p className="mt-1 text-xs text-[#0F294A]/70">Cálculo automático vigente</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold text-slate-500">Aspecto mejor calificado</p>
          <p className="mt-2 font-display text-base font-extrabold text-[#0F294A]">
            {analytics.filteredStats.mejoresPreguntas[0]?.label || 'Sin respuestas aún'}
          </p>
          <p className="mt-1 text-xs text-[#D61F26] font-bold tabular-nums">
            {analytics.filteredStats.mejoresPreguntas[0]
              ? `${analytics.filteredStats.mejoresPreguntas[0].promedio.toFixed(2)} / 5.0`
              : 'Esperando primera encuesta'}
          </p>
        </div>
      </div>

      {/* Selector de vista dentro del Registro */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-piggy-submodule="true"
          onClick={() => setViewMode('listado')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
            viewMode === 'listado'
              ? 'bg-[#D61F26] text-white border-b-2 border-[#FACC15]'
              : 'border border-slate-200 bg-white text-[#0F294A] hover:bg-slate-50'
          }`}
        >
          1. Listado general de encuestas ({filteredResponses.length})
        </button>
        <button
          type="button"
          data-piggy-submodule="true"
          onClick={() => setViewMode('porActividad')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
            viewMode === 'porActividad'
              ? 'bg-[#0F294A] text-[#FACC15] border-b-2 border-[#D61F26]'
              : 'border border-slate-200 bg-white text-[#0F294A] hover:bg-slate-50'
          }`}
        >
          2. Consolidado por actividad (9)
        </button>
        <button
          type="button"
          data-piggy-submodule="true"
          onClick={() => setViewMode('consolidado')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
            viewMode === 'consolidado'
              ? 'bg-[#0F294A] text-[#FACC15] border-b-2 border-[#D61F26]'
              : 'border border-slate-200 bg-white text-[#0F294A] hover:bg-slate-50'
          }`}
        >
          3. Consolidado general y mejoras
        </button>
      </div>

      {/* VISTA 1: LISTADO GENERAL DE ENCUESTAS RECIBIDAS */}
      {viewMode === 'listado' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          {filteredResponses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center space-y-2">
              <ClipboardCheck className="mx-auto h-9 w-9 text-slate-400" />
              <p className="font-display text-base font-extrabold text-[#0F294A]">
                No hay encuestas registradas en este filtro todavía
              </p>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Cuando un trabajador diligencie y envíe una encuesta en la pestaña «Encuestas»,
                quedará almacenada aquí de forma permanente e independiente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-[#0F294A] text-white">
                    <th className="border border-slate-300 px-3 py-2.5">N.º Registro</th>
                    <th className="border border-slate-300 px-3 py-2.5">Actividad evaluada</th>
                    <th className="border border-slate-300 px-3 py-2.5">Dimensión</th>
                    <th className="border border-slate-300 px-3 py-2.5 text-center">Fecha resp.</th>
                    <th className="border border-slate-300 px-3 py-2.5">Participante</th>
                    <th className="border border-slate-300 px-3 py-2.5 text-center">
                      Calif. General
                    </th>
                    <th className="border border-slate-300 px-3 py-2.5">
                      Comentarios y sugerencias
                    </th>
                    <th className="border border-slate-300 px-3 py-2.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResponses.map((r, idx) => {
                    const avg = calcAverage(r);
                    const dim = r.dimension || actDimMap.get(r.actividadId) || '—';
                    const regCode = `ENC-2027-${String(r.numeroRegistro ?? idx + 1).padStart(3, '0')}`;
                    return (
                      <tr
                        key={r.id}
                        className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                      >
                        <td className="border border-slate-200 px-3 py-2.5 font-mono font-bold text-[#D61F26] whitespace-nowrap">
                          {regCode}
                        </td>
                        <td className="border border-slate-200 px-3 py-2.5 font-bold text-[#0F294A]">
                          {r.actividadNombre}
                        </td>
                        <td className="border border-slate-200 px-3 py-2.5 text-slate-700">
                          {dim}
                        </td>
                        <td className="border border-slate-200 px-3 py-2.5 text-center font-mono">
                          {r.fechaRealizacion}
                        </td>
                        <td className="border border-slate-200 px-3 py-2.5 text-slate-700">
                          {r.nombreParticipante || 'Anónimo'}
                          {r.areaCargo ? (
                            <span className="block text-[11px] text-slate-500">{r.areaCargo}</span>
                          ) : null}
                        </td>
                        <td className="border border-slate-200 px-3 py-2.5 text-center font-mono font-extrabold text-[#0F294A] tabular-nums">
                          {avg.toFixed(2)} / 5
                          <span className="block text-[11px] text-emerald-700">
                            ({Math.round((avg / 5) * 100)}%)
                          </span>
                        </td>
                        <td className="border border-slate-200 px-3 py-2.5 text-slate-600 max-w-xs">
                          <p className="line-clamp-2">{r.aspectosMejorar || r.observaciones || '—'}</p>
                        </td>
                        <td className="border border-slate-200 px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(r)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#0F294A]/20 bg-[#EFF6FF] px-2.5 py-1.5 text-[11px] font-bold text-[#0F294A] hover:bg-[#DBEAFE] cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Ver
                            </button>
                            <button
                              type="button"
                              onClick={() => requestAuthorizedEdit(r)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#FACC15] bg-[#FEF9C3] px-2.5 py-1.5 text-[11px] font-bold text-[#0F294A] hover:bg-[#FDE047] cursor-pointer"
                              title="Corregir registro con autorización"
                            >
                              <Pencil className="h-3.5 w-3.5 text-[#D61F26]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* VISTA 2: CONSOLIDADO POR ACTIVIDAD */}
      {viewMode === 'porActividad' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h3 className="font-display text-base font-extrabold text-[#0F294A]">
            Vista Consolidada por Actividad (Plan Anual 2027)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#0F294A] text-white">
                  <th className="border border-slate-300 px-3 py-2.5">Actividad</th>
                  <th className="border border-slate-300 px-3 py-2.5">Dimensión</th>
                  <th className="border border-slate-300 px-3 py-2.5 text-center">Encuestas</th>
                  <th className="border border-slate-300 px-3 py-2.5 text-center">Promedio (/5)</th>
                  <th className="border border-slate-300 px-3 py-2.5 text-center">% Satisfacción</th>
                  <th className="border border-slate-300 px-3 py-2.5">Mejor calificado</th>
                  <th className="border border-slate-300 px-3 py-2.5">Aspecto a reforzar</th>
                </tr>
              </thead>
              <tbody>
                {analytics.byActivity.map((row, idx) => (
                  <tr
                    key={row.actividadId}
                    className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                  >
                    <td className="border border-slate-200 px-3 py-2.5 font-bold text-[#0F294A]">
                      {row.actividad}
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-[#D61F26] font-semibold">
                      {row.dimension}
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-center font-mono font-bold tabular-nums">
                      {row.total}
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-center font-mono font-bold text-[#0F294A] tabular-nums">
                      {row.total > 0 ? row.promedio.toFixed(2) : '—'}
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-center font-mono font-bold text-emerald-700 tabular-nums">
                      {row.total > 0 ? `${row.porcentaje}%` : '—'}
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-slate-700">
                      {row.mejorCriterio}
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-slate-700">
                      {row.aMejorar}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* VISTA 3: CONSOLIDADO GENERAL DE SATISFACCIÓN Y MEJORAS */}
      {viewMode === 'consolidado' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#D61F26]" />
              <h3 className="font-display text-base font-extrabold text-[#0F294A]">
                Resultados Consolidados por Criterio Evaluado
              </h3>
            </div>
            {analytics.filteredStats.total === 0 ? (
              <p className="text-xs text-slate-500">
                Aún no hay respuestas registradas para calcular promedios por criterio.
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.filteredStats.byCriterion.map((c) => (
                  <div key={c.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#0F294A]">
                      <span>{c.label}</span>
                      <span className="font-mono tabular-nums">
                        {c.promedio.toFixed(2)} / 5 ({c.porcentaje}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#D61F26] to-[#FACC15]"
                        style={{ width: `${c.porcentaje}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-[#FDE047] bg-[#FFFBEB] p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-[#D61F26]" />
                <h3 className="font-display text-base font-extrabold text-[#0F294A]">
                  Fortalezas y Aspectos que Necesitan Mejoras
                </h3>
              </div>
              {analytics.filteredStats.total === 0 ? (
                <p className="text-xs text-[#0F294A]/70">
                  Los criterios destacados y oportunidades de mejora aparecerán automáticamente al
                  recibir respuestas.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-xl bg-white p-3.5 border border-emerald-200 space-y-1.5">
                    <p className="font-extrabold text-emerald-800">Mejores calificaciones</p>
                    {analytics.filteredStats.mejoresPreguntas.map((m) => (
                      <p key={m.label} className="text-slate-700 tabular-nums">
                        • {m.label}: <strong>{m.promedio.toFixed(2)}/5</strong>
                      </p>
                    ))}
                  </div>
                  <div className="rounded-xl bg-white p-3.5 border border-[#FCA5A5] space-y-1.5">
                    <p className="font-extrabold text-[#D61F26]">Aspectos a fortalecer</p>
                    {analytics.filteredStats.aspectosMejoraPreguntas.map((m) => (
                      <p key={m.label} className="text-slate-700 tabular-nums">
                        • {m.label}: <strong>{m.promedio.toFixed(2)}/5</strong>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#0F294A]" />
                <h3 className="font-display text-base font-extrabold text-[#0F294A]">
                  Comentarios y Recomendaciones de los Trabajadores
                </h3>
              </div>
              {analytics.filteredStats.comentarios.length === 0 ? (
                <p className="text-xs text-slate-500">Sin comentarios registrados aún.</p>
              ) : (
                <ul className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                  {analytics.filteredStats.comentarios.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-[#0F294A]">
                        <span>
                          {c.reg} · {c.actividad}
                        </span>
                        <span className="font-mono text-slate-500">{c.fecha}</span>
                      </div>
                      <p className="text-slate-700">
                        <strong>Mejora sugerida:</strong> {c.aspectosMejorar}
                      </p>
                      {c.otrasActividades && (
                        <p className="text-slate-600">
                          <strong>Otras actividades:</strong> {c.otrasActividades}
                        </p>
                      )}
                      {c.observaciones && (
                        <p className="text-slate-600">
                          <strong>Observación:</strong> {c.observaciones}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Modal: Vista individual completa de una respuesta */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F294A]/50 p-4 pt-16 backdrop-blur-[1px]">
          <div
            data-piggy-modal-surface="true"
            data-piggy-context={`reg-encuestas:detail:${selectedRecord.id}`}
            className="max-h-[calc(100vh-5.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="font-mono text-xs font-extrabold text-[#D61F26]">
                  REGISTRO ENC-2027-
                  {String(selectedRecord.numeroRegistro ?? 1).padStart(3, '0')}
                </p>
                <h3 className="font-display text-lg font-extrabold text-[#0F294A]">
                  {selectedRecord.actividadNombre}
                </h3>
                <p className="text-xs text-slate-500">
                  Fecha respuesta: {selectedRecord.fechaRealizacion} · Registrado:{' '}
                  {(selectedRecord.fechaHoraRegistro || '').slice(0, 19).replace('T', ' ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-[#D61F26]"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-xs">
              <div>
                <span className="font-bold text-slate-500 block">Participante</span>
                <span className="font-bold text-[#0F294A]">
                  {selectedRecord.nombreParticipante || 'Anónimo'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-500 block">Área / Cargo</span>
                <span className="font-bold text-[#0F294A]">
                  {selectedRecord.areaCargo || 'No especificado'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]">
                Calificaciones por criterio (Promedio general:{' '}
                {calcAverage(selectedRecord).toFixed(2)} / 5)
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                {(Object.keys(CRITERIO_LABELS) as CriterioEncuestaKey[]).map((key) => (
                  <div
                    key={key}
                    className="rounded-lg border border-slate-200 bg-white p-2.5 text-center"
                  >
                    <p className="text-[11px] font-semibold text-slate-500">
                      {CRITERIO_LABELS[key]}
                    </p>
                    <p className="mt-1 font-mono text-base font-extrabold text-[#D61F26]">
                      {selectedRecord.calificaciones[key]} / 5
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="font-bold text-[#0F294A]">¿Qué fue lo que más le gustó?</p>
                <p className="mt-1 text-slate-700">{selectedRecord.loQueMasGusto}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="font-bold text-[#0F294A]">Aspectos a mejorar:</p>
                <p className="mt-1 text-slate-700">{selectedRecord.aspectosMejorar}</p>
              </div>
              {selectedRecord.otrasActividades && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="font-bold text-[#0F294A]">Otras actividades sugeridas:</p>
                  <p className="mt-1 text-slate-700">{selectedRecord.otrasActividades}</p>
                </div>
              )}
              {selectedRecord.observaciones && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="font-bold text-[#0F294A]">Observaciones:</p>
                  <p className="mt-1 text-slate-700">{selectedRecord.observaciones}</p>
                </div>
              )}
            </div>

            {selectedRecord.corregidoPor && (
              <p className="rounded-lg bg-[#FFFBEB] border border-[#FDE047] px-3 py-2 text-[11px] font-semibold text-[#0F294A]">
                Última corrección autorizada por {selectedRecord.corregidoPor} el{' '}
                {(selectedRecord.ultimaCorreccionAt || '').slice(0, 16).replace('T', ' ')}.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => requestAuthorizedEdit(selectedRecord)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#FACC15] bg-[#FEF9C3] px-4 py-2 text-xs font-bold text-[#0F294A] hover:bg-[#FDE047] cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4 text-[#D61F26]" />
                Corregir con autorización
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl bg-[#0F294A] px-4 py-2 text-xs font-bold text-white cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de verificación de autorización para corrección */}
      {authPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F294A]/55 p-4 pt-16 backdrop-blur-[1px]">
          <form
            data-piggy-modal-surface="true"
            data-piggy-context="reg-encuestas:auth-pin"
            onSubmit={confirmAuthorization}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2 text-[#D61F26]">
              <Lock className="h-5 w-5" />
              <h3 className="font-display text-base font-extrabold text-[#0F294A]">
                Permiso Autorizado para Corrección
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Para conservar la integridad del historial, únicamente el responsable autorizado de
              Talento Humano puede corregir registros (clave institucional: <strong>2027</strong>).
            </p>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                Nombre del responsable que autoriza *
              </label>
              <input
                type="text"
                required
                value={autorizadorNombre}
                onChange={(e) => setAutorizadorNombre(e.target.value)}
                placeholder="Ej. Responsable de Talento Humano"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                Clave de autorización *
              </label>
              <input
                type="password"
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Ingresa clave institucional"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAuthPinModalOpen(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-bold text-[#0F294A]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-xs font-bold text-white"
              >
                Autorizar edición
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de corrección autorizada */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F294A]/55 p-4 pt-16 backdrop-blur-[1px]">
          <form
            data-piggy-modal-surface="true"
            data-piggy-context={`reg-encuestas:edit:${editingRecord.id}`}
            onSubmit={saveAuthorizedCorrection}
            className="max-h-[calc(100vh-5.5rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-base font-extrabold text-[#0F294A]">
                Corregir Registro de Encuesta (Autorizado: {autorizadorNombre})
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-[#D61F26]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">Participante</label>
                <input
                  type="text"
                  value={editingRecord.nombreParticipante || ''}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, nombreParticipante: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">Fecha</label>
                <input
                  type="date"
                  required
                  value={editingRecord.fechaRealizacion}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, fechaRealizacion: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0F294A]">
                Aspectos a mejorar *
              </label>
              <textarea
                rows={2}
                required
                value={editingRecord.aspectosMejorar}
                onChange={(e) =>
                  setEditingRecord({ ...editingRecord, aspectosMejorar: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0F294A]">
                Observaciones
              </label>
              <textarea
                rows={2}
                value={editingRecord.observaciones}
                onChange={(e) =>
                  setEditingRecord({ ...editingRecord, observaciones: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-[#0F294A]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-xs font-bold text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                Guardar corrección
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
