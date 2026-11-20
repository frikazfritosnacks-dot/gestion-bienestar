import { useRef, useState } from 'react';
import {
  Home,
  BookOpen,
  FileSpreadsheet,
  GitFork,
  Menu,
  X,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { MotionConfig, motion } from 'motion/react';
import { BienestarProvider, useBienestar } from './context/BienestarContext';
import { ManualSubSectionId, SectionId } from './types/bienestar';
import { InicioSection } from './components/sections/InicioSection';
import { ManualSection } from './components/sections/ManualSection';
import { MatrizDetalladaSection } from './components/sections/MatrizDetalladaSection';
import { FlujogramaSection } from './components/sections/FlujogramaSection';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { ChipButtonBurstOverlay } from './components/ui/ChipButtonBurstOverlay';

const FRIKAZ_LOGO_URL = '/assets/aistudio/image_44eb546f.png';

const NAV_ITEMS: Array<{
  id: SectionId;
  label: string;
  icon: typeof Home;
}> = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'manual', label: 'Manual', icon: BookOpen },
  { id: 'matriz', label: 'Matriz detallada', icon: FileSpreadsheet },
  { id: 'flujograma', label: 'Flujograma', icon: GitFork },
];

const SECTION_TITLES: Record<SectionId, string> = {
  inicio: 'Inicio',
  manual: 'Manual del Procedimiento',
  matriz: 'Matriz Detallada',
  flujograma: 'Flujograma del Procedimiento',
  seguimiento: 'Seguimiento y Resultados',
};

