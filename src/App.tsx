import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  GitFork,
  HeartHandshake,
  Home,
  Info,
  Menu,
  Sparkles,
  X,
} from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { BienestarProvider, useBienestar } from './context/BienestarContext';
import { DimensionBienestar, ManualSubSectionId, SectionId } from './types/bienestar';
import { CoverPortada } from './components/sections/CoverPortada';
import { InicioSection } from './components/sections/InicioSection';
import { ManualSection } from './components/sections/ManualSection';
import { MatrizDetalladaSection } from './components/sections/MatrizDetalladaSection';
import { FlujogramaSection } from './components/sections/FlujogramaSection';
import {
  PlanSubTab,
  ProgramasBienestarSection,
} from './components/sections/ProgramasBienestarSection';
import { ChipButtonBurstOverlay } from './components/ui/ChipButtonBurstOverlay';
import {
  WalkingPiggyCompanion,
  requestPiggyWalkAndNavigate,
} from './components/mascot/WalkingPiggyCompanion';

const FRIKAZ_LOGO_URL = '/assets/aistudio/image_44eb546f.png';

/**
 * Menú principal ÚNICO: cada apartado aparece exactamente una sola vez.
 */
const MENU_ITEMS: Array<{
  id: SectionId;
  label: string;
  icon: typeof Home;
}> = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'manual', label: 'Manual', icon: BookOpen },
  { id: 'matriz', label: 'Matriz Detallada', icon: FileSpreadsheet },
  { id: 'flujograma', label: 'Flujograma', icon: GitFork },
  { id: 'programas', label: 'Programas de Bienestar', icon: HeartHandshake },
];

const SECTION_TITLES: Record<SectionId, string> = {
  inicio: 'Inicio',
  manual: 'Manual',
  matriz: 'Matriz Detallada',
  flujograma: 'Flujograma',
  programas: 'Programas de Bienestar',
};

