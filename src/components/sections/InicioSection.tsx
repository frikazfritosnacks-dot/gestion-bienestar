import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  FileSpreadsheet,
  GitFork,
  HeartHandshake,
  UserCheck,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { SectionId } from '../../types/bienestar';
import { requestPiggyWalkAndNavigate } from '../mascot/WalkingPiggyCompanion';
import { ChipHeaderAccent } from '../ui/ChipGraphics';

interface InicioSectionProps {
  onSelectSection: (section: Exclude<SectionId, 'inicio'>) => void;
}

/**
 * Pantalla de Inicio única y espaciosa: presenta los 4 módulos de trabajo sin duplicarlos
 * dentro de las páginas internas. Al seleccionar un módulo, el cerdito oficial camina
 * hasta la tarjeta dejando huellas progresivas y abre directamente su espacio de trabajo.
 */
export function InicioSection({ onSelectSection }: InicioSectionProps) {
  const { state } = useBienestar();
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  const handleOpen = (
    e: React.MouseEvent<HTMLButtonElement>,
    section: Exclude<SectionId, 'inicio'>
  ) => {
    if (navigatingId) return;
    setNavigatingId(section);
    requestPiggyWalkAndNavigate(e.currentTarget);
    onSelectSection(section);
    setNavigatingId(null);
  };

  const modules: Array<{
    id: Exclude<SectionId, 'inicio'>;
    title: string;
    description: string;
    detail: string;
    icon: typeof BookOpen;
    accent: string;
    iconBg: string;
  }> = [
    {
      id: 'manual',
      title: 'Manual',
      description:
        'Consulta y edita la introducción, objetivos con responsables, justificación, alcance, normograma, terminología y descarga el documento oficial en Word (.docx).',
      detail: `${state.normograma.length} normas · ${state.terminologia.length} términos · Word (.docx)`,
      icon: BookOpen,
      accent: 'border-[#0F294A]/20 hover:border-[#0F294A]',
      iconBg: 'bg-[#0F294A] text-[#FACC15]',
    },
    {
      id: 'responsables',
      title: 'Responsables del Plan de Bienestar',
      description:
        'Define la conducción directa de la Gerente como única responsable principal de todas las actividades del Plan 2027 y sus 10 funciones clave.',
      detail: `Cargo: ${state.responsablesPlan.cargoPrincipal} · ${state.responsablesPlan.responsabilidades.length} responsabilidades`,
      icon: UserCheck,
      accent: 'border-[#0F294A]/20 hover:border-[#0F294A]',
      iconBg: 'bg-[#0F294A] text-white',
    },
    {
      id: 'matriz',
      title: 'Matriz Detallada',
      description:
        'Secuencia estructurada paso a paso de todas las actividades del procedimiento, responsables y soportes documentales.',
      detail: `${state.proceso.length} actividades sincronizadas con el flujograma`,
      icon: FileSpreadsheet,
      accent: 'border-[#FDE047] hover:border-[#D97706]',
      iconBg: 'bg-[#FACC15] text-[#0F294A]',
    },
    {
      id: 'flujograma',
      title: 'Flujograma',
      description:
        'Diagrama interactivo de decisiones, rutas alternativas SÍ / NO y ciclos de ajuste del procedimiento organizacional.',
      detail: 'Representación gráfica editable del proceso',
      icon: GitFork,
      accent: 'border-[#FCA5A5] hover:border-[#D61F26]',
      iconBg: 'bg-[#D61F26] text-white',
    },
    {
      id: 'programas',
      title: 'Programas de Bienestar',
      description:
        'Plan Anual 2027 (10 trabajadores): 8 dimensiones, 9 fichas de actividades, Pausas Activas Interactivas, Presupuesto General 2027, Cronograma y Gantt 2027, Seguimiento, Encuestas, Asistencia, Convenios verificados y 24 formatos.',
      detail: `${state.planBienestar.length} actividades · Pausas Activas · Presupuesto 2027 · Convenios`,
      icon: HeartHandshake,
      accent: 'border-[#FCA5A5] bg-gradient-to-br from-[#FEF2F2]/60 via-white to-[#FFFBEB] hover:border-[#D61F26]',
      iconBg: 'bg-[#D61F26] text-[#FACC15]',
    },
  ];

  return (
    <div className="space-y-10 pt-10 sm:pt-12 pb-2">
      {/* Encabezado limpio y amplio de bienvenida */}
      <section
        data-module-surface="true"
        className="relative overflow-hidden rounded-3xl border border-[#FDE047] bg-white p-8 sm:p-10 shadow-xs"
      >
        <div className="absolute inset-x-0 top-0 flex h-2">
          <div className="w-2/3 bg-[#D61F26]" />
          <div className="w-1/3 bg-[#FACC15]" />
        </div>
        <div className="max-w-3xl space-y-3 pt-1">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-extrabold tracking-wide text-[#D61F26]">
              {state.planGeneral.empresa} · VIGENCIA {state.planGeneral.vigenciaAnual}
            </span>
            <ChipHeaderAccent className="hidden sm:inline-flex" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#0F294A] sm:text-4xl">
            {state.planGeneral.nombrePrograma}
          </h1>
          <p className="text-base leading-relaxed text-slate-600">
            Selecciona una sección para trabajar en su espacio independiente. Cada módulo conserva
            su propia estructura, formularios, tablas y exportaciones sin duplicar contenidos.
          </p>
        </div>
      </section>

      {/* Cuadrícula limpia de los 5 espacios de trabajo */}
      <section aria-label="Secciones principales" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod, idx) => {
          const Icon = mod.icon;
          return (
            <motion.button
              key={mod.id}
              type="button"
              data-piggy-walk-nav="true"
              onClick={(e) => handleOpen(e, mod.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.99 }}
              className={`group flex flex-col justify-between rounded-2xl border-2 bg-white p-7 text-left shadow-xs transition-all cursor-pointer ${
                mod.id === 'programas' ? 'md:col-span-2 lg:col-span-2' : ''
              } ${mod.accent}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-xs ${mod.iconBg}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-[#D61F26]" />
                </div>

                <div>
                  <h2 className="font-display text-xl font-extrabold text-[#0F294A] group-hover:text-[#D61F26] transition-colors">
                    {mod.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{mod.description}</p>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-3.5 text-xs font-bold text-[#0F294A]/75">
                {mod.detail}
              </div>
            </motion.button>
          );
        })}
      </section>
    </div>
  );
}
