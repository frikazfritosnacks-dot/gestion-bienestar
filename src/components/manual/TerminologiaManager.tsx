import { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  ArrowUpDown,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { TerminoItem } from '../../types/bienestar';
import { ConfirmModal } from '../ui/ConfirmModal';

type SortMode = 'original' | 'az' | 'za';

export function TerminologiaManager() {
  const { state, addTermino, updateTermino, deleteTermino } = useBienestar();
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('original');
  const [showAdd, setShowAdd] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newDef, setNewDef] = useState('');
  const [formError, setFormError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<TerminoItem | null>(null);
  const [editError, setEditError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const displayedTerms = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = state.terminologia.filter(
      (t) =>
        !q ||
        t.termino.toLowerCase().includes(q) ||
        t.definicion.toLowerCase().includes(q)
    );
    if (sortMode === 'az') {
      return [...filtered].sort((a, b) => a.termino.localeCompare(b.termino, 'es'));
    }
    if (sortMode === 'za') {
      return [...filtered].sort((a, b) => b.termino.localeCompare(a.termino, 'es'));
    }
    return filtered;
  }, [state.terminologia, search, sortMode]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || !newDef.trim()) {
      setFormError('Debes diligenciar tanto el nombre del término como su definición.');
      return;
    }
    addTermino({ termino: newTerm.trim(), definicion: newDef.trim() });
    setNewTerm('');
    setNewDef('');
    setFormError('');
    setShowAdd(false);
  };

  const handleSaveEdit = () => {
    if (!editItem) return;
    if (!editItem.termino.trim() || !editItem.definicion.trim()) {
      setEditError('El nombre del término y la definición son obligatorios.');
      return;
    }
    updateTermino({
      ...editItem,
      termino: editItem.termino.trim(),
      definicion: editItem.definicion.trim(),
    });
    setEditingId(null);
    setEditItem(null);
    setEditError('');
  };

  const targetToDelete = state.terminologia.find((t) => t.id === deleteId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0F294A]">
            Terminología y Diccionario de Bienestar
          </h2>
          <p className="text-sm text-slate-600">
            Diccionario conceptual editable sin límite de registros ·{' '}
            <span className="font-mono font-semibold text-[#D61F26] tabular-nums">
              {state.terminologia.length}
            </span>{' '}
            términos disponibles
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAdd((v) => !v);
            setFormError('');
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#B3161C] hover:-translate-y-0.5 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4 text-[#FACC15]" />
          {showAdd ? 'Cerrar formulario' : 'Agregar término'}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="rounded-xl border border-[#FDE047] bg-[#FFFBEB] p-5 space-y-4"
        >
          <h3 className="text-sm font-bold text-[#0F294A]">Nuevo concepto del diccionario</h3>

          {formError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-xs text-[#D61F26]"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs font-semibold text-[#0F294A]">
                Nombre del término *
              </label>
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Ej. Clima organizacional"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0F294A] focus:border-[#0F294A] focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[#0F294A]">
                Definición *
              </label>
              <textarea
                rows={2}
                value={newDef}
                onChange={(e) => setNewDef(e.target.value)}
                placeholder="Escribe la definición aplicada al bienestar social laboral..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0F294A] focus:border-[#0F294A] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0F294A] hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B3161C] whitespace-nowrap shrink-0"
            >
              Guardar término
            </button>
          </div>
        </form>
      )}

      {/* Búsqueda y ordenamiento */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar concepto o definición..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-[#0F294A] focus:border-[#0F294A] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-1">
          <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-[#0F294A]/70" />
          <button
            type="button"
            onClick={() => setSortMode('original')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              sortMode === 'original'
                ? 'bg-[#0F294A] text-white shadow-2xs'
                : 'text-[#0F294A] hover:bg-[#FEF9C3]'
            }`}
          >
            Orden del manual
          </button>
          <button
            type="button"
            onClick={() => setSortMode('az')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              sortMode === 'az'
                ? 'bg-[#D61F26] text-white border-b border-[#FACC15] shadow-2xs'
                : 'text-[#0F294A] hover:bg-[#FEF9C3]'
            }`}
          >
            Alfabético A–Z
          </button>
          <button
            type="button"
            onClick={() => setSortMode('za')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              sortMode === 'za'
                ? 'bg-[#D61F26] text-white border-b border-[#FACC15] shadow-2xs'
                : 'text-[#0F294A] hover:bg-[#FEF9C3]'
            }`}
          >
            Alfabético Z–A
          </button>
        </div>
      </div>

      {editError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-[#FACC15] bg-[#FEF9C3] px-4 py-2.5 text-xs font-medium text-[#0F294A]"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-[#D61F26]" />
          <span>{editError}</span>
        </div>
      )}

      {/* Lista / tabla del diccionario */}
      {displayedTerms.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No se encontraron términos que coincidan con "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {displayedTerms.map((item, idx) => {
            const isEditing = editingId === item.id && editItem;
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-[#FACC15]"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editItem.termino}
                      onChange={(e) => setEditItem({ ...editItem, termino: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-[#0F294A]"
                    />
                    <textarea
                      rows={3}
                      value={editItem.definicion}
                      onChange={(e) => setEditItem({ ...editItem, definicion: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditItem(null);
                          setEditError('');
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#0F294A] hover:bg-slate-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="inline-flex items-center gap-1 rounded-md bg-[#D61F26] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#B3161C]"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-xs font-semibold text-[#D61F26] tabular-nums">
                            {String(idx + 1).padStart(2, '0')}.
                          </span>
                          <h3 className="text-base font-bold text-[#0F294A]">
                            {item.termino}
                          </h3>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600">{item.definicion}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditItem({ ...item });
                            setEditError('');
                          }}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-[#FEF9C3] hover:text-[#0F294A]"
                          title="Editar término"
                          aria-label={`Editar ${item.termino}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(item.id)}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-[#FEE2E2] hover:text-[#D61F26]"
                          title="Eliminar término"
                          aria-label={`Eliminar ${item.termino}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Eliminar término del diccionario"
        description={`¿Estás seguro de eliminar el concepto "${targetToDelete?.termino ?? ''}" de la terminología?`}
        onConfirm={() => {
          if (deleteId) deleteTermino(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
