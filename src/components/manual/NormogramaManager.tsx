import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { JerarquiaNormativa, NormaItem } from '../../types/bienestar';
import { ConfirmModal } from '../ui/ConfirmModal';

const JERARQUIAS: JerarquiaNormativa[] = [
  'Constitución',
  'Ley',
  'Decreto',
  'Resolución',
  'Artículo',
  'Otra disposición',
];

const emptyForm = {
  jerarquia: 'Ley' as string,
  nombre: '',
  afectacion: '',
  queDebeHacer: '',
};

export function NormogramaManager() {
  const { state, addNorma, updateNorma, deleteNorma } = useBienestar();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('Todas');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newForm, setNewForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<NormaItem | null>(null);
  const [editError, setEditError] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const availableTypes = Array.from(
    new Set([...JERARQUIAS, ...state.normograma.map((n) => n.jerarquia)])
  );

  const filteredNormas = state.normograma.filter((n) => {
    const matchesType = filterType === 'Todas' || n.jerarquia === filterType;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      n.nombre.toLowerCase().includes(q) ||
      n.jerarquia.toLowerCase().includes(q) ||
      n.afectacion.toLowerCase().includes(q) ||
      n.queDebeHacer.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newForm.jerarquia.trim() ||
      !newForm.nombre.trim() ||
      !newForm.afectacion.trim() ||
      !newForm.queDebeHacer.trim()
    ) {
      setFormError(
        'Todos los cuatro criterios son obligatorios: Jerarquía normativa, Nombre de la norma, Afectación al proceso y Qué debe hacer la empresa.'
      );
      return;
    }
    addNorma({
      jerarquia: newForm.jerarquia.trim(),
      nombre: newForm.nombre.trim(),
      afectacion: newForm.afectacion.trim(),
      queDebeHacer: newForm.queDebeHacer.trim(),
    });
    setNewForm(emptyForm);
    setFormError('');
    setShowAddForm(false);
  };

  const startEdit = (norma: NormaItem) => {
    setEditingId(norma.id);
    setEditForm({ ...norma });
    setEditError('');
  };

  const saveEdit = () => {
    if (!editForm) return;
    if (
      !editForm.jerarquia.trim() ||
      !editForm.nombre.trim() ||
      !editForm.afectacion.trim() ||
      !editForm.queDebeHacer.trim()
    ) {
      setEditError('Ninguno de los 4 criterios de la norma puede quedar vacío.');
      return;
    }
    updateNorma({
      ...editForm,
      jerarquia: editForm.jerarquia.trim(),
      nombre: editForm.nombre.trim(),
      afectacion: editForm.afectacion.trim(),
      queDebeHacer: editForm.queDebeHacer.trim(),
    });
    setEditingId(null);
    setEditForm(null);
    setEditError('');
  };

  const targetToDelete = state.normograma.find((n) => n.id === confirmDeleteId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0F294A]">
            Normograma Legal Institucional
          </h2>
          <p className="text-sm text-slate-600">
            Gestión normativa editable sin límite de registros ·{' '}
            <span className="font-mono font-semibold text-[#D61F26] tabular-nums">
              {state.normograma.length}
            </span>{' '}
            disposiciones registradas
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAddForm((v) => !v);
            setFormError('');
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#B3161C] hover:-translate-y-0.5 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4 text-[#FACC15]" />
          {showAddForm ? 'Cerrar formulario' : 'Agregar norma'}
        </button>
      </div>

      {/* Formulario para agregar nueva norma */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-[#FDE047] bg-[#FFFBEB] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F294A]">
              Registrar nueva disposición normativa
            </h3>
            <span className="text-xs font-medium text-[#0F294A]/70">Los 4 campos son obligatorios</span>
          </div>

          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] p-3 text-xs text-[#D61F26]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0F294A]">
                1. Jerarquía normativa *
              </label>
              <select
                value={newForm.jerarquia}
                onChange={(e) => setNewForm({ ...newForm, jerarquia: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0F294A] focus:border-[#0F294A] focus:outline-none"
              >
                {JERARQUIAS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0F294A]">
                2. Nombre de la norma *
              </label>
              <input
                type="text"
                value={newForm.nombre}
                onChange={(e) => setNewForm({ ...newForm, nombre: e.target.value })}
                placeholder="Ej. Ley 2381 de 2024 / Decreto..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0F294A] focus:border-[#0F294A] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0F294A]">
                3. ¿En qué afecta al procedimiento o proceso? *
              </label>
              <textarea
                rows={3}
                value={newForm.afectacion}
                onChange={(e) => setNewForm({ ...newForm, afectacion: e.target.value })}
                placeholder="Describe cómo impacta al proceso de Bienestar Social Laboral..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0F294A] focus:border-[#0F294A] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0F294A]">
                4. ¿Qué debería hacer la empresa? *
              </label>
              <textarea
                rows={3}
                value={newForm.queDebeHacer}
                onChange={(e) => setNewForm({ ...newForm, queDebeHacer: e.target.value })}
                placeholder="Acciones concretas que debe cumplir Frikaz S.A.S..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0F294A] focus:border-[#0F294A] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormError('');
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0F294A] hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B3161C] whitespace-nowrap shrink-0"
            >
              Guardar norma
            </button>
          </div>
        </form>
      )}

      {/* Búsqueda y filtros */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, jerarquía o descripción..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-[#0F294A] focus:border-[#0F294A] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setFilterType('Todas')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              filterType === 'Todas'
                ? 'bg-[#0F294A] text-white shadow-2xs'
                : 'text-[#0F294A] hover:bg-[#FEF9C3]'
            }`}
          >
            Todas ({state.normograma.length})
          </button>
          {availableTypes.map((type) => {
            const count = state.normograma.filter((n) => n.jerarquia === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  filterType === type
                    ? 'bg-[#D61F26] text-white border-b border-[#FACC15] shadow-2xs'
                    : 'text-[#0F294A] hover:bg-[#FEF9C3]'
                }`}
              >
                {type} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Error de edición en línea */}
      {editError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-[#FACC15] bg-[#FEF9C3] px-4 py-2.5 text-xs font-medium text-[#0F294A]"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-[#D61F26]" />
          <span>{editError}</span>
        </div>
      )}

      {/* Tabla del Normograma */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-[#FACC15] bg-[#0F294A] text-xs font-semibold text-white">
                <th className="px-4 py-3 w-36">Jerarquía normativa</th>
                <th className="px-4 py-3 w-56">Nombre de la norma</th>
                <th className="px-4 py-3">¿En qué afecta al procedimiento o proceso?</th>
                <th className="px-4 py-3">¿Qué debería hacer la empresa?</th>
                <th className="px-4 py-3 text-right w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNormas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    No se encontraron normas que coincidan con tu búsqueda.
                  </td>
                </tr>
              ) : (
                filteredNormas.map((norma) => {
                  const isEditing = editingId === norma.id && editForm;
                  return (
                    <tr key={norma.id} className="align-top transition-colors hover:bg-[#FFFBEB]/60">
                      <td className="px-4 py-3.5">
                        {isEditing ? (
                          <select
                            value={editForm.jerarquia}
                            onChange={(e) =>
                              setEditForm({ ...editForm, jerarquia: e.target.value })
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-[#0F294A]"
                          >
                            {availableTypes.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-semibold text-[#D61F26]">{norma.jerarquia}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.nombre}
                            onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-[#0F294A]"
                          />
                        ) : (
                          <span className="font-bold text-[#0F294A]">{norma.nombre}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 leading-relaxed">
                        {isEditing ? (
                          <textarea
                            rows={3}
                            value={editForm.afectacion}
                            onChange={(e) =>
                              setEditForm({ ...editForm, afectacion: e.target.value })
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-[#0F294A]"
                          />
                        ) : (
                          norma.afectacion
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 leading-relaxed">
                        {isEditing ? (
                          <textarea
                            rows={3}
                            value={editForm.queDebeHacer}
                            onChange={(e) =>
                              setEditForm({ ...editForm, queDebeHacer: e.target.value })
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-[#0F294A]"
                          />
                        ) : (
                          norma.queDebeHacer
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {isEditing ? (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="rounded-md bg-[#D61F26] p-1.5 text-white hover:bg-[#B3161C]"
                              title="Guardar cambios"
                              aria-label="Guardar norma"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditForm(null);
                                setEditError('');
                              }}
                              className="rounded-md border border-slate-200 bg-white p-1.5 text-[#0F294A] hover:bg-slate-50"
                              title="Cancelar edición"
                              aria-label="Cancelar edición"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(norma)}
                              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-[#FEF9C3] hover:text-[#0F294A]"
                              title="Editar norma"
                              aria-label={`Editar ${norma.nombre}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(norma.id)}
                              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-[#FEE2E2] hover:text-[#D61F26]"
                              title="Eliminar norma"
                              aria-label={`Eliminar ${norma.nombre}`}
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
        open={Boolean(confirmDeleteId)}
        title="Eliminar norma del normograma"
        description={`¿Deseas eliminar "${targetToDelete?.nombre ?? ''}" del normograma de Frikaz S.A.S.? Esta acción actualizará la tabla documental de forma permanente.`}
        onConfirm={() => {
          if (confirmDeleteId) deleteNorma(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
