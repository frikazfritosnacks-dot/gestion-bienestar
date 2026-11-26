import { useState } from 'react';
import {
  Building2,
  CalendarCheck,
  Check,
  Handshake,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { ConvenioItem } from '../../types/bienestar';
import { ConfirmModal } from '../ui/ConfirmModal';

const EMPTY_CONVENIO: Omit<ConvenioItem, 'id'> = {
  nombreConvenio: '',
  entidad: '',
  datosContacto: '',
  beneficios: '',
  vigencia: '',
  responsable: 'Gestión del Talento Humano',
};

export function ConveniosManager() {
  const { state, addConvenio, updateConvenio, deleteConvenio } = useBienestar();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ConvenioItem | null>(null);
  const [form, setForm] = useState<Omit<ConvenioItem, 'id'>>(EMPTY_CONVENIO);
  const [pendingDelete, setPendingDelete] = useState<ConvenioItem | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_CONVENIO);
    setModalOpen(true);
  };

  const openEdit = (item: ConvenioItem) => {
    setEditing(item);
    setForm({
      nombreConvenio: item.nombreConvenio,
      entidad: item.entidad,
      datosContacto: item.datosContacto,
      beneficios: item.beneficios,
      vigencia: item.vigencia,
      responsable: item.responsable,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombreConvenio.trim() || !form.entidad.trim()) return;
    if (editing) {
      updateConvenio({ ...form, id: editing.id });
    } else {
      addConvenio(form);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <section data-submodule-surface="true" className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-extrabold text-[#0F294A]">
            Convenios y Alianzas Institucionales
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Registro centralizado de convenios vigentes en recreación, salud, educación y
            alimentación para colaboradores de Frikaz S.A.S.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#B3161C] cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4 text-[#FACC15]" />
          Registrar convenio
        </button>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {state.convenios.map((conv) => (
          <article
            key={conv.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-sm space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#FACC15] bg-[#FFFBEB] text-[#D61F26]">
                    <Handshake className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-extrabold text-[#0F294A]">
                      {conv.nombreConvenio}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-[#D61F26]">
                      <Building2 className="h-3.5 w-3.5" />
                      {conv.entidad}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(conv)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-[#FEF9C3] hover:text-[#0F294A]"
                    aria-label={`Editar ${conv.nombreConvenio}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(conv)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-[#FEE2E2] hover:text-[#D61F26] cursor-pointer"
                    aria-label={`Eliminar ${conv.nombreConvenio}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-sm text-slate-700">
                <strong className="text-xs font-bold text-[#0F294A] block mb-1">Beneficios:</strong>
                {conv.beneficios}
              </div>

              <dl className="space-y-2 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0F294A]" />
                  <div>
                    <strong className="text-[#0F294A]">Datos de contacto:</strong>{' '}
                    {conv.datosContacto}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D61F26]" />
                  <div>
                    <strong className="text-[#0F294A]">Vigencia:</strong> {conv.vigencia}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <UserCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D97706]" />
                  <div>
                    <strong className="text-[#0F294A]">Responsable:</strong> {conv.responsable}
                  </div>
                </div>
              </dl>
            </div>
          </article>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F294A]/45 p-4 pt-16 backdrop-blur-[1px]">
          <form
            data-piggy-modal-surface="true"
            data-piggy-context="convenios:modal"
            onSubmit={handleSubmit}
            className="max-h-[calc(100vh-5.5rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-extrabold text-[#0F294A]">
                {editing ? 'Editar convenio' : 'Registrar nuevo convenio'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-[#D61F26]"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Nombre del convenio *
                </label>
                <input
                  type="text"
                  required
                  value={form.nombreConvenio}
                  onChange={(e) => setForm({ ...form, nombreConvenio: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">Entidad *</label>
                <input
                  type="text"
                  required
                  value={form.entidad}
                  onChange={(e) => setForm({ ...form, entidad: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Datos de contacto *
                </label>
                <input
                  type="text"
                  required
                  value={form.datosContacto}
                  onChange={(e) => setForm({ ...form, datosContacto: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">Beneficios *</label>
                <textarea
                  rows={2}
                  required
                  value={form.beneficios}
                  onChange={(e) => setForm({ ...form, beneficios: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#0F294A]">Vigencia *</label>
                  <input
                    type="text"
                    required
                    value={form.vigencia}
                    onChange={(e) => setForm({ ...form, vigencia: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                    Responsable *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.responsable}
                    onChange={(e) => setForm({ ...form, responsable: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-[#0F294A]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-xs font-bold text-white hover:bg-[#B3161C]"
              >
                <Check className="h-4 w-4" />
                Guardar convenio
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="¿Eliminar convenio institucional?"
        description={`Se eliminará "${pendingDelete?.nombreConvenio}" (${pendingDelete?.entidad}) del registro de convenios.`}
        confirmLabel="Sí, eliminar"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            deleteConvenio(pendingDelete.id);
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
}