function AppShell() {
  const { state, isSaving, toasts, dismissToast } = useBienestar();
  const [showCover, setShowCover] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>('inicio');
  const [manualSubTab, setManualSubTab] = useState<ManualSubSectionId>('introduccion');
  const [programasSubTab, setProgramasSubTab] = useState<PlanSubTab>('general');
  const [programasDimension, setProgramasDimension] = useState<'ALL' | DimensionBienestar>('ALL');
  const [programasActividadId, setProgramasActividadId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigate = (section: SectionId, tab?: ManualSubSectionId) => {
    setActiveSection(section);
    if (tab) setManualSubTab(tab);
    setMobileMenuOpen(false);
  };

  const handleWalkNavigate = (
    e: React.MouseEvent<HTMLElement>,
    section: SectionId,
    tab?: ManualSubSectionId
  ) => {
    setMobileMenuOpen(false);
    setActiveSection(section);
    if (tab) setManualSubTab(tab);
    requestPiggyWalkAndNavigate(e.currentTarget);
  };

  return (
    <MotionConfig reducedMotion="user">
      {/* Animación global de papitas saltando desde los botones */}
      <ChipButtonBurstOverlay />

      <AnimatePresence mode="wait">
        {showCover ? (
          <motion.div
            key="cover-portada"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <CoverPortada
              empresa={state.manual.portada.empresa}
              onStart={() => {
                setShowCover(false);
                setActiveSection('inicio');
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="main-platform"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen bg-[#F8FAFC] text-[#0F294A] flex flex-col"
          >
            {/* Cerdito oficial caminando automáticamente con huellas que desaparecen */}
            <WalkingPiggyCompanion />

            {/* Menú principal único sin duplicaciones */}
            <header className="sticky top-0 z-30 border-b-2 border-[#FACC15] bg-white/95 backdrop-blur-xs">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                {/* Marca oficial Frikaz S.A.S. */}
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    data-piggy-walk-nav="true"
                    onClick={(e) => handleWalkNavigate(e, 'inicio')}
                    className="flex items-center gap-2.5 shrink-0 rounded-xl px-1.5 py-1 transition-transform hover:scale-[1.02] cursor-pointer"
                    aria-label="Frikaz S.A.S. Inicio"
                  >
                    <img
                      src={FRIKAZ_LOGO_URL}
                      alt="Logo oficial Frikaz S.A.S."
                      className="h-10 w-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <span className="font-display text-sm font-extrabold text-[#D61F26] whitespace-nowrap">
                      Frikaz S.A.S.
                    </span>
                  </button>

                  {activeSection !== 'inicio' && (
                    <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                      <span aria-hidden="true">/</span>
                      <span className="font-bold text-[#0F294A] whitespace-nowrap">
                        {SECTION_TITLES[activeSection]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Navegación única en escritorio */}
                <nav
                  className="hidden lg:flex items-center gap-1.5"
                  aria-label="Menú principal"
                >
                  {MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-piggy-walk-nav="true"
                        onClick={(e) => handleWalkNavigate(e, item.id)}
                        className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-[#D61F26] text-white border-b-2 border-[#FACC15] shadow-xs'
                            : 'text-[#0F294A] hover:bg-[#FEF9C3]/80 hover:text-[#D61F26]'
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${active ? 'text-[#FACC15]' : 'text-[#0F294A]/70'}`}
                        />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>

                {/* Botón de portada, estado de guardado y menú móvil */}
                <div className="flex items-center gap-2 shrink-0">
                  {isSaving && (
                    <span
                      aria-live="polite"
                      className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D61F26] animate-pulse" />
                      Guardando...
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowCover(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#0F294A] hover:border-[#0F294A] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#D61F26]" />
                    Portada
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="rounded-xl border border-slate-200 p-2 text-[#0F294A] hover:bg-[#FEF9C3] lg:hidden"
                    aria-label="Abrir menú"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </header>

            {/* Drawer móvil */}
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
                <div
                  className="fixed inset-0 bg-[#0F294A]/40 backdrop-blur-[1px]"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className="relative z-10 flex h-full w-76 max-w-[85vw] flex-col justify-between bg-white p-5 shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="font-display text-sm font-extrabold text-[#D61F26]">
                        Frikaz S.A.S.
                      </span>
                      <button
                        type="button"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-lg p-1.5 text-[#0F294A]/70 hover:bg-[#FEE2E2] hover:text-[#D61F26]"
                        aria-label="Cerrar menú"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const active = activeSection === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            data-piggy-walk-nav="true"
                            onClick={(e) => handleWalkNavigate(e, item.id)}
                            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold ${
                              active
                                ? 'bg-[#D61F26] text-white border-b-2 border-[#FACC15]'
                                : 'text-[#0F294A] hover:bg-[#FEF9C3]/70'
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 ${active ? 'text-[#FACC15]' : 'text-[#0F294A]/75'}`}
                            />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Espacio de trabajo dedicado del módulo activo */}
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 lg:px-10">
              {activeSection !== 'inicio' && (
                <div className="mb-6">
                  <button
                    type="button"
                    data-piggy-walk-nav="true"
                    onClick={(e) => handleWalkNavigate(e, 'inicio')}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#0F294A] transition-colors hover:border-[#D61F26] hover:text-[#D61F26] cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 text-[#D61F26]" />
                    Volver a la pantalla principal
                  </button>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  {activeSection === 'inicio' && (
                    <InicioSection onSelectSection={(sec) => handleNavigate(sec)} />
                  )}

                  {activeSection === 'manual' && (
                    <ManualSection
                      activeSubTab={manualSubTab}
                      onChangeSubTab={(tab) => setManualSubTab(tab)}
                    />
                  )}

                  {activeSection === 'matriz' && (
                    <MatrizDetalladaSection onOpenFlowchart={() => handleNavigate('flujograma')} />
                  )}

                  {activeSection === 'flujograma' && (
                    <FlujogramaSection onOpenMatriz={() => handleNavigate('matriz')} />
                  )}

                  {activeSection === 'programas' && (
                    <ProgramasBienestarSection
                      activeSubTab={programasSubTab}
                      onChangeSubTab={setProgramasSubTab}
                      selectedDimensionProp={programasDimension}
                      onChangeDimensionProp={setProgramasDimension}
                      selectedActividadIdProp={programasActividadId}
                      onChangeActividadIdProp={setProgramasActividadId}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Notificaciones Toast */}
            {toasts.length > 0 && (
              <div
                className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
                aria-live="polite"
              >
                {toasts.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs font-semibold shadow-md ${
                      t.tone === 'warning'
                        ? 'border-[#FACC15] bg-[#FEF9C3] text-[#0F294A]'
                        : t.tone === 'info'
                          ? 'border-[#0F294A]/25 bg-[#EFF6FF] text-[#0F294A]'
                          : 'border-[#FCA5A5] bg-white text-[#0F294A]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {t.tone === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-[#B45309]" />
                      ) : t.tone === 'info' ? (
                        <Info className="h-4 w-4 shrink-0 text-[#0F294A]" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#D61F26]" />
                      )}
                      <span>{t.text}</span>
                    </div>
                    <button
                      type="button"
                      data-piggy-ignore="true"
                      onClick={() => dismissToast(t.id)}
                      className="rounded p-0.5 opacity-60 hover:opacity-100"
                      aria-label="Cerrar aviso"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

export default function App() {
  return (
    <BienestarProvider>
      <AppShell />
    </BienestarProvider>
  );
}
