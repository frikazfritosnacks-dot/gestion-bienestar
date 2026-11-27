import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Pencil,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { ResponsablesPlanData, SectionId } from '../../types/bienestar';
import { PlanSubTab } from './ProgramasBienestarSection';
import { requestPiggyWalkAndNavigate } from '../mascot/WalkingPiggyCompanion';
import { ChipHeaderAccent } from '../ui/ChipGraphics';

interface ResponsablesPlanSectionProps {
  onNavigate?: (section: SectionId, tab?: PlanSubTab) => void;
}

function getTargetRouteForResponsibility(
  numero: number
): { section: SectionId; tab?: PlanSubTab; label: string } {
  switch (numero) {
    case 1:
      return { section: 'matriz', label: 'Ver etapa diagnóstica en Matriz' };
    case 2:
      return { section: 'programas', tab: 'actividades', label: 'Ir a Dimensiones y Fichas' };
    case 3:
      return { section: 'programas', tab: 'cronograma', label: 'Ir a Cronograma y Gantt 2027' };
    case 4:
      return { section: 'programas', tab: 'presupuesto', label: 'Ir a Presupuesto General 2027' };
    case 5:
      return { section: 'programas', tab: 'asistencia', label: 'Ir a Registro de Asistencia' };
    case 6:
      return { section: 'programas', tab: 'convenios', label: 'Ir a Convenios y Alianzas' };
    case 7:
      return { section: 'matriz', label: 'Ver convocatoria en Matriz' };
    case 8:
      return { section: 'programas', tab: 'seguimiento', label: 'Ir a Seguimiento e Indicadores' };
    case 9:
      return { section: 'programas', tab: 'registroEncuestas', label: 'Ir a Registro de Encuestas' };
    default:
      return { section: 'flujograma', label: 'Ver cierre y mejora en Flujograma' };
  }
}

