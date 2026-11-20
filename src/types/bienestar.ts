export type SectionId =
  | 'inicio'
  | 'manual'
  | 'matriz'
  | 'flujograma'
  | 'seguimiento';

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

export type EstadoAprobacion = 'Pendiente' | 'Aprobado' | 'En ajuste' | 'Rechazado';
export type EstadoEjecucion = 'Planeado' | 'En ejecución' | 'Ejecutado' | 'Reprogramado';

export interface ProgramaBienestar {
  id: string;
  nombrePrograma: string;
  objetivo: string;
  actividad: string;
  descripcion: string;
  poblacionParticipante: string;
  responsable: string;
  fechaEjecucion: string;
  lugar: string;
  recursosNecesarios: string;
  presupuesto: number;
  estadoAprobacion: EstadoAprobacion;
  estadoEjecucion: EstadoEjecucion;
  evidencias: string;
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
  nivelSatisfaccion: number; // Escala 1 a 5 (se convierte también a %)
  cumplimientoCronograma: number; // 0 a 100
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
  planBienestar: ProgramaBienestar[];
  seguimiento: RegistroSeguimiento[];
  lastUpdated: string;
}
