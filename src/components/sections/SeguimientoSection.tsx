import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Camera,
  X,
  Image as ImageIcon,
  Search,
  AlertCircle,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { EvidenciaFotografica, RegistroSeguimiento } from '../../types/bienestar';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ChipSvg } from '../ui/ChipGraphics';

const emptyRegistro: Omit<RegistroSeguimiento, 'id'> = {
  nombreActividad: '',
  fecha: '',
  convocados: 48,
  participantes: 0,
  nivelSatisfaccion: 4.5,
  cumplimientoCronograma: 100,
  presupuestoPlaneado: 0,
  presupuestoEjecutado: 0,
  registroAsistencia: '',
  encuestaSatisfaccion: '',
  informeResultados: '',
  evidenciasFotograficas: [],
};

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function SeguimientoSection() {
  const { state, addSeguimiento, updateSeguimiento, deleteSeguimiento } = useBienestar();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<RegistroSeguimiento, 'id'>>(emptyRegistro);
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Evidencia draft inside form
  const [fotoTitulo, setFotoTitulo] = useState('');
  const [fotoDesc, setFotoDesc] = useState('');
  const [fotoDataUrl, setFotoDataUrl] = useState<string | undefined>(undefined);

  const filtered = state.seguimiento.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.nombreActividad.toLowerCase().includes(q) ||
      r.informeResultados.toLowerCase().includes(q) ||
      r.registroAsistencia.toLowerCase().includes(q)
    );
  });

  // Global KPIs
  const totalRegistros = state.seguimiento.length;
  const totalParticipantes = state.seguimiento.reduce((s, r) => s + r.participantes, 0);
  const totalConvocados = state.seguimiento.reduce((s, r) => s + r.convocados, 0);
  const pctParticipacionGlobal =
    totalConvocados > 0 ? Math.round((totalParticipantes / totalConvocados) * 100) : 0;

  const avgSatisfaccion =
    totalRegistros > 0
      ? state.seguimiento.reduce((s, r) => s + r.nivelSatisfaccion, 0) / totalRegistros
      : 0;
  const pctSatisfaccionGlobal = Math.round((avgSatisfaccion / 5) * 100);

  const avgCronograma =
    totalRegistros > 0
      ? Math.round(
          state.seguimiento.reduce((s, r) => s + r.cumplimientoCronograma, 0) / totalRegistros
        )
      : 0;

  const totalPresupPlaneado = state.seguimiento.reduce((s, r) => s + r.presupuestoPlaneado, 0);
  const totalPresupEjecutado = state.seguimiento.reduce((s, r) => s + r.presupuestoEjecutado, 0);
  const pctPresupuestoGlobal =
    totalPresupPlaneado > 0 ? Math.round((totalPresupEjecutado / totalPresupPlaneado) * 100) : 0;

  const openNew = () => {
    setEditingId(null);
    setFormData(emptyRegistro);
    setFormError('');
    setFotoTitulo('');
    setFotoDesc('');
    setFotoDataUrl(undefined);
    setFormOpen(true);
  };

  const openEdit = (reg: RegistroSeguimiento) => {
    setEditingId(reg.id);
    const { id: _id, ...rest } = reg;
    setFormData(rest);
    setFormError('');
    setFotoTitulo('');
    setFotoDesc('');
    setFotoDataUrl(undefined);
    setFormOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFotoDataUrl(reader.result);
        if (!fotoTitulo) setFotoTitulo(file.name.replace(/\.[^.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const addEvidenciaToForm = () => {
    if (!fotoTitulo.trim()) return;
    const nueva: EvidenciaFotografica = {
      id: `ev-${Date.now()}`,
      titulo: fotoTitulo.trim(),
      fecha: formData.fecha || new Date().toISOString().slice(0, 10),
      descripcion: fotoDesc.trim() || 'Registro fotográfico de actividad de bienestar.',
      dataUrl: fotoDataUrl,
    };
    setFormData((prev) => ({
      ...prev,
      evidenciasFotograficas: [...prev.evidenciasFotograficas, nueva],
    }));
    setFotoTitulo('');
    setFotoDesc('');
    setFotoDataUrl(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombreActividad.trim() || !formData.fecha) {
      setFormError('El nombre de la actividad y la fecha son obligatorios.');
      return;
    }
    if (editingId) {
      updateSeguimiento({ id: editingId, ...formData });
    } else {
      addSeguimiento(formData);
    }
    setFormOpen(false);
    setEditingId(null);
  };

  const targetToDelete = state.seguimiento.find((r) => r.id === deleteId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-[#0F294A]/20 bg-[#EFF6FF] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-[#0F294A]">
              Seguimiento, Indicadores y Resultados · Frikaz S.A.S.
            </h1>
            <ChipSvg variant="redonda" className="hidden sm:block h-5 w-5 shrink-0" />
          </div>
          <p className="text-sm text-[#0F294A]/80">
            Registra asistencia, encuestas de satisfacción, evidencias fotográficas, cumplimiento de
            cronograma y ejecución presupuestal.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#B3161C] hover:-translate-y-0.5 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4 text-[#FACC15]" />
          Registrar seguimiento
        </button>
      </div>

      {/* Tarjetas de Indicadores Clave */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-[#0F294A]/70">Porcentaje de Participación</p>
          <p className="mt-2 text-2xl font-extrabold text-[#0F294A] tabular-nums">
            {pctParticipacionGlobal}%
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#D61F26]"
              style={{ width: `${Math.min(100, pctParticipacionGlobal)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 tabular-nums">
            {totalParticipantes} asistentes de {totalConvocados} convocados
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-[#0F294A]/70">Nivel de Satisfacción</p>
          <p className="mt-2 text-2xl font-extrabold text-[#0F294A] tabular-nums">
            {avgSatisfaccion.toFixed(1)} / 5.0
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#0F294A]"
              style={{ width: `${Math.min(100, pctSatisfaccionGlobal)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 tabular-nums">
            Equivalente al {pctSatisfaccionGlobal}% de favorabilidad
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-[#0F294A]/70">Cumplimiento del Cronograma</p>
          <p className="mt-2 text-2xl font-extrabold text-[#0F294A] tabular-nums">{avgCronograma}%</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#FACC15]"
              style={{ width: `${Math.min(100, avgCronograma)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 tabular-nums">
            Promedio en {totalRegistros} actividades evaluadas
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-[#0F294A]/70">Cumplimiento del Presupuesto</p>
          <p className="mt-2 text-2xl font-extrabold text-[#0F294A] tabular-nums">
            {pctPresupuestoGlobal}%
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#163A66]"
              style={{ width: `${Math.min(100, pctPresupuestoGlobal)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 tabular-nums">
            {formatCOP(totalPresupEjecutado)} / {formatCOP(totalPresupPlaneado)}
          </p>
        </div>
      </div>

      {/* Gráfica comparativa por actividad */}
      {state.seguimiento.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0F294A]">
                Comparativo de Indicadores por Actividad
              </h2>
              <p className="text-xs text-slate-500">
                Participación (%) · Satisfacción (%) · Cumplimiento de Cronograma (%)
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#0F294A]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#D61F26]" />
                Participación
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#0F294A]" />
                Satisfacción
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#FACC15] border border-[#D97706]" />
                Cronograma
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            {state.seguimiento.map((reg) => {
              const partPct =
                reg.convocados > 0 ? Math.round((reg.participantes / reg.convocados) * 100) : 0;
              const satPct = Math.round((reg.nivelSatisfaccion / 5) * 100);
              return (
                <div key={reg.id} className="space-y-2 border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-bold text-[#0F294A]">{reg.nombreActividad}</span>
                    <span className="font-mono text-xs text-slate-500 tabular-nums">{reg.fecha}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-slate-600">
                        <span>Participación</span>
                        <span className="font-mono font-semibold text-[#D61F26] tabular-nums">{partPct}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#D61F26]"
                          style={{ width: `${Math.min(100, partPct)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-slate-600">
                        <span>Satisfacción</span>
                        <span className="font-mono font-semibold text-[#0F294A] tabular-nums">
                          {satPct}% ({reg.nivelSatisfaccion.toFixed(1)}/5)
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#0F294A]"
                          style={{ width: `${Math.min(100, satPct)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-slate-600">
                        <span>Cronograma</span>
                        <span className="font-mono font-semibold text-[#0F294A] tabular-nums">
                          {reg.cumplimientoCronograma}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#FACC15]"
                          style={{ width: `${Math.min(100, reg.cumplimientoCronograma)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Formulario para crear / editar seguimiento */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[#FDE047] bg-[#FFFBEB] p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#FDE047] pb-3">
            <h2 className="text-base font-bold text-[#0F294A]">
              {editingId ? 'Editar registro de seguimiento' : 'Nuevo registro de seguimiento y resultados'}
            </h2>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded p-1 text-slate-500 hover:text-[#0F294A]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {formError && (
            <div className="flex items-center gap-2 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-xs text-[#D61F26]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                Nombre de la actividad / programa *
              </label>
              <input
                type="text"
                value={formData.nombreActividad}
                onChange={(e) => setFormData({ ...formData, nombreActividad: e.target.value })}
                list="programas-sugeridos"
                placeholder="Selecciona o escribe la actividad..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
              <datalist id="programas-sugeridos">
                {state.planBienestar.map((p) => (
                  <option key={p.id} value={p.actividad} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#0F294A]">Fecha *</label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                Nivel de satisfacción (1 a 5)
              </label>
              <input
                type="number"
                min={1}
                max={5}
                step={0.1}
                value={formData.nivelSatisfaccion}
                onChange={(e) =>
                  setFormData({ ...formData, nivelSatisfaccion: Number(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                Trabajadores convocados
              </label>
              <input
                type="number"
                min={0}
                value={formData.convocados}
                onChange={(e) =>
                  setFormData({ ...formData, convocados: Number(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                Número de participantes
              </label>
              <input
                type="number"
                min={0}
                value={formData.participantes}
                onChange={(e) =>
                  setFormData({ ...formData, participantes: Number(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                Cumplimiento cronograma (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.cumplimientoCronograma}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cumplimientoCronograma: Number(e.target.value) || 0,
                  })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                  Presup. planeado
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={formData.presupuestoPlaneado}
                  onChange={(e) =>
                    setFormData({ ...formData, presupuestoPlaneado: Number(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-mono text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                  Presup. ejecutado
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={formData.presupuestoEjecutado}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      presupuestoEjecutado: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-mono text-xs"
                />
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                  Registro de asistencia
                </label>
                <textarea
                  rows={2}
                  value={formData.registroAsistencia}
                  onChange={(e) =>
                    setFormData({ ...formData, registroAsistencia: e.target.value })
                  }
                  placeholder="Observaciones y soporte de planilla de asistencia..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                  Encuestas de satisfacción
                </label>
                <textarea
                  rows={2}
                  value={formData.encuestaSatisfaccion}
                  onChange={(e) =>
                    setFormData({ ...formData, encuestaSatisfaccion: e.target.value })
                  }
                  placeholder="Resumen de respuestas y percepción de los colaboradores..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                  Informe de resultados
                </label>
                <textarea
                  rows={2}
                  value={formData.informeResultados}
                  onChange={(e) =>
                    setFormData({ ...formData, informeResultados: e.target.value })
                  }
                  placeholder="Conclusiones, hallazgos y oportunidades de mejora..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Evidencias fotográficas */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <h3 className="text-xs font-bold text-[#0F294A]">Evidencias fotográficas</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 items-end">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-600">
                  Título de la foto
                </label>
                <input
                  type="text"
                  value={fotoTitulo}
                  onChange={(e) => setFotoTitulo(e.target.value)}
                  placeholder="Ej. Taller de integración"
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-600">
                  Descripción breve
                </label>
                <input
                  type="text"
                  value={fotoDesc}
                  onChange={(e) => setFotoDesc(e.target.value)}
                  placeholder="Contexto de la evidencia"
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-600">
                  Archivo de imagen (opcional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full text-xs text-slate-600 file:mr-2 file:rounded-md file:border file:border-slate-200 file:bg-slate-50 file:px-2.5 file:py-1 file:text-xs"
                />
              </div>
              <button
                type="button"
                onClick={addEvidenciaToForm}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#FACC15] bg-[#FEF9C3] px-3 py-1.5 text-xs font-semibold text-[#0F294A] hover:bg-[#FDE047]"
              >
                <Camera className="h-3.5 w-3.5 text-[#D61F26]" />
                Adjuntar evidencia
              </button>
            </div>

            {formData.evidenciasFotograficas.length > 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 pt-2">
                {formData.evidenciasFotograficas.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {ev.dataUrl ? (
                        <img
                          src={ev.dataUrl}
                          alt={ev.titulo}
                          className="h-8 w-8 rounded object-cover shrink-0"
                        />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate font-medium text-[#0F294A]">{ev.titulo}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          evidenciasFotograficas: prev.evidenciasFotograficas.filter(
                            (x) => x.id !== ev.id
                          ),
                        }))
                      }
                      className="rounded p-1 text-slate-400 hover:text-[#D61F26]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0F294A]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B3161C]"
            >
              {editingId ? 'Guardar cambios' : 'Guardar seguimiento'}
            </button>
          </div>
        </form>
      )}

      {/* Búsqueda de registros */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar registro de seguimiento o informe..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-[#0F294A] focus:border-[#0F294A] focus:outline-none"
        />
      </div>

      {/* Lista de registros de seguimiento y resultados */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No se encontraron registros de seguimiento.
          </div>
        ) : (
          filtered.map((reg) => {
            const pctPart =
              reg.convocados > 0 ? Math.round((reg.participantes / reg.convocados) * 100) : 0;
            const pctPres =
              reg.presupuestoPlaneado > 0
                ? Math.round((reg.presupuestoEjecutado / reg.presupuestoPlaneado) * 100)
                : 0;

            return (
              <article
                key={reg.id}
                className="rounded-xl border border-slate-200 bg-white p-6 space-y-5"
              >
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-[#D61F26] tabular-nums">{reg.fecha}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {reg.participantes}/{reg.convocados} participantes ({pctPart}%)
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        Satisfacción {reg.nivelSatisfaccion.toFixed(1)}/5.0
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-bold text-[#0F294A]">
                      {reg.nombreActividad}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(reg)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#0F294A] hover:bg-[#FEF9C3]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(reg.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#0F294A] hover:bg-[#FEE2E2] hover:text-[#D61F26]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-sm">
                  <div className="rounded-lg border border-slate-100 bg-[#F8FAFC] p-4">
                    <p className="text-xs font-bold text-[#0F294A]">Registro de asistencia</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {reg.registroAsistencia || 'Sin observaciones registradas.'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#FCA5A5]/40 bg-[#FEF2F2]/60 p-4">
                    <p className="text-xs font-bold text-[#D61F26]">
                      Encuestas de satisfacción
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                      {reg.encuestaSatisfaccion || 'Sin resumen de encuestas.'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#FDE047]/60 bg-[#FFFBEB] p-4">
                    <p className="text-xs font-bold text-[#0F294A]">
                      Informe y ejecución presupuestal
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                      {reg.informeResultados || 'Sin informe adjunto.'}
                    </p>
                    <p className="mt-2 font-mono text-[11px] font-semibold text-[#0F294A]/75 tabular-nums">
                      Presupuesto: {formatCOP(reg.presupuestoEjecutado)} /{' '}
                      {formatCOP(reg.presupuestoPlaneado)} ({pctPres}%)
                    </p>
                  </div>
                </div>

                {reg.evidenciasFotograficas.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[#0F294A]">
                      Evidencias fotográficas ({reg.evidenciasFotograficas.length})
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {reg.evidenciasFotograficas.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3"
                        >
                          {ev.dataUrl ? (
                            <img
                              src={ev.dataUrl}
                              alt={ev.titulo}
                              className="h-14 w-14 rounded-md object-cover shrink-0 border border-slate-100"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-[#FACC15] bg-[#FEF9C3] text-[#0F294A]">
                              <Camera className="h-5 w-5 text-[#D61F26]" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-[#0F294A]">
                              {ev.titulo}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                              {ev.fecha}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-600">
                              {ev.descripcion}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Eliminar registro de seguimiento"
        description={`¿Deseas eliminar el seguimiento de "${targetToDelete?.nombreActividad ?? ''}"?`}
        onConfirm={() => {
          if (deleteId) deleteSeguimiento(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
