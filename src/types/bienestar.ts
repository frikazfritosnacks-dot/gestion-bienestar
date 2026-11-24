export type SectionId =
  | 'inicio'
  | 'manual'
  | 'matriz'
  | 'flujograma'
  | 'programas';

export type ManualSubSectionId =
  | 'introduccion'
  | 'objetivos'
  | 'justificacion'
  | 'alcance'
  | 'normograma'
  | 'terminologia';

export type JerarquiaNormativa =
  | 'Constitución'
  | 'Ley'
  | 'Decreto'
  | 'Resolución'
  | 'Artículo'
  | 'Otra disposición';

export type FlowchartSymbol =
  | 'oval'
  | 'rectangle'
  | 'diamond'
  | 'document'
  | 'cylinder';

export interface ManualPortada {
  empresa: string;
  nombreDocumento: string;
  codigoDocumental: string;
  version: string;
  fechaActualizacion: string;
  areaResponsable: string;
  elaboradoPor?: string;
  revisadoPor?: string;
  aprobadoPor?: string;
}

export interface WordSyncInfo {
  lastSyncedAt: string;
  lastSyncedHash: string;
  syncedVersion: string;
}

export interface ObjetivoEspecifico {
  id: string;
  texto: string;
}

export interface ManualData {
  portada: ManualPortada;
  introduccion: string;
  objetivoGeneral: string;
  objetivosEspecificos: ObjetivoEspecifico[];
  justificacion: string;
  alcance: string;
}

export interface NormaItem {
  id: string;
  jerarquia: JerarquiaNormativa | string;
  nombre: string;
  afectacion: string;
  queDebeHacer: string;
}

export interface TerminoItem {
  id: string;
  termino: string;
  definicion: string;
}

export interface MatrizMetadata {
  empresa: string;
  codigo: string;
  version: string;
  fecha: string;
  responsable: string;
  objetivo: string;
}

export interface ProcessStep {
  id: string;
  symbol: FlowchartSymbol;
  actividad: string;
  descripcion: string;
  responsable: string;
  registroDocumento: string;
  isDecision: boolean;
  isAdjustment?: boolean;
  yesLabel?: string;
  noLabel?: string;
  yesTargetId?: string;
  noTargetId?: string;
  nextTargetId?: string;
}

export type EstadoAprobacion =
  | 'Pendiente de aprobación'
  | 'Pendiente'
  | 'Aprobado'
  | 'En ajuste'
  | 'Rechazado';

export type EstadoEjecucion =
  | 'Programada'
  | 'En ejecución'
  | 'Realizada'
  | 'Reprogramada';

export type DimensionBienestar =
  | 'Física'
  | 'Mental'
  | 'Financiera'
  | 'Familiar'
  | 'Social'
  | 'Horarios'
  | 'Incentivos'
  | 'Reconocimientos';

export interface PlanGeneralInfo {
  nombrePrograma: string;
  empresa: string;
  vigenciaAnual: string;
  objetivoGeneral: string;
  alcance: string;
  poblacionBeneficiaria: string;
  responsables: string;
}

export interface DimensionInfo {
  id: DimensionBienestar;
  nombre: DimensionBienestar;
  descripcion: string;
  enfoque: string;
}

export interface ProgramaBienestar {
  id: string;
  numero: number;
  dimension: DimensionBienestar | string;
  nombrePrograma: string;
  actividad: string;
  objetivo: string; // Objetivo específico de la actividad
  objetivoGeneralPrograma: string;
  metodologia: string;
  descripcion: string; // Descripción general
  descripcionDetallada: string;
  justificacion: string;
  poblacionParticipante: string;
  responsable: string;
  recursosNecesarios: string; // Materiales o insumos requeridos
  presupuesto: number;
  presupuestoEjecutado: number;
  presupuestoEstado: string;
  fechaInicio: string; // Fecha de inicio 2027
  fechaFin: string; // Fecha de finalización 2027
  fechaEjecucion: string; // Fecha base de referencia
  duracionEstimada: string; // Duración estimada
  horaInicio: string;
  horaFin: string;
  cronogramaTexto: string;
  mesesCronograma: number[]; // 1..12 (Ene..Dic 2027)
  frecuencia: string;
  lugar: string;
  estadoAprobacion: EstadoAprobacion;
  estadoEjecucion: EstadoEjecucion;
  porcentajeCumplimiento: number;
  indicador: string;
  meta: string;
  evidencias: string;
}

