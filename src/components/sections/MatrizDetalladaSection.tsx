import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  GitFork,
  AlertCircle,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { FlowchartSymbol, ProcessStep } from '../../types/bienestar';
import { SYMBOL_LABELS, SymbolGraphic } from '../ui/SymbolGraphic';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ChipSvg } from '../ui/ChipGraphics';
import { InstitutionalQualityBox } from '../ui/InstitutionalQualityBox';

interface MatrizDetalladaSectionProps {
  onOpenFlowchart: () => void;
}

const SYMBOLS: FlowchartSymbol[] = ['oval', 'rectangle', 'diamond', 'document', 'cylinder'];

const emptyStepForm = {
  symbol: 'rectangle' as FlowchartSymbol,
  actividad: '',
  descripcion: '',
  responsable: 'Talento Humano',
  registroDocumento: '',
  isDecision: false,
  isAdjustment: false,
};

export function MatrizDetalladaSection({ onOpenFlowchart }: MatrizDetalladaSectionProps) {
  const {
    state,
    updateMatrizMeta,
    addProcessStep,
    updateProcessStep,
    deleteProcessStep,
    moveProcessStep,
  } = useBienestar();

  const [editingMeta, setEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState(state.matrizMeta);
  const metaOriginalRef = useRef(state.matrizMeta);

  useEffect(() => {
    if (!editingMeta) {
      setMetaForm(state.matrizMeta);
    }
  }, [state.matrizMeta, editingMeta]);

  useEffect(() => {
    if (!editingMeta) return;
    if (
      !metaForm.empresa.trim() ||
      !metaForm.responsable.trim() ||
      !metaForm.objetivo.trim()
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      updateMatrizMeta(metaForm, { silent: true });
    }, 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaForm, editingMeta]);

  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStep, setNewStep] = useState(emptyStepForm);
  const [formError, setFormError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStep, setEditStep] = useState<ProcessStep | null>(null);
  const editStepOriginalRef = useRef<ProcessStep | null>(null);
  const [editError, setEditError] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!editingId || !editStep) return;
    if (
      !editStep.actividad.trim() ||
      !editStep.descripcion.trim() ||
      !editStep.responsable.trim() ||
      !editStep.registroDocumento.trim()
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      const isDiamond = editStep.symbol === 'diamond';
      updateProcessStep(
        {
          ...editStep,
          actividad: editStep.actividad.trim(),
          descripcion: editStep.descripcion.trim(),
          responsable: editStep.responsable.trim(),
          registroDocumento: editStep.registroDocumento.trim(),
          isDecision: isDiamond,
          yesLabel: isDiamond ? editStep.yesLabel || 'SÍ' : editStep.yesLabel,
          noLabel: isDiamond ? editStep.noLabel || 'NO' : editStep.noLabel,
        },
        { silent: true }
      );
    }, 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editStep, editingId]);

  const filteredSteps = state.proceso.filter((step) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      step.actividad.toLowerCase().includes(q) ||
      step.descripcion.toLowerCase().includes(q) ||
      step.responsable.toLowerCase().includes(q) ||
      step.registroDocumento.toLowerCase().includes(q) ||
      SYMBOL_LABELS[step.symbol].toLowerCase().includes(q)
    );
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newStep.actividad.trim() ||
      !newStep.descripcion.trim() ||
      !newStep.responsable.trim() ||
      !newStep.registroDocumento.trim()
    ) {
      setFormError(
        'Completa todos los campos de la matriz: Símbolo, Actividad, Descripción, Responsable y Registro / Documento.'
      );
      return;
    }

    const isDiamond = newStep.symbol === 'diamond' || newStep.isDecision;
    addProcessStep({
      symbol: isDiamond ? 'diamond' : newStep.symbol,
      actividad: newStep.actividad.trim(),
      descripcion: newStep.descripcion.trim(),
      responsable: newStep.responsable.trim(),
      registroDocumento: newStep.registroDocumento.trim(),
      isDecision: isDiamond,
      isAdjustment: newStep.isAdjustment,
      yesLabel: isDiamond ? 'SÍ' : undefined,
      noLabel: isDiamond ? 'NO' : undefined,
    });
    setNewStep(emptyStepForm);
    setFormError('');
    setShowAddForm(false);
  };

  const handleSaveEdit = () => {
    if (!editStep) return;
    if (
      !editStep.actividad.trim() ||
      !editStep.descripcion.trim() ||
      !editStep.responsable.trim() ||
      !editStep.registroDocumento.trim()
    ) {
      setEditError('Todos los campos de la fila son obligatorios.');
      return;
    }
    const isDiamond = editStep.symbol === 'diamond';
    updateProcessStep({
      ...editStep,
      actividad: editStep.actividad.trim(),
      descripcion: editStep.descripcion.trim(),
      responsable: editStep.responsable.trim(),
      registroDocumento: editStep.registroDocumento.trim(),
      isDecision: isDiamond,
      yesLabel: isDiamond ? editStep.yesLabel || 'SÍ' : editStep.yesLabel,
      noLabel: isDiamond ? editStep.noLabel || 'NO' : editStep.noLabel,
    });
    setEditingId(null);
    setEditStep(null);
    setEditError('');
  };

  const stepToDelete = state.proceso.find((s) => s.id === deleteId);

  return (
    <div className="space-y-6">
      {/* Encabezado de identificación de la matriz */}
      <section data-module-surface="true" className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-col gap-3 border-b-2 border-[#FACC15] bg-[#FFFBEB] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-[#0F294A]">
                Matriz Detallada de Bienestar · {state.matrizMeta.empresa}
              </h1>
              <ChipSvg variant="lisa" className="hidden sm:block h-5 w-5 shrink-0" />
            </div>
            <p className="text-xs text-[#0F294A]/80">
              Código <span className="font-mono font-bold text-[#D61F26]">{state.matrizMeta.codigo}</span> ·
              Versión <span className="font-mono font-semibold">{state.matrizMeta.version}</span> ·
              Fecha <span className="font-mono font-semibold">{state.matrizMeta.fecha}</span> ·
              Responsable: {state.matrizMeta.responsable}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              data-piggy-section-nav="true"
              data-piggy-target="true"
              onClick={onOpenFlowchart}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#FACC15] bg-[#FEF9C3] px-3.5 py-2 text-xs font-semibold text-[#0F294A] transition-all duration-150 hover:bg-[#FDE047] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <GitFork className="h-3.5 w-3.5 text-[#D61F26]" />
              Ver en Flujograma
            </button>
            <button
              type="button"
              onClick={() => {
                if (!editingMeta) {
                  metaOriginalRef.current = state.matrizMeta;
                  setMetaForm(state.matrizMeta);
                  setEditingMeta(true);
                } else {
                  setEditingMeta(false);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0F294A]/20 bg-white px-3.5 py-2 text-xs font-semibold text-[#0F294A] transition-colors hover:border-[#D61F26] hover:text-[#D61F26] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              {editingMeta ? 'Cerrar encabezado' : 'Editar identificación'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {editingMeta ? (
            <form
              data-submodule-surface="true"
              data-piggy-priority="form"
              data-piggy-context="matriz:edit-meta"
              onSubmit={(e) => {
                e.preventDefault();
                updateMatrizMeta(metaForm);
                setEditingMeta(false);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#0F294A]">Empresa</label>
                  <input
                    type="text"
                    required
                    value={metaForm.empresa}
                    onChange={(e) => setMetaForm({ ...metaForm, empresa: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#0F294A]">Código</label>
                  <input
                    type="text"
                    value={metaForm.codigo}
                    onChange={(e) => setMetaForm({ ...metaForm, codigo: e.target.value })}
                    placeholder="Pendiente de asignación"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#0F294A]">Versión</label>
                  <input
                    type="text"
                    value={metaForm.version}
                    onChange={(e) => setMetaForm({ ...metaForm, version: e.target.value })}
                    placeholder="Pendiente de asignación"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#0F294A]">Fecha</label>
                  <input
                    type="text"
                    value={metaForm.fecha}
                    onChange={(e) => setMetaForm({ ...metaForm, fecha: e.target.value })}
                    placeholder="Pendiente de asignación"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                    Responsable
                  </label>
                  <input
                    type="text"
                    required
                    value={metaForm.responsable}
                    onChange={(e) => setMetaForm({ ...metaForm, responsable: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                  Objetivo de la matriz
                </label>
                <textarea
                  rows={2}
                  required
                  value={metaForm.objetivo}
                  onChange={(e) => setMetaForm({ ...metaForm, objetivo: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateMatrizMeta(metaOriginalRef.current, { silent: true });
                    setMetaForm(metaOriginalRef.current);
                    setEditingMeta(false);
                  }}
                  className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-[#0F294A]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#B3161C]"
                >
                  Guardar identificación
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <InstitutionalQualityBox
                empresa={state.matrizMeta.empresa}
                tituloDocumento="MATRIZ DETALLADA DEL PROCEDIMIENTO DE BIENESTAR SOCIAL LABORAL"
                codigo={state.matrizMeta.codigo}
                version={state.matrizMeta.version}
                fecha={state.matrizMeta.fecha}
              />
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#D61F26]">
                  Objetivo de la matriz
                </p>
                <p className="text-sm leading-relaxed text-slate-700">{state.matrizMeta.objetivo}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Barra de búsqueda y botón Agregar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar actividad, responsable o documento..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-[#0F294A] focus:border-[#0F294A] focus:outline-none"
          />
        </div>

        <button
          type="button"
          data-piggy-submodule="true"
          onClick={() => {
            setShowAddForm((v) => !v);
            setFormError('');
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#B3161C] hover:-translate-y-0.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4 text-[#FACC15]" />
          {showAddForm ? 'Cerrar formulario' : 'Agregar actividad'}
        </button>
      </div>

      {/* Formulario nueva fila de matriz */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          data-submodule-surface="true"
          data-piggy-priority="form"
          className="mt-14 rounded-xl border border-[#FDE047] bg-[#FFFBEB] p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#0F294A]">
              Nueva actividad en la Matriz Detallada (sincronizada con Flujograma)
            </h2>
            <span className="text-xs font-medium text-[#0F294A]/70">Todos los campos son obligatorios</span>
          </div>

          {formError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-xs text-[#D61F26]"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0F294A]">1. Símbolo *</label>
              <select
                value={newStep.symbol}
                onChange={(e) =>
                  setNewStep({
                    ...newStep,
                    symbol: e.target.value as FlowchartSymbol,
                    isDecision: e.target.value === 'diamond',
                  })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0F294A]"
              >
                {SYMBOLS.map((sym) => (
                  <option key={sym} value={sym}>
                    {SYMBOL_LABELS[sym]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0F294A]">
                2. Actividad *
              </label>
              <input
                type="text"
                value={newStep.actividad}
                onChange={(e) => setNewStep({ ...newStep, actividad: e.target.value })}
                placeholder="Nombre de la actividad o decisión"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0F294A]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0F294A]">
                4. Responsable *
              </label>
              <input
                type="text"
                value={newStep.responsable}
                onChange={(e) => setNewStep({ ...newStep, responsable: e.target.value })}
                placeholder="Ej. Talento Humano / Gerencia"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0F294A]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[#0F294A]">
                3. Descripción de la actividad *
              </label>
              <textarea
                rows={2}
                value={newStep.descripcion}
                onChange={(e) => setNewStep({ ...newStep, descripcion: e.target.value })}
                placeholder="Detalle operativo de la actividad..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0F294A]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0F294A]">
                5. Registro / Documento *
              </label>
              <input
                type="text"
                value={newStep.registroDocumento}
                onChange={(e) => setNewStep({ ...newStep, registroDocumento: e.target.value })}
                placeholder="Ej. Acta de revisión / N/A"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0F294A]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0F294A] hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B3161C]"
            >
              Guardar actividad
            </button>
          </div>
        </form>
      )}

      {editError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-[#FACC15] bg-[#FEF9C3] px-4 py-2.5 text-xs font-medium text-[#0F294A]"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-[#D61F26]" />
          <span>{editError}</span>
        </div>
      )}

      {/* Tabla editable de la Matriz Detallada */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-[#FACC15] bg-[#0F294A] text-xs font-semibold text-white">
                <th className="px-3 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3 w-36">Símbolo</th>
                <th className="px-4 py-3 w-52">Actividad</th>
                <th className="px-4 py-3">Descripción de la actividad</th>
                <th className="px-4 py-3 w-40">Responsable</th>
                <th className="px-4 py-3 w-44">Registro / Documento</th>
                <th className="px-4 py-3 w-36 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSteps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No hay actividades que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredSteps.map((step) => {
                  const realIndex = state.proceso.findIndex((p) => p.id === step.id);
                  const isEditing = editingId === step.id && editStep;
                  return (
                    <tr key={step.id} className="align-top transition-colors hover:bg-[#FFFBEB]/60">
                      <td className="px-3 py-3.5 text-center font-mono text-xs font-semibold text-[#D61F26] tabular-nums">
                        {realIndex + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        {isEditing ? (
                          <select
                            value={editStep.symbol}
                            onChange={(e) =>
                              setEditStep({
                                ...editStep,
                                symbol: e.target.value as FlowchartSymbol,
                              })
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
                          >
                            {SYMBOLS.map((sym) => (
                              <option key={sym} value={sym}>
                                {SYMBOL_LABELS[sym]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex flex-col items-start gap-1">
                            <SymbolGraphic symbol={step.symbol} size="sm" />
                            <span className="text-[11px] text-slate-500">
                              {SYMBOL_LABELS[step.symbol].split(' ')[0]}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editStep.actividad}
                            onChange={(e) =>
                              setEditStep({ ...editStep, actividad: e.target.value })
                            }
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium"
                          />
                        ) : (
                          <span className="font-bold text-[#0F294A]">{step.actividad}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 leading-relaxed">
                        {isEditing ? (
                          <textarea
                            rows={6}
                            value={editStep.descripcion}
                            onChange={(e) =>
                              setEditStep({ ...editStep, descripcion: e.target.value })
                            }
                            className="w-full min-w-[280px] rounded-md border border-slate-300 px-2.5 py-2 text-xs leading-relaxed"
                          />
                        ) : (
                          step.descripcion
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[#0F294A]">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editStep.responsable}
                            onChange={(e) =>
                              setEditStep({ ...editStep, responsable: e.target.value })
                            }
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                          />
                        ) : (
                          step.responsable
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[#0F294A]">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editStep.registroDocumento}
                            onChange={(e) =>
                              setEditStep({ ...editStep, registroDocumento: e.target.value })
                            }
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                          />
                        ) : (
                          <span className="font-semibold text-[#163A66]">{step.registroDocumento}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="rounded-md bg-[#D61F26] p-1.5 text-white hover:bg-[#B3161C]"
                              title="Guardar"
                              aria-label="Guardar cambios"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (editStepOriginalRef.current) {
                                  updateProcessStep(editStepOriginalRef.current, { silent: true });
                                }
                                setEditingId(null);
                                setEditStep(null);
                                setEditError('');
                              }}
                              className="rounded-md border border-slate-200 bg-white p-1.5 text-[#0F294A] hover:bg-slate-50"
                              title="Cancelar"
                              aria-label="Cancelar edición"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-0.5">
                            {!search && (
                              <>
                                <button
                                  type="button"
                                  disabled={realIndex === 0}
                                  onClick={() => moveProcessStep(step.id, 'up')}
                                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#0F294A] disabled:opacity-30"
                                  title="Subir fila"
                                  aria-label={`Subir ${step.actividad}`}
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={realIndex === state.proceso.length - 1}
                                  onClick={() => moveProcessStep(step.id, 'down')}
                                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#0F294A] disabled:opacity-30"
                                  title="Bajar fila"
                                  aria-label={`Bajar ${step.actividad}`}
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                editStepOriginalRef.current = { ...step };
                                setEditingId(step.id);
                                setEditStep({ ...step });
                                setEditError('');
                              }}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-[#FEF9C3] hover:text-[#0F294A]"
                              title="Editar"
                              aria-label={`Editar ${step.actividad}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(step.id)}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-[#FEE2E2] hover:text-[#D61F26]"
                              title="Eliminar"
                              aria-label={`Eliminar ${step.actividad}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Eliminar actividad de la matriz"
        description={`¿Deseas eliminar "${stepToDelete?.actividad ?? ''}"? También se actualizará automáticamente el Flujograma del procedimiento.`}
        onConfirm={() => {
          if (deleteId) deleteProcessStep(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