export function ResponsablesPlanSection({ onNavigate }: ResponsablesPlanSectionProps) {
  const { state, updateResponsablesPlan } = useBienestar();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ResponsablesPlanData>(state.responsablesPlan);

  useEffect(() => {
    if (!editing) {
      setDraft(state.responsablesPlan);
    }
  }, [state.responsablesPlan, editing]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.cargoPrincipal.trim() || !draft.alcanceResponsabilidad.trim()) return;
    updateResponsablesPlan({
      cargoPrincipal: draft.cargoPrincipal.trim(),
      alcanceResponsabilidad: draft.alcanceResponsabilidad.trim(),
      responsabilidades: draft.responsabilidades.map((r, idx) => ({
        ...r,
        numero: idx + 1,
        texto: r.texto.trim(),
      })),
    });
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado principal del módulo */}
      <section
        data-module-surface="true"
        data-piggy-context="responsables"
        className="relative overflow-hidden rounded-2xl border border-[#FCA5A5] bg-white p-6 sm:p-8 shadow-xs"
      >
        <div className="absolute inset-x-0 top-0 flex h-2">
          <div className="w-2/3 bg-[#D61F26]" />
          <div className="w-1/3 bg-[#FACC15]" />
        </div>

        <div className="flex flex-col gap-4 pt-1 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-extrabold tracking-wide text-[#D61F26]">
              <UserCheck className="h-4 w-4 text-[#D97706]" />
              <span>
                {state.planGeneral.empresa} · VIGENCIA {state.planGeneral.vigenciaAnual}
              </span>
              <ChipHeaderAccent className="hidden sm:inline-flex" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-[#0F294A] sm:text-3xl">
              Responsables del Plan de Bienestar
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
              Definición única y coherente de la conducción organizacional del Plan de Bienestar
              Social Laboral de Frikaz S.A.S. (10 colaboradores).
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={() => {
                setDraft(state.responsablesPlan);
                setEditing(true);
              }}
              className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[#FACC15] bg-[#FEF9C3] px-4 py-2.5 text-xs font-bold text-[#0F294A] hover:bg-[#FDE047] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Pencil className="h-3.5 w-3.5 text-[#D61F26]" />
              Editar responsabilidades
            </button>
          )}
        </div>

        {/* Cargo único principal */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4 rounded-2xl border-2 border-[#0F294A] bg-[#0F294A] p-5 text-white flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FACC15]">
                Responsable principal de todas las actividades
              </span>
              <h2 className="font-display text-2xl font-extrabold text-white">
                Cargo: {state.responsablesPlan.cargoPrincipal}
              </h2>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-white/90">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#FACC15]" />
              <span>Conducción directa e integral · Vigencia 2027</span>
            </div>
          </div>

          <div className="lg:col-span-8 rounded-2xl border border-[#FDE047] bg-[#FFFBEB] p-5 flex flex-col justify-center space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#D61F26]">
              Alcance organizacional de la responsabilidad
            </h3>
            <p className="text-sm leading-relaxed text-[#0F294A]">
              {state.responsablesPlan.alcanceResponsabilidad}
            </p>
            <p className="text-xs text-slate-600">
              Todas las fichas de actividades, la Matriz Detallada, el Flujograma, el Presupuesto
              2027 y el Manual de Procedimiento mantienen unificada esta asignación en la{' '}
              <strong className="text-[#0F294A]">{state.responsablesPlan.cargoPrincipal}</strong>,
              sin duplicar comités ni dependencias inexistentes en la empresa.
            </p>
          </div>
        </div>
      </section>

      {/* Formulario de edición o listado de las 10 responsabilidades */}
      {editing ? (
        <form
          data-submodule-surface="true"
          data-piggy-context="responsables:edit"
          onSubmit={handleSave}
          className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-display text-lg font-extrabold text-[#0F294A]">
              Editar cargo y funciones del responsable
            </h2>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg p-1 text-slate-400 hover:text-[#D61F26]"
              aria-label="Cancelar edición"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                Cargo principal *
              </label>
              <input
                type="text"
                required
                value={draft.cargoPrincipal}
                onChange={(e) => setDraft({ ...draft, cargoPrincipal: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-[#0F294A]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                Alcance de la responsabilidad *
              </label>
              <textarea
                rows={2}
                required
                value={draft.alcanceResponsabilidad}
                onChange={(e) => setDraft({ ...draft, alcanceResponsabilidad: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0F294A]"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]">
              Listado de responsabilidades ({draft.responsabilidades.length})
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {draft.responsabilidades.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2"
                >
                  <label className="block text-xs font-bold text-[#D61F26]">
                    Responsabilidad #{idx + 1}
                  </label>
                  <input
                    type="text"
                    required
                    value={item.texto}
                    onChange={(e) => {
                      const next = draft.responsabilidades.map((r) =>
                        r.id === item.id ? { ...r, texto: e.target.value } : r
                      );
                      setDraft({ ...draft, responsabilidades: next });
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0F294A]"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#0F294A]"
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
      ) : (
        <section
          data-submodule-surface="true"
          data-piggy-context="responsables:list"
          className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-extrabold text-[#0F294A]">
                Funciones y Responsabilidades del Cargo ({state.responsablesPlan.cargoPrincipal})
              </h2>
              <p className="text-xs text-slate-600">
                Ciclo completo de gestión del Plan de Bienestar Social Laboral en Frikaz S.A.S.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 self-start rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
              <ClipboardCheck className="h-3.5 w-3.5" />
              {state.responsablesPlan.responsabilidades.length} responsabilidades asignadas
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {state.responsablesPlan.responsabilidades.map((resp) => {
              const target = getTargetRouteForResponsibility(resp.numero);
              return (
                <article
                  key={resp.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-[#F8FAFC] p-5 transition-all hover:border-[#0F294A]/40 hover:bg-white"
                >
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0F294A] font-mono text-xs font-extrabold text-[#FACC15] tabular-nums">
                      {String(resp.numero).padStart(2, '0')}
                    </span>
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-sm font-bold leading-snug text-[#0F294A]">{resp.texto}</p>
                      {resp.apartadoRelacionado && (
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#D61F26]" />
                          <span>{resp.apartadoRelacionado}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {onNavigate && (
                    <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-3">
                      <span className="text-[11px] font-bold text-slate-500">
                        Responsable: <strong className="text-[#0F294A]">{state.responsablesPlan.cargoPrincipal}</strong>
                      </span>
                      <button
                        type="button"
                        data-piggy-walk-nav="true"
                        onClick={(e) => {
                          requestPiggyWalkAndNavigate(e.currentTarget);
                          onNavigate(target.section, target.tab);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#D61F26] hover:text-[#0F294A] cursor-pointer"
                      >
                        {target.label}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