export interface PresupuestoCostoItem {
  id: string;
  actividadId: string;
  recursoMaterial: string;
  cantidad: number;
  unidadMedida: string;
  valorUnitario: number;
  frecuenciaCompra: string;
  ejecutado: number;
}

export interface PresupuestoGeneral2027 {
  vigencia: string;
  poblacionTrabajadores: number;
  presupuestoTotalAprobado: number;
  reservaImprevistos: number;
  reservaAutorizada: boolean;
  reservaEjecutada: number;
  reservaMotivoAutorizacion: string;
  items: PresupuestoCostoItem[];
}

export type CriterioEncuestaKey =
  | 'organizacion'
  | 'claridad'
  | 'cumplimientoObjetivo'
  | 'materiales'
  | 'participacion'
  | 'duracion'
  | 'utilidad'
  | 'satisfaccionGeneral';

export interface EncuestaPreguntaConfig {
  key: CriterioEncuestaKey;
  criterio: string;
  enunciado: string;
}

export interface EncuestaActividadConfig {
  actividadId: string;
  actividadNombre: string;
  dimension: DimensionBienestar;
  introduccion: string;
  preguntas: EncuestaPreguntaConfig[];
}

export interface RespuestaEncuesta {
  id: string;
  numeroRegistro?: number;
  actividadId: string;
  actividadNombre: string;
  dimension?: DimensionBienestar | string;
  nombreParticipante?: string;
  areaCargo?: string;
  fechaRealizacion: string;
  fechaHoraRegistro?: string;
  calificaciones: Record<CriterioEncuestaKey, number>; // 1..5
  calificacionGeneral?: number; // Promedio 1..5
  loQueMasGusto: string;
  aspectosMejorar: string;
  otrasActividades: string;
  observaciones: string;
  ultimaCorreccionAt?: string;
  corregidoPor?: string;
}

export interface ParticipanteAsistencia {
  id: string;
  nombreCompleto: string;
  cargo: string;
  area: string;
  documento: string;
  firma: string;
}

export interface ListaAsistenciaActividad {
  id: string;
  numeroRegistro?: number;
  actividadId: string;
  nombreActividad: string;
  dimension: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  lugar: string;
  responsable: string;
  firmaResponsable: string;
  observaciones: string;
  participantes: ParticipanteAsistencia[];
  fechaHoraRegistro?: string;
  ultimaCorreccionAt?: string;
  corregidoPor?: string;
}

export interface ConvenioItem {
  id: string;
  nombreConvenio: string;
  entidad: string;
  datosContacto: string;
  beneficios: string;
  vigencia: string;
  responsable: string;
}

export interface EvidenciaFotografica {
  id: string;
  titulo: string;
  fecha: string;
  descripcion: string;
  dataUrl?: string;
}

export interface RegistroSeguimiento {
  id: string;
  programaId?: string;
  nombreActividad: string;
  fecha: string;
  convocados: number;
  participantes: number;
  nivelSatisfaccion: number;
  cumplimientoCronograma: number;
  presupuestoPlaneado: number;
  presupuestoEjecutado: number;
  registroAsistencia: string;
  encuestaSatisfaccion: string;
  informeResultados: string;
  evidenciasFotograficas: EvidenciaFotografica[];
}

export interface BienestarState {
  manual: ManualData;
  normograma: NormaItem[];
  terminologia: TerminoItem[];
  matrizMeta: MatrizMetadata;
  proceso: ProcessStep[];
  planGeneral: PlanGeneralInfo;
  planBienestar: ProgramaBienestar[];
  presupuestoGeneral2027: PresupuestoGeneral2027;
  respuestasEncuestas: RespuestaEncuesta[];
  listasAsistencia: ListaAsistenciaActividad[];
  convenios: ConvenioItem[];
  seguimiento: RegistroSeguimiento[];
  lastUpdated: string;
  wordSync?: WordSyncInfo;
}
