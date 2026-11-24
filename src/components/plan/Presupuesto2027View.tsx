import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  DollarSign,
  FileSpreadsheet,
  Lock,
  Plus,
  ShieldAlert,
  Trash2,
  Unlock,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import { PresupuestoCostoItem } from '../../types/bienestar';
import { downloadSingleExcelFormat } from '../../utils/excelFormatsGenerator';

function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

/**
 * Sección «Presupuesto General 2027»:
 * Presupuesto MiPyme para 10 trabajadores ($2.150.000 COP base), reserva separada para imprevistos,
 * control de ejecución presupuestal y desglose completo de costos por actividad.
 */
export function Presupuesto2027View() {
  const {
    state,
    updatePresupuestoGeneralConfig,
    addPresupuestoCostoItem,
    updatePresupuestoCostoItem,
    deletePresupuestoCostoItem,
    notify,
  } = useBienestar();

  const budget = state.presupuestoGeneral2027;
  const [expandedActId, setExpandedActId] = useState<string>('act-5');
  const [addingForActId, setAddingForActId] = useState<string | null>(null);
  const [exportingKey, setExportingKey] = useState<string | null>(null);

  const [newItemDraft, setNewItemDraft] = useState<Omit<PresupuestoCostoItem, 'id' | 'actividadId'>>({
    recursoMaterial: '',
    cantidad: 1,
    unidadMedida: 'Unidad',
    valorUnitario: 0,
    frecuenciaCompra: 'Única 2027',
    ejecutado: 0,
  });

  const totals = useMemo(() => {
    const subtotalActividades = state.planBienestar.reduce(
      (acc, a) => acc + (a.presupuesto || 0),
      0
    );
    const ejecutadoActividades = state.planBienestar.reduce(
      (acc, a) => acc + (a.presupuestoEjecutado || 0),
      0
    );
    const reservaAsignada = budget.reservaImprevistos || 0;
    const reservaEjecutada = budget.reservaAutorizada
      ? Math.min(reservaAsignada, budget.reservaEjecutada || 0)
      : 0;
    const totalAsignadoMasReserva = subtotalActividades + reservaAsignada;
    const presupuestoAprobado = budget.presupuestoTotalAprobado || 0;
    const totalEjecutado = ejecutadoActividades + reservaEjecutada;
    const disponible = presupuestoAprobado - totalEjecutado;
    const diferenciaAsignacion = presupuestoAprobado - totalAsignadoMasReserva;
    const pctEjecucion =
      presupuestoAprobado > 0
        ? Math.round((totalEjecutado / presupuestoAprobado) * 1000) / 10
        : 0;
    const pctActividadesEjec =
      subtotalActividades > 0
        ? Math.round((ejecutadoActividades / subtotalActividades) * 1000) / 10
        : 0;
    const superaPresupuesto = totalAsignadoMasReserva > presupuestoAprobado;

    return {
      subtotalActividades,
      ejecutadoActividades,
      reservaAsignada,
      reservaEjecutada,
      totalAsignadoMasReserva,
      presupuestoAprobado,
      totalEjecutado,
      disponible,
      diferenciaAsignacion,
      pctEjecucion,
      pctActividadesEjec,
      superaPresupuesto,
      exceso: Math.max(0, totalAsignadoMasReserva - presupuestoAprobado),
    };
  }, [state.planBienestar, budget]);

  const handleUpdateApprovedBudget = (nextApproved: number) => {
    const val = Math.max(0, nextApproved);
    if (totals.totalAsignadoMasReserva > val) {
      notify(
        `Alerta: La suma de asignaciones (${formatCop(totals.totalAsignadoMasReserva)}) supera el presupuesto aprobado (${formatCop(val)}).`,
        'warning'
      );
    }
    updatePresupuestoGeneralConfig({ presupuestoTotalAprobado: val });
  };

  const handleUpdateReserva = (nextReserva: number) => {
    const val = Math.max(0, nextReserva);
    const nextSum = totals.subtotalActividades + val;
    if (nextSum > totals.presupuestoAprobado) {
      notify(
        `Alerta presupuestal: Con esa reserva el total (${formatCop(nextSum)}) supera el presupuesto general aprobado (${formatCop(totals.presupuestoAprobado)}).`,
        'warning'
      );
    }
    updatePresupuestoGeneralConfig({ reservaImprevistos: val });
  };

  const handleItemChange = (
    item: PresupuestoCostoItem,
    patch: Partial<PresupuestoCostoItem>
  ) => {
    const updated: PresupuestoCostoItem = { ...item, ...patch };
    const prevCost = item.cantidad * item.valorUnitario;
    const nextCost = updated.cantidad * updated.valorUnitario;
    const projectedSum = totals.totalAsignadoMasReserva - prevCost + nextCost;

    if (projectedSum > totals.presupuestoAprobado) {
      notify(
        `Alerta: Este ajuste eleva el total a ${formatCop(projectedSum)} y supera el presupuesto general aprobado (${formatCop(totals.presupuestoAprobado)}).`,
        'warning'
      );
    }
    updatePresupuestoCostoItem(updated);
  };

  const handleAddItemSubmit = (e: React.FormEvent, actividadId: string) => {
    e.preventDefault();
    if (!newItemDraft.recursoMaterial.trim()) return;
    const addedCost = Math.max(0, newItemDraft.cantidad) * Math.max(0, newItemDraft.valorUnitario);
    const projectedSum = totals.totalAsignadoMasReserva + addedCost;
    if (projectedSum > totals.presupuestoAprobado) {
      notify(
        `Alerta: Al agregar este ítem el total (${formatCop(projectedSum)}) supera el presupuesto general aprobado (${formatCop(totals.presupuestoAprobado)}). Ajusta los montos o aumenta el presupuesto aprobado.`,
        'warning'
      );
    }
    addPresupuestoCostoItem({
      actividadId,
      ...newItemDraft,
      recursoMaterial: newItemDraft.recursoMaterial.trim(),
    });
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

  const handleExport = async (key: 'presupuesto_general' | 'desglose_presupuestal') => {
    if (exportingKey) return;
    setExportingKey(key);
    try {
      const file = await downloadSingleExcelFormat(key, state);
      notify(`Excel descargado: ${file}`);
    } finally {
      setExportingKey(null);
    }
  };

  return (
    <div className="space-y-7">
      {/* Encabezado de sección y botones Excel */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1 max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#D61F26]">
              MIPYME FRIKAZ S.A.S. · {budget.poblacionTrabajadores} TRABAJADORES · ENERO A DICIEMBRE 2027
            </p>
            <h2 className="font-display text-2xl font-extrabold text-[#0F294A]">
              Presupuesto General 2027
            </h2>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              Planeación financiera realista para una empresa pequeña de 10 trabajadores. Prioriza
              recursos internos, costos desglosados por ítem y control automático frente al tope
              anual aprobado.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleExport('presupuesto_general')}
              disabled={exportingKey !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F294A] border-b-2 border-[#FACC15] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#D61F26] cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#FACC15]" />
              {exportingKey === 'presupuesto_general'
                ? 'Generando...'
                : 'Descargar Presupuesto General (.xlsx)'}
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
                : 'Descargar Desglose por Actividad (.xlsx)'}
            </button>
          </div>
        </div>

        {/* Alerta automática cuando se supera el presupuesto general */}
        {totals.superaPresupuesto && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border-2 border-[#D61F26] bg-[#FEF2F2] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#D61F26]" />
              <div className="text-xs text-[#0F294A]">
                <p className="font-extrabold text-[#D61F26]">
                  ALERTA PRESUPUESTAL: La suma de asignaciones y reserva supera el presupuesto
                  general aprobado.
                </p>
                <p className="mt-1">
                  Asignado actividades ({formatCop(totals.subtotalActividades)}) + Reserva (
                  {formatCop(totals.reservaAsignada)}) ={' '}
                  <strong>{formatCop(totals.totalAsignadoMasReserva)}</strong> · Tope aprobado:{' '}
                  <strong>{formatCop(totals.presupuestoAprobado)}</strong> · Exceso:{' '}
                  <strong className="text-[#D61F26]">{formatCop(totals.exceso)}</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleUpdateApprovedBudget(totals.totalAsignadoMasReserva)}
              className="rounded-lg bg-[#D61F26] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#B3161C] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ajustar aprobado a {formatCop(totals.totalAsignadoMasReserva)}
            </button>
          </div>
        )}
      </section>

      {/* Tarjetas de control automático */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border-2 border-[#0F294A] bg-white p-5">
          <label
            htmlFor="presupuesto-total-aprobado"
            className="flex items-center justify-between text-xs font-extrabold text-[#0F294A]"
          >
            <span>Presupuesto Total Aprobado</span>
            <DollarSign className="h-4 w-4 text-[#D61F26]" />
          </label>
          <input
            id="presupuesto-total-aprobado"
            type="number"
            min={0}
            step={10000}
            value={budget.presupuestoTotalAprobado}
            onChange={(e) => handleUpdateApprovedBudget(Number(e.target.value) || 0)}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3 py-1.5 font-display text-xl font-extrabold text-[#0F294A] tabular-nums focus:border-[#D61F26] focus:bg-white focus:outline-none"
          />
          <p className="mt-1.5 text-[11px] text-slate-500">
            Editable · Base inicial: $2.150.000 COP
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold text-slate-500">Subtotal 9 Actividades</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-[#0F294A] tabular-nums">
            {formatCop(totals.subtotalActividades)}
          </p>
          <p className="mt-1 text-[11px] text-slate-600 tabular-nums">
            Sin reserva · Margen sin asignar:{' '}
            <strong className={totals.diferenciaAsignacion < 0 ? 'text-[#D61F26]' : 'text-emerald-700'}>
              {formatCop(totals.diferenciaAsignacion)}
            </strong>
          </p>
        </div>

        <div className="rounded-2xl border border-[#FDE047] bg-[#FFFBEB] p-5">
          <p className="text-xs font-bold text-[#0F294A]">Dinero Ejecutado</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-[#D61F26] tabular-nums">
            {formatCop(totals.totalEjecutado)}
          </p>
          <p className="mt-1 text-[11px] text-[#0F294A]/75 tabular-nums">
            Ejecución presupuestal: <strong>{totals.pctEjecucion}%</strong>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold text-slate-500">Dinero Disponible</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-emerald-700 tabular-nums">
            {formatCop(totals.disponible)}
          </p>
          <p className="mt-1 text-[11px] text-slate-600 tabular-nums">
            Diferencia (Presup. − Ejec.): {formatCop(totals.disponible)}
          </p>
        </div>

        <div className="rounded-2xl border border-[#0F294A]/20 bg-[#EFF6FF] p-5">
          <div className="flex items-center justify-between text-xs font-extrabold text-[#0F294A]">
            <span>Reserva Imprevistos</span>
            {budget.reservaAutorizada ? (
              <Unlock className="h-4 w-4 text-[#D61F26]" />
            ) : (
              <Lock className="h-4 w-4 text-[#0F294A]" />
            )}
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold text-[#0F294A] tabular-nums">
            {formatCop(totals.reservaAsignada)}
          </p>
          <p className="mt-1 text-[11px] text-[#0F294A]/75">
            {budget.reservaAutorizada
              ? `Autorizada (${formatCop(totals.reservaEjecutada)} ejecutados)`
              : 'Separada · No contabilizada como ejecutada'}
          </p>
        </div>
      </section>

      {/* Panel de Reserva para imprevistos (control estricto de autorización) */}
      <section className="rounded-2xl border border-[#0F294A]/15 bg-white p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#D61F26]" />
            <div>
              <h3 className="font-display text-base font-extrabold text-[#0F294A]">
                Control de Reserva para Imprevistos 2027
              </h3>
              <p className="text-xs text-slate-600">
                Se mantiene separada del gasto operativo y no se suma al dinero ejecutado hasta que
                exista autorización formal de Gerencia.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              updatePresupuestoGeneralConfig({
                reservaAutorizada: !budget.reservaAutorizada,
                reservaEjecutada: !budget.reservaAutorizada ? budget.reservaEjecutada : 0,
              })
            }
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              budget.reservaAutorizada
                ? 'bg-[#D61F26] text-white'
                : 'border border-slate-300 bg-slate-50 text-[#0F294A] hover:bg-[#FEF9C3]'
            }`}
          >
            {budget.reservaAutorizada ? (
              <>
                <Unlock className="h-3.5 w-3.5" />
                Reserva autorizada (clic para bloquear)
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" />
                Autorizar uso de reserva
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          <div>
            <label className="mb-1 block font-bold text-[#0F294A]">
              Valor de reserva asignado (COP)
            </label>
            <input
              type="number"
              min={0}
              step={10000}
              value={budget.reservaImprevistos}
              onChange={(e) => handleUpdateReserva(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono font-bold text-[#0F294A]"
            />
          </div>
          <div>
            <label className="mb-1 block font-bold text-[#0F294A]">
              Monto ejecutado de reserva (requiere autorización)
            </label>
            <input
              type="number"
              min={0}
              max={budget.reservaImprevistos}
              step={5000}
              disabled={!budget.reservaAutorizada}
              value={budget.reservaAutorizada ? budget.reservaEjecutada : 0}
              onChange={(e) =>
                updatePresupuestoGeneralConfig({
                  reservaEjecutada: Math.min(
                    budget.reservaImprevistos,
                    Math.max(0, Number(e.target.value) || 0)
                  ),
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono font-bold text-[#0F294A] disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>
          <div>
            <label className="mb-1 block font-bold text-[#0F294A]">
              Soporte / motivo de autorización
            </label>
            <input
              type="text"
              disabled={!budget.reservaAutorizada}
              placeholder={
                budget.reservaAutorizada
                  ? 'Ej. Acta #04 aprobada por Gerencia'
                  : 'Bloqueado hasta autorización'
              }
              value={budget.reservaMotivoAutorizacion}
              onChange={(e) =>
                updatePresupuestoGeneralConfig({ reservaMotivoAutorizacion: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs disabled:bg-slate-100"
            />
          </div>
        </div>
      </section>

      {/* Tabla consolidada de distribución presupuestal + Desglose por actividad */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="font-display text-lg font-extrabold text-[#0F294A]">
            Distribución y Desglose de Costos por Actividad (9 Actividades)
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Haz clic en cualquier actividad para consultar, editar o agregar sus recursos,
            cantidades, unidades de medida, valor unitario, valor total y dinero ejecutado.
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {state.planBienestar.map((act, idx) => {
            const actItems = budget.items.filter((it) => it.actividadId === act.id);
            const isOpen = expandedActId === act.id;
            const disponibleAct = (act.presupuesto || 0) - (act.presupuestoEjecutado || 0);
            const pctAct =
              act.presupuesto > 0
                ? Math.round(((act.presupuestoEjecutado || 0) / act.presupuesto) * 100)
                : 0;

            return (
              <div key={act.id} className="bg-white">
                {/* Fila resumen de actividad */}
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
                    </div>
                    <p className="font-display text-base font-extrabold text-[#0F294A]">
                      {act.actividad}
                    </p>
                    <p className="text-xs text-slate-500">{act.frecuencia}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-5 text-xs tabular-nums">
                    <div>
                      <span className="block text-[11px] text-slate-500">Presupuestado</span>
                      <span className="font-mono text-sm font-extrabold text-[#0F294A]">
                        {formatCop(act.presupuesto)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">Ejecutado</span>
                      <span className="font-mono text-sm font-bold text-[#D61F26]">
                        {formatCop(act.presupuestoEjecutado)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">Disponible</span>
                      <span className="font-mono text-sm font-bold text-emerald-700">
                        {formatCop(disponibleAct)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">% Ejec.</span>
                      <span className="font-mono text-sm font-extrabold text-[#0F294A]">
                        {pctAct}%
                      </span>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-1.5 text-[#0F294A]">
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Desglose de recursos/materiales de la actividad */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-[#F8FAFC] px-6 py-5 space-y-4">
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full min-w-[820px] border-collapse text-xs">
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
                              Valor total
                            </th>
                            <th className="border border-slate-300 px-3 py-2 text-left w-44">
                              Frecuencia de compra
                            </th>
                            <th className="border border-slate-300 px-2 py-2 text-right w-28">
                              Ejecutado (COP)
                            </th>
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
                                <td className="border border-slate-200 px-2 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => deletePresupuestoCostoItem(it.id)}
                                    className="rounded p-1 text-slate-400 hover:bg-[#FEE2E2] hover:text-[#D61F26]"
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

                    {/* Botón o formulario rápido para agregar recurso a esta actividad */}
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
                            placeholder="Cantidad"
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
                            placeholder="Unidad (ej. Unidad)"
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
                            placeholder="Valor unitario COP"
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
                            placeholder="Frecuencia de compra"
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
                            Total calculado:{' '}
                            {formatCop(newItemDraft.cantidad * newItemDraft.valorUnitario)}
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setAddingForActId(null)}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-[#0F294A]"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 rounded-lg bg-[#D61F26] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#B3161C]"
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
            Subtotal 9 actividades: <strong>{formatCop(totals.subtotalActividades)}</strong> +
            Reserva para imprevistos: <strong>{formatCop(totals.reservaAsignada)}</strong>
          </div>
          <div className="font-display text-base font-extrabold text-[#FACC15] tabular-nums">
            TOTAL GENERAL ASIGNADO: {formatCop(totals.totalAsignadoMasReserva)}
          </div>
        </div>
      </section>
    </div>
  );
}
