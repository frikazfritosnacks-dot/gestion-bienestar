import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CalendarCheck,
  Check,
  ExternalLink,
  Filter,
  Globe,
  Handshake,
  Info,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import {
  ConvenioEstadoGestion,
  ConvenioItem,
  ConvenioTipoBeneficio,
  ConvenioTipoEntidad,
} from '../../types/bienestar';
import { ConfirmModal } from '../ui/ConfirmModal';

const TIPOS_ENTIDAD: ConvenioTipoEntidad[] = [
  'Caja de Compensación Familiar',
  'SENA',
  'EPS',
  'ARL',
  'Otra institución',
];

const TIPOS_BENEFICIO: ConvenioTipoBeneficio[] = [
  'Gratuito por afiliación / ley',
  'Gratuito público',
  'Subsidiado / Tarifa afiliado',
  'Con costo empresarial / a cotizar',
];

const ESTADOS_GESTION: ConvenioEstadoGestion[] = [
  'Por consultar',
  'Contactada',
  'En negociación',
  'Convenio establecido',
  'No aplica',
];

const ACTIVIDADES_FILTER_OPTIONS = [
  'Pausas activas',
  'Juegos de mesa',
  'Finanzas personales',
  'Bonos familiares',
  'Desayunos comunitarios',
  'Celebración de cumpleaños',
  'Flexibilidad de horarios',
  'Apoyo educativo para los hijos',
  'Trabajador del mes',
  'Transversal al Plan de Bienestar',
];

const EMPTY_CONVENIO: Omit<ConvenioItem, 'id'> = {
  nombreConvenio: '',
  entidad: '',
  tipoEntidad: 'Otra institución',
  actividadesPlan: ['Transversal al Plan de Bienestar'],
  serviciosProgramas: '',
  datosContacto: 'Información no disponible en la fuente oficial consultada',
  beneficios: '',
  requisitosCondiciones: '',
  condicionesMiPyme: '',
  paginaWebOficial: '',
  enlaceDirecto: '',
  tipoBeneficio: 'Gratuito por afiliación / ley',
  estadoGestion: 'Por consultar',
  fuenteVerificacion: 'Registro directo de Gerencia Frikaz S.A.S.',
  fechaVerificacion: '27/11/2026',
  esConvenioVigente: false,
  vigencia: 'Por consultar / sujeto a gestión con Gerencia',
  responsable: 'Gerente',
};

function getEstadoBadgeStyle(estado?: ConvenioEstadoGestion): string {
  switch (estado) {
    case 'Convenio establecido':
      return 'border-emerald-300 bg-emerald-50 text-emerald-800';
    case 'En negociación':
      return 'border-amber-300 bg-amber-50 text-amber-900';
    case 'Contactada':
      return 'border-sky-300 bg-sky-50 text-sky-900';
    case 'No aplica':
      return 'border-slate-300 bg-slate-100 text-slate-600';
    default:
      return 'border-[#FCA5A5] bg-[#FEF2F2] text-[#D61F26]';
  }
}

