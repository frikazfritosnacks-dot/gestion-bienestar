import {
  BookOpen,
  FileSpreadsheet,
  GitFork,
  Scale,
  BookMarked,
  ArrowRight,
  ClipboardList,
  Target,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { ManualSubSectionId, SectionId } from '../../types/bienestar';
import { ChipHeaderAccent } from '../ui/ChipGraphics';

interface InicioSectionProps {
  onNavigate: (section: SectionId, manualTab?: ManualSubSectionId) => void;
}

export function InicioSection({ onNavigate }: InicioSectionProps) {
  const { state } = useBienestar();

  const totalNormas = state.normograma.length;
  const totalTerminos = state.terminologia.length;
  const totalActividadesMatriz = state.proceso.length;
  const totalDecisiones = state.proceso.filter((p) => p.isDecision).length;
  const totalObjetivosEsp = state.manual.objetivosEspecificos.length;

  const moduleCards: Array<{
    id: SectionId;
    manualTab?: ManualSubSectionId;
    title: string;
    subtitle: string;
    metric: string;
    accent: 'red' | 'navy' | 'yellow';
    icon: typeof BookOpen;
  }> = [
    {
      id: 'manual',
      manualTab: 'introduccion',
      title: 'Manual del Procedimiento',
      subtitle: 'Introducción, objetivos, justificación y alcance institucional.',
      metric: `Código ${state.manual.portada.codigoDocumental} · Versión ${state.manual.portada.version}`,
      accent: 'red',
      icon: BookOpen,
    },
    {
      id: 'manual',
      manualTab: 'normograma',
      title: 'Normograma Legal',
      subtitle: 'Marco normativo editable con jerarquía, impacto y obligaciones de Frikaz S.A.S.',
      metric: `${totalNormas} normas registradas`,
      accent: 'navy',
      icon: Scale,
    },
    {
      id: 'manual',
      manualTab: 'terminologia',
      title: 'Terminología y Diccionario',
      subtitle: 'Glosario conceptual editable de bienestar laboral y desarrollo humano.',
      metric: `${totalTerminos} conceptos activos`,
      accent: 'navy',
      icon: BookMarked,
    },
    {
      id: 'matriz',
      title: 'Matriz Detallada',
      subtitle: 'Secuencia operativa editable vinculada directamente al flujograma.',
      metric: `${state.matrizMeta.codigo} · ${totalActividadesMatriz} actividades`,
      accent: 'yellow',
      icon: FileSpreadsheet,
    },
    {
      id: 'flujograma',
      title: 'Flujograma Interactivo',
      subtitle: 'Diagrama vertical editable con compuertas de aprobación SÍ / NO y ajustes.',
      metric: `${totalActividadesMatriz} nodos · ${totalDecisiones} decisiones`,
      accent: 'yellow',
      icon: GitFork,
    },
  ];

  const accentStyle = {
    red: 'bg-[#FEE2E2] border-[#FCA5A5] text-[#D61F26]',
    navy: 'bg-[#EFF6FF] border-[#0F294A]/20 text-[#0F294A]',
    yellow: 'bg-[#FEF9C3] border-[#FACC15] text-[#0F294A]',
  };

  return (
    <div className="space-y-8">
      {/* Encabezado Institucional */}
      <section className="relative overflow-hidden rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 flex h-1.5">
          <div className="w-2/3 bg-[#D61F26]" />
          <div className="w-1/3 bg-[#FACC15]" />
        </div>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-1">
          <div className="max-w-3xl space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#D61F26]">
              <span>{state.manual.portada.empresa}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#0F294A]">{state.manual.portada.areaResponsable}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-[#0F294A]/80">
                Actualizado {state.manual.portada.fechaActualizacion}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0F294A] sm:text-3xl text-balance">
                Sistema de Gestión de Bienestar Social Laboral
              </h1>
              <ChipHeaderAccent className="hidden sm:inline-flex" />
            </div>
            <p className="text-sm leading-relaxed text-[#0F294A]/85 sm:text-base">
              Plataforma administrativa para consultar, editar y mantener sincronizados el Manual de
              Procedimiento, el Normograma, la Terminología, la Matriz Detallada y el Flujograma de
              Frikaz S.A.S.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('manual', 'introduccion')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#B3161C] hover:-translate-y-0.5 whitespace-nowrap shrink-0"
            >
              <BookOpen className="h-4 w-4 text-[#FACC15]" />
              Abrir Manual
            </button>
            <button
              type="button"
              onClick={() => onNavigate('flujograma')}
              className="inline-flex items-center gap-2 rounded-lg border border-[#FACC15] bg-[#FEF9C3] px-4 py-2.5 text-sm font-semibold text-[#0F294A] transition-all duration-150 hover:bg-[#FDE047] hover:-translate-y-0.5 whitespace-nowrap shrink-0"
            >
              <GitFork className="h-4 w-4 text-[#D61F26]" />
              Ver Flujograma
            </button>
          </div>
        </div>
      </section>

      {/* Indicadores consolidados reales */}
      <section aria-label="Resumen operativo">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#0F294A]/30">
            <div className="flex items-center justify-between text-xs font-semibold text-[#0F294A]/70">
              <span>Marco Normativo y Glosario</span>
              <Scale className="h-4 w-4 text-[#0F294A]" />
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-2xl font-extrabold text-[#0F294A] tabular-nums">{totalNormas}</span>
              <span className="text-xs text-slate-500">normas</span>
              <span className="text-slate-300">/</span>
              <span className="text-2xl font-extrabold text-[#0F294A] tabular-nums">
                {totalTerminos}
              </span>
              <span className="text-xs text-slate-500">términos</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#FCA5A5]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#0F294A]/70">
              <span>Objetivos del Manual</span>
              <Target className="h-4 w-4 text-[#D61F26]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#0F294A] tabular-nums">
                1 + {totalObjetivosEsp}
              </span>
              <span className="text-xs text-slate-500">general y específicos</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#FACC15]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#0F294A]/70">
              <span>Procedimiento Sincronizado</span>
              <ClipboardList className="h-4 w-4 text-[#D97706]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#0F294A] tabular-nums">
                {totalActividadesMatriz}
              </span>
              <span className="text-xs text-slate-500">
                actividades · {totalDecisiones} decisiones
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Acceso directo a módulos */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0F294A]">
              Módulos de Administración del Procedimiento
            </h2>
            <p className="text-sm text-slate-600">
              Todos los cambios realizados se guardan automáticamente y mantienen coherencia entre sí.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('matriz')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#D61F26] hover:underline whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Ir a Matriz Detallada
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {moduleCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <button
                key={`${card.id}-${index}`}
                type="button"
                onClick={() => onNavigate(card.id, card.manualTab)}
                className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 text-left transition-all duration-150 hover:border-[#D61F26]/50 hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border ${accentStyle[card.accent]}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-[#D61F26]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0F294A] group-hover:text-[#D61F26] transition-colors">
                      {card.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{card.subtitle}</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3 text-xs font-semibold text-[#0F294A]/70 tabular-nums">
                  {card.metric}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Alcance y Propósito del Manual */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#0F294A]/20 bg-[#EFF6FF] p-6">
          <h3 className="text-base font-bold text-[#0F294A]">Objetivo General del Manual</h3>
          <p className="mt-2.5 text-sm leading-relaxed text-[#0F294A]/90">
            {state.manual.objetivoGeneral}
          </p>
        </div>
        <div className="rounded-xl border border-[#FDE047] bg-[#FFFBEB] p-6">
          <h3 className="text-base font-bold text-[#0F294A]">Alcance Institucional</h3>
          <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-[#0F294A]/90">
            {state.manual.alcance}
          </p>
        </div>
      </section>
    </div>
  );
}
