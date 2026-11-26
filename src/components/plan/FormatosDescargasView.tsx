import { useRef, useState } from 'react';
import {
  Archive,
  Award,
  BarChart3,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  Layers,
  RotateCcw,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { useBienestar } from '../../context/BienestarContext';
import {
  downloadAllInstitutionalFormatsZip,
  downloadSingleExcelFormat,
  FormatoExcelKey,
  triggerBlobDownload,
} from '../../utils/excelFormatsGenerator';
import { FormatoWordKey, generateWordFormatBlob } from '../../utils/wordFormatsGenerator';
import { ConfirmModal } from '../ui/ConfirmModal';
import { InstitutionalQualityBox } from '../ui/InstitutionalQualityBox';

type CategoriaFormato =
  | 'Planificación'
  | 'Presupuesto'
  | 'Cronograma'
  | 'Asistencia'
  | 'Encuestas'
  | 'Seguimiento'
  | 'Evaluación'
  | 'Reconocimientos';

const CATEGORIAS_ORDEN: Array<{
  id: CategoriaFormato;
  icon: typeof FileText;
  descripcion: string;
}> = [
  { id: 'Planificación', icon: Layers, descripcion: 'Portada 2027, planificación general, fichas técnicas y convenios.' },
  { id: 'Presupuesto', icon: DollarSign, descripcion: 'Presupuesto general 2027 (formato en blanco) y desglose por actividad.' },
  { id: 'Cronograma', icon: CalendarRange, descripcion: 'Cronograma anual 2027 (15 parámetros) y Diagrama de Gantt 2027.' },
  { id: 'Asistencia', icon: ClipboardList, descripcion: 'Listas de asistencia oficiales en Word y Excel editable.' },
  { id: 'Encuestas', icon: ClipboardCheck, descripcion: 'Cuestionarios en Word, tabulación automática y base de datos.' },
  { id: 'Seguimiento', icon: TrendingUp, descripcion: 'Actas, evidencias, seguimiento de actividades y compromisos.' },
  { id: 'Evaluación', icon: BarChart3, descripcion: 'Informe de resultados, plan de mejora e indicadores globales.' },
  { id: 'Reconocimientos', icon: Award, descripcion: 'Entrega de bonos familiares y registro del Trabajador del Mes.' },
];

interface FormatoCatalogItem {
  id: string;
  categoria: CategoriaFormato;
  tipo: 'word' | 'excel';
  key: FormatoWordKey | FormatoExcelKey;
  titulo: string;
  descripcion: string;
  perActivity?: boolean;
}

const CATALOGO_FORMATOS: FormatoCatalogItem[] = [
  // Planificación
  { id: 'w-portada', categoria: 'Planificación', tipo: 'word', key: 'portada', titulo: 'Portada del Plan Anual de Bienestar 2027', descripcion: 'Portada institucional 2027 con Caja de Calidad y campos de aprobación en blanco.' },
  { id: 'w-planif', categoria: 'Planificación', tipo: 'word', key: 'planificacion', titulo: 'Documento de planificación general del programa', descripcion: 'Objetivo general, alcance, 8 dimensiones y casillas en blanco de ejecución.' },
  { id: 'w-ficha', categoria: 'Planificación', tipo: 'word', key: 'ficha', titulo: 'Ficha técnica individual por actividad (9 actividades)', descripcion: 'Parámetros de la actividad seleccionada y tabla de ejecución en blanco.', perActivity: true },
  { id: 'w-convenios', categoria: 'Planificación', tipo: 'word', key: 'convenios', titulo: 'Formato de registro de convenios', descripcion: 'Planilla en blanco de alianzas vigentes, beneficios, contacto y vigencia.' },
  // Presupuesto
  { id: 'x-pres-gral', categoria: 'Presupuesto', tipo: 'excel', key: 'presupuesto_general', titulo: 'Presupuesto general anual 2027', descripcion: 'Asignado vs. ejecutado, disponible, diferencia y % con fórmulas automáticas.' },
  { id: 'x-desglose', categoria: 'Presupuesto', tipo: 'excel', key: 'desglose_presupuestal', titulo: 'Desglose presupuestal por actividad', descripcion: 'Recurso, cantidad, unidad, valor unitario y total (=Cantidad*Unitario).' },
  // Cronograma
  { id: 'x-crono', categoria: 'Cronograma', tipo: 'excel', key: 'cronograma_anual', titulo: 'Cronograma anual 2027', descripcion: 'Estructura en blanco con los 15 parámetros del plan anual.' },
  { id: 'x-gantt', categoria: 'Cronograma', tipo: 'excel', key: 'diagrama_gantt', titulo: 'Diagrama de Gantt 2027', descripcion: 'Bloques mensuales Ene–Dic 2027 en blanco con conteos automáticos (=COUNTIF).' },
  // Asistencia
  { id: 'w-asist', categoria: 'Asistencia', tipo: 'word', key: 'asistencia', titulo: 'Formato de lista de asistencia (imprimible)', descripcion: 'Planilla formal en Word lista para firma física y archivo.', perActivity: true },
  { id: 'x-asist', categoria: 'Asistencia', tipo: 'excel', key: 'asistencia', titulo: 'Lista de asistencia editable', descripcion: 'Libro Excel en blanco con filtros y conteo automático de asistentes (=COUNTA).' },
  // Encuestas
  { id: 'w-enc', categoria: 'Encuestas', tipo: 'word', key: 'encuesta', titulo: 'Formato de encuesta de satisfacción por actividad', descripcion: 'Cuestionario específico de la actividad elegida con escala 1–5 en blanco.', perActivity: true },
  { id: 'x-enc', categoria: 'Encuestas', tipo: 'excel', key: 'encuesta', titulo: 'Encuestas de satisfacción y consolidación', descripcion: 'Tabulación automática (=AVERAGE) + hoja de cuestionarios específicos.' },
  { id: 'x-bd-enc', categoria: 'Encuestas', tipo: 'excel', key: 'bd_encuestas', titulo: 'Base de datos de resultados de encuestas', descripcion: 'Histórico normalizado en blanco + tablero dinámico (=COUNTIF / =AVERAGEIF).' },
  // Seguimiento
  { id: 'w-acta', categoria: 'Seguimiento', tipo: 'word', key: 'acta', titulo: 'Formato de acta de ejecución de actividades', descripcion: 'Acta diligenciable en blanco de jornada, recursos ejecutados y compromisos.' },
  { id: 'w-evid', categoria: 'Seguimiento', tipo: 'word', key: 'evidencias', titulo: 'Formato de registro de evidencias', descripcion: 'Control documental en blanco de soportes fotográficos y planillas 2027.' },
  { id: 'w-comp', categoria: 'Seguimiento', tipo: 'word', key: 'compromisos', titulo: 'Formato de seguimiento de compromisos', descripcion: 'Matriz en blanco de compromisos, responsables, fechas pactadas y cierre.' },
  { id: 'x-seg', categoria: 'Seguimiento', tipo: 'excel', key: 'seguimiento', titulo: 'Seguimiento de ejecución de actividades', descripcion: 'Estado, cumplimiento promedio (=AVERAGE), metas y evidencias.' },
  { id: 'x-evid', categoria: 'Seguimiento', tipo: 'excel', key: 'control_evidencias', titulo: 'Control de evidencias', descripcion: 'Seguimiento de archivo y % de verificación documental (=COUNTIF).' },
  // Evaluación
  { id: 'w-inf', categoria: 'Evaluación', tipo: 'word', key: 'informe', titulo: 'Formato de informe de resultados', descripcion: 'Informe ejecutivo en blanco con indicadores y espacio de conclusiones.' },
  { id: 'w-mej', categoria: 'Evaluación', tipo: 'word', key: 'mejora', titulo: 'Formato de plan de mejora', descripcion: 'Acciones correctivas y preventivas en blanco derivadas de evaluaciones.' },
  { id: 'x-ind', categoria: 'Evaluación', tipo: 'excel', key: 'indicadores', titulo: 'Indicadores de cumplimiento del Plan de Bienestar', descripcion: 'Tablero integral en blanco de asistencia, satisfacción y ejecución.' },
  // Reconocimientos
  { id: 'w-bonos', categoria: 'Reconocimientos', tipo: 'word', key: 'bonos', titulo: 'Formato de registro de entrega de bonos y reconocimientos', descripcion: 'Planilla en blanco de recibo firmado para bonos familiares y Trabajador del Mes.' },
  { id: 'x-bonos', categoria: 'Reconocimientos', tipo: 'excel', key: 'entrega_bonos', titulo: 'Control de entrega de bonos', descripcion: 'Planilla en blanco con fórmula automática de total entregado por trabajador.' },
  { id: 'x-tmes', categoria: 'Reconocimientos', tipo: 'excel', key: 'trabajador_mes', titulo: 'Registro de reconocimientos al trabajador del mes', descripcion: 'Planilla anual en blanco Ene–Dic 2027 con suma automática.' },
];

/**
 * Sección independiente «Formatos institucionales» organizada por las 8 categorías
 * con los 12 formatos reales en Word (.docx) y 12 archivos reales en Excel (.xlsx),
 * todos con la Caja de Calidad institucional y descarga individual o en .ZIP.
 */
export function FormatosDescargasView() {
  const { state, importState, resetToInitial, notify } = useBienestar();
  const [selectedCategory, setSelectedCategory] = useState<'TODAS' | CategoriaFormato>('TODAS');
  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    state.planBienestar[0]?.id || 'act-1'
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const visibleItems =
    selectedCategory === 'TODAS'
      ? CATALOGO_FORMATOS
      : CATALOGO_FORMATOS.filter((item) => item.categoria === selectedCategory);

  const handleDownloadItem = async (item: FormatoCatalogItem) => {
    if (loadingId) return;
    setLoadingId(item.id);
    try {
      if (item.tipo === 'excel') {
        const file = await downloadSingleExcelFormat(item.key as FormatoExcelKey, state);
        notify(`Archivo Excel descargado: ${file}`);
      } else {
        const { blob, filename } = await generateWordFormatBlob(
          item.key as FormatoWordKey,
          state,
          selectedActivityId
        );
        triggerBlobDownload(blob, filename);
        notify(`Documento Word descargado: ${filename}`);
      }
    } catch {
      notify('No fue posible generar el documento. Inténtalo de nuevo.', 'warning');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDownloadZip = async () => {
    if (loadingId) return;
    setLoadingId('zip');
    try {
      await downloadAllInstitutionalFormatsZip(state);
      notify(
        'Paquete ZIP descargado con todos los formatos institucionales Word (.docx) y Excel (.xlsx) organizados por categoría.'
      );
    } catch {
      notify('No fue posible generar el paquete ZIP.', 'warning');
    } finally {
      setLoadingId(null);
    }
  };

  const handleBackupJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    triggerBlobDownload(
      blob,
      `respaldo-frikaz-bienestar-2027-${new Date().toISOString().slice(0, 10)}.json`
    );
    notify('Copia de seguridad completa (.json) descargada.');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        importState(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-7">
      {/* Encabezado de Formatos Institucionales en Blanco + Botón ZIP */}
      <section
        data-submodule-surface="true"
        data-piggy-context={`formatos:${selectedCategory}`}
        className="relative overflow-hidden rounded-2xl border-2 border-[#FACC15] bg-white p-6 sm:p-8 shadow-xs"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-1.5">
            <p className="text-xs font-extrabold tracking-wide text-[#D61F26]">
              12 FORMATOS WORD (.DOCX) + 12 FORMATOS EXCEL (.XLSX) · 100% EN BLANCO Y EDITABLES
            </p>
            <h2 className="font-display text-2xl font-extrabold text-[#0F294A]">
              Formatos institucionales en blanco
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Todos los formatos descargables del Plan Anual de Bienestar 2027 se entregan
              completamente en blanco en sus campos de diligenciamiento (sin nombres ficticios ni
              respuestas precargadas), incorporando logotipo oficial, Caja de Calidad uniforme de
              Frikaz S.A.S., instrucciones de diligenciamiento y fórmulas automáticas en Excel.
            </p>
          </div>

          <button
            type="button"
            data-piggy-ignore="true"
            onClick={handleDownloadZip}
            disabled={loadingId !== null}
            className="inline-flex items-center gap-2.5 self-start rounded-xl bg-[#D61F26] border-b-4 border-[#FACC15] px-6 py-3.5 text-sm font-extrabold text-white shadow-md transition-all hover:bg-[#B3161C] hover:-translate-y-0.5 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FolderArchive className="h-5 w-5 text-[#FACC15]" />
            {loadingId === 'zip'
              ? 'EMPAQUETANDO TODOS LOS FORMATOS...'
              : 'Descargar todos los formatos (.ZIP)'}
          </button>
        </div>

        {/* Vista unificada de la Caja de Calidad institucional incluida en todos los formatos */}
        <div className="mt-6 space-y-2 border-t border-slate-100 pt-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#0F294A]/70">
            Caja de Calidad institucional uniforme incluida en todos los Word y Excel (campos de código, versión y fecha pendientes de asignación):
          </p>
          <InstitutionalQualityBox
            empresa={state.planGeneral.empresa || 'Frikaz S.A.S.'}
            tituloDocumento="FORMATO INSTITUCIONAL PLAN DE BIENESTAR SOCIAL LABORAL"
          />
        </div>

        {/* Selector de actividad para formatos individuales (Ficha técnica y Encuesta en Word) */}
        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-[#0F294A]">
            <strong className="block font-extrabold">
              Actividad seleccionada para Fichas Técnicas, Encuestas y Listas individuales (Word):
            </strong>
            <span className="text-slate-500">
              El paquete .ZIP incluye automáticamente las 9 fichas técnicas y las 9 encuestas.
            </span>
          </div>
          <select
            value={selectedActivityId}
            onChange={(e) => setSelectedActivityId(e.target.value)}
            className="w-full max-w-sm rounded-xl border border-slate-300 bg-[#F8FAFC] px-3.5 py-2 text-xs font-bold text-[#0F294A]"
          >
            {state.planBienestar.map((a, idx) => (
              <option key={a.id} value={a.id}>
                {a.numero || idx + 1}. {a.actividad} ({a.dimension})
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Filtro ordenado por las 8 categorías */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]/70">
          Categorías documentales
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-piggy-submodule="true"
            onClick={() => setSelectedCategory('TODAS')}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
              selectedCategory === 'TODAS'
                ? 'bg-[#0F294A] text-[#FACC15]'
                : 'border border-slate-200 bg-white text-[#0F294A] hover:bg-slate-50'
            }`}
          >
            Todas las categorías ({CATALOGO_FORMATOS.length})
          </button>
          {CATEGORIAS_ORDEN.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            const count = CATALOGO_FORMATOS.filter((f) => f.categoria === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                data-piggy-submodule="true"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#D61F26] text-white'
                    : 'border border-slate-200 bg-white text-[#0F294A] hover:bg-[#FEF9C3]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.id} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* Listado por categorías con descarga individual Word (.docx) y Excel (.xlsx) */}
      <div className="space-y-8">
        {CATEGORIAS_ORDEN.filter(
          (c) => selectedCategory === 'TODAS' || c.id === selectedCategory
        ).map((cat) => {
          const items = visibleItems.filter((i) => i.categoria === cat.id);
          const CatIcon = cat.icon;
          return (
            <section key={cat.id} className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-200 pb-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F294A] text-[#FACC15]">
                  <CatIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-[#0F294A]">{cat.id}</h3>
                  <p className="text-xs text-slate-600">{cat.descripcion}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => {
                  const isWord = item.tipo === 'word';
                  const isLoading = loadingId === item.id;
                  return (
                    <article
                      key={item.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-[#0F294A]/40 hover:shadow-sm space-y-4"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-semibold text-slate-500">
                            {item.categoria} · En blanco
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[11px] font-extrabold ${
                              isWord
                                ? 'border border-blue-200 bg-blue-50 text-[#0F294A]'
                                : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {isWord ? (
                              <FileText className="h-3 w-3 text-[#D61F26]" />
                            ) : (
                              <FileSpreadsheet className="h-3 w-3 text-emerald-700" />
                            )}
                            {isWord ? 'WORD (.DOCX)' : 'EXCEL (.XLSX)'}
                          </span>
                        </div>
                        <h4 className="font-display text-sm font-extrabold text-[#0F294A]">
                          {item.titulo}
                        </h4>
                        <p className="text-xs leading-relaxed text-slate-600">{item.descripcion}</p>
                      </div>

                      <button
                        type="button"
                        data-piggy-ignore="true"
                        onClick={() => handleDownloadItem(item)}
                        disabled={loadingId !== null}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors disabled:opacity-60 cursor-pointer ${
                          isWord
                            ? 'bg-[#D61F26] border-b-2 border-[#FACC15] text-white hover:bg-[#B3161C]'
                            : 'bg-[#0F294A] border-b-2 border-[#FACC15] text-[#FACC15] hover:bg-[#163A66] hover:text-white'
                        }`}
                      >
                        <Download className="h-4 w-4" />
                        {isLoading
                          ? 'Generando archivo...'
                          : isWord
                            ? 'Descargar Word (.docx)'
                            : 'Descargar Excel (.xlsx)'}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Respaldo completo JSON preservado */}
      <section className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Archive className="mt-0.5 h-5 w-5 shrink-0 text-[#0F294A]" />
            <div>
              <h3 className="font-display text-sm font-extrabold text-[#0F294A]">
                Copia de seguridad integral del sistema
              </h3>
              <p className="text-xs text-slate-600">
                Respalda o restaura toda la base de datos local (Manual, Normograma, Terminología,
                Matriz, Flujograma, Presupuesto General 2027 y Plan Anual).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              data-piggy-ignore="true"
              onClick={handleBackupJson}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-[#0F294A] hover:border-[#0F294A] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-[#D61F26]" />
              Guardar copia (.JSON)
            </button>
            <button
              type="button"
              data-piggy-ignore="true"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-[#0F294A] hover:border-[#0F294A] cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              Cargar copia (.JSON)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportJson}
              className="hidden"
            />
            <button
              type="button"
              data-piggy-ignore="true"
              onClick={() => setConfirmResetOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#FACC15] bg-[#FEF9C3] px-3.5 py-2 text-xs font-bold text-[#0F294A] hover:bg-[#FDE047] cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar base inicial
            </button>
          </div>
        </div>

        <ConfirmModal
          open={confirmResetOpen}
          title="Restaurar información inicial"
          description="¿Deseas restablecer los documentos, normas, terminología, matriz, flujograma, Presupuesto 2027 y Plan Anual de Bienestar a su configuración original?"
          confirmLabel="Sí, restaurar"
          onConfirm={() => {
            resetToInitial();
            setConfirmResetOpen(false);
          }}
          onCancel={() => setConfirmResetOpen(false)}
        />
      </section>
    </div>
  );
}
