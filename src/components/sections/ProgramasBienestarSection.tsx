import { useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  Brain,
  CalendarRange,
  Check,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Database,
  DollarSign,
  FileSpreadsheet,
  Gift,
  Handshake,
  HeartHandshake,
  Home,
  Info,
  Layers,
  Pencil,
  Users,
  X,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { DIMENSIONES_BIENESTAR } from '../../data/planBienestarData';
import { DimensionBienestar, PlanGeneralInfo } from '../../types/bienestar';
import { ActividadFichaDetail } from '../plan/ActividadFichaDetail';
import { AsistenciaManager } from '../plan/AsistenciaManager';
import { ConveniosManager } from '../plan/ConveniosManager';
import { CronogramaGanttView } from '../plan/CronogramaGanttView';
import { EncuestasManager } from '../plan/EncuestasManager';
import { FormatosDescargasView } from '../plan/FormatosDescargasView';
import { Presupuesto2027View } from '../plan/Presupuesto2027View';
import { RegistroEncuestasView } from '../plan/RegistroEncuestasView';

type PlanSubTab =
  | 'general'
  | 'actividades'
  | 'presupuesto'
  | 'cronograma'
  | 'encuestas'
  | 'registroEncuestas'
  | 'asistencia'
  | 'convenios'
  | 'formatos';

const DIMENSION_ICONS: Record<DimensionBienestar, typeof Activity> = {
  Física: Activity,
  Mental: Brain,
  Financiera: DollarSign,
  Familiar: Home,
  Social: Users,
  Horarios: Clock,
  Incentivos: Gift,
  Reconocimientos: Award,
};

const SUB_TABS: Array<{ id: PlanSubTab; label: string; icon: typeof Info }> = [
  { id: 'general', label: 'Información General', icon: Info },
  { id: 'actividades', label: 'Dimensiones y Fichas (9)', icon: Layers },
  { id: 'presupuesto', label: 'Presupuesto General 2027', icon: DollarSign },
  { id: 'cronograma', label: 'Cronograma y Gantt 2027', icon: CalendarRange },
  { id: 'encuestas', label: 'Diligenciar Encuesta', icon: ClipboardCheck },
  { id: 'registroEncuestas', label: 'Registro de Encuestas', icon: Database },
  { id: 'asistencia', label: 'Registro de Asistencia', icon: ClipboardList },
  { id: 'convenios', label: 'Convenios', icon: Handshake },
  { id: 'formatos', label: 'Formatos en Blanco', icon: FileSpreadsheet },
];

export function ProgramasBienestarSection() {
  const { state, updatePlanGeneral, updatePrograma } = useBienestar();
  const [activeTab, setActiveTab] = useState<PlanSubTab>('general');
  const [selectedDimension, setSelectedDimension] = useState<'ALL' | DimensionBienestar>('ALL');
  const [selectedActividadId, setSelectedActividadId] = useState<string | null>(null);
  const [contextActividadId, setContextActividadId] = useState<string | undefined>(undefined);
  const [editingPlanGeneral, setEditingPlanGeneral] = useState(false);
  const [generalDraft, setGeneralDraft] = useState<PlanGeneralInfo>(state.planGeneral);

  const selectedActividad = useMemo(
    () => state.planBienestar.find((a) => a.id === selectedActividadId) || null,
    [state.planBienestar, selectedActividadId]
  );

  const visibleActividades = useMemo(() => {
    if (selectedDimension === 'ALL') return state.planBienestar;
    return state.planBienestar.filter((a) => a.dimension === selectedDimension);
  }, [state.planBienestar, selectedDimension]);

  const getActivityMetrics = (actividadId: string) => {
    const listas = state.listasAsistencia.filter((l) => l.actividadId === actividadId);
    const asistentesCount = listas.reduce((acc, l) => acc + l.participantes.length, 0);
    const encuestas = state.respuestasEncuestas.filter((r) => r.actividadId === actividadId);
    const avg =
      encuestas.length > 0
        ? encuestas.reduce((acc, r) => {
            const vals = Object.values(r.calificaciones);
            return acc + vals.reduce((a, b) => a + b, 0) / vals.length;
          }, 0) / encuestas.length
        : 0;
    return {
      asistentesCount,
      encuestasCount: encuestas.length,
      promedioSatisfaccion: avg,
    };
  };

  const handleSelectDimension = (dim: DimensionBienestar) => {
    setSelectedDimension(dim);
    setSelectedActividadId(null);
    setActiveTab('actividades');
  };

  const handleOpenEncuestaFromFicha = (actId: string) => {
    setContextActividadId(actId);
    setSelectedActividadId(null);
    setActiveTab('encuestas');
  };

  const handleOpenAsistenciaFromFicha = (actId: string) => {
    setContextActividadId(actId);
    setSelectedActividadId(null);
    setActiveTab('asistencia');
  };

  return (
    <div className="space-y-8">
      {/* Encabezado limpio y espacioso del módulo */}
      <section className="relative overflow-hidden rounded-2xl border border-[#FCA5A5] bg-white p-6 sm:p-8 shadow-xs">
        <div className="absolute inset-x-0 top-0 flex h-2">
          <div className="w-2/3 bg-[#D61F26]" />
          <div className="w-1/3 bg-[#FACC15]" />
        </div>
        <div className="flex flex-col gap-4 pt-1 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-extrabold tracking-wide text-[#D61F26]">
              <HeartHandshake className="h-4 w-4 text-[#D97706]" />
              <span>{state.planGeneral.empresa} · VIGENCIA {state.planGeneral.vigenciaAnual}</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold text-[#0F294A] sm:text-3xl">
              Programas de Bienestar
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
              {state.planGeneral.nombrePrograma}: 8 dimensiones del bienestar, 9 actividades
              estructuradas para 10 trabajadores, presupuesto MiPyme 2027, cronograma y Diagrama de
              Gantt (enero a diciembre de 2027), encuestas, asistencia, convenios y 24 formatos
              institucionales en Word y Excel.
            </p>
          </div>
        </div>
      </section>

      {/* Navegación interna ordenada en pestañas limpias */}
      <nav
        aria-label="Subapartados del Plan Anual de Bienestar"
        className="overflow-x-auto pb-1"
      >
        <div className="inline-flex min-w-full items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-2">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedActividadId(null);
                }}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#D61F26] text-white border-b-2 border-[#FACC15] shadow-xs'
                    : 'text-[#0F294A] hover:bg-[#FEF9C3]/80 hover:text-[#D61F26]'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-[#FACC15]' : 'text-[#0F294A]/70'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* SUBPÁGINA A: INFORMACIÓN GENERAL DEL PLAN Y 8 DIMENSIONES */}
      {activeTab === 'general' && (
        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-extrabold text-[#0F294A]">
                  A. Información General del Plan Anual
                </h2>
                <p className="text-xs text-slate-600">
                  Marco general institucional que orienta las actividades durante todo el año.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGeneralDraft(state.planGeneral);
                  setEditingPlanGeneral(true);
                }}
                className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[#FACC15] bg-[#FEF9C3] px-4 py-2 text-xs font-bold text-[#0F294A] hover:bg-[#FDE047] cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5 text-[#D61F26]" />
                Editar información general
              </button>
            </div>

            <dl className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <dt className="text-xs font-extrabold uppercase tracking-wide text-[#D61F26]">
                  Nombre del programa
                </dt>
                <dd className="mt-1.5 text-sm font-bold text-[#0F294A]">
                  {state.planGeneral.nombrePrograma}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <dt className="text-xs font-extrabold uppercase tracking-wide text-[#D61F26]">
                  Empresa y Vigencia Anual
                </dt>
                <dd className="mt-1.5 text-sm font-bold text-[#0F294A]">
                  {state.planGeneral.empresa} · Vigencia {state.planGeneral.vigenciaAnual}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 md:col-span-2">
                <dt className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]/70">
                  Objetivo general
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-slate-700">
                  {state.planGeneral.objetivoGeneral}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <dt className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]/70">
                  Alcance
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-slate-700">
                  {state.planGeneral.alcance}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <dt className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]/70">
                  Población beneficiaria
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-slate-700">
                  {state.planGeneral.poblacionBeneficiaria}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 md:col-span-2">
                <dt className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]/70">
                  Responsables
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-slate-700">
                  {state.planGeneral.responsables}
                </dd>
              </div>
            </dl>
          </section>

          {/* B. Las 8 dimensiones del bienestar */}
          <section className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-extrabold text-[#0F294A]">
                B. Las 8 Dimensiones del Bienestar
              </h2>
              <p className="text-xs text-slate-600">
                Haz clic en cualquier dimensión para consultar únicamente sus actividades y fichas.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {DIMENSIONES_BIENESTAR.map((dim, idx) => {
                const Icon = DIMENSION_ICONS[dim.id];
                const actCount = state.planBienestar.filter((a) => a.dimension === dim.id).length;
                return (
                  <button
                    key={dim.id}
                    type="button"
                    onClick={() => handleSelectDimension(dim.id)}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-[#D61F26] hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#FDE047] bg-[#FFFBEB] text-[#D61F26]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-400 tabular-nums">
                          0{idx + 1}
                        </span>
                      </div>
                      <h3 className="font-display text-base font-extrabold text-[#0F294A] group-hover:text-[#D61F26]">
                        {dim.nombre}
                      </h3>
                      <p className="text-xs leading-relaxed text-slate-600">{dim.descripcion}</p>
                    </div>
                    <div className="mt-4 border-t border-slate-100 pt-3 text-xs font-bold text-[#0F294A]">
                      {actCount} {actCount === 1 ? 'actividad asignada' : 'actividades asignadas'} →
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* SUBPÁGINA B: DIMENSIONES Y LAS 9 ACTIVIDADES CON FICHAS INDIVIDUALES */}
      {activeTab === 'actividades' && (
        <>
          {selectedActividad ? (
            <ActividadFichaDetail
              actividad={selectedActividad}
              {...getActivityMetrics(selectedActividad.id)}
              onBack={() => setSelectedActividadId(null)}
              onUpdate={updatePrograma}
              onOpenEncuesta={handleOpenEncuestaFromFicha}
              onOpenAsistencia={handleOpenAsistenciaFromFicha}
            />
          ) : (
            <div className="space-y-6">
              {/* Filtro limpio de las 8 dimensiones */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-display text-lg font-extrabold text-[#0F294A]">
                      {selectedDimension === 'ALL'
                        ? 'Las 9 Actividades del Plan Anual'
                        : `Dimensión ${selectedDimension}`}
                    </h2>
                    <p className="text-xs text-slate-600">
                      Selecciona una actividad para abrir su ficha completa con los 16 parámetros.
                    </p>
                  </div>
                  {selectedDimension !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setSelectedDimension('ALL')}
                      className="self-start rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#0F294A] hover:bg-slate-50 cursor-pointer"
                    >
                      Ver todas las dimensiones (9)
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDimension('ALL')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                      selectedDimension === 'ALL'
                        ? 'bg-[#0F294A] text-[#FACC15]'
                        : 'border border-slate-200 bg-white text-[#0F294A] hover:bg-slate-50'
                    }`}
                  >
                    Todas ({state.planBienestar.length})
                  </button>
                  {DIMENSIONES_BIENESTAR.map((dim) => (
                    <button
                      key={dim.id}
                      type="button"
                      onClick={() => setSelectedDimension(dim.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                        selectedDimension === dim.id
                          ? 'bg-[#D61F26] text-white'
                          : 'border border-slate-200 bg-white text-[#0F294A] hover:bg-[#FEF9C3]'
                      }`}
                    >
                      {dim.nombre}
                    </button>
                  ))}
                </div>
              </section>

              {/* Cuadrícula espaciosa de fichas individuales */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {visibleActividades.map((act) => {
                  const metrics = getActivityMetrics(act.id);
                  return (
                    <article
                      key={act.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-[#D61F26]/50 hover:shadow-sm space-y-5"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-[#D61F26]">Dimensión: {act.dimension}</span>
                          <span className="font-mono text-slate-400 tabular-nums">
                            #{String(act.numero).padStart(2, '0')}
                          </span>
                        </div>
                        <h3 className="font-display text-lg font-extrabold text-[#0F294A]">
                          {act.actividad}
                        </h3>
                        <p className="text-xs leading-relaxed text-slate-600 line-clamp-3">
                          {act.descripcion}
                        </p>
                        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-700 space-y-1">
                          <p>
                            <strong className="text-[#0F294A]">Frecuencia:</strong> {act.frecuencia}
                          </p>
                          <p>
                            <strong className="text-[#0F294A]">Vigencia 2027:</strong>{' '}
                            {act.fechaInicio || act.fechaEjecucion} al{' '}
                            {act.fechaFin || '2027-12-31'}
                          </p>
                          <p>
                            <strong className="text-[#0F294A]">Presupuesto:</strong>{' '}
                            {new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              maximumFractionDigits: 0,
                            }).format(act.presupuesto || 0)}{' '}
                            · {act.estadoEjecucion} ({act.porcentajeCumplimiento}%)
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
                          <span>{metrics.asistentesCount} asistentes</span>
                          <span className="inline-flex items-center gap-1">
                            <BarChart3 className="h-3.5 w-3.5 text-[#D61F26]" />
                            {metrics.encuestasCount > 0
                              ? `${metrics.promedioSatisfaccion.toFixed(1)}/5`
                              : 'Sin encuestas'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedActividadId(act.id)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F294A] px-4 py-2.5 text-xs font-bold text-[#FACC15] transition-colors hover:bg-[#D61F26] hover:text-white cursor-pointer"
                        >
                          Abrir ficha completa (16 campos) →
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* SUBPÁGINA C: PRESUPUESTO GENERAL ANUAL 2027 Y DESGLOSE POR ÍTEMS */}
      {activeTab === 'presupuesto' && <Presupuesto2027View />}

      {/* SUBPÁGINA D: CRONOGRAMA Y DIAGRAMA DE GANTT 2027 */}
      {activeTab === 'cronograma' && <CronogramaGanttView />}

      {/* SUBPÁGINA E: DILIGENCIAR ENCUESTAS DE SATISFACCIÓN */}
      {activeTab === 'encuestas' && (
        <EncuestasManager
          initialActividadId={contextActividadId}
          onGoToRegistro={() => setActiveTab('registroEncuestas')}
        />
      )}

      {/* SUBPÁGINA F: REGISTRO DE ENCUESTAS DE SATISFACCIÓN (BASE DE DATOS Y CONSOLIDADO) */}
      {activeTab === 'registroEncuestas' && <RegistroEncuestasView />}

      {/* SUBPÁGINA G: REGISTRO DE ASISTENCIA A ACTIVIDADES */}
      {activeTab === 'asistencia' && (
        <AsistenciaManager initialActividadId={contextActividadId} />
      )}

      {/* SUBPÁGINA H: CONVENIOS */}
      {activeTab === 'convenios' && <ConveniosManager />}

      {/* SUBPÁGINA I: FORMATOS INSTITUCIONALES EN BLANCO (12 WORD + 12 EXCEL + ZIP) */}
      {activeTab === 'formatos' && <FormatosDescargasView />}

      {/* Modal de edición de Información General del Plan */}
      {editingPlanGeneral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F294A]/45 p-4 backdrop-blur-[1px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updatePlanGeneral(generalDraft);
              setEditingPlanGeneral(false);
            }}
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-extrabold text-[#0F294A]">
                Editar Información General del Plan
              </h3>
              <button
                type="button"
                onClick={() => setEditingPlanGeneral(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-[#D61F26]"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Nombre del programa
                </label>
                <input
                  type="text"
                  required
                  value={generalDraft.nombrePrograma}
                  onChange={(e) =>
                    setGeneralDraft({ ...generalDraft, nombrePrograma: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">Empresa</label>
                <input
                  type="text"
                  required
                  value={generalDraft.empresa}
                  onChange={(e) => setGeneralDraft({ ...generalDraft, empresa: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Vigencia anual
                </label>
                <input
                  type="text"
                  required
                  value={generalDraft.vigenciaAnual}
                  onChange={(e) =>
                    setGeneralDraft({ ...generalDraft, vigenciaAnual: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Objetivo general
                </label>
                <textarea
                  rows={3}
                  required
                  value={generalDraft.objetivoGeneral}
                  onChange={(e) =>
                    setGeneralDraft({ ...generalDraft, objetivoGeneral: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">Alcance</label>
                <textarea
                  rows={2}
                  required
                  value={generalDraft.alcance}
                  onChange={(e) => setGeneralDraft({ ...generalDraft, alcance: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Población beneficiaria
                </label>
                <input
                  type="text"
                  required
                  value={generalDraft.poblacionBeneficiaria}
                  onChange={(e) =>
                    setGeneralDraft({ ...generalDraft, poblacionBeneficiaria: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">Responsables</label>
                <input
                  type="text"
                  required
                  value={generalDraft.responsables}
                  onChange={(e) =>
                    setGeneralDraft({ ...generalDraft, responsables: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingPlanGeneral(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-[#0F294A]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-xs font-bold text-white hover:bg-[#B3161C]"
              >
                <Check className="h-4 w-4" />
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