function AppShell() {
  const { state, toasts, dismissToast, resetToInitial, importState, notify } = useBienestar();
  const [activeSection, setActiveSection] = useState<SectionId>('inicio');
  const [manualSubTab, setManualSubTab] = useState<ManualSubSectionId>('introduccion');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNavigate = (section: SectionId, tab?: ManualSubSectionId) => {
    setActiveSection(section);
    if (tab) setManualSubTab(tab);
    setMobileMenuOpen(false);
  };

  const handleManualSubTabChange = (tab: ManualSubSectionId) => {
    setManualSubTab(tab);
    setMobileMenuOpen(false);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frikaz-bienestar-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Respaldo JSON descargado correctamente.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        importState(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200">
      <div>
        {/* Identidad Oficial Frikaz S.A.S. */}
        <div className="border-b border-slate-200 bg-white px-5 pt-4 pb-3.5">
          <button
            type="button"
            onClick={() => handleNavigate('inicio')}
            className="group flex w-full flex-col items-center rounded-xl bg-white p-1.5 text-center transition-transform duration-150 hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D61F26]"
            aria-label="Ir al inicio de Frikaz S.A.S."
          >
            <img
              src={FRIKAZ_LOGO_URL}
              alt="Logo oficial Frikaz S.A.S."
              className="h-16 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="mt-1.5 text-xs font-extrabold tracking-tight text-[#D61F26]">
              Frikaz S.A.S.
            </span>
            <span className="text-[11px] font-semibold text-[#0F294A]">
              Bienestar Social Laboral
            </span>
          </button>
          <div className="mt-3 flex h-1 w-full overflow-hidden rounded-full">
            <div className="w-2/3 bg-[#D61F26]" />
            <div className="w-1/3 bg-[#FACC15]" />
          </div>
        </div>

        {/* Navegación principal */}
        <nav className="p-3 space-y-1.5" aria-label="Menú principal">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                  active
                    ? 'bg-[#D61F26] text-white border-b-2 border-[#FACC15] shadow-xs'
                    : 'text-[#0F294A] hover:bg-[#FEF9C3]/80 hover:text-[#D61F26]'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#FACC15]' : 'text-[#0F294A]/70'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Subapartados del Manual cuando está activo */}
        {activeSection === 'manual' && (
          <div className="mx-3 mt-2 rounded-xl border border-[#FDE047] bg-[#FFFBEB] p-3">
            <p className="mb-2 text-[11px] font-bold text-[#0F294A]">
              Apartados del Manual
            </p>
            <div className="space-y-1">
              {[
                { id: 'introduccion' as ManualSubSectionId, label: '1. Introducción' },
                { id: 'objetivos' as ManualSubSectionId, label: '2. Objetivos' },
                { id: 'justificacion' as ManualSubSectionId, label: '3. Justificación' },
                { id: 'alcance' as ManualSubSectionId, label: '4. Alcance' },
                {
                  id: 'normograma' as ManualSubSectionId,
                  label: `5. Normograma (${state.normograma.length})`,
                },
                {
                  id: 'terminologia' as ManualSubSectionId,
                  label: `6. Terminología (${state.terminologia.length})`,
                },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleManualSubTabChange(sub.id)}
                  className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                    manualSubTab === sub.id
                      ? 'bg-white font-bold text-[#D61F26] shadow-2xs border-l-0 ring-1 ring-[#FACC15]'
                      : 'font-medium text-[#0F294A]/85 hover:bg-white/80 hover:text-[#0F294A]'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Herramientas de respaldo documental */}
      <div className="border-t border-slate-200 p-4 space-y-2 bg-white">
        <p className="text-[11px] font-semibold text-[#0F294A]/70">Respaldo y datos del sistema</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0F294A] transition-all duration-150 hover:border-[#0F294A] hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5 text-[#D61F26]" />
            Exportar
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0F294A] transition-all duration-150 hover:border-[#0F294A] hover:bg-slate-50 whitespace-nowrap"
          >
            <Upload className="h-3.5 w-3.5 text-[#0F294A]" />
            Importar
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleImportFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => setConfirmResetOpen(true)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#FACC15] bg-[#FEF9C3] px-2.5 py-1.5 text-xs font-semibold text-[#0F294A] transition-all duration-150 hover:bg-[#FDE047] whitespace-nowrap"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restaurar originales
        </button>
      </div>
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F294A] flex">
        {/* Animación global de papitas saltando desde los botones */}
        <ChipButtonBurstOverlay />

        {/* Sidebar fijo escritorio */}
        <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen">
          {SidebarContent}
        </aside>

        {/* Drawer móvil / tableta */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div
              className="fixed inset-0 bg-[#0F294A]/40 backdrop-blur-[1px]"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-72 max-w-[85vw] h-full bg-white shadow-xl">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-[#0F294A]/70 hover:bg-[#FEE2E2] hover:text-[#D61F26]"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
              {SidebarContent}
            </div>
          </div>
        )}

        {/* Contenido principal */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Barra superior con logo oficial Frikaz S.A.S. */}
          <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b-2 border-[#FACC15] bg-white px-4 py-2.5 sm:px-8">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-lg border border-slate-200 p-2 text-[#0F294A] hover:bg-[#FEF9C3] lg:hidden"
                aria-label="Abrir menú de navegación"
              >
                <Menu className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('inicio')}
                className="flex items-center gap-2.5 shrink-0 focus-visible:outline-2 focus-visible:outline-[#D61F26] rounded-md"
                aria-label="Frikaz S.A.S. Inicio"
              >
                <img
                  src={FRIKAZ_LOGO_URL}
                  alt="Frikaz S.A.S."
                  className="h-9 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </button>

              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="hidden sm:inline font-display font-extrabold text-[#D61F26] whitespace-nowrap shrink-0">
                  Frikaz S.A.S.
                </span>
                <span className="text-slate-300" aria-hidden="true">
                  /
                </span>
                <span className="font-semibold text-[#0F294A] truncate">
                  {SECTION_TITLES[activeSection]}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden sm:inline text-xs text-[#0F294A]/75 font-mono tabular-nums whitespace-nowrap">
                {state.manual.portada.codigoDocumental} · v{state.manual.portada.version}
              </span>
            </div>
          </header>

          {/* Área de vistas con transición suave */}
          <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeSection === 'inicio' && <InicioSection onNavigate={handleNavigate} />}
              {activeSection === 'manual' && (
                <ManualSection
                  activeSubTab={manualSubTab}
                  onChangeSubTab={handleManualSubTabChange}
                />
              )}
              {activeSection === 'matriz' && (
                <MatrizDetalladaSection onOpenFlowchart={() => handleNavigate('flujograma')} />
              )}
              {activeSection === 'flujograma' && (
                <FlujogramaSection onOpenMatriz={() => handleNavigate('matriz')} />
              )}
            </motion.div>
          </main>
        </div>

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

        <ConfirmModal
          open={confirmResetOpen}
          title="Restaurar información original"
          description="Esta acción restablecerá el Manual, el Normograma (20 normas), la Terminología (50 conceptos), la Matriz Detallada y el Flujograma de Frikaz S.A.S. a sus valores iniciales. ¿Deseas continuar?"
          confirmLabel="Sí, restaurar"
          onConfirm={() => {
            resetToInitial();
            setConfirmResetOpen(false);
          }}
          onCancel={() => setConfirmResetOpen(false)}
        />
      </div>
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
