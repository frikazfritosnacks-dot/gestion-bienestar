import { useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ArrowDown,
  CornerDownLeft,
  FileSpreadsheet,
  Eye,
  X,
  Check,
  AlertCircle,
  FileDown,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { FlowchartSymbol, ProcessStep } from '../../types/bienestar';
import { SYMBOL_LABELS, SymbolGraphic } from '../ui/SymbolGraphic';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ChipSvg } from '../ui/ChipGraphics';
import {
  buildFlujogramaWordFilename,
  downloadManualMatrizFlujogramaThreeWord,
  generateFlujogramaWordBlob,
} from '../../utils/wordManualGenerator';

interface FlujogramaSectionProps {
  onOpenMatriz: () => void;
}

const SYMBOLS: FlowchartSymbol[] = ['oval', 'rectangle', 'diamond', 'document', 'cylinder'];

export function FlujogramaSection({ onOpenMatriz }: FlujogramaSectionProps) {
  const { state, addProcessStep, updateProcessStep, deleteProcessStep, notify } = useBienestar();

  const [selectedId, setSelectedId] = useState<string | null>(state.proceso[0]?.id ?? null);
  const [simulatedBranch, setSimulatedBranch] = useState<Record<string, 'yes' | 'no'>>({});
  const [editMode, setEditMode] = useState(false);
  const [downloadingFlujoWord, setDownloadingFlujoWord] = useState(false);
  const [downloadingThreeWord, setDownloadingThreeWord] = useState(false);

  const handleDownloadFlujoWord = async () => {
    if (downloadingFlujoWord) return;
    setDownloadingFlujoWord(true);
    try {
      const blob = await generateFlujogramaWordBlob(state);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = buildFlujogramaWordFilename(state);
      a.click();
      URL.revokeObjectURL(url);
      notify('Flujograma descargado en Word (.docx).');
    } catch {
      notify('No fue posible generar el Flujograma en Word. Inténtalo de nuevo.', 'warning');
    } finally {
      setDownloadingFlujoWord(false);
    }
  };

  const handleDownloadThreeWord = async () => {
    if (downloadingThreeWord) return;
    setDownloadingThreeWord(true);
    try {
      await downloadManualMatrizFlujogramaThreeWord(state);
      notify('Descargados los 3 archivos Word independientes: Manual, Matriz y Flujograma.');
    } catch {
      notify('No fue posible generar los 3 archivos Word. Inténtalo nuevamente.', 'warning');
    } finally {
      setDownloadingThreeWord(false);
    }
  };

  const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<{
    symbol: FlowchartSymbol;
    actividad: string;
    descripcion: string;
    responsable: string;
    registroDocumento: string;
    isDecision: boolean;
    insertAfterId: string;
    yesLabel: string;
    noLabel: string;
  }>({
    symbol: 'rectangle',
    actividad: '',
    descripcion: '',
    responsable: 'Talento Humano',
    registroDocumento: '',
    isDecision: false,
    insertAfterId: state.proceso[state.proceso.length - 2]?.id ?? '',
    yesLabel: 'SÍ',
    noLabel: 'NO',
  });
  const [addError, setAddError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Build ordered main spine (excluding adjustment nodes rendered beside their decision)
  const adjustmentTargetIds = useMemo(() => {
    const set = new Set<string>();
    state.proceso.forEach((s) => {
      if (s.isAdjustment) set.add(s.id);
      if (s.isDecision && s.noTargetId) {
        const noNode = state.proceso.find((x) => x.id === s.noTargetId);
        if (noNode && noNode.isAdjustment) set.add(noNode.id);
      }
    });
    return set;
  }, [state.proceso]);

  const mainSpineSteps = useMemo(
    () => state.proceso.filter((s) => !adjustmentTargetIds.has(s.id)),
    [state.proceso, adjustmentTargetIds]
  );

  const selectedNode = state.proceso.find((s) => s.id === selectedId) || null;

  const renderShapeNode = (step: ProcessStep, isSelected: boolean, isHighlightedLoop = false) => {
    const baseRing = isSelected
      ? 'ring-2 ring-[#D61F26] ring-offset-2'
      : isHighlightedLoop
        ? 'ring-2 ring-[#FACC15] ring-offset-1'
        : '';

    if (step.symbol === 'oval') {
      return (
        <div
          className={`mx-auto flex min-w-[210px] max-w-[300px] items-center justify-center rounded-full border-2 border-[#D61F26] bg-[#FEE2E2] px-7 py-3 text-center transition-all ${baseRing}`}
        >
          <span className="text-sm font-extrabold tracking-wide text-[#D61F26]">{step.actividad}</span>
        </div>
      );
    }

    if (step.symbol === 'diamond' || step.isDecision) {
      return (
        <div
          className={`relative mx-auto flex w-full max-w-[360px] flex-col items-center rounded-xl border-2 border-[#FACC15] bg-[#FEF9C3] px-5 py-4 text-center transition-all ${baseRing}`}
        >
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0F294A]">
            <SymbolGraphic symbol="diamond" size="sm" />
            <span>Decisión · {step.responsable}</span>
          </div>
          <p className="text-sm font-bold text-[#0F294A]">{step.actividad}</p>
          {step.registroDocumento && step.registroDocumento !== 'N/A' && (
            <p className="mt-1 text-xs font-medium text-[#0F294A]/75">Doc: {step.registroDocumento}</p>
          )}
        </div>
      );
    }

    if (step.symbol === 'cylinder') {
      return (
        <div
          className={`mx-auto w-full max-w-[360px] rounded-xl border-2 border-[#0F294A]/40 bg-[#EFF6FF] px-5 py-3.5 text-left transition-all ${baseRing}`}
        >
          <div className="flex items-start gap-3">
            <SymbolGraphic symbol="cylinder" size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#0F294A]">{step.actividad}</p>
              <p className="mt-0.5 text-xs text-[#0F294A]/75">
                {step.responsable} · {step.registroDocumento}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (step.symbol === 'document') {
      return (
        <div
          className={`mx-auto w-full max-w-[360px] rounded-xl rounded-br-3xl border-2 border-[#0F294A] bg-[#EFF6FF] px-5 py-3.5 text-left transition-all ${baseRing}`}
        >
          <div className="flex items-start gap-3">
            <SymbolGraphic symbol="document" size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#0F294A]">{step.actividad}</p>
              <p className="mt-0.5 text-xs text-[#0F294A]/75">
                {step.responsable} · {step.registroDocumento}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // rectangle
    return (
      <div
        className={`mx-auto w-full max-w-[360px] rounded-lg border-2 border-[#0F294A]/35 bg-white px-5 py-3.5 text-left transition-all ${baseRing}`}
      >
        <div className="flex items-start gap-3">
          <SymbolGraphic symbol="rectangle" size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#0F294A]">{step.actividad}</p>
            <p className="mt-0.5 text-xs text-slate-600">
              {step.responsable} · {step.registroDocumento}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const handleSaveNodeEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStep) return;
    if (!editingStep.actividad.trim() || !editingStep.responsable.trim()) return;
    const isDiamond = editingStep.symbol === 'diamond' || editingStep.isDecision;
    updateProcessStep({
      ...editingStep,
      actividad: editingStep.actividad.trim(),
      descripcion: editingStep.descripcion.trim(),
      responsable: editingStep.responsable.trim(),
      registroDocumento: editingStep.registroDocumento.trim() || 'N/A',
      isDecision: isDiamond,
    });
    setEditingStep(null);
  };

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.actividad.trim() || !addForm.descripcion.trim() || !addForm.responsable.trim()) {
      setAddError('Nombre de actividad, descripción y responsable son obligatorios.');
      return;
    }
    const isDiamond = addForm.symbol === 'diamond' || addForm.isDecision;
    const newId = addProcessStep(
      {
        symbol: isDiamond ? 'diamond' : addForm.symbol,
        actividad: addForm.actividad.trim(),
        descripcion: addForm.descripcion.trim(),
        responsable: addForm.responsable.trim(),
        registroDocumento: addForm.registroDocumento.trim() || 'N/A',
        isDecision: isDiamond,
        yesLabel: isDiamond ? addForm.yesLabel || 'SÍ' : undefined,
        noLabel: isDiamond ? addForm.noLabel || 'NO' : undefined,
      },
      addForm.insertAfterId || undefined
    );
    setSelectedId(newId);
    setShowAddModal(false);
    setAddError('');
    setAddForm({
      symbol: 'rectangle',
      actividad: '',
      descripcion: '',
      responsable: 'Talento Humano',
      registroDocumento: '',
      isDecision: false,
      insertAfterId: newId,
      yesLabel: 'SÍ',
      noLabel: 'NO',
    });
  };

  const stepToDelete = state.proceso.find((s) => s.id === deleteId);

  return (
    <div className="space-y-6">
      {/* Barra superior del Flujograma */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-[#0F294A]">
              Flujograma del Procedimiento · {state.matrizMeta.empresa}
            </h1>
            <ChipSvg variant="chip" className="hidden sm:block h-5 w-5 shrink-0" />
          </div>
          <p className="text-xs text-slate-600">
            Integrado en tiempo real con la Matriz Detallada ({state.matrizMeta.codigo}) · Haz clic
            en cualquier nodo para consultar o editar su ruta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setEditMode(false);
                setEditingStep(null);
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                !editMode ? 'bg-[#0F294A] text-white shadow-2xs' : 'text-[#0F294A]'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Modo consulta
            </button>
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                editMode ? 'bg-[#D61F26] text-white border-b border-[#FACC15] shadow-2xs' : 'text-[#0F294A]'
              }`}
            >
              <Pencil className="h-3.5 w-3.5" />
              Modo edición
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadFlujoWord}
            disabled={downloadingFlujoWord || downloadingThreeWord}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F294A] border-b-2 border-[#FACC15] px-3.5 py-2 text-xs font-bold text-white transition-all duration-150 hover:bg-[#D61F26] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileDown className="h-3.5 w-3.5 text-[#FACC15]" />
            {downloadingFlujoWord ? 'Generando...' : 'Descargar Flujograma (.docx)'}
          </button>

          <button
            type="button"
            onClick={handleDownloadThreeWord}
            disabled={downloadingFlujoWord || downloadingThreeWord}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-3.5 py-2 text-xs font-bold text-white transition-all duration-150 hover:bg-[#B3161C] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileDown className="h-3.5 w-3.5 text-[#FACC15]" />
            {downloadingThreeWord ? 'Generando 3 Word...' : 'Descargar 3 Word'}
          </button>

          {editMode && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-3.5 py-2 text-xs font-semibold text-white transition-all duration-150 hover:bg-[#B3161C] hover:-translate-y-0.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-[#FACC15]" />
              Agregar nodo
            </button>
          )}

          <button
            type="button"
            onClick={onOpenMatriz}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#FACC15] bg-[#FEF9C3] px-3.5 py-2 text-xs font-semibold text-[#0F294A] transition-colors hover:bg-[#FDE047] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#D61F26]" />
            Ver Matriz
          </button>
        </div>
      </div>

      {/* Leyenda de simbología */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs text-[#0F294A]">
        <span className="font-bold text-[#0F294A]">Convenciones:</span>
        {SYMBOLS.map((sym) => (
          <div key={sym} className="flex items-center gap-2">
            <SymbolGraphic symbol={sym} size="sm" />
            <span>{SYMBOL_LABELS[sym]}</span>
          </div>
        ))}
      </div>

      {/* Área principal: Diagrama vertical + Panel lateral de detalle / edición */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        {/* Canvas vertical del Flujograma */}
        <div className="xl:col-span-8 rounded-xl border border-slate-200 bg-[#F8FAFC] p-5 sm:p-8 overflow-x-auto">
          <div className="mx-auto flex min-w-[320px] max-w-3xl flex-col items-center">
            {mainSpineSteps.map((step, index) => {
              const isSelected = selectedId === step.id;
              const noTargetNode =
                step.isDecision && step.noTargetId
                  ? state.proceso.find((s) => s.id === step.noTargetId)
                  : null;
              const yesTargetNode =
                step.isDecision && step.yesTargetId
                  ? state.proceso.find((s) => s.id === step.yesTargetId)
                  : null;
              const branchChoice = simulatedBranch[step.id];

              return (
                <div key={step.id} className="w-full flex flex-col items-center">
                  {/* Fila del nodo (con rama NO lateral si es decisión) */}
                  <div
                    className={`w-full flex flex-col items-center gap-4 ${
                      noTargetNode ? 'lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center' : ''
                    }`}
                  >
                    {/* Columna izquierda vacía para centrar el nodo principal en grid de 3 cols */}
                    {noTargetNode && <div className="hidden lg:block" />}

                    {/* Nodo central */}
                    <div className="w-full max-w-[360px] mx-auto">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedId(step.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') setSelectedId(step.id);
                        }}
                        className="cursor-pointer focus:outline-none"
                      >
                        {renderShapeNode(step, isSelected)}
                      </div>

                      {step.isDecision && (
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSimulatedBranch((prev) => ({ ...prev, [step.id]: 'yes' }))
                            }
                            className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                              branchChoice === 'yes'
                                ? 'border-[#0F294A] bg-[#0F294A] text-white'
                                : 'border-slate-200 bg-white text-[#0F294A] hover:bg-[#EFF6FF]'
                            }`}
                          >
                            Ruta {step.yesLabel || 'SÍ'}
                            {yesTargetNode ? ` → ${yesTargetNode.actividad.slice(0, 18)}…` : ''}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSimulatedBranch((prev) => ({ ...prev, [step.id]: 'no' }))
                            }
                            className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                              branchChoice === 'no'
                                ? 'border-[#D97706] bg-[#FACC15] text-[#0F294A]'
                                : 'border-slate-200 bg-white text-[#0F294A] hover:bg-[#FEF9C3]'
                            }`}
                          >
                            Ruta {step.noLabel || 'NO'} (Ajuste)
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Rama lateral derecha para camino NO + retorno */}
                    {noTargetNode && (
                      <div className="flex items-center gap-3 w-full max-w-sm lg:max-w-none">
                        {/* Conector horizontal NO */}
                        <div className="hidden lg:flex items-center gap-1 text-xs font-bold text-[#0F294A]">
                          <div className="h-0.5 w-6 bg-[#D97706]" />
                          <span className="rounded border border-[#FACC15] bg-[#FEF9C3] px-1.5 py-0.5 text-[11px]">
                            {step.noLabel || 'NO'}
                          </span>
                          <span aria-hidden="true">→</span>
                        </div>

                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedId(noTargetNode.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') setSelectedId(noTargetNode.id);
                          }}
                          className={`flex-1 cursor-pointer rounded-xl border-2 p-3.5 transition-all ${
                            selectedId === noTargetNode.id
                              ? 'border-[#D61F26] bg-[#FEF2F2] ring-2 ring-[#D61F26] ring-offset-1'
                              : branchChoice === 'no'
                                ? 'border-[#FACC15] bg-[#FEF9C3]'
                                : 'border-[#FDE047] bg-white hover:bg-[#FFFBEB]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-[#D61F26]">
                              Si es {step.noLabel || 'NO'}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F294A]">
                              <CornerDownLeft className="h-3 w-3" />
                              Vuelve a aprobación
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-bold text-[#0F294A]">
                            {noTargetNode.actividad}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-600">
                            {noTargetNode.responsable} · {noTargetNode.registroDocumento}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Conector vertical hacia siguiente actividad */}
                  {index < mainSpineSteps.length - 1 && (
                    <div className="my-1.5 flex flex-col items-center">
                      {step.isDecision && (
                        <span className="mb-1 rounded border border-[#0F294A]/20 bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-bold text-[#0F294A]">
                          {step.yesLabel || 'SÍ'}
                        </span>
                      )}
                      <div
                        className={`h-5 w-0.5 ${
                          branchChoice === 'yes' ? 'bg-[#0F294A]' : 'bg-slate-300'
                        }`}
                      />
                      <ArrowDown
                        className={`h-4 w-4 -mt-1 ${
                          branchChoice === 'yes' ? 'text-[#0F294A]' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel derecho: Inspección / Edición de nodo seleccionado */}
        <aside className="xl:col-span-4 rounded-xl border border-slate-200 bg-white p-5 sticky top-6">
          {!selectedNode ? (
            <p className="text-sm text-slate-500">
              Selecciona cualquier elemento del flujograma para ver sus detalles o editarlo.
            </p>
          ) : editingStep && editingStep.id === selectedNode.id ? (
            <form onSubmit={handleSaveNodeEdit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-[#D61F26]">Editar nodo del proceso</h2>
                <button
                  type="button"
                  onClick={() => setEditingStep(null)}
                  className="rounded p-1 text-slate-400 hover:text-[#0F294A]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">Símbolo</label>
                <select
                  value={editingStep.symbol}
                  onChange={(e) =>
                    setEditingStep({
                      ...editingStep,
                      symbol: e.target.value as FlowchartSymbol,
                      isDecision: e.target.value === 'diamond',
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {SYMBOLS.map((sym) => (
                    <option key={sym} value={sym}>
                      {SYMBOL_LABELS[sym]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                  Nombre de la actividad
                </label>
                <input
                  type="text"
                  required
                  value={editingStep.actividad}
                  onChange={(e) => setEditingStep({ ...editingStep, actividad: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">Descripción</label>
                <textarea
                  rows={3}
                  value={editingStep.descripcion}
                  onChange={(e) => setEditingStep({ ...editingStep, descripcion: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                    Responsable
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStep.responsable}
                    onChange={(e) =>
                      setEditingStep({ ...editingStep, responsable: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                    Registro / Documento
                  </label>
                  <input
                    type="text"
                    value={editingStep.registroDocumento}
                    onChange={(e) =>
                      setEditingStep({ ...editingStep, registroDocumento: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {(editingStep.symbol === 'diamond' || editingStep.isDecision) && (
                <div className="space-y-3 rounded-lg border border-[#FDE047] bg-[#FFFBEB] p-3">
                  <p className="text-xs font-bold text-[#0F294A]">
                    Rutas de decisión (SÍ / NO)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-[#0F294A]">
                        Etiqueta SÍ
                      </label>
                      <input
                        type="text"
                        value={editingStep.yesLabel || 'SÍ'}
                        onChange={(e) =>
                          setEditingStep({ ...editingStep, yesLabel: e.target.value })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-[#0F294A]">
                        Etiqueta NO
                      </label>
                      <input
                        type="text"
                        value={editingStep.noLabel || 'NO'}
                        onChange={(e) =>
                          setEditingStep({ ...editingStep, noLabel: e.target.value })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[#0F294A]">
                      Destino si SÍ
                    </label>
                    <select
                      value={editingStep.yesTargetId || ''}
                      onChange={(e) =>
                        setEditingStep({ ...editingStep, yesTargetId: e.target.value })
                      }
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"
                    >
                      <option value="">-- Siguiente en secuencia --</option>
                      {state.proceso
                        .filter((s) => s.id !== editingStep.id)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.actividad}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[#0F294A]">
                      Actividad de ajuste si NO
                    </label>
                    <select
                      value={editingStep.noTargetId || ''}
                      onChange={(e) =>
                        setEditingStep({ ...editingStep, noTargetId: e.target.value })
                      }
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"
                    >
                      <option value="">-- Sin nodo lateral --</option>
                      {state.proceso
                        .filter((s) => s.id !== editingStep.id)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.actividad}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStep(null)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-[#0F294A]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#B3161C]"
                >
                  <Check className="h-3.5 w-3.5" />
                  Guardar cambios
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <SymbolGraphic symbol={selectedNode.symbol} size="sm" />
                  <div>
                    <p className="text-[11px] font-medium text-slate-500">
                      {SYMBOL_LABELS[selectedNode.symbol]}
                    </p>
                    <h2 className="text-base font-bold text-[#0F294A]">{selectedNode.actividad}</h2>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="block text-xs font-semibold text-[#0F294A]/70">Descripción</span>
                  <p className="mt-1 leading-relaxed text-slate-700">{selectedNode.descripcion}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-[#F8FAFC] p-3">
                  <div>
                    <span className="block text-[11px] font-medium text-slate-500">
                      Responsable
                    </span>
                    <span className="text-xs font-bold text-[#0F294A]">
                      {selectedNode.responsable}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-medium text-slate-500">
                      Registro / Documento
                    </span>
                    <span className="text-xs font-bold text-[#D61F26]">
                      {selectedNode.registroDocumento}
                    </span>
                  </div>
                </div>

                {selectedNode.isDecision && (
                  <div className="rounded-lg border border-[#FDE047] bg-[#FFFBEB] p-3 text-xs text-[#0F294A] space-y-1">
                    <p className="font-bold">Lógica de aprobación:</p>
                    <p>
                      · <strong>{selectedNode.yesLabel || 'SÍ'}:</strong>{' '}
                      {state.proceso.find((x) => x.id === selectedNode.yesTargetId)?.actividad ||
                        'Continúa con la siguiente actividad'}
                    </p>
                    <p>
                      · <strong>{selectedNode.noLabel || 'NO'}:</strong>{' '}
                      {state.proceso.find((x) => x.id === selectedNode.noTargetId)?.actividad ||
                        'Ajustar y volver a presentar'}
                    </p>
                  </div>
                )}
              </div>

              {editMode && (
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingStep({ ...selectedNode })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#FACC15] bg-[#FEF9C3] px-3 py-2 text-xs font-semibold text-[#0F294A] hover:bg-[#FDE047]"
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#D61F26]" />
                    Editar nodo
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(selectedNode.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-xs font-semibold text-[#D61F26] hover:bg-[#FEE2E2]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Modal para agregar nuevo nodo al flujograma y matriz */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F294A]/40 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0F294A]">
                Agregar actividad o decisión al Flujograma
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded p-1 text-slate-400 hover:text-[#0F294A]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddNode} className="mt-4 space-y-4">
              {addError && (
                <div className="flex items-center gap-2 rounded-lg border border-[#FACC15] bg-[#FEF9C3] px-3 py-2 text-xs font-medium text-[#0F294A]">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#D61F26]" />
                  <span>{addError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#0F294A]">Símbolo *</label>
                  <select
                    value={addForm.symbol}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        symbol: e.target.value as FlowchartSymbol,
                        isDecision: e.target.value === 'diamond',
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {SYMBOLS.map((sym) => (
                      <option key={sym} value={sym}>
                        {SYMBOL_LABELS[sym]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                    Insertar después de
                  </label>
                  <select
                    value={addForm.insertAfterId}
                    onChange={(e) => setAddForm({ ...addForm, insertAfterId: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {state.proceso.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.actividad}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                  Nombre de la actividad o decisión *
                </label>
                <input
                  type="text"
                  value={addForm.actividad}
                  onChange={(e) => setAddForm({ ...addForm, actividad: e.target.value })}
                  placeholder="Ej. Validar disponibilidad logística"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                  Descripción *
                </label>
                <textarea
                  rows={2}
                  value={addForm.descripcion}
                  onChange={(e) => setAddForm({ ...addForm, descripcion: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                    Responsable *
                  </label>
                  <input
                    type="text"
                    value={addForm.responsable}
                    onChange={(e) => setAddForm({ ...addForm, responsable: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                    Documento generado
                  </label>
                  <input
                    type="text"
                    value={addForm.registroDocumento}
                    onChange={(e) =>
                      setAddForm({ ...addForm, registroDocumento: e.target.value })
                    }
                    placeholder="Ej. Formato de validación"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#0F294A]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B3161C]"
                >
                  Agregar y sincronizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Eliminar nodo del flujograma"
        description={`¿Deseas eliminar "${stepToDelete?.actividad ?? ''}"? También se eliminará de la Matriz Detallada de Bienestar.`}
        onConfirm={() => {
          if (deleteId) {
            deleteProcessStep(deleteId);
            if (selectedId === deleteId) setSelectedId(state.proceso[0]?.id ?? null);
          }
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
