import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  DollarSign,
  FileCheck2,
  FileSpreadsheet,
  History,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { PresupuestoCostoItem } from '../../types/bienestar';
import { downloadSingleExcelFormat } from '../../utils/excelFormatsGenerator';
import { ConfirmModal } from '../ui/ConfirmModal';

const GERENCIA_PIN = '2027';

function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Sección «Presupuesto General 2027»:
 * Inicia como «Propuesta pendiente de aprobación» sin reserva ficticia ($200.000 eliminada)
 * y sin mostrar montos aprobados, ejecutados ni disponibles hasta aprobación formal de Gerencia.
 */
export function Presupuesto2027View() {
  const {
    state,
    addPresupuestoCostoItem,
    updatePresupuestoCostoItem,
    deletePresupuestoCostoItem,
    reviewPresupuestoGerencia,
    notify,
  } = useBienestar();

  const budget = state.presupuestoGeneral2027;
  const isApproved = budget.estadoAprobacion === 'Aprobado por Gerencia';
  const isAdjustment = budget.estadoAprobacion === 'En ajuste';

  const [expandedActId, setExpandedActId] = useState<string>('act-5');
  const [addingForActId, setAddingForActId] = useState<string | null>(null);
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<PresupuestoCostoItem | null>(null);

  // Modal de Revisión y Aprobación de Gerencia
  const [reviewOpen, setReviewOpen] = useState(false);
  const [gerenteNombre, setGerenteNombre] = useState(budget.gerenteAprobador || '');
  const [pinInput, setPinInput] = useState('');
  const [observacionesGerencia, setObservacionesGerencia] = useState(
    budget.observacionesGerencia || ''
  );
  const [reviewError, setReviewError] = useState('');

  const [newItemDraft, setNewItemDraft] = useState<Omit<PresupuestoCostoItem, 'id' | 'actividadId'>>({
    recursoMaterial: '',
    cantidad: 1,
    unidadMedida: 'Unidad',
    valorUnitario: 0,
    frecuenciaCompra: 'Única 2027',
    ejecutado: 0,
  });

  const totals = useMemo(() => {
    const projectedTotal = budget.items.reduce(
      (acc, it) => acc + Math.max(0, it.cantidad) * Math.max(0, it.valorUnitario),
      0
    );
    const ejecutadoReal = isApproved
      ? budget.items.reduce((acc, it) => acc + Math.max(0, it.ejecutado || 0), 0)
      : 0;
    const aprobadoGerencia = isApproved ? budget.presupuestoTotalAprobado || projectedTotal : 0;
    const disponibleReal = isApproved ? aprobadoGerencia - ejecutadoReal : 0;
    const pctEjecucion =
      isApproved && aprobadoGerencia > 0
        ? Math.round((ejecutadoReal / aprobadoGerencia) * 1000) / 10
        : 0;
    const actividadesConCosto = state.planBienestar.filter((a) => (a.presupuesto || 0) > 0).length;
    const actividadesSinCosto = state.planBienestar.length - actividadesConCosto;
    const diferenciaProyeccionVsAprobado = isApproved ? aprobadoGerencia - projectedTotal : 0;

    return {
      projectedTotal,
      ejecutadoReal,
      aprobadoGerencia,
      disponibleReal,
      pctEjecucion,
      actividadesConCosto,
      actividadesSinCosto,
      diferenciaProyeccionVsAprobado,
    };
  }, [budget, isApproved, state.planBienestar]);

  const handleItemChange = (
    item: PresupuestoCostoItem,
    patch: Partial<PresupuestoCostoItem>
  ) => {
    updatePresupuestoCostoItem({ ...item, ...patch });
  };

  const handleAddItemSubmit = (e: React.FormEvent, actividadId: string) => {
    e.preventDefault();
    const res = addPresupuestoCostoItem({
      actividadId,
      ...newItemDraft,
      recursoMaterial: newItemDraft.recursoMaterial.trim(),
      ejecutado: 0,
    });
    if (!res.ok) return;
    setAddingForActId(null);
    setNewItemDraft({
      recursoMaterial: '',
      cantidad: 1,
      unidadMedida: 'Unidad',
      valorUnitario: 0,
      frecuenciaCompra: 'Única 2027',
      ejecutado: 0,
    });
  };

  const handleGerenciaSubmit = (decision: 'Aprobado por Gerencia' | 'En ajuste') => {
    setReviewError('');
    if (!gerenteNombre.trim()) {
      setReviewError('Ingresa el nombre completo de la Gerente.');
      return;
    }
    if (pinInput.trim() !== GERENCIA_PIN) {
      setReviewError('PIN de autorización de Gerencia incorrecto (PIN institucional: 2027).');
      return;
    }
    if (decision === 'En ajuste' && !observacionesGerencia.trim()) {
      setReviewError('Registra las observaciones de ajuste solicitadas por Gerencia.');
      return;
    }

    const res = reviewPresupuestoGerencia({
      decision,
      gerenteNombre: gerenteNombre.trim(),
      observaciones: observacionesGerencia.trim(),
    });
    if (!res.ok) {
      setReviewError(res.error || 'No fue posible registrar la decisión.');
      return;
    }
    setPinInput('');
    setReviewOpen(false);
  };

  const handleExport = async (key: 'presupuesto_general' | 'desglose_presupuestal') => {
    if (exportingKey) return;
    setExportingKey(key);
    try {
      const file = await downloadSingleExcelFormat(key, state);
      notify(`Excel descargado: ${file}`);
    } catch {
      notify('No fue posible generar el archivo Excel. Inténtalo de nuevo.', 'warning');
    } finally {
      setExportingKey(null);
    }
  };

  return (
    <div className="space-y-7">
      {/* Encabezado de sección, estado oficial de la propuesta y descargas */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#D61F26]">
              MIPYME FRIKAZ S.A.S. · {budget.poblacionTrabajadores} TRABAJADORES · ENERO A DICIEMBRE 2027
            </p>
            <h2 className="font-display text-2xl font-extrabold text-[#0F294A]">
              Presupuesto General 2027
            </h2>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              Propuesta financiera ajustada para los 10 colaboradores de Frikaz S.A.S. Edita
              cantidades, precios unitarios y recursos en tiempo real con trazabilidad automática de
              cambios antes y después de la aprobación de Gerencia.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setReviewError('');
                setGerenteNombre(budget.gerenteAprobador || '');
                setObservacionesGerencia(budget.observacionesGerencia || '');
                setReviewOpen(true);
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer whitespace-nowrap ${
                isApproved
                  ? 'border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                  : 'bg-[#D61F26] border-b-2 border-[#FACC15] text-white hover:bg-[#B3161C]'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              {isApproved ? 'Revisar / Ajustar Aprobación' : 'Revisión y Aprobación de Gerencia'}
            </button>
            <button
              type="button"
              onClick={() => handleExport('presupuesto_general')}
              disabled={exportingKey !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F294A] border-b-2 border-[#FACC15] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#D61F26] cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#FACC15]" />
              {exportingKey === 'presupuesto_general'
                ? 'Generando...'
                : 'Presupuesto en Blanco (.xlsx)'}
            </button>
            <button
              type="button"
              onClick={() => handleExport('desglose_presupuestal')}
              disabled={exportingKey !== null}
              className="inline-flex items-center gap-2 rounded-xl border border-[#FACC15] bg-[#FEF9C3] px-4 py-2.5 text-xs font-bold text-[#0F294A] hover:bg-[#FDE047] cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#D61F26]" />
              {exportingKey === 'desglose_presupuestal'
                ? 'Generando...'
                : 'Desglose en Blanco (.xlsx)'}
            </button>
          </div>
        </div>

        {/* Banner de estado formal de Gerencia */}
        <div
          className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
            isApproved
              ? 'border-emerald-300 bg-emerald-50/70'
              : isAdjustment
                ? 'border-[#FCA5A5] bg-[#FEF2F2]'
                : 'border-[#FDE047] bg-[#FFFBEB]'
          }`}
        >
          <div className="flex items-start gap-3">
            {isApproved ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            ) : isAdjustment ? (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#D61F26]" />
            ) : (
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#B45309]" />
            )}
            <div className="text-xs text-[#0F294A]">
              <p className="font-extrabold">
                Estado del Presupuesto General 2027:{' '}
                <span className={isApproved ? 'text-emerald-800' : 'text-[#D61F26]'}>
                  {budget.estadoAprobacion}
                </span>
              </p>
              {isApproved ? (
                <p className="mt-1 text-slate-700">
                  Aprobado por <strong>{budget.gerenteAprobador}</strong> el{' '}
                  {formatDateTime(budget.fechaAprobacion)}. Ya está habilitado el registro de
                  ejecución real por cada recurso.
                  {budget.observacionesGerencia ? ` Nota: ${budget.observacionesGerencia}` : ''}
                </p>
              ) : isAdjustment ? (
                <p className="mt-1 text-slate-700">
                  Observaciones de Gerencia ({budget.gerenteAprobador}):{' '}
                  <strong>{budget.observacionesGerencia}</strong>. Realiza los ajustes en el
                  desglose y vuelve a presentar a aprobación.
                </p>
              ) : (
                <p className="mt-1 text-slate-700">
                  Este presupuesto corresponde a una <strong>propuesta proyectada</strong> pendiente
                  de aprobación por parte de la Gerente. Hasta su aprobación formal, no se registran
                  montos aprobados, ejecutados ni saldos disponibles.
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-[#0F294A] hover:border-[#0F294A] shrink-0 cursor-pointer"
          >
            <History className="h-3.5 w-3.5 text-[#D61F26]" />
            Historial ({budget.historialModificaciones?.length || 0})
          </button>
        </div>

        {/* Alerta automática si una modificación posterior excede el monto aprobado por Gerencia */}
        {isApproved && totals.diferenciaProyeccionVsAprobado < 0 && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-[#D61F26] bg-[#FEF2F2] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2.5 text-xs text-[#0F294A]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#D61F26]" />
              <p>
                La proyección actual ({formatCop(totals.projectedTotal)}) supera en{' '}
                <strong className="text-[#D61F26]">
                  {formatCop(Math.abs(totals.diferenciaProyeccionVsAprobado))}
                </strong>{' '}
                el monto aprobado por Gerencia ({formatCop(totals.aprobadoGerencia)}). Requiere
                nueva revisión de Gerencia.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className="rounded-lg bg-[#D61F26] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#B3161C] shrink-0 cursor-pointer"
            >
              Actualizar aprobación
            </button>
          </div>
        )}
      </section>

      {/* Tarjetas resumen: estrictamente reales según estado de aprobación */}
      {!isApproved ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border-2 border-[#0F294A] bg-white p-5">
            <div className="flex items-center justify-between text-xs font-extrabold text-[#0F294A]">
              <span>Valor Proyectado General</span>
              <DollarSign className="h-4 w-4 text-[#D61F26]" />
            </div>
            <p className="mt-2 font-display text-2xl font-extrabold text-[#0F294A] tabular-nums">
              {formatCop(totals.projectedTotal)}
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              Suma automática en tiempo real de los recursos propuestos
            </p>
          </div>

          <div className="rounded-2xl border border-[#FDE047] bg-[#FFFBEB] p-5">
            <div className="flex items-center justify-between text-xs font-bold text-[#0F294A]">
              <span>Estado de Aprobación</span>
              <Clock3 className="h-4 w-4 text-[#B45309]" />
            </div>
            <p className="mt-2 font-display text-lg font-extrabold text-[#D61F26]">
              {budget.estadoAprobacion}
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              A la espera de revisión formal de Gerencia
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Cobertura de Actividades</span>
              <FileCheck2 className="h-4 w-4 text-[#0F294A]" />
            </div>
            <p className="mt-2 font-display text-2xl font-extrabold text-[#0F294A] tabular-nums">
              {totals.actividadesConCosto} con costo · {totals.actividadesSinCosto} internas
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              9 actividades proyectadas de enero a diciembre 2027
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Ejecución y Saldos</span>
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 font-display text-base font-extrabold text-slate-600">
              Sin valores aprobados aún
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Se habilitan únicamente cuando la Gerente apruebe la propuesta
            </p>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border-2 border-[#0F294A] bg-white p-5">
            <div className="flex items-center justify-between text-xs font-extrabold text-[#0F294A]">
              <span>Presupuesto Aprobado por Gerencia</span>
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
            </div>
            <p className="mt-2 font-display text-2xl font-extrabold text-[#0F294A] tabular-nums">
              {formatCop(totals.aprobadoGerencia)}
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              Proyección actual: {formatCop(totals.projectedTotal)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#FDE047] bg-[#FFFBEB] p-5">
            <div className="flex items-center justify-between text-xs font-bold text-[#0F294A]">
              <span>Ejecutado Real Registrado</span>
              <DollarSign className="h-4 w-4 text-[#D61F26]" />
            </div>
            <p className="mt-2 font-display text-2xl font-extrabold text-[#D61F26] tabular-nums">
              {formatCop(totals.ejecutadoReal)}
            </p>
            <p className="mt-1 text-[11px] text-[#0F294A]/75 tabular-nums">
              Ejecución real acumulada: <strong>{totals.pctEjecucion}%</strong>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Saldo Disponible Real</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            </div>
            <p className="mt-2 font-display text-2xl font-extrabold text-emerald-700 tabular-nums">
              {formatCop(totals.disponibleReal)}
            </p>
            <p className="mt-1 text-[11px] text-slate-600 tabular-nums">
              Aprobado menos ejecutado real
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Cobertura MiPyme 2027</span>
              <Users className="h-4 w-4 text-[#0F294A]" />
            </div>
            <p className="mt-2 font-display text-2xl font-extrabold text-[#0F294A] tabular-nums">
              {budget.poblacionTrabajadores} trabajadores
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              {totals.actividadesConCosto} actividades con recurso · {totals.actividadesSinCosto} sin costo
            </p>
          </div>
        </section>
      )}

      {/* Historial de modificaciones del presupuesto */}
      {showHistory && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-[#D61F26]" />
              <h3 className="font-display text-base font-extrabold text-[#0F294A]">
                Historial de Modificaciones y Aprobación
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="rounded-lg p-1 text-slate-400 hover:text-[#D61F26] cursor-pointer"
              aria-label="Cerrar historial"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!budget.historialModificaciones || budget.historialModificaciones.length === 0 ? (
            <p className="p-6 text-xs text-slate-500">
              Aún no se han registrado modificaciones manuales sobre la propuesta inicial. Cada
              edición de precio, cantidad, recurso o revisión de Gerencia quedará registrada aquí.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[740px] border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0F294A] text-white">
                    <th className="border border-slate-300 px-3 py-2 text-left">Fecha y hora</th>
                    <th className="border border-slate-300 px-3 py-2 text-left">Tipo</th>
                    <th className="border border-slate-300 px-3 py-2 text-left">Responsable</th>
                    <th className="border border-slate-300 px-3 py-2 text-left">Detalle del cambio</th>
                    <th className="border border-slate-300 px-3 py-2 text-right">Valor anterior</th>
                    <th className="border border-slate-300 px-3 py-2 text-right">Valor nuevo</th>
                  </tr>
                </thead>
                <tbody>
                  {budget.historialModificaciones.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/70">
                      <td className="border border-slate-200 px-3 py-2 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {formatDateTime(h.fechaHora)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 font-bold text-[#0F294A]">
                        {h.tipo}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-700">
                        {h.usuario}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-700">
                        {h.descripcion}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-right font-mono tabular-nums text-slate-600">
                        {formatCop(h.valorAnterior)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-right font-mono font-bold tabular-nums text-[#0F294A]">
                        {formatCop(h.valorNuevo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tabla consolidada de proyección y desglose por actividad */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="font-display text-lg font-extrabold text-[#0F294A]">
            Desglose Proyectado de Costos por Actividad (9 Actividades)
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Haz clic en cada actividad para consultar su valor proyectado, editar cantidades y
            precios unitarios o agregar recursos.{' '}
            {isApproved
              ? 'El registro de ejecución real se encuentra habilitado.'
              : 'La columna de ejecución real se habilitará al aprobarse el presupuesto por Gerencia.'}
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {state.planBienestar.map((act, idx) => {
            const actItems = budget.items.filter((it) => it.actividadId === act.id);
            const actProjected = actItems.reduce(
              (acc, it) => acc + Math.max(0, it.cantidad) * Math.max(0, it.valorUnitario),
              0
            );
            const actExecuted = isApproved
              ? actItems.reduce((acc, it) => acc + Math.max(0, it.ejecutado || 0), 0)
              : 0;
            const actAvailable = isApproved ? actProjected - actExecuted : 0;
            const pctAct =
              isApproved && actProjected > 0 ? Math.round((actExecuted / actProjected) * 100) : 0;
            const isOpen = expandedActId === act.id;

            return (
              <div key={act.id} className="bg-white">
                <button
                  type="button"
                  onClick={() => setExpandedActId(isOpen ? '' : act.id)}
                  className="flex w-full flex-col gap-3 px-6 py-4 text-left transition-colors hover:bg-slate-50/80 lg:flex-row lg:items-center lg:justify-between cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-[#D61F26]">
                      <span className="font-mono text-[#0F294A]">
                        #{String(act.numero || idx + 1).padStart(2, '0')}
                      </span>
                      <span>· {act.dimension.toUpperCase()}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600">{actItems.length} ítem(s)</span>
                    </div>
                    <p className="font-display text-base font-extrabold text-[#0F294A]">
                      {act.actividad}
                    </p>
                    <p className="text-xs text-slate-500">{act.frecuencia}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-5 text-xs tabular-nums">
                    <div>
                      <span className="block text-[11px] text-slate-500">
                        {isApproved ? 'Aprobado / Proyectado' : 'Proyectado estimado'}
                      </span>
                      <span className="font-mono text-sm font-extrabold text-[#0F294A]">
                        {formatCop(actProjected)}
                      </span>
                    </div>
                    {isApproved && (
                      <>
                        <div>
                          <span className="block text-[11px] text-slate-500">Ejecutado real</span>
                          <span className="font-mono text-sm font-bold text-[#D61F26]">
                            {formatCop(actExecuted)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px] text-slate-500">Disponible</span>
                          <span className="font-mono text-sm font-bold text-emerald-700">
                            {formatCop(actAvailable)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px] text-slate-500">% Ejec.</span>
                          <span className="font-mono text-sm font-extrabold text-[#0F294A]">
                            {pctAct}%
                          </span>
                        </div>
                      </>
                    )}
                    <div className="rounded-lg border border-slate-200 p-1.5 text-[#0F294A]">
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 bg-[#F8FAFC] px-6 py-5 space-y-4">
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full min-w-[780px] border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#0F294A] text-white">
                            <th className="border border-slate-300 px-3 py-2 text-left">
                              Recurso o material
                            </th>
                            <th className="border border-slate-300 px-2 py-2 text-center w-20">
                              Cantidad
                            </th>
                            <th className="border border-slate-300 px-3 py-2 text-left w-32">
                              Unidad de medida
                            </th>
                            <th className="border border-slate-300 px-2 py-2 text-right w-28">
                              Valor unitario
                            </th>
                            <th className="border border-slate-300 px-3 py-2 text-right w-28">
                              Total proyectado
                            </th>
                            <th className="border border-slate-300 px-3 py-2 text-left w-44">
                              Frecuencia de compra
                            </th>
                            {isApproved && (
                              <th className="border border-slate-300 px-2 py-2 text-right w-28">
                                Ejecutado real
                              </th>
                            )}
                            <th className="border border-slate-300 px-2 py-2 text-center w-14">
                              Quitar
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {actItems.map((it) => {
                            const totalItem = it.cantidad * it.valorUnitario;
                            return (
                              <tr key={it.id} className="bg-white hover:bg-slate-50/70">
                                <td className="border border-slate-200 px-2.5 py-2">
                                  <input
                                    type="text"
                                    value={it.recursoMaterial}
                                    onChange={(e) =>
                                      handleItemChange(it, { recursoMaterial: e.target.value })
                                    }
                                    className="w-full rounded border border-transparent px-1.5 py-1 text-xs font-semibold text-[#0F294A] hover:border-slate-300 focus:border-[#0F294A] focus:outline-none"
                                  />
                                </td>
                                <td className="border border-slate-200 px-2 py-2 text-center">
                                  <input
                                    type="number"
                                    min={0}
                                    value={it.cantidad}
                                    onChange={(e) =>
                                      handleItemChange(it, {
                                        cantidad: Math.max(0, Number(e.target.value) || 0),
                                      })
                                    }
                                    className="w-16 rounded border border-slate-200 px-1.5 py-1 text-center font-mono font-bold text-[#0F294A] tabular-nums"
                                  />
                                </td>
                                <td className="border border-slate-200 px-2 py-2">
                                  <input
                                    type="text"
                                    value={it.unidadMedida}
                                    onChange={(e) =>
                                      handleItemChange(it, { unidadMedida: e.target.value })
                                    }
                                    className="w-full rounded border border-transparent px-1.5 py-1 text-xs text-slate-700 hover:border-slate-300"
                                  />
                                </td>
                                <td className="border border-slate-200 px-2 py-2 text-right">
                                  <input
                                    type="number"
                                    min={0}
                                    step={500}
                                    value={it.valorUnitario}
                                    onChange={(e) =>
                                      handleItemChange(it, {
                                        valorUnitario: Math.max(0, Number(e.target.value) || 0),
                                      })
                                    }
                                    className="w-24 rounded border border-slate-200 px-1.5 py-1 text-right font-mono font-semibold text-[#0F294A] tabular-nums"
                                  />
                                </td>
                                <td className="border border-slate-200 px-3 py-2 text-right font-mono font-extrabold text-[#0F294A] tabular-nums bg-[#FFFBEB]/60">
                                  {formatCop(totalItem)}
                                </td>
                                <td className="border border-slate-200 px-2 py-2">
                                  <input
                                    type="text"
                                    value={it.frecuenciaCompra}
                                    onChange={(e) =>
                                      handleItemChange(it, { frecuenciaCompra: e.target.value })
                                    }
                                    className="w-full rounded border border-transparent px-1.5 py-1 text-xs text-slate-600 hover:border-slate-300"
                                  />
                                </td>
                                {isApproved && (
                                  <td className="border border-slate-200 px-2 py-2 text-right">
                                    <input
                                      type="number"
                                      min={0}
                                      step={1000}
                                      value={it.ejecutado}
                                      onChange={(e) =>
                                        handleItemChange(it, {
                                          ejecutado: Math.max(0, Number(e.target.value) || 0),
                                        })
                                      }
                                      className="w-24 rounded border border-slate-200 px-1.5 py-1 text-right font-mono font-semibold text-[#D61F26] tabular-nums"
                                    />
                                  </td>
                                )}
                                <td className="border border-slate-200 px-2 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setPendingDeleteItem(it)}
                                    className="rounded p-1 text-slate-400 hover:bg-[#FEE2E2] hover:text-[#D61F26] cursor-pointer"
                                    aria-label="Eliminar recurso"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {addingForActId === act.id ? (
                      <form
                        onSubmit={(e) => handleAddItemSubmit(e, act.id)}
                        className="rounded-xl border border-[#FDE047] bg-[#FFFBEB] p-4 space-y-3"
                      >
                        <p className="text-xs font-extrabold text-[#0F294A]">
                          Nuevo recurso o material para {act.actividad}
                        </p>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
                          <input
                            type="text"
                            required
                            placeholder="Recurso o material *"
                            value={newItemDraft.recursoMaterial}
                            onChange={(e) =>
                              setNewItemDraft({ ...newItemDraft, recursoMaterial: e.target.value })
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs lg:col-span-2"
                          />
                          <input
                            type="number"
                            min={1}
                            required
                            placeholder="Cantidad *"
                            value={newItemDraft.cantidad}
                            onChange={(e) =>
                              setNewItemDraft({
                                ...newItemDraft,
                                cantidad: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Unidad (ej. Unidad) *"
                            value={newItemDraft.unidadMedida}
                            onChange={(e) =>
                              setNewItemDraft({ ...newItemDraft, unidadMedida: e.target.value })
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                          />
                          <input
                            type="number"
                            min={0}
                            required
                            placeholder="Valor unitario COP *"
                            value={newItemDraft.valorUnitario}
                            onChange={(e) =>
                              setNewItemDraft({
                                ...newItemDraft,
                                valorUnitario: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Frecuencia de compra *"
                            value={newItemDraft.frecuenciaCompra}
                            onChange={(e) =>
                              setNewItemDraft({
                                ...newItemDraft,
                                frecuenciaCompra: e.target.value,
                              })
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                          />
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-bold text-[#0F294A] tabular-nums">
                            Total proyectado:{' '}
                            {formatCop(newItemDraft.cantidad * newItemDraft.valorUnitario)}
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setAddingForActId(null)}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-[#0F294A] cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 rounded-lg bg-[#D61F26] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#B3161C] cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Agregar recurso
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setAddingForActId(act.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-[#0F294A] hover:border-[#D61F26] hover:text-[#D61F26] cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Agregar recurso o costo a esta actividad
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pie consolidado oficial */}
        <div className="border-t-2 border-[#FACC15] bg-[#0F294A] px-6 py-4 text-white flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-extrabold text-[#FACC15]">RESUMEN PRESUPUESTAL 2027:</span>{' '}
            Estado actual: <strong>{budget.estadoAprobacion}</strong> · 9 actividades consolidadas
          </div>
          <div className="font-display text-base font-extrabold text-[#FACC15] tabular-nums">
            {isApproved
              ? `APROBADO: ${formatCop(totals.aprobadoGerencia)} · EJECUTADO: ${formatCop(totals.ejecutadoReal)}`
              : `VALOR PROYECTADO TOTAL: ${formatCop(totals.projectedTotal)}`}
          </div>
        </div>
      </section>

      {/* Modal de Revisión y Aprobación por Gerencia */}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F294A]/50 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#D61F26]">
                  AUTORIZACIÓN FORMAL · GERENCIA FRIKAZ S.A.S.
                </p>
                <h3 className="font-display text-lg font-extrabold text-[#0F294A]">
                  Revisión del Presupuesto General 2027
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-[#D61F26] cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-[#FDE047] bg-[#FFFBEB] p-3.5 text-xs text-[#0F294A] space-y-1">
              <p>
                <strong>Total proyectado a revisar:</strong>{' '}
                <span className="font-mono font-extrabold">
                  {formatCop(totals.projectedTotal)} COP
                </span>
              </p>
              <p className="text-slate-600">
                Al aprobar, este monto quedará fijado como Presupuesto Oficial Aprobado 2027 y se
                habilitará el registro de dinero ejecutado real.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">
                  Nombre completo de la Gerente *
                </label>
                <input
                  type="text"
                  placeholder="Ej. María Fernanda Gómez · Gerente General"
                  value={gerenteNombre}
                  onChange={(e) => setGerenteNombre(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0F294A]"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">
                  PIN de autorización de Gerencia *
                </label>
                <input
                  type="password"
                  placeholder="Ingresa el PIN institucional (2027)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#0F294A]">
                  Observaciones de Gerencia (obligatorio si solicita ajustes)
                </label>
                <textarea
                  rows={3}
                  placeholder="Comentarios de aprobación o detalle de ajustes solicitados..."
                  value={observacionesGerencia}
                  onChange={(e) => setObservacionesGerencia(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {reviewError && (
              <p role="alert" className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-xs font-bold text-[#D61F26]">
                {reviewError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-bold text-[#0F294A] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleGerenciaSubmit('En ajuste')}
                className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2 text-xs font-bold text-[#D61F26] hover:bg-[#FEE2E2] cursor-pointer"
              >
                Solicitar ajustes
              </button>
              <button
                type="button"
                onClick={() => handleGerenciaSubmit('Aprobado por Gerencia')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F294A] border-b-2 border-[#FACC15] px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
              >
                <Check className="h-4 w-4 text-[#FACC15]" />
                Aprobar Presupuesto 2027
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación antes de eliminar un ítem del presupuesto */}
      <ConfirmModal
        open={Boolean(pendingDeleteItem)}
        title="¿Eliminar recurso del presupuesto?"
        description={`Se eliminará "${pendingDeleteItem?.recursoMaterial}" del desglose proyectado y el cambio quedará registrado en el historial de auditoría.`}
        confirmLabel="Sí, eliminar recurso"
        onCancel={() => setPendingDeleteItem(null)}
        onConfirm={() => {
          if (pendingDeleteItem) {
            deletePresupuestoCostoItem(pendingDeleteItem.id);
            setPendingDeleteItem(null);
          }
        }}
      />
    </div>
  );
}
