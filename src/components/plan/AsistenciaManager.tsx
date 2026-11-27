import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Filter,
  Lock,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { ListaAsistenciaActividad, ParticipanteAsistencia } from '../../types/bienestar';
import { maskDocumentoPersonal } from '../../utils/bienestarDatabase';
import {
  buildConsolidadoAsistenciasWorkbook,
  buildListaAsistenciaDiligenciadaWorkbook,
  buildPlantillaAsistenciaEnBlancoWorkbook,
  downloadWorkbookAsExcel,
} from '../../utils/excelFormatsGenerator';

interface AsistenciaManagerProps {
  initialActividadId?: string;
}

const AUTHORIZED_PIN = '2027';
const ASISTENCIA_DRAFT_KEY = 'frikaz_draft_asistencia_v1';

interface AsistenciaDraft {
  selectedActId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  lugar: string;
  responsable: string;
  firmaResponsable: string;
  observaciones: string;
  participantes: ParticipanteAsistencia[];
  newRow: Omit<ParticipanteAsistencia, 'id'>;
}

function loadAsistenciaDraft(fallbackActId: string): AsistenciaDraft | null {
  try {
    const raw = sessionStorage.getItem(ASISTENCIA_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AsistenciaDraft>;
    return {
      selectedActId: parsed.selectedActId || fallbackActId,
      fecha: parsed.fecha || '',
      horaInicio: parsed.horaInicio || '',
      horaFin: parsed.horaFin || '',
      lugar: parsed.lugar || '',
      responsable: parsed.responsable || '',
      firmaResponsable: parsed.firmaResponsable || '',
      observaciones: parsed.observaciones || '',
      participantes: Array.isArray(parsed.participantes) ? parsed.participantes : [],
      newRow: parsed.newRow || {
        nombreCompleto: '',
        cargo: '',
        area: '',
        documento: '',
        firma: '',
      },
    };
  } catch {
    return null;
  }
}

export function AsistenciaManager({ initialActividadId }: AsistenciaManagerProps) {
  const { state, addListaAsistencia, updateListaAsistenciaAuthorized, notify } = useBienestar();
  const initialDraft = loadAsistenciaDraft(state.planBienestar[0]?.id || 'act-1');

  const [selectedActId, setSelectedActId] = useState<string>(
    initialActividadId || initialDraft?.selectedActId || state.planBienestar[0]?.id || 'act-1'
  );
  const [exporting, setExporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estado del formulario de nueva jornada (completamente en blanco por defecto o borrador recuperado)
  const [fecha, setFecha] = useState(initialDraft?.fecha || '');
  const [horaInicio, setHoraInicio] = useState(initialDraft?.horaInicio || '');
  const [horaFin, setHoraFin] = useState(initialDraft?.horaFin || '');
  const [lugar, setLugar] = useState(initialDraft?.lugar || '');
  const [responsable, setResponsable] = useState(initialDraft?.responsable || '');
  const [firmaResponsable, setFirmaResponsable] = useState(
    initialDraft?.firmaResponsable || ''
  );
  const [observaciones, setObservaciones] = useState(initialDraft?.observaciones || '');
  const [participantes, setParticipantes] = useState<ParticipanteAsistencia[]>(
    initialDraft?.participantes || []
  );

  const [newRow, setNewRow] = useState<Omit<ParticipanteAsistencia, 'id'>>(
    initialDraft?.newRow || {
      nombreCompleto: '',
      cargo: '',
      area: '',
      documento: '',
      firma: '',
    }
  );
  const [lastSavedCode, setLastSavedCode] = useState<string | null>(null);

  useEffect(() => {
    try {
      const hasDraft =
        fecha ||
        horaInicio ||
        horaFin ||
        lugar ||
        responsable ||
        firmaResponsable ||
        observaciones ||
        participantes.length > 0 ||
        newRow.nombreCompleto ||
        newRow.cargo ||
        newRow.area;
      if (!hasDraft) {
        sessionStorage.removeItem(ASISTENCIA_DRAFT_KEY);
        return;
      }
      const draft: AsistenciaDraft = {
        selectedActId,
        fecha,
        horaInicio,
        horaFin,
        lugar,
        responsable,
        firmaResponsable,
        observaciones,
        participantes,
        newRow,
      };
      sessionStorage.setItem(ASISTENCIA_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore sessionStorage error
    }
  }, [
    selectedActId,
    fecha,
    horaInicio,
    horaFin,
    lugar,
    responsable,
    firmaResponsable,
    observaciones,
    participantes,
    newRow,
  ]);

  // Filtros de Historial y Descargas (Apartado C)
  const [filterActId, setFilterActId] = useState<string>('ALL');
  const [filterFecha, setFilterFecha] = useState<string>('');
  const [filterTrabajador, setFilterTrabajador] = useState<string>('');
  const [selectedDownloadListId, setSelectedDownloadListId] = useState<string>('');
  const [emptyDownloadWarning, setEmptyDownloadWarning] = useState(false);

  // Modales de inspección, protección PII y corrección autorizada
  const [viewingLista, setViewingLista] = useState<ListaAsistenciaActividad | null>(null);
  const [editingLista, setEditingLista] = useState<ListaAsistenciaActividad | null>(null);
  const [piiUnlocked, setPiiUnlocked] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState<'pii' | 'edit'>('pii');
  const [pendingEditLista, setPendingEditLista] = useState<ListaAsistenciaActividad | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [autorizadorNombre, setAutorizadorNombre] = useState('');

  const selectedActivity = useMemo(
    () =>
      state.planBienestar.find((a) => a.id === selectedActId) || state.planBienestar[0],
    [state.planBienestar, selectedActId]
  );

  const poblacionBase = Math.max(
    1,
    state.presupuestoGeneral2027?.poblacionTrabajadores || 10
  );

  // Historial filtrado de listas de asistencia guardadas
  const filteredListas = useMemo(() => {
    const q = filterTrabajador.trim().toLowerCase();
    return state.listasAsistencia
      .filter((l) => {
        if (filterActId !== 'ALL' && l.actividadId !== filterActId) return false;
        if (filterFecha && l.fecha !== filterFecha) return false;
        if (q) {
          const hasWorker = l.participantes.some((p) =>
            p.nombreCompleto.toLowerCase().includes(q)
          );
          if (!hasWorker) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dCmp = (b.fecha || '').localeCompare(a.fecha || '');
        if (dCmp !== 0) return dCmp;
        return (b.numeroRegistro || 0) - (a.numeroRegistro || 0);
      });
  }, [state.listasAsistencia, filterActId, filterFecha, filterTrabajador]);

  // Historial consolidado de participación por trabajador (sin exposición de documento ni firma)
  const workerHistory = useMemo(() => {
    const q = filterTrabajador.trim().toLowerCase();
    const map = new Map<
      string,
      {
        nombre: string;
        cargo: string;
        area: string;
        asistencias: number;
        actividades: string[];
      }
    >();

    state.listasAsistencia.forEach((l) => {
      if (filterActId !== 'ALL' && l.actividadId !== filterActId) return;
      if (filterFecha && l.fecha !== filterFecha) return;

      l.participantes.forEach((p) => {
        const cleanName = p.nombreCompleto.trim();
        const key = cleanName.toLowerCase();
        if (!key) return;
        if (q && !key.includes(q)) return;

        const prev = map.get(key) || {
          nombre: cleanName,
          cargo: p.cargo,
          area: p.area,
          asistencias: 0,
          actividades: [],
        };
        prev.asistencias += 1;
        prev.cargo = p.cargo || prev.cargo;
        prev.area = p.area || prev.area;
        prev.actividades.push(`${l.nombreActividad} (${l.fecha})`);
        map.set(key, prev);
      });
    });

    const totalSesionesBase = Math.max(1, state.planBienestar.length);
    return Array.from(map.values())
      .map((w) => ({
        ...w,
        porcentaje: Math.min(100, Math.round((w.asistencias / totalSesionesBase) * 100)),
      }))
      .sort((a, b) => b.asistencias - a.asistencias);
  }, [
    state.listasAsistencia,
    state.planBienestar.length,
    filterActId,
    filterFecha,
    filterTrabajador,
  ]);

  // --- APARTADO A: DESCARGA DE PLANTILLAS EN BLANCO ---
  const handleDownloadBlankActivityTemplate = async () => {
    if (exporting || !selectedActivity) return;
    setExporting(true);
    try {
      const wb = await buildPlantillaAsistenciaEnBlancoWorkbook({
        actividadNombre: selectedActivity.actividad,
        dimension: String(selectedActivity.dimension),
      });
      const safeName = selectedActivity.actividad
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '_')
        .slice(0, 28);
      await downloadWorkbookAsExcel(wb, `Plantilla_En_Blanco_Asistencia_${safeName}.xlsx`);
      notify('Plantilla en blanco de lista de asistencia descargada (.xlsx).');
    } catch {
      notify('No fue posible generar la plantilla en Excel. Inténtalo de nuevo.', 'warning');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadGeneralBlankTemplate = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const wb = await buildPlantillaAsistenciaEnBlancoWorkbook({ general: true });
      await downloadWorkbookAsExcel(wb, 'Plantilla_General_Asistencia_Frikaz_2027.xlsx');
      notify('Plantilla general en blanco para actividades descargada (.xlsx).');
    } catch {
      notify('No fue posible generar la plantilla general en Excel.', 'warning');
    } finally {
      setExporting(false);
    }
  };

  // --- APARTADO B: REGISTRO DE ASISTENCIA ---
  const handleAddParticipant = () => {
    const cleanName = newRow.nombreCompleto.trim();
    const cleanCargo = newRow.cargo.trim();
    const cleanArea = newRow.area.trim();
    if (!cleanName || !cleanCargo || !cleanArea) {
      notify(
        'Completa nombre completo, cargo y área del trabajador para agregarlo a la lista.',
        'warning'
      );
      return;
    }

    const dup = participantes.some(
      (p) => p.nombreCompleto.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (dup) {
      notify(
        `El colaborador "${cleanName}" ya figura en esta lista de asistencia.`,
        'warning'
      );
      return;
    }

    const participant: ParticipanteAsistencia = {
      id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      nombreCompleto: cleanName,
      cargo: cleanCargo,
      area: cleanArea,
      documento: newRow.documento.trim(),
      firma: newRow.firma.trim() || 'Firma registrada',
    };

    setParticipantes((prev) => [...prev, participant]);
    setNewRow({ nombreCompleto: '', cargo: '', area: '', documento: '', firma: '' });
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipantes((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveListaAsistencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity || submitting) return;

    setSubmitting(true);
    try {
      const res = addListaAsistencia({
        actividadId: selectedActivity.id,
        nombreActividad: selectedActivity.actividad,
        dimension: String(selectedActivity.dimension),
        fecha,
        horaInicio,
        horaFin,
        lugar: lugar.trim(),
        responsable: responsable.trim(),
        firmaResponsable: firmaResponsable.trim(),
        observaciones: observaciones.trim(),
        participantes,
      });

      if (res.ok && res.record) {
        try {
          sessionStorage.removeItem(ASISTENCIA_DRAFT_KEY);
        } catch {
          // ignore
        }
        const code = `ASIST-2027-${String(res.record.numeroRegistro ?? 1).padStart(3, '0')}`;
        setLastSavedCode(code);
        setEmptyDownloadWarning(false);
        setSelectedDownloadListId(res.record.id);
        // Limpiar borrador para el siguiente registro independiente
        setFecha('');
        setHoraInicio('');
        setHoraFin('');
        setLugar('');
        setResponsable('');
        setFirmaResponsable('');
        setObservaciones('');
        setParticipantes([]);
        setNewRow({ nombreCompleto: '', cargo: '', area: '', documento: '', firma: '' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // --- APARTADO C: DESCARGAS DE LISTAS DILIGENCIADAS Y CONSOLIDADO ---
  const activeDownloadLista = useMemo(() => {
    if (filteredListas.length === 0) return null;
    if (selectedDownloadListId) {
      const found = filteredListas.find((l) => l.id === selectedDownloadListId);
      if (found) return found;
    }
    return filteredListas[0];
  }, [filteredListas, selectedDownloadListId]);

  const handleDownloadDiligenciada = async (target?: ListaAsistenciaActividad | null) => {
    const lista = target || activeDownloadLista;
    if (!lista) {
      setEmptyDownloadWarning(true);
      notify(
        'No hay listas diligenciadas guardadas para descargar. Registra y guarda al menos una jornada primero.',
        'warning'
      );
      return;
    }
    setEmptyDownloadWarning(false);
    if (exporting) return;
    setExporting(true);
    try {
      const wb = await buildListaAsistenciaDiligenciadaWorkbook(lista);
      const code = `ASIST-2027-${String(lista.numeroRegistro ?? 1).padStart(3, '0')}`;
      const safeName = lista.nombreActividad
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '_')
        .slice(0, 24);
      await downloadWorkbookAsExcel(wb, `Lista_Diligenciada_${code}_${safeName}.xlsx`);
      notify(`Lista diligenciada ${code} descargada en Excel (.xlsx).`);
    } catch {
      notify('No fue posible exportar la lista diligenciada en Excel.', 'warning');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadConsolidadoGeneral = async () => {
    if (state.listasAsistencia.length === 0) {
      notify(
        'Aún no hay listas de asistencia registradas para generar el consolidado general.',
        'warning'
      );
      return;
    }
    if (exporting) return;
    setExporting(true);
    try {
      const wb = await buildConsolidadoAsistenciasWorkbook(
        state.listasAsistencia,
        state.planBienestar
      );
      await downloadWorkbookAsExcel(wb, 'Consolidado_General_Asistencia_Frikaz_2027.xlsx');
      notify('Consolidado general de asistencia descargado en Excel (.xlsx).');
    } catch {
      notify('No fue posible generar el consolidado general de asistencia.', 'warning');
    } finally {
      setExporting(false);
    }
  };

  // --- AUTORIZACIÓN DE ACCESO PII / CORRECCIÓN ---
  const openAuthPrompt = (intent: 'pii' | 'edit', target?: ListaAsistenciaActividad) => {
    setAuthIntent(intent);
    setPendingEditLista(target || null);
    setPinInput('');
    setAuthModalOpen(true);
  };

  const handleAuthorizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() !== AUTHORIZED_PIN) {
      notify(
        'Clave incorrecta. Solo la Gerente autorizada puede acceder o corregir registros.',
        'warning'
      );
      return;
    }
    if (!autorizadorNombre.trim()) {
      notify('Ingresa el nombre del responsable autorizado.', 'warning');
      return;
    }
    setAuthModalOpen(false);
    setPiiUnlocked(true);
    if (authIntent === 'edit' && pendingEditLista) {
      setEditingLista({
        ...pendingEditLista,
        participantes: pendingEditLista.participantes.map((p) => ({ ...p })),
      });
      setPendingEditLista(null);
    } else {
      notify('Acceso autorizado concedido para consulta de datos sensibles (Ley 1581).');
    }
  };

  const handleSaveAuthorizedEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLista) return;
    updateListaAsistenciaAuthorized(editingLista, autorizadorNombre);
    setViewingLista(editingLista);
    setEditingLista(null);
  };

  return (
    <div className="space-y-8">
      {/* Encabezado del módulo independiente */}
      <section data-submodule-surface="true" className="rounded-2xl border-2 border-[#0F294A]/15 bg-white p-6 shadow-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold tracking-wide text-[#D61F26]">
              <ClipboardList className="h-4 w-4" />
              <span>GESTIÓN DOCUMENTAL · HISTORIAL PERMANENTE · LEY 1581 DE 2012</span>
            </div>
            <h2 className="font-display text-2xl font-extrabold text-[#0F294A]">
              REGISTRO DE ASISTENCIA A ACTIVIDADES
            </h2>
            <p className="text-xs leading-relaxed text-slate-600 max-w-3xl">
              Administra plantillas en blanco para impresión, registra jornadas reales de asistencia
              sin sobrescribir sesiones anteriores y descarga listas diligenciadas o el consolidado
              general del Plan Anual 2027 (población base: {poblacionBase} trabajadores).
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-right">
            <span className="block text-[11px] font-bold text-slate-500">
              Listas guardadas
            </span>
            <span className="font-display text-2xl font-extrabold text-[#0F294A] tabular-nums">
              {state.listasAsistencia.length}
            </span>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* APARTADO A. PLANTILLAS                                                */}
      {/* ===================================================================== */}
      <section className="rounded-2xl border-2 border-[#FACC15] bg-white p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <p className="text-xs font-extrabold tracking-wide text-[#D61F26]">APARTADO A</p>
          <h3 className="font-display text-xl font-extrabold text-[#0F294A]">PLANTILLAS</h3>
          <p className="text-xs text-slate-600">
            Descarga formatos completamente vacíos con encabezado oficial, Caja de Calidad,
            instrucciones de diligenciamiento y fórmula automática de conteo de asistentes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5">
            <label className="mb-1.5 block text-xs font-bold text-[#0F294A]">
              Actividad para plantilla individual en blanco:
            </label>
            <select
              value={selectedActId}
              onChange={(e) => setSelectedActId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-[#0F294A]"
            >
              {state.planBienestar.map((act, idx) => (
                <option key={act.id} value={act.id}>
                  {idx + 1}. {act.actividad} — {act.dimension}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3 lg:col-span-7 lg:justify-end">
            <button
              type="button"
              data-piggy-ignore="true"
              onClick={handleDownloadBlankActivityTemplate}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#B3161C] cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#FACC15]" />
              DESCARGAR PLANTILLA EN BLANCO
            </button>

            <button
              type="button"
              data-piggy-ignore="true"
              onClick={handleDownloadGeneralBlankTemplate}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F294A] border-b-2 border-[#FACC15] px-4 py-2.5 text-xs font-bold text-[#FACC15] hover:bg-[#163A66] cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Descargar plantilla general para las actividades
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* APARTADO B. REGISTRAR ASISTENCIA                                      */}
      {/* ===================================================================== */}
      <form
        onSubmit={handleSaveListaAsistencia}
        className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-6"
      >
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold tracking-wide text-[#D61F26]">APARTADO B</p>
            <h3 className="font-display text-xl font-extrabold text-[#0F294A]">
              REGISTRAR ASISTENCIA
            </h3>
            <p className="text-xs text-slate-600">
              Cada jornada guardada crea un registro histórico independiente ({' '}
              <span className="font-mono font-bold">ASIST-2027-XXX</span>) sin reemplazar sesiones
              previas.
            </p>
          </div>
          <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-2 text-center">
            <span className="block text-[11px] font-bold text-[#D61F26]">
              Asistentes en esta lista
            </span>
            <span className="font-display text-2xl font-extrabold text-[#0F294A] tabular-nums">
              {participantes.length}
            </span>
          </div>
        </div>

        {lastSavedCode && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-950">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" />
            <span>
              Lista de asistencia <strong className="font-mono">{lastSavedCode}</strong> guardada
              permanentemente en el historial. Los campos quedaron en blanco para registrar una
              nueva jornada.
            </span>
          </div>
        )}

        {/* Encabezado de jornada */}
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-[#F8FAFC] p-5 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="sm:col-span-2">
            <label className="mb-1 block font-bold text-[#0F294A]">
              Actividad realizada *
            </label>
            <select
              value={selectedActId}
              onChange={(e) => setSelectedActId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-[#0F294A]"
            >
              {state.planBienestar.map((act, idx) => (
                <option key={act.id} value={act.id}>
                  {idx + 1}. {act.actividad} ({act.dimension})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#0F294A]">Dimensión</label>
            <input
              type="text"
              readOnly
              value={selectedActivity?.dimension || ''}
              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-[#D61F26]"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#0F294A]">Fecha de realización *</label>
            <input
              type="date"
              required
              min="2027-01-01"
              max="2027-12-31"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#0F294A]">Hora de inicio *</label>
            <input
              type="time"
              required
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#0F294A]">Hora de finalización *</label>
            <input
              type="time"
              required
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#0F294A]">Lugar *</label>
            <input
              type="text"
              required
              placeholder="Ej. Sede Frikaz S.A.S."
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#0F294A]">Responsable *</label>
            <input
              type="text"
              required
              placeholder="Nombre del responsable"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            />
          </div>
        </div>

        {/* Sub-bloque de ingreso de participantes */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[#FDE047] bg-[#FFFBEB] p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#0F294A]">
              <UserPlus className="h-4 w-4 text-[#D61F26]" />
              <span>Agregar trabajador asistente a esta jornada</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
              <input
                type="text"
                placeholder="Nombre completo *"
                value={newRow.nombreCompleto}
                onChange={(e) => setNewRow({ ...newRow, nombreCompleto: e.target.value })}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              />
              <input
                type="text"
                placeholder="Cargo *"
                value={newRow.cargo}
                onChange={(e) => setNewRow({ ...newRow, cargo: e.target.value })}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              />
              <input
                type="text"
                placeholder="Área *"
                value={newRow.area}
                onChange={(e) => setNewRow({ ...newRow, area: e.target.value })}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              />
              <input
                type="text"
                placeholder="Documento / ID (protegido)"
                value={newRow.documento}
                onChange={(e) => setNewRow({ ...newRow, documento: e.target.value })}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              />
              <input
                type="text"
                placeholder="Firma / Constancia"
                value={newRow.firma}
                onChange={(e) => setNewRow({ ...newRow, firma: e.target.value })}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={handleAddParticipant}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0F294A] border-b-2 border-[#FACC15] px-3 py-2 text-xs font-bold text-[#FACC15] hover:bg-[#163A66] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar fila
              </button>
            </div>
          </div>

          {participantes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-600">
              Lista en blanco: utiliza el formulario superior para agregar los trabajadores
              asistentes antes de guardar la jornada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-[#0F294A] text-white">
                    <th className="border border-slate-300 px-3 py-2 text-center w-12">N.º</th>
                    <th className="border border-slate-300 px-3 py-2">Nombre completo</th>
                    <th className="border border-slate-300 px-3 py-2">Cargo</th>
                    <th className="border border-slate-300 px-3 py-2">Área</th>
                    <th className="border border-slate-300 px-3 py-2">Documento</th>
                    <th className="border border-slate-300 px-3 py-2">Firma</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-16">Quitar</th>
                  </tr>
                </thead>
                <tbody>
                  {participantes.map((p, idx) => (
                    <tr key={p.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="border border-slate-200 px-3 py-2 text-center font-mono font-bold text-[#0F294A]">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 font-semibold text-[#0F294A]">
                        {p.nombreCompleto}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-700">{p.cargo}</td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-700">{p.area}</td>
                      <td className="border border-slate-200 px-3 py-2 font-mono text-slate-600">
                        {piiUnlocked ? p.documento || '—' : maskDocumentoPersonal(p.documento)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 italic text-slate-600">
                        {piiUnlocked ? p.firma : 'Constancia registrada'}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipant(p.id)}
                          className="rounded p-1 text-slate-400 hover:bg-[#FEE2E2] hover:text-[#D61F26] cursor-pointer"
                          aria-label={`Quitar a ${p.nombreCompleto}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cierre del registro */}
        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3 text-xs">
          <div>
            <label className="mb-1 block font-bold text-[#0F294A]">
              Firma / validación del responsable
            </label>
            <input
              type="text"
              placeholder="Nombre o constancia de firma"
              value={firmaResponsable}
              onChange={(e) => setFirmaResponsable(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block font-bold text-[#0F294A]">Observaciones</label>
            <input
              type="text"
              placeholder="Novedades, compromisos o comentarios de la jornada"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D61F26] border-b-2 border-[#FACC15] px-6 py-3 text-xs font-extrabold text-white hover:bg-[#B3161C] disabled:opacity-60 cursor-pointer"
          >
            <Save className="h-4 w-4 text-[#FACC15]" />
            {submitting ? 'Guardando lista...' : 'Guardar lista de asistencia'}
          </button>
        </div>
      </form>

      {/* ===================================================================== */}
      {/* APARTADO C. HISTORIAL Y DESCARGAS                                     */}
      {/* ===================================================================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-extrabold tracking-wide text-[#D61F26]">APARTADO C</p>
            <h3 className="font-display text-xl font-extrabold text-[#0F294A]">
              HISTORIAL Y DESCARGAS
            </h3>
            <p className="text-xs text-slate-600">
              Consulta listas guardadas por actividad, fecha o trabajador, descarga listas
              diligenciadas exactas o exporta el consolidado general en Excel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                piiUnlocked ? setPiiUnlocked(false) : openAuthPrompt('pii')
              }
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold cursor-pointer ${
                piiUnlocked
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-slate-300 bg-slate-50 text-[#0F294A] hover:bg-slate-100'
              }`}
            >
              {piiUnlocked ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Ocultar documentos (Ley 1581)
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-[#D61F26]" />
                  Acceso autorizado PII
                </>
              )}
            </button>

            <button
              type="button"
              data-piggy-ignore="true"
              onClick={() => handleDownloadDiligenciada(activeDownloadLista)}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#B3161C] cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#FACC15]" />
              DESCARGAR LISTA DILIGENCIADA
            </button>

            <button
              type="button"
              data-piggy-ignore="true"
              onClick={handleDownloadConsolidadoGeneral}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F294A] px-4 py-2.5 text-xs font-bold text-[#FACC15] hover:bg-[#163A66] cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Descargar consolidado general en Excel
            </button>
          </div>
        </div>

        {emptyDownloadWarning && filteredListas.length === 0 && (
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-700" />
            <span>
              <strong>Sin registros guardados para descargar:</strong> aún no existen listas de
              asistencia diligenciadas para los criterios actuales. Registra una jornada en el{' '}
              <strong>Apartado B</strong> para habilitar la descarga exacta.
            </span>
          </div>
        )}

        {/* Filtros y selector de lista diligenciada */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div>
            <label className="mb-1 flex items-center gap-1 font-bold text-[#0F294A]">
              <Filter className="h-3.5 w-3.5 text-[#D61F26]" />
              Filtrar por actividad
            </label>
            <select
              value={filterActId}
              onChange={(e) => {
                setFilterActId(e.target.value);
                setEmptyDownloadWarning(false);
              }}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-[#0F294A]"
            >
              <option value="ALL">Todas las actividades (9)</option>
              {state.planBienestar.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.actividad}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#0F294A]">Filtrar por fecha</label>
            <input
              type="date"
              value={filterFecha}
              onChange={(e) => setFilterFecha(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-[#0F294A]"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#0F294A]">
              Buscar por trabajador
            </label>
            <input
              type="text"
              placeholder="Nombre del trabajador..."
              value={filterTrabajador}
              onChange={(e) => setFilterTrabajador(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-[#0F294A]"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#0F294A]">
              Lista diligenciada a descargar
            </label>
            <select
              value={activeDownloadLista?.id || ''}
              onChange={(e) => setSelectedDownloadListId(e.target.value)}
              disabled={filteredListas.length === 0}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-[#0F294A] disabled:opacity-60"
            >
              {filteredListas.length === 0 ? (
                <option value="">Sin listas diligenciadas</option>
              ) : (
                filteredListas.map((l, idx) => (
                  <option key={l.id} value={l.id}>
                    ASIST-2027-{String(l.numeroRegistro ?? idx + 1).padStart(3, '0')} ·{' '}
                    {l.nombreActividad} ({l.fecha})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Tabla de historial de listas guardadas */}
        {filteredListas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center space-y-2">
            <Users className="mx-auto h-9 w-9 text-slate-400" />
            <p className="font-display text-base font-extrabold text-[#0F294A]">
              No hay listas de asistencia registradas todavía
            </p>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Diligencia el Apartado B cuando se realice una actividad. Cada lista quedará
              almacenada de forma permanente y disponible para consulta o descarga en Excel.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#0F294A] text-white">
                  <th className="border border-slate-300 px-3 py-2.5">N.º Registro</th>
                  <th className="border border-slate-300 px-3 py-2.5">Actividad</th>
                  <th className="border border-slate-300 px-3 py-2.5">Dimensión</th>
                  <th className="border border-slate-300 px-3 py-2.5 text-center">Fecha</th>
                  <th className="border border-slate-300 px-3 py-2.5 text-center">Horario</th>
                  <th className="border border-slate-300 px-3 py-2.5">Responsable</th>
                  <th className="border border-slate-300 px-3 py-2.5 text-center">Asistentes</th>
                  <th className="border border-slate-300 px-3 py-2.5 text-center">% Partic.</th>
                  <th className="border border-slate-300 px-3 py-2.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredListas.map((l, idx) => {
                  const code = `ASIST-2027-${String(l.numeroRegistro ?? idx + 1).padStart(3, '0')}`;
                  const pct = Math.min(
                    100,
                    Math.round((l.participantes.length / poblacionBase) * 100)
                  );
                  return (
                    <tr key={l.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="border border-slate-200 px-3 py-2.5 font-mono font-bold text-[#D61F26] whitespace-nowrap">
                        {code}
                      </td>
                      <td className="border border-slate-200 px-3 py-2.5 font-bold text-[#0F294A]">
                        {l.nombreActividad}
                      </td>
                      <td className="border border-slate-200 px-3 py-2.5 text-slate-700">
                        {l.dimension}
                      </td>
                      <td className="border border-slate-200 px-3 py-2.5 text-center font-mono">
                        {l.fecha}
                      </td>
                      <td className="border border-slate-200 px-3 py-2.5 text-center font-mono">
                        {l.horaInicio}–{l.horaFin}
                      </td>
                      <td className="border border-slate-200 px-3 py-2.5 text-slate-700">
                        {l.responsable}
                      </td>
                      <td className="border border-slate-200 px-3 py-2.5 text-center font-mono font-bold text-[#0F294A] tabular-nums">
                        {l.participantes.length}
                      </td>
                      <td className="border border-slate-200 px-3 py-2.5 text-center font-mono font-bold text-emerald-700 tabular-nums">
                        {pct}%
                      </td>
                      <td className="border border-slate-200 px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingLista(l)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#0F294A]/20 bg-[#EFF6FF] px-2.5 py-1.5 text-[11px] font-bold text-[#0F294A] hover:bg-[#DBEAFE] cursor-pointer"
                            title="Ver detalle"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver
                          </button>
                          <button
                            type="button"
                            onClick={() => openAuthPrompt('edit', l)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#FACC15] bg-[#FEF9C3] px-2 py-1.5 text-[11px] font-bold text-[#0F294A] hover:bg-[#FDE047] cursor-pointer"
                            title="Corregir con autorización"
                          >
                            <Pencil className="h-3.5 w-3.5 text-[#D61F26]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadDiligenciada(l)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#0F294A] px-2 py-1.5 text-[11px] font-bold text-[#FACC15] hover:bg-[#163A66] cursor-pointer"
                            title="Descargar lista diligenciada (.xlsx)"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Historial de participación por trabajador */}
        <div className="border-t border-slate-100 pt-5 space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[#D61F26]" />
            <h4 className="font-display text-sm font-extrabold text-[#0F294A]">
              Historial de Participación por Trabajador (Protección Ley 1581 de 2012)
            </h4>
          </div>

          {workerHistory.length === 0 ? (
            <p className="text-xs text-slate-500">
              El consolidado individual por trabajador aparecerá automáticamente al guardar listas
              de asistencia. No se exponen documentos de identidad ni firmas en consultas públicas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[#0F294A]">
                    <th className="border border-slate-200 px-3 py-2">Colaborador</th>
                    <th className="border border-slate-200 px-3 py-2">Último cargo</th>
                    <th className="border border-slate-200 px-3 py-2">Área</th>
                    <th className="border border-slate-200 px-3 py-2 text-center">Asistencias</th>
                    <th className="border border-slate-200 px-3 py-2 text-center">
                      % Cumpl. Plan (9 act.)
                    </th>
                    <th className="border border-slate-200 px-3 py-2">
                      Actividades y fechas registradas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workerHistory.map((w, idx) => (
                    <tr key={w.nombre} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="border border-slate-200 px-3 py-2 font-bold text-[#0F294A]">
                        {w.nombre}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-700">{w.cargo}</td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-700">{w.area}</td>
                      <td className="border border-slate-200 px-3 py-2 text-center font-mono font-bold text-[#D61F26]">
                        {w.asistencias}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-center font-mono font-bold text-emerald-700">
                        {w.porcentaje}%
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-600">
                        {w.actividades.join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Modal: Detalle de Lista Guardada */}
      {viewingLista && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F294A]/50 p-4 pt-16 backdrop-blur-[1px]">
          <div
            data-piggy-modal-surface="true"
            data-piggy-context={`asistencia:detail:${viewingLista.id}`}
            className="max-h-[calc(100vh-5.5rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="font-mono text-xs font-extrabold text-[#D61F26]">
                  ASIST-2027-{String(viewingLista.numeroRegistro ?? 1).padStart(3, '0')}
                </p>
                <h3 className="font-display text-lg font-extrabold text-[#0F294A]">
                  {viewingLista.nombreActividad}
                </h3>
                <p className="text-xs text-slate-500">
                  Fecha: {viewingLista.fecha} · Horario: {viewingLista.horaInicio}–
                  {viewingLista.horaFin} · Lugar: {viewingLista.lugar}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingLista(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-[#D61F26] cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-xs sm:grid-cols-3">
              <div>
                <span className="block font-bold text-slate-500">Responsable</span>
                <span className="font-bold text-[#0F294A]">{viewingLista.responsable}</span>
              </div>
              <div>
                <span className="block font-bold text-slate-500">Dimensión</span>
                <span className="font-bold text-[#D61F26]">{viewingLista.dimension}</span>
              </div>
              <div>
                <span className="block font-bold text-slate-500">Total asistentes</span>
                <span className="font-bold text-[#0F294A]">
                  {viewingLista.participantes.length} trabajadores
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-[#0F294A] text-white">
                    <th className="border border-slate-300 px-3 py-2 text-center">N.º</th>
                    <th className="border border-slate-300 px-3 py-2">Nombre completo</th>
                    <th className="border border-slate-300 px-3 py-2">Cargo</th>
                    <th className="border border-slate-300 px-3 py-2">Área</th>
                    <th className="border border-slate-300 px-3 py-2">Documento</th>
                    <th className="border border-slate-300 px-3 py-2">Firma / Constancia</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingLista.participantes.map((p, idx) => (
                    <tr key={p.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="border border-slate-200 px-3 py-2 text-center font-mono font-bold">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 font-semibold text-[#0F294A]">
                        {p.nombreCompleto}
                      </td>
                      <td className="border border-slate-200 px-3 py-2">{p.cargo}</td>
                      <td className="border border-slate-200 px-3 py-2">{p.area}</td>
                      <td className="border border-slate-200 px-3 py-2 font-mono">
                        {piiUnlocked ? p.documento || '—' : maskDocumentoPersonal(p.documento)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 italic">
                        {piiUnlocked ? p.firma : 'Constancia protegida'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {viewingLista.observaciones && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <strong className="text-[#0F294A]">Observaciones: </strong>
                <span className="text-slate-700">{viewingLista.observaciones}</span>
              </div>
            )}

            {viewingLista.corregidoPor && (
              <p className="rounded-lg border border-[#FDE047] bg-[#FFFBEB] px-3 py-2 text-[11px] font-semibold text-[#0F294A]">
                Última corrección autorizada por {viewingLista.corregidoPor} el{' '}
                {(viewingLista.ultimaCorreccionAt || '').slice(0, 16).replace('T', ' ')}.
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              {!piiUnlocked && (
                <button
                  type="button"
                  onClick={() => openAuthPrompt('pii')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-[#0F294A] hover:bg-slate-50 cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5 text-[#D61F26]" />
                  Desbloquear datos sensibles
                </button>
              )}
              <button
                type="button"
                onClick={() => openAuthPrompt('edit', viewingLista)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#FACC15] bg-[#FEF9C3] px-3.5 py-2 text-xs font-bold text-[#0F294A] hover:bg-[#FDE047] cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4 text-[#D61F26]" />
                Corregir con autorización
              </button>
              <button
                type="button"
                data-piggy-ignore="true"
                onClick={() => handleDownloadDiligenciada(viewingLista)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#D61F26] px-4 py-2 text-xs font-bold text-white hover:bg-[#B3161C] cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-[#FACC15]" />
                Descargar Excel
              </button>
              <button
                type="button"
                onClick={() => setViewingLista(null)}
                className="rounded-xl bg-[#0F294A] px-4 py-2 text-xs font-bold text-white cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Autorización PIN */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F294A]/55 p-4 pt-16 backdrop-blur-[1px]">
          <form
            data-piggy-modal-surface="true"
            data-piggy-context="asistencia:auth-pin"
            onSubmit={handleAuthorizeSubmit}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2 text-[#D61F26]">
              <Lock className="h-5 w-5" />
              <h3 className="font-display text-base font-extrabold text-[#0F294A]">
                {authIntent === 'edit'
                  ? 'Permiso Autorizado para Corrección'
                  : 'Acceso Autorizado · Ley 1581 de 2012'}
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Los documentos de identidad, firmas y correcciones históricas están protegidos. Solo
              la Gerente autorizada puede acceder (clave institucional: <strong>2027</strong>).
            </p>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                Nombre del responsable autorizado *
              </label>
              <input
                type="text"
                required
                value={autorizadorNombre}
                onChange={(e) => setAutorizadorNombre(e.target.value)}
                placeholder="Ej. Gerente de Frikaz S.A.S."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                Clave de autorización *
              </label>
              <input
                type="password"
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Ingresa clave institucional"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-bold text-[#0F294A]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-xs font-bold text-white"
              >
                Validar acceso
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Corrección Autorizada */}
      {editingLista && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F294A]/55 p-4 pt-16 backdrop-blur-[1px]">
          <form
            data-piggy-modal-surface="true"
            data-piggy-context={`asistencia:edit:${editingLista.id}`}
            onSubmit={handleSaveAuthorizedEdit}
            className="max-h-[calc(100vh-5.5rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-base font-extrabold text-[#0F294A]">
                Corregir Lista de Asistencia (Autorizado: {autorizadorNombre})
              </h3>
              <button
                type="button"
                onClick={() => setEditingLista(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-[#D61F26]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">Fecha *</label>
                <input
                  type="date"
                  required
                  value={editingLista.fecha}
                  onChange={(e) => setEditingLista({ ...editingLista, fecha: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">Lugar *</label>
                <input
                  type="text"
                  required
                  value={editingLista.lugar}
                  onChange={(e) => setEditingLista({ ...editingLista, lugar: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">Hora inicio *</label>
                <input
                  type="time"
                  required
                  value={editingLista.horaInicio}
                  onChange={(e) =>
                    setEditingLista({ ...editingLista, horaInicio: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">Hora fin *</label>
                <input
                  type="time"
                  required
                  value={editingLista.horaFin}
                  onChange={(e) => setEditingLista({ ...editingLista, horaFin: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block font-bold text-[#0F294A]">Responsable *</label>
                <input
                  type="text"
                  required
                  value={editingLista.responsable}
                  onChange={(e) =>
                    setEditingLista({ ...editingLista, responsable: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block font-bold text-[#0F294A]">Observaciones</label>
                <textarea
                  rows={2}
                  value={editingLista.observaciones}
                  onChange={(e) =>
                    setEditingLista({ ...editingLista, observaciones: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingLista(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-[#0F294A]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2 text-xs font-bold text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                Guardar corrección autorizada
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
