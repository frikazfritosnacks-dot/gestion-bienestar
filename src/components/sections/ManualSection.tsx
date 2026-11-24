import { useEffect, useState } from 'react';
import {
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  FileText,
  FileDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { ManualSubSectionId } from '../../types/bienestar';
import { NormogramaManager } from '../manual/NormogramaManager';
import { TerminologiaManager } from '../manual/TerminologiaManager';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ChipSvg } from '../ui/ChipGraphics';
import { buildWordFilename, generateManualWordBlob } from '../../utils/wordManualGenerator';

interface ManualSectionProps {
  activeSubTab: ManualSubSectionId;
  onChangeSubTab: (tab: ManualSubSectionId) => void;
}

const SUB_TABS: Array<{ id: ManualSubSectionId; label: string }> = [
  { id: 'introduccion', label: '1. Introducción' },
  { id: 'objetivos', label: '2. Objetivos' },
  { id: 'justificacion', label: '3. Justificación' },
  { id: 'alcance', label: '4. Alcance' },
  { id: 'normograma', label: '5. Normograma' },
  { id: 'terminologia', label: '6. Terminología' },
];

export function ManualSection({ activeSubTab, onChangeSubTab }: ManualSectionProps) {
  const {
    state,
    updatePortada,
    updateManualField,
    addObjetivoEspecifico,
    updateObjetivoEspecifico,
    deleteObjetivoEspecifico,
    hasPendingWordSync,
    syncWordDocument,
    notify,
  } = useBienestar();

  const [downloadingWord, setDownloadingWord] = useState(false);

  // Encabezado documental del manual (sin subapartado independiente de portada)
  const [editingHeaderMeta, setEditingHeaderMeta] = useState(false);
  const [headerMetaForm, setHeaderMetaForm] = useState(state.manual.portada);

  useEffect(() => {
    setHeaderMetaForm(state.manual.portada);
  }, [state.manual.portada]);

  const handleDownloadWord = async () => {
    if (downloadingWord) return;
    setDownloadingWord(true);
    try {
      if (hasPendingWordSync) {
        syncWordDocument(true);
      }
      const blob = await generateManualWordBlob(state);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = buildWordFilename(state);
      anchor.click();
      URL.revokeObjectURL(url);
      notify('Manual en formato Microsoft Word (.docx) descargado con la información vigente.');
    } catch {
      notify('No fue posible generar el archivo Word. Inténtalo nuevamente.', 'warning');
    } finally {
      setDownloadingWord(false);
    }
  };

  const formattedSyncDate = (() => {
    const raw = state.wordSync?.lastSyncedAt || state.lastUpdated;
    try {
      return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(raw));
    } catch {
      return state.manual.portada.fechaActualizacion;
    }
  })();

  // Edición de secciones de texto (introducción, objetivo general, justificación, alcance)
  const [editingTextTab, setEditingTextTab] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState('');

  // Edición de objetivos específicos
  const [newObjText, setNewObjText] = useState('');
  const [editingObjId, setEditingObjId] = useState<string | null>(null);
  const [editingObjText, setEditingObjText] = useState('');
  const [deleteObjId, setDeleteObjId] = useState<string | null>(null);

  const openTextEditor = (
    field: 'introduccion' | 'objetivoGeneral' | 'justificacion' | 'alcance'
  ) => {
    setTextDraft(state.manual[field]);
    setEditingTextTab(field);
  };

  const saveTextEditor = (
    field: 'introduccion' | 'objetivoGeneral' | 'justificacion' | 'alcance'
  ) => {
    if (!textDraft.trim()) return;
    updateManualField(field, textDraft.trim());
    setEditingTextTab(null);
  };

  const renderEditableProseCard = (
    field: 'introduccion' | 'justificacion' | 'alcance',
    title: string,
    subtitle: string,
    tone: 'red' | 'navy' | 'yellow'
  ) => {
    const isEditing = editingTextTab === field;
    const toneHeader =
      tone === 'red'
        ? 'border-[#FCA5A5] bg-[#FEF2F2] text-[#D61F26]'
        : tone === 'yellow'
          ? 'border-[#FDE047] bg-[#FFFBEB] text-[#0F294A]'
          : 'border-[#0F294A]/15 bg-[#EFF6FF] text-[#0F294A]';

    return (
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div
          className={`flex flex-col gap-3 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between ${toneHeader}`}
        >
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="text-xs opacity-80">{subtitle}</p>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => openTextEditor(field)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0F294A]/20 bg-white px-3.5 py-2 text-xs font-semibold text-[#0F294A] transition-all duration-150 hover:border-[#D61F26] hover:text-[#D61F26] whitespace-nowrap shrink-0"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar contenido
            </button>
          )}
        </div>

        <div className="p-6">
          {isEditing ? (
            <div className="space-y-4">
              <textarea
                rows={8}
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-3.5 text-sm leading-relaxed text-[#0F294A] focus:border-[#0F294A] focus:outline-none"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTextTab(null)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0F294A] hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => saveTextEditor(field)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B3161C] whitespace-nowrap shrink-0"
                >
                  <Check className="h-4 w-4" />
                  Guardar cambios
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl whitespace-pre-line text-base leading-relaxed text-slate-700">
              {state.manual[field]}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Encabezado general de identificación documental del Manual */}
      <section className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-5 sm:p-6">
        {editingHeaderMeta ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updatePortada(headerMetaForm);
              setEditingHeaderMeta(false);
            }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#FCA5A5] pb-3">
              <h2 className="text-sm font-bold text-[#D61F26]">
                Editar identificación documental del Manual
              </h2>
              <button
                type="button"
                onClick={() => {
                  setHeaderMetaForm(state.manual.portada);
                  setEditingHeaderMeta(false);
                }}
                className="rounded p-1 text-[#D61F26]/70 hover:text-[#D61F26]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">Empresa</label>
                <input
                  type="text"
                  required
                  value={headerMetaForm.empresa}
                  onChange={(e) =>
                    setHeaderMetaForm({ ...headerMetaForm, empresa: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                  Nombre del documento
                </label>
                <input
                  type="text"
                  required
                  value={headerMetaForm.nombreDocumento}
                  onChange={(e) =>
                    setHeaderMetaForm({ ...headerMetaForm, nombreDocumento: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                  Área responsable
                </label>
                <input
                  type="text"
                  required
                  value={headerMetaForm.areaResponsable}
                  onChange={(e) =>
                    setHeaderMetaForm({ ...headerMetaForm, areaResponsable: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">Código</label>
                <input
                  type="text"
                  required
                  value={headerMetaForm.codigoDocumental}
                  onChange={(e) =>
                    setHeaderMetaForm({ ...headerMetaForm, codigoDocumental: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">Versión</label>
                <input
                  type="text"
                  required
                  value={headerMetaForm.version}
                  onChange={(e) =>
                    setHeaderMetaForm({ ...headerMetaForm, version: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                  Fecha de actualización
                </label>
                <input
                  type="text"
                  required
                  value={headerMetaForm.fechaActualizacion}
                  onChange={(e) =>
                    setHeaderMetaForm({ ...headerMetaForm, fechaActualizacion: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                  Elaborado por
                </label>
                <input
                  type="text"
                  value={headerMetaForm.elaboradoPor || ''}
                  onChange={(e) =>
                    setHeaderMetaForm({ ...headerMetaForm, elaboradoPor: e.target.value })
                  }
                  placeholder="Cargo o responsable"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                  Revisado por
                </label>
                <input
                  type="text"
                  value={headerMetaForm.revisadoPor || ''}
                  onChange={(e) =>
                    setHeaderMetaForm({ ...headerMetaForm, revisadoPor: e.target.value })
                  }
                  placeholder="Cargo o responsable"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[#0F294A]">
                  Aprobado por
                </label>
                <input
                  type="text"
                  value={headerMetaForm.aprobadoPor || ''}
                  onChange={(e) =>
                    setHeaderMetaForm({ ...headerMetaForm, aprobadoPor: e.target.value })
                  }
                  placeholder="Cargo o responsable de aprobación"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setHeaderMetaForm(state.manual.portada);
                  setEditingHeaderMeta(false);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0F294A]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#B3161C]"
              >
                Guardar encabezado
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#FACC15] bg-[#FEF9C3] text-[#D61F26]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#D61F26]">
                    <span>{state.manual.portada.empresa}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#0F294A]">{state.manual.portada.areaResponsable}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <h1 className="text-lg font-extrabold text-[#0F294A] sm:text-xl">
                      {state.manual.portada.nombreDocumento}
                    </h1>
                    <ChipSvg variant="ondulada" className="hidden sm:block h-6 w-6 shrink-0" />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 font-mono tabular-nums">
                    <span>Código: {state.manual.portada.codigoDocumental}</span>
                    <span aria-hidden="true">·</span>
                    <span>Versión: {state.manual.portada.version}</span>
                    <span aria-hidden="true">·</span>
                    <span>Actualización: {state.manual.portada.fechaActualizacion}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadWord}
                  disabled={downloadingWord}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0F294A] border-b-2 border-[#FACC15] px-4 py-2.5 text-xs font-bold tracking-wide text-white shadow-xs transition-all duration-150 hover:bg-[#D61F26] hover:-translate-y-0.5 disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  <FileDown className="h-4 w-4 text-[#FACC15]" />
                  {downloadingWord ? 'GENERANDO WORD...' : 'DESCARGAR MANUAL EN WORD'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingHeaderMeta(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#FACC15] bg-[#FEF9C3] px-3.5 py-2.5 text-xs font-semibold text-[#0F294A] transition-all duration-150 hover:bg-[#FDE047] whitespace-nowrap shrink-0"
                >
                  <Pencil className="h-3.5 w-3.5 text-[#D61F26]" />
                  Editar caja de calidad
                </button>
              </div>
            </div>

            {/* Caja de calidad y control de versiones / sincronización Word */}
            <div className="grid grid-cols-1 gap-3 border-t border-[#FCA5A5]/60 pt-3.5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200/80 bg-white px-3.5 py-2.5">
                <p className="text-[11px] font-semibold text-slate-500">Elaborado / Revisado / Aprobado</p>
                <p className="mt-0.5 text-xs font-semibold text-[#0F294A] truncate">
                  {state.manual.portada.elaboradoPor || 'Sin registrar'} ·{' '}
                  {state.manual.portada.revisadoPor || 'Sin registrar'} ·{' '}
                  {state.manual.portada.aprobadoPor || 'Sin registrar'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200/80 bg-white px-3.5 py-2.5">
                <p className="text-[11px] font-semibold text-slate-500">Versión del documento</p>
                <p className="mt-0.5 font-mono text-xs font-bold text-[#0F294A] tabular-nums">
                  v{state.manual.portada.version} · {state.normograma.length} normas · {state.terminologia.length} términos
                </p>
              </div>
              <div className="rounded-lg border border-slate-200/80 bg-white px-3.5 py-2.5">
                <p className="text-[11px] font-semibold text-slate-500">Última sincronización Word</p>
                <p className="mt-0.5 text-xs font-semibold text-[#0F294A] tabular-nums">
                  {formattedSyncDate}
                </p>
              </div>
              <div
                className={`flex items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 ${
                  hasPendingWordSync
                    ? 'border-[#FACC15] bg-[#FEF9C3] text-[#0F294A]'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {hasPendingWordSync ? (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-[#D61F26]" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate">
                      {hasPendingWordSync
                        ? 'Cambios pendientes de sincronización'
                        : 'Word sincronizado'}
                    </p>
                    <p className="text-[10px] opacity-80 truncate">
                      {hasPendingWordSync
                        ? 'Se actualizará antes de descargar'
                        : 'Formato APA 7ª ed. vigente'}
                    </p>
                  </div>
                </div>
                {hasPendingWordSync && (
                  <button
                    type="button"
                    onClick={() => syncWordDocument(false)}
                    className="inline-flex items-center gap-1 rounded-md bg-[#D61F26] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#B3161C] whitespace-nowrap shrink-0"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Sincronizar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Navegación interna del Manual: 6 subapartados definitivos */}
      <div className="overflow-x-auto pb-1">
        <div
          className="inline-flex min-w-full items-center gap-1 rounded-xl border border-slate-200 bg-white p-1.5"
          role="tablist"
          aria-label="Apartados del Manual"
        >
          {SUB_TABS.map((tab) => {
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  onChangeSubTab(tab.id);
                  setEditingTextTab(null);
                }}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#D61F26] text-white border-b-2 border-[#FACC15]'
                    : 'text-[#0F294A] hover:bg-[#FEF9C3] hover:text-[#0F294A]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Introducción */}
      {activeSubTab === 'introduccion' &&
        renderEditableProseCard(
          'introduccion',
          'Introducción',
          'Propósito general y lineamientos de participación, integración, reconocimiento y acompañamiento',
          'navy'
        )}

      {/* 2. Objetivos (Objetivo general + Objetivos específicos unificados) */}
      {activeSubTab === 'objetivos' && (
        <div className="space-y-6">
          {/* Bloque A: Objetivo general */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[#FCA5A5] bg-[#FEF2F2] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#D61F26]">Objetivo general</h2>
                <p className="text-xs text-[#0F294A]/75">
                  Propósito rector de los programas de bienestar social laboral en Frikaz S.A.S.
                </p>
              </div>
              {editingTextTab !== 'objetivoGeneral' && (
                <button
                  type="button"
                  onClick={() => openTextEditor('objetivoGeneral')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#0F294A]/20 bg-white px-3.5 py-2 text-xs font-semibold text-[#0F294A] transition-colors hover:border-[#D61F26] hover:text-[#D61F26] whitespace-nowrap shrink-0"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar objetivo general
                </button>
              )}
            </div>

            <div className="p-6">
              {editingTextTab === 'objetivoGeneral' ? (
                <div className="space-y-4">
                  <textarea
                    rows={5}
                    value={textDraft}
                    onChange={(e) => setTextDraft(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-3.5 text-sm leading-relaxed text-[#0F294A] focus:border-[#0F294A] focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingTextTab(null)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0F294A] hover:bg-slate-50 whitespace-nowrap shrink-0"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => saveTextEditor('objetivoGeneral')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B3161C] whitespace-nowrap shrink-0"
                    >
                      <Check className="h-4 w-4" />
                      Guardar objetivo general
                    </button>
                  </div>
                </div>
              ) : (
                <p className="max-w-4xl whitespace-pre-line text-base leading-relaxed text-slate-700">
                  {state.manual.objetivoGeneral}
                </p>
              )}
            </div>
          </section>

          {/* Bloque B: Objetivos específicos */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-[#0F294A]/15 bg-[#EFF6FF] px-6 py-4">
              <h2 className="text-lg font-bold text-[#0F294A]">Objetivos específicos</h2>
              <p className="text-xs text-[#0F294A]/75">
                Agrega, modifica o elimina objetivos específicos del procedimiento de bienestar
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                {state.manual.objetivosEspecificos.map((obj, idx) => {
                  const isEditing = editingObjId === obj.id;
                  return (
                    <div
                      key={obj.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      {isEditing ? (
                        <div className="flex-1 space-y-3">
                          <textarea
                            rows={2}
                            value={editingObjText}
                            onChange={(e) => setEditingObjText(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0F294A]"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingObjId(null)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#0F294A]"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (editingObjText.trim()) {
                                  updateObjetivoEspecifico(obj.id, editingObjText.trim());
                                  setEditingObjId(null);
                                }
                              }}
                              className="rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 font-mono text-sm font-bold text-[#D61F26] tabular-nums">
                              {idx + 1}.
                            </span>
                            <p className="text-sm leading-relaxed text-slate-700">{obj.texto}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingObjId(obj.id);
                                setEditingObjText(obj.texto);
                              }}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-[#FEF9C3] hover:text-[#0F294A]"
                              title="Editar objetivo específico"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteObjId(obj.id)}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-[#FEE2E2] hover:text-[#D61F26]"
                              title="Eliminar objetivo específico"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newObjText.trim()) return;
                  addObjetivoEspecifico(newObjText.trim());
                  setNewObjText('');
                }}
                className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
              >
                <label className="block text-xs font-semibold text-[#0F294A]">
                  Agregar nuevo objetivo específico
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={newObjText}
                    onChange={(e) => setNewObjText(e.target.value)}
                    placeholder="Describe el nuevo objetivo específico..."
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0F294A] focus:border-[#0F294A] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B3161C] whitespace-nowrap shrink-0"
                  >
                    <Plus className="h-4 w-4 text-[#FACC15]" />
                    Agregar objetivo
                  </button>
                </div>
              </form>
            </div>

            <ConfirmModal
              open={Boolean(deleteObjId)}
              title="Eliminar objetivo específico"
              description="¿Deseas eliminar este objetivo específico del Manual de Bienestar Social Laboral?"
              onConfirm={() => {
                if (deleteObjId) deleteObjetivoEspecifico(deleteObjId);
                setDeleteObjId(null);
              }}
              onCancel={() => setDeleteObjId(null)}
            />
          </section>
        </div>
      )}

      {/* 3. Justificación */}
      {activeSubTab === 'justificacion' &&
        renderEditableProseCard(
          'justificacion',
          'Justificación',
          'Importancia estratégica del bienestar, motivación, relaciones interpersonales e integración',
          'yellow'
        )}

      {/* 4. Alcance */}
      {activeSubTab === 'alcance' &&
        renderEditableProseCard(
          'alcance',
          'Alcance',
          'Cobertura sobre colaboradores administrativos, operativos, logísticos y áreas de intervención',
          'navy'
        )}

      {/* 5. Normograma */}
      {activeSubTab === 'normograma' && <NormogramaManager />}

      {/* 6. Terminología */}
      {activeSubTab === 'terminologia' && <TerminologiaManager />}
    </div>
  );
}