export function ConveniosManager() {
  const { state, addConvenio, updateConvenio, deleteConvenio } = useBienestar();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ConvenioItem | null>(null);
  const [form, setForm] = useState<Omit<ConvenioItem, 'id'>>(EMPTY_CONVENIO);
  const [pendingDelete, setPendingDelete] = useState<ConvenioItem | null>(null);

  // Filtros interactivos
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipoEntidad, setFilterTipoEntidad] = useState<string>('ALL');
  const [filterActividad, setFilterActividad] = useState<string>('ALL');
  const [filterTipoBeneficio, setFilterTipoBeneficio] = useState<string>('ALL');
  const [filterEstado, setFilterEstado] = useState<string>('ALL');

  const filteredConvenios = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.convenios.filter((conv) => {
      if (filterTipoEntidad !== 'ALL' && conv.tipoEntidad !== filterTipoEntidad) return false;
      if (filterTipoBeneficio !== 'ALL' && conv.tipoBeneficio !== filterTipoBeneficio) return false;
      if (filterEstado !== 'ALL' && (conv.estadoGestion || 'Por consultar') !== filterEstado) {
        return false;
      }
      if (filterActividad !== 'ALL') {
        const acts = conv.actividadesPlan || [];
        if (!acts.some((a) => a.toLowerCase().includes(filterActividad.toLowerCase()))) return false;
      }
      if (q) {
        const haystack = [
          conv.entidad,
          conv.nombreConvenio,
          conv.tipoEntidad,
          conv.serviciosProgramas,
          conv.beneficios,
          conv.datosContacto,
          ...(conv.actividadesPlan || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    state.convenios,
    searchQuery,
    filterTipoEntidad,
    filterActividad,
    filterTipoBeneficio,
    filterEstado,
  ]);

  const counts = useMemo(() => {
    const byStatus = {
      porConsultar: 0,
      enGestion: 0,
      establecidos: 0,
    };
    state.convenios.forEach((c) => {
      const est = c.estadoGestion || 'Por consultar';
      if (est === 'Convenio establecido') byStatus.establecidos += 1;
      else if (est === 'Contactada' || est === 'En negociación') byStatus.enGestion += 1;
      else if (est === 'Por consultar') byStatus.porConsultar += 1;
    });
    return byStatus;
  }, [state.convenios]);

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
      tipoEntidad: item.tipoEntidad || 'Otra institución',
      actividadesPlan: item.actividadesPlan || [],
      serviciosProgramas: item.serviciosProgramas || '',
      datosContacto: item.datosContacto,
      beneficios: item.beneficios,
      requisitosCondiciones: item.requisitosCondiciones || '',
      condicionesMiPyme: item.condicionesMiPyme || '',
      paginaWebOficial: item.paginaWebOficial || '',
      enlaceDirecto: item.enlaceDirecto || item.paginaWebOficial || '',
      tipoBeneficio: item.tipoBeneficio || 'Gratuito por afiliación / ley',
      estadoGestion: item.estadoGestion || 'Por consultar',
      fuenteVerificacion: item.fuenteVerificacion || '',
      fechaVerificacion: item.fechaVerificacion || '27/11/2026',
      esConvenioVigente: item.estadoGestion === 'Convenio establecido',
      vigencia: item.vigencia,
      responsable: item.responsable || 'Gerente',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombreConvenio.trim() || !form.entidad.trim()) return;
    const payload: Omit<ConvenioItem, 'id'> = {
      ...form,
      esConvenioVigente: form.estadoGestion === 'Convenio establecido',
    };
    if (editing) {
      updateConvenio({ ...payload, id: editing.id });
    } else {
      addConvenio(payload);
    }
    setModalOpen(false);
  };

  const handleInlineEstadoChange = (conv: ConvenioItem, nextEstado: ConvenioEstadoGestion) => {
    updateConvenio({
      ...conv,
      estadoGestion: nextEstado,
      esConvenioVigente: nextEstado === 'Convenio establecido',
    });
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterTipoEntidad !== 'ALL' ||
    filterActividad !== 'ALL' ||
    filterTipoBeneficio !== 'ALL' ||
    filterEstado !== 'ALL';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterTipoEntidad('ALL');
    setFilterActividad('ALL');
    setFilterTipoBeneficio('ALL');
    setFilterEstado('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Encabezado del módulo */}
      <section
        data-submodule-surface="true"
        data-piggy-context="programas:convenios"
        className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1 max-w-3xl">
          <h2 className="font-display text-lg font-extrabold text-[#0F294A] sm:text-xl">
            Convenios y Alianzas Estratégicas (Directorio Verificado Colombia)
          </h2>
          <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
            Opciones reales de contacto y gestión ante Cajas de Compensación Familiar, SENA, EPS,
            ARL e instituciones públicas para apoyar las actividades del Plan de Bienestar 2027 de
            Frikaz S.A.S. (10 trabajadores).
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[#D61F26] border-b-2 border-[#FACC15] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#B3161C] cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4 text-[#FACC15]" />
          Agregar opción o convenio
        </button>
      </section>

      {/* Aviso obligatorio sobre el carácter informativo / no firmado */}
      <section className="rounded-2xl border-2 border-[#FDE047] bg-[#FFFBEB] p-5 space-y-2.5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#D61F26]" />
          <div className="space-y-1.5 text-xs leading-relaxed text-[#0F294A]">
            <p className="font-extrabold text-sm">
              Nota aclaratoria importante: Opciones de contacto y gestión, NO convenios vigentes
              firmados
            </p>
            <p>
              Las entidades presentadas a continuación corresponden a{' '}
              <strong>opciones reales verificadas en fuentes oficiales de Colombia</strong> (con
              fecha de consulta <strong>27/11/2026</strong>) que la <strong>Gerente</strong> de
              Frikaz S.A.S. puede contactar o gestionar según afiliación vigente (Caja de
              Compensación, EPS, ARL) o programas públicos (SENA, IDRD, Asobancaria).{' '}
              <strong>
                No representan convenios firmados ni acuerdos activos actualmente con Frikaz S.A.S.
              </strong>
            </p>
            <p className="text-slate-700">
              <Info className="mr-1 inline h-3.5 w-3.5 text-[#0F294A]" />
              Asimismo, acciones internas como <strong>Flexibilidad de horarios</strong>,{' '}
              <strong>Celebración de cumpleaños</strong>, <strong>Trabajador del mes</strong>,{' '}
              <strong>Desayunos comunitarios</strong> y <strong>Bonos familiares</strong> se
              administran principalmente de forma interna bajo dirección de la Gerente.
            </p>
          </div>
        </div>
      </section>

      {/* Resumen cuantitativo + Barra de filtros */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <p className="text-[11px] font-semibold text-slate-500">Entidades registradas</p>
            <p className="font-mono text-lg font-extrabold text-[#0F294A] tabular-nums">
              {state.convenios.length}
            </p>
          </div>
          <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2.5">
            <p className="text-[11px] font-semibold text-[#D61F26]">Por consultar</p>
            <p className="font-mono text-lg font-extrabold text-[#D61F26] tabular-nums">
              {counts.porConsultar}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
            <p className="text-[11px] font-semibold text-amber-800">En gestión / contacto</p>
            <p className="font-mono text-lg font-extrabold text-amber-900 tabular-nums">
              {counts.enGestion}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
            <p className="text-[11px] font-semibold text-emerald-800">Convenios establecidos</p>
            <p className="font-mono text-lg font-extrabold text-emerald-800 tabular-nums">
              {counts.establecidos}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#0F294A]">
              <Filter className="h-4 w-4 text-[#D61F26]" />
              <span>Filtrar directorio de entidades y programas</span>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-[#D61F26] hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Limpiar filtros ({filteredConvenios.length} mostradas)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar entidad o servicio..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs text-[#0F294A]"
              />
            </div>

            <select
              value={filterTipoEntidad}
              onChange={(e) => setFilterTipoEntidad(e.target.value)}
              aria-label="Filtrar por tipo de entidad"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#0F294A]"
            >
              <option value="ALL">Todos los tipos de entidad</option>
              {TIPOS_ENTIDAD.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>

            <select
              value={filterActividad}
              onChange={(e) => setFilterActividad(e.target.value)}
              aria-label="Filtrar por actividad del Plan"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#0F294A]"
            >
              <option value="ALL">Todas las actividades del Plan</option>
              {ACTIVIDADES_FILTER_OPTIONS.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>

            <select
              value={filterTipoBeneficio}
              onChange={(e) => setFilterTipoBeneficio(e.target.value)}
              aria-label="Filtrar por tipo de beneficio"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#0F294A]"
            >
              <option value="ALL">Todos los tipos de beneficio</option>
              {TIPOS_BENEFICIO.map((tb) => (
                <option key={tb} value={tb}>
                  {tb}
                </option>
              ))}
            </select>

            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              aria-label="Filtrar por estado de gestión"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#0F294A]"
            >
              <option value="ALL">Todos los estados de gestión</option>
              {ESTADOS_GESTION.map((est) => (
                <option key={est} value={est}>
                  {est}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Fichas de entidades verificadas */}
      {filteredConvenios.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          No se encontraron entidades con los filtros seleccionados. Usa &quot;Limpiar filtros&quot;
          para ver todas las opciones registradas.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredConvenios.map((conv) => {
            const officialUrl = conv.enlaceDirecto || conv.paginaWebOficial;
            return (
              <article
                key={conv.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-sm space-y-4"
              >
                <div className="space-y-4">
                  {/* Encabezado de tarjeta */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#FACC15] bg-[#FFFBEB] text-[#D61F26]">
                        <Handshake className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                          <span className="rounded-md bg-[#EFF6FF] px-2 py-0.5 text-[#0F294A]">
                            {conv.tipoEntidad || 'Institución aliada'}
                          </span>
                          {conv.tipoBeneficio && (
                            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-amber-900 border border-amber-200">
                              {conv.tipoBeneficio}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-1 font-display text-base font-extrabold text-[#0F294A]">
                          {conv.entidad}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-[#D61F26]">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          {conv.nombreConvenio}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(conv)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-[#FEF9C3] hover:text-[#0F294A]"
                        aria-label={`Editar ${conv.entidad}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(conv)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-[#FEE2E2] hover:text-[#D61F26] cursor-pointer"
                        aria-label={`Eliminar ${conv.entidad}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Actividades del Plan relacionadas */}
                  {conv.actividadesPlan && conv.actividadesPlan.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {conv.actividadesPlan.map((act) => (
                        <span
                          key={act}
                          className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-[#0F294A]"
                        >
                          {act}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Servicios / programas y beneficios */}
                  <div className="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs leading-relaxed text-slate-700">
                    {conv.serviciosProgramas && (
                      <div>
                        <strong className="text-[#0F294A]">Servicios o programas que ofrece:</strong>{' '}
                        {conv.serviciosProgramas}
                      </div>
                    )}
                    <div>
                      <strong className="text-[#0F294A]">Beneficios diferenciados:</strong>{' '}
                      {conv.beneficios}
                    </div>
                    {conv.requisitosCondiciones && (
                      <div>
                        <strong className="text-[#0F294A]">Requisitos o condiciones:</strong>{' '}
                        {conv.requisitosCondiciones}
                      </div>
                    )}
                    {conv.condicionesMiPyme && (
                      <div>
                        <strong className="text-[#0F294A]">
                          Condiciones para empresa pequeña (10 trabajadores):
                        </strong>{' '}
                        {conv.condicionesMiPyme}
                      </div>
                    )}
                  </div>

                  {/* Contacto, URL oficial, verificación y vigencia */}
                  <dl className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0F294A]" />
                      <div>
                        <strong className="text-[#0F294A]">Datos de contacto publicados:</strong>{' '}
                        {conv.datosContacto}
                      </div>
                    </div>
                    {conv.paginaWebOficial && (
                      <div className="flex items-start gap-2">
                        <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0F294A]" />
                        <div className="break-all">
                          <strong className="text-[#0F294A]">Página web oficial:</strong>{' '}
                          <a
                            href={conv.paginaWebOficial}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-[#0F294A] underline hover:text-[#D61F26]"
                          >
                            {conv.paginaWebOficial}
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <CalendarCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D61F26]" />
                      <div>
                        <strong className="text-[#0F294A]">Estado / vigencia:</strong>{' '}
                        {conv.vigencia}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <UserCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D97706]" />
                      <div>
                        <strong className="text-[#0F294A]">Responsable de gestión:</strong>{' '}
                        {conv.responsable}
                      </div>
                    </div>
                    {(conv.fuenteVerificacion || conv.fechaVerificacion) && (
                      <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500">
                        <strong className="text-[#0F294A]">Fuente y verificación:</strong>{' '}
                        {conv.fuenteVerificacion || 'Sitio web oficial'} · Consultado:{' '}
                        {conv.fechaVerificacion || '27/11/2026'}
                      </div>
                    )}
                  </dl>
                </div>

                {/* Pie de tarjeta: selector editable de Estado de gestión + Enlace directo */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`estado-${conv.id}`}
                      className="text-[11px] font-bold text-[#0F294A]"
                    >
                      Estado:
                    </label>
                    <select
                      id={`estado-${conv.id}`}
                      value={conv.estadoGestion || 'Por consultar'}
                      onChange={(e) =>
                        handleInlineEstadoChange(conv, e.target.value as ConvenioEstadoGestion)
                      }
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold cursor-pointer ${getEstadoBadgeStyle(
                        conv.estadoGestion
                      )}`}
                    >
                      {ESTADOS_GESTION.map((est) => (
                        <option key={est} value={est}>
                          {est}
                        </option>
                      ))}
                    </select>
                  </div>

                  {officialUrl && (
                    <a
                      href={officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F294A] px-3 py-1.5 text-xs font-bold text-[#FACC15] hover:bg-[#D61F26] hover:text-white transition-colors"
                    >
                      Abrir enlace oficial
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal de creación / edición */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F294A]/45 p-4 pt-16 backdrop-blur-[1px]">
          <form
            data-piggy-modal-surface="true"
            data-piggy-context="convenios:modal"
            onSubmit={handleSubmit}
            className="max-h-[calc(100vh-5.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-extrabold text-[#0F294A]">
                {editing ? 'Editar entidad o gestión' : 'Registrar nueva entidad o convenio'}
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Nombre oficial de la entidad *
                </label>
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
                  Programa o línea de gestión *
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
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Tipo de entidad
                </label>
                <select
                  value={form.tipoEntidad || 'Otra institución'}
                  onChange={(e) => setForm({ ...form, tipoEntidad: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {TIPOS_ENTIDAD.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Tipo de beneficio
                </label>
                <select
                  value={form.tipoBeneficio || 'Gratuito por afiliación / ley'}
                  onChange={(e) => setForm({ ...form, tipoBeneficio: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {TIPOS_BENEFICIO.map((tb) => (
                    <option key={tb} value={tb}>
                      {tb}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Servicios o programas que ofrece
                </label>
                <textarea
                  rows={2}
                  value={form.serviciosProgramas || ''}
                  onChange={(e) => setForm({ ...form, serviciosProgramas: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">Beneficios *</label>
                <textarea
                  rows={2}
                  required
                  value={form.beneficios}
                  onChange={(e) => setForm({ ...form, beneficios: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Requisitos y condiciones para empresa pequeña (10 trabajadores)
                </label>
                <textarea
                  rows={2}
                  value={form.requisitosCondiciones || ''}
                  onChange={(e) => setForm({ ...form, requisitosCondiciones: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Datos de contacto publicados *
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
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Página web oficial (URL)
                </label>
                <input
                  type="url"
                  value={form.paginaWebOficial || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paginaWebOficial: e.target.value,
                      enlaceDirecto: form.enlaceDirecto || e.target.value,
                    })
                  }
                  placeholder="https://..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#0F294A]">
                  Estado de gestión
                </label>
                <select
                  value={form.estadoGestion || 'Por consultar'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      estadoGestion: e.target.value as ConvenioEstadoGestion,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {ESTADOS_GESTION.map((est) => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
                </select>
              </div>
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
                Guardar opción
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="¿Eliminar entidad o convenio?"
        description={`Se eliminará "${pendingDelete?.entidad}" (${pendingDelete?.nombreConvenio}) del directorio.`}
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
