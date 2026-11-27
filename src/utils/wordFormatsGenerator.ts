import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import {
  DIMENSIONES_BIENESTAR,
  ENCUESTAS_POR_ACTIVIDAD,
} from '../data/planBienestarData';
import {
  BienestarState,
  ProgramaBienestar,
} from '../types/bienestar';
import {
  fitAspectDimensions,
  loadInstitutionalQualityLogo,
  QualityLogoAsset,
} from './institutionalLogoAsset';

const FONT = 'Times New Roman';
const MARGIN = 1440; // 2.54 cm (norma formal APA 7ª ed.)
const BODY_LINE_SPACING = 360; // Interlineado 1.5 líneas
const NAVY = '0F294A';
const RED = '0F294A';
const YELLOW_SOFT = 'F1F5F9';
const BLUE_SOFT = 'F8FAFC';
const ZEBRA = 'F8FAFC';
const BORDER = 'CBD5E1';
const HEADER_BG = 'F1F5F9';
const HEADER_BORDER = '334155';
const TEXT = '000000';
const MUTED = '334155';

export type FormatoWordKey =
  | 'portada'
  | 'planificacion'
  | 'ficha'
  | 'encuesta'
  | 'asistencia'
  | 'acta'
  | 'evidencias'
  | 'informe'
  | 'mejora'
  | 'compromisos'
  | 'bonos'
  | 'convenios';

function pText(
  text: string,
  opts?: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    color?: string;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    before?: number;
    after?: number;
  }
): Paragraph {
  return new Paragraph({
    alignment: opts?.align ?? AlignmentType.LEFT,
    spacing: {
      line: BODY_LINE_SPACING,
      before: opts?.before ?? 40,
      after: opts?.after ?? 80,
    },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: opts?.size ?? 24, // 12pt Times New Roman
        bold: opts?.bold,
        italics: opts?.italic,
        color: opts?.color ?? TEXT,
      }),
    ],
  });
}

function mainHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    keepNext: true,
    alignment: AlignmentType.CENTER,
    spacing: { line: BODY_LINE_SPACING, before: 140, after: 100 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: 28, // 14pt Times New Roman
        bold: true,
        color: NAVY,
      }),
    ],
  });
}

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
    spacing: { line: BODY_LINE_SPACING, before: 180, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: HEADER_BORDER },
    },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: 24, // 12pt Times New Roman negrita
        bold: true,
        color: TEXT,
      }),
    ],
  });
}

function cell(
  text: string,
  opts?: {
    widthPct?: number;
    colSpan?: number;
    bold?: boolean;
    header?: boolean;
    fill?: string;
    color?: string;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    size?: number;
  }
): TableCell {
  return new TableCell({
    columnSpan: opts?.colSpan,
    width: opts?.widthPct ? { size: opts.widthPct, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    shading: opts?.header
      ? { type: ShadingType.CLEAR, color: 'auto', fill: HEADER_BG }
      : opts?.fill
        ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.fill }
        : { type: ShadingType.CLEAR, color: 'auto', fill: 'FFFFFF' },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: opts?.header ? HEADER_BORDER : BORDER },
      bottom: {
        style: BorderStyle.SINGLE,
        size: opts?.header ? 8 : 4,
        color: opts?.header ? HEADER_BORDER : BORDER,
      },
      left: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
    },
    children: [
      new Paragraph({
        alignment: opts?.align ?? AlignmentType.LEFT,
        spacing: { line: 276, before: 0, after: 0 },
        children: [
          new TextRun({
            text,
            font: FONT,
            size: opts?.size ?? 20, // 10pt en tablas para ajuste limpio
            bold: opts?.bold || opts?.header,
            color: opts?.header ? NAVY : opts?.color ?? TEXT,
          }),
        ],
      }),
    ],
  });
}

function buildInstructionsBox(instrucciones: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          cell(`INSTRUCCIONES DE DILIGENCIAMIENTO: ${instrucciones}`, {
            widthPct: 100,
            fill: BLUE_SOFT,
            color: TEXT,
            size: 22,
          }),
        ],
      }),
    ],
  });
}

function qualityBoxBorder() {
  return {
    top: { style: BorderStyle.SINGLE, size: 6, color: '1E293B' },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: '1E293B' },
    left: { style: BorderStyle.SINGLE, size: 6, color: '1E293B' },
    right: { style: BorderStyle.SINGLE, size: 6, color: '1E293B' },
  };
}

/**
 * Caja de Calidad institucional obligatoria y uniforme para todos los documentos Word,
 * fiel al formato oficial: fondo blanco limpio, bordes oscuros nítidos y grilla de 3 columnas
 * (logo izquierdo en 3 filas, razón social + título del formato en el centro, CÓDIGO/VERSIÓN/FECHA a la derecha).
 */
function buildUniformQualityBox(
  title: string,
  logoAsset: QualityLogoAsset | null,
  meta?: {
    empresa?: string;
    codigo?: string;
    version?: string;
    fecha?: string;
  }
): Table {
  const logoFit = logoAsset
    ? fitAspectDimensions(logoAsset.width, logoAsset.height, 128, 66)
    : null;
  const empresa = meta?.empresa?.trim() || 'Frikaz S.A.S.';
  const cleanCode = meta?.codigo?.trim() || '';
  const cleanVersion = meta?.version?.trim() || '';
  const cleanDate = meta?.fecha?.trim() || '';

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          new TableCell({
            rowSpan: 3,
            width: { size: 23, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFFFFF' },
            margins: { top: 65, bottom: 65, left: 80, right: 80 },
            borders: qualityBoxBorder(),
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 220, before: 0, after: 0 },
                children:
                  logoAsset && logoFit
                    ? [
                        new ImageRun({
                          data: logoAsset.bytes,
                          transformation: {
                            width: logoFit.width,
                            height: logoFit.height,
                          },
                          type: 'png',
                        }),
                      ]
                    : [
                        new TextRun({
                          text: empresa,
                          font: FONT,
                          size: 22,
                          bold: true,
                          color: RED,
                        }),
                      ],
              }),
            ],
          }),
          new TableCell({
            rowSpan: 2,
            width: { size: 52, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFFFFF' },
            margins: { top: 85, bottom: 85, left: 110, right: 110 },
            borders: qualityBoxBorder(),
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 240, before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: empresa,
                    font: FONT,
                    size: 22,
                    bold: true,
                    color: TEXT,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFFFFF' },
            margins: { top: 60, bottom: 60, left: 95, right: 95 },
            borders: qualityBoxBorder(),
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { line: 220, before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: `CÓDIGO: ${cleanCode}`,
                    font: FONT,
                    size: 18,
                    bold: true,
                    color: TEXT,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFFFFF' },
            margins: { top: 60, bottom: 60, left: 95, right: 95 },
            borders: qualityBoxBorder(),
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { line: 220, before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: `VERSIÓN: ${cleanVersion}`,
                    font: FONT,
                    size: 18,
                    bold: true,
                    color: TEXT,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 52, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFFFFF' },
            margins: { top: 60, bottom: 60, left: 110, right: 110 },
            borders: qualityBoxBorder(),
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 220, before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: title.toUpperCase(),
                    font: FONT,
                    size: 18,
                    bold: true,
                    color: TEXT,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFFFFF' },
            margins: { top: 60, bottom: 60, left: 95, right: 95 },
            borders: qualityBoxBorder(),
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { line: 220, before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: `FECHA: ${cleanDate}`,
                    font: FONT,
                    size: 18,
                    bold: true,
                    color: TEXT,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildSignatureBlock(
  leftLabel = 'Elaborado / Responsable de ejecución',
  rightLabel = 'Revisado / Aprobado por Gerencia'
): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          cell(
            `${leftLabel}\n\nNombre: ___________________________\nCargo:  ___________________________\nFecha:  ____ / ____ / 2027\nFirma:  ___________________________`,
            { widthPct: 50, fill: ZEBRA, size: 20 }
          ),
          cell(
            `${rightLabel}\n\nNombre: ___________________________\nCargo:  ___________________________\nFecha:  ____ / ____ / 2027\nFirma:  ___________________________`,
            { widthPct: 50, fill: ZEBRA, size: 20 }
          ),
        ],
      }),
    ],
  });
}

function wrapInInstitutionalDocument(
  title: string,
  instrucciones: string,
  logoAsset: QualityLogoAsset | null,
  bodyChildren: (Paragraph | Table)[],
  empresa = 'Frikaz S.A.S.'
): Document {
  return new Document({
    creator: empresa,
    title,
    description: `${title} - Formato Institucional en Blanco - ${empresa}`,
    styles: {
      default: {
        document: {
          run: {
            font: FONT,
            size: 24, // 12pt Times New Roman
            color: TEXT,
          },
          paragraph: {
            spacing: { line: BODY_LINE_SPACING, lineRule: 'auto' },
          },
        },
        heading1: {
          run: {
            font: FONT,
            size: 28, // 14pt Times New Roman
            bold: true,
            color: NAVY,
          },
          paragraph: {
            spacing: { line: BODY_LINE_SPACING, before: 140, after: 100 },
          },
        },
        heading2: {
          run: {
            font: FONT,
            size: 24, // 12pt Times New Roman
            bold: true,
            color: TEXT,
          },
          paragraph: {
            spacing: { line: BODY_LINE_SPACING, before: 180, after: 80 },
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            font: FONT,
            size: 24,
            color: TEXT,
          },
          paragraph: {
            spacing: { line: BODY_LINE_SPACING, lineRule: 'auto' },
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${empresa} · ${title}    Página `,
                    font: FONT,
                    size: 18,
                    color: MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT,
                    size: 18,
                    bold: true,
                    color: NAVY,
                  }),
                  new TextRun({ text: ' de ', font: FONT, size: 18, color: MUTED }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: FONT,
                    size: 18,
                    color: MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${empresa} · Plan Anual de Bienestar Social Laboral 2027 · Formato Oficial Listo para Diligenciar`,
                    font: FONT,
                    size: 18,
                    color: MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          buildUniformQualityBox(title, logoAsset, {
            empresa,
            codigo: '',
            version: '',
            fecha: '',
          }),
          mainHeading(title),
          buildInstructionsBox(instrucciones),
          new Paragraph({ spacing: { before: 60, after: 60 }, children: [] }),
          ...bodyChildren,
        ],
      },
    ],
  });
}

/**
 * 1. Portada del Plan Anual de Bienestar Social Laboral 2027 (campos de aprobación en blanco)
 */
function buildPortadaBody(state: BienestarState): (Paragraph | Table)[] {
  return [
    pText('', { before: 200, after: 140 }),
    pText('PLAN ANUAL DE BIENESTAR SOCIAL LABORAL', {
      bold: true,
      size: 40,
      color: NAVY,
      align: AlignmentType.CENTER,
      after: 80,
    }),
    pText('VIGENCIA ENERO – DICIEMBRE 2027', {
      bold: true,
      size: 28,
      color: RED,
      align: AlignmentType.CENTER,
      after: 220,
    }),
    pText(state.planGeneral.nombrePrograma, {
      bold: true,
      size: 24,
      color: NAVY,
      align: AlignmentType.CENTER,
      after: 220,
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          children: [
            cell('Empresa', { widthPct: 34, bold: true, fill: YELLOW_SOFT, color: NAVY }),
            cell('Frikaz S.A.S.', { widthPct: 66, bold: true }),
          ],
        }),
        new TableRow({
          children: [
            cell('Vigencia del Plan', { widthPct: 34, bold: true, fill: ZEBRA, color: NAVY }),
            cell('Enero a diciembre de 2027', { widthPct: 66 }),
          ],
        }),
        new TableRow({
          children: [
            cell('Población beneficiaria', { widthPct: 34, bold: true, fill: ZEBRA, color: NAVY }),
            cell('', { widthPct: 66 }),
          ],
        }),
        new TableRow({
          children: [
            cell('Presupuesto general aprobado (COP)', { widthPct: 34, bold: true, fill: ZEBRA, color: NAVY }),
            cell('$ ', { widthPct: 66 }),
          ],
        }),
        new TableRow({
          children: [
            cell('Fecha de presentación / aprobación', { widthPct: 34, bold: true, fill: ZEBRA, color: NAVY }),
            cell('____ / ____ / 2027', { widthPct: 66 }),
          ],
        }),
        new TableRow({
          children: [
            cell('Área o comité responsable', { widthPct: 34, bold: true, fill: ZEBRA, color: NAVY }),
            cell('', { widthPct: 66 }),
          ],
        }),
      ],
    }),
    pText('', { before: 240, after: 100 }),
    buildSignatureBlock('Elaborado por (Responsable del Plan)', 'Aprobado por (Gerente Frikaz S.A.S.)'),
  ];
}

/**
 * 2. Documento de planificación general del programa (estructura institucional + campos de seguimiento vacíos)
 */
function buildPlanificacionGeneralBody(state: BienestarState): (Paragraph | Table)[] {
  const g = state.planGeneral;
  return [
    sectionTitle('1. Identificación General del Programa 2027'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({ children: [cell('Nombre del programa', { widthPct: 30, bold: true, fill: YELLOW_SOFT }), cell(g.nombrePrograma, { widthPct: 70, bold: true })] }),
        new TableRow({ children: [cell('Empresa y vigencia', { widthPct: 30, bold: true, fill: ZEBRA }), cell('Frikaz S.A.S. · Vigencia 2027', { widthPct: 70 })] }),
        new TableRow({ children: [cell('Objetivo general', { widthPct: 30, bold: true, fill: ZEBRA }), cell(g.objetivoGeneral, { widthPct: 70 })] }),
        new TableRow({ children: [cell('Alcance', { widthPct: 30, bold: true, fill: ZEBRA }), cell(g.alcance, { widthPct: 70 })] }),
        new TableRow({ children: [cell('Responsable diligenciamiento', { widthPct: 30, bold: true, fill: ZEBRA }), cell('', { widthPct: 70 })] }),
        new TableRow({ children: [cell('Fecha de revisión / aprobación', { widthPct: 30, bold: true, fill: ZEBRA }), cell('____ / ____ / 2027', { widthPct: 70 })] }),
      ],
    }),
    sectionTitle('2. Las 8 Dimensiones del Bienestar Social Laboral'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({ tableHeader: true, children: [cell('Dimensión', { widthPct: 22, header: true }), cell('Enfoque', { widthPct: 36, header: true }), cell('Descripción', { widthPct: 42, header: true })] }),
        ...DIMENSIONES_BIENESTAR.map((d, i) =>
          new TableRow({
            cantSplit: true,
            children: [
              cell(d.nombre, { widthPct: 22, bold: true, color: RED, fill: i % 2 ? ZEBRA : undefined }),
              cell(d.enfoque, { widthPct: 36, fill: i % 2 ? ZEBRA : undefined }),
              cell(d.descripcion, { widthPct: 42, fill: i % 2 ? ZEBRA : undefined }),
            ],
          })
        ),
      ],
    }),
    sectionTitle('3. Matriz de Planificación de Actividades (Espacios en Blanco para Registro)'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cell('#', { widthPct: 6, header: true, align: AlignmentType.CENTER }),
            cell('Actividad programada', { widthPct: 28, header: true }),
            cell('Dimensión', { widthPct: 16, header: true }),
            cell('Fecha ejecutada', { widthPct: 16, header: true, align: AlignmentType.CENTER }),
            cell('Asistentes', { widthPct: 14, header: true, align: AlignmentType.CENTER }),
            cell('Valor ejecutado (COP)', { widthPct: 20, header: true, align: AlignmentType.RIGHT }),
          ],
        }),
        ...state.planBienestar.map((a, i) =>
          new TableRow({
            cantSplit: true,
            children: [
              cell(String(a.numero || i + 1), { widthPct: 6, align: AlignmentType.CENTER, bold: true }),
              cell(a.actividad, { widthPct: 28, bold: true, color: NAVY }),
              cell(a.dimension, { widthPct: 16 }),
              cell('', { widthPct: 16 }),
              cell('', { widthPct: 14 }),
              cell('', { widthPct: 20 }),
            ],
          })
        ),
      ],
    }),
    pText('', { before: 120 }),
    buildSignatureBlock(),
  ];
}

/**
 * 3. Ficha técnica individual por actividad (parámetros de referencia + tabla de ejecución completamente vacía)
 */
function buildFichaActividadBody(act: ProgramaBienestar): (Paragraph | Table)[] {
  return [
    sectionTitle(`Ficha Técnica #${act.numero}: ${act.actividad}`),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({ children: [cell('1. Nombre de la actividad', { widthPct: 30, bold: true, fill: YELLOW_SOFT }), cell(act.actividad, { widthPct: 70, bold: true, color: NAVY })] }),
        new TableRow({ children: [cell('2. Dimensión', { widthPct: 30, bold: true, fill: ZEBRA }), cell(act.dimension, { widthPct: 70, bold: true, color: RED })] }),
        new TableRow({ children: [cell('3. Objetivo general del programa', { widthPct: 30, bold: true, fill: ZEBRA }), cell(act.objetivoGeneralPrograma, { widthPct: 70 })] }),
        new TableRow({ children: [cell('4. Metodología', { widthPct: 30, bold: true, fill: ZEBRA }), cell(act.metodologia, { widthPct: 70 })] }),
        new TableRow({ children: [cell('5. Descripción general', { widthPct: 30, bold: true, fill: ZEBRA }), cell(act.descripcion, { widthPct: 70 })] }),
        new TableRow({ children: [cell('6. Objetivo específico', { widthPct: 30, bold: true, fill: ZEBRA }), cell(act.objetivo, { widthPct: 70 })] }),
        new TableRow({ children: [cell('7. Descripción detallada', { widthPct: 30, bold: true, fill: ZEBRA }), cell(act.descripcionDetallada, { widthPct: 70 })] }),
        new TableRow({ children: [cell('8. Justificación', { widthPct: 30, bold: true, fill: ZEBRA }), cell(act.justificacion, { widthPct: 70 })] }),
        new TableRow({ children: [cell('9. Frecuencia esperada', { widthPct: 30, bold: true, fill: ZEBRA }), cell(act.frecuencia, { widthPct: 70 })] }),
        new TableRow({ children: [cell('10. Indicador y evidencia', { widthPct: 30, bold: true, fill: ZEBRA }), cell(`${act.indicador} | Evidencia: ${act.evidencias}`, { widthPct: 70 })] }),
      ],
    }),
    sectionTitle('Registro de Ejecución en Campo (Diligenciar al realizar la jornada)'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({ children: [cell('Fecha real de ejecución:', { widthPct: 30, bold: true, fill: YELLOW_SOFT }), cell('____ / ____ / 2027', { widthPct: 20 }), cell('Horario real:', { widthPct: 22, bold: true, fill: YELLOW_SOFT }), cell('____ : ____ a ____ : ____', { widthPct: 28 })] }),
        new TableRow({ children: [cell('Responsable asignado:', { widthPct: 30, bold: true, fill: ZEBRA }), cell('', { widthPct: 20 }), cell('Lugar de realización:', { widthPct: 22, bold: true, fill: ZEBRA }), cell('', { widthPct: 28 })] }),
        new TableRow({ children: [cell('Total participantes:', { widthPct: 30, bold: true, fill: ZEBRA }), cell('', { widthPct: 20 }), cell('Valor ejecutado (COP):', { widthPct: 22, bold: true, fill: ZEBRA }), cell('$ ', { widthPct: 28 })] }),
        new TableRow({ children: [cell('Observaciones y novedades:', { widthPct: 30, bold: true, fill: ZEBRA }), cell('\n', { colSpan: 3 })] }),
      ],
    }),
    sectionTitle('Registro de Recursos e Insumos Utilizados (Tabla en Blanco)'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cell('Recurso o material', { widthPct: 40, header: true }),
            cell('Cantidad', { widthPct: 12, header: true, align: AlignmentType.CENTER }),
            cell('Unidad', { widthPct: 16, header: true }),
            cell('Valor unitario', { widthPct: 16, header: true, align: AlignmentType.RIGHT }),
            cell('Valor total', { widthPct: 16, header: true, align: AlignmentType.RIGHT }),
          ],
        }),
        ...Array.from({ length: 5 }).map(() =>
          new TableRow({
            cantSplit: true,
            children: [
              cell('', { widthPct: 40 }),
              cell('', { widthPct: 12 }),
              cell('', { widthPct: 16 }),
              cell('', { widthPct: 16 }),
              cell('', { widthPct: 16 }),
            ],
          })
        ),
      ],
    }),
    pText('', { before: 100 }),
    buildSignatureBlock(),
  ];
}

/**
 * 4. Formato de encuesta de satisfacción en blanco por actividad
 */
function buildEncuestaWordBody(actividadId: string): (Paragraph | Table)[] {
  const cfg =
    ENCUESTAS_POR_ACTIVIDAD.find((e) => e.actividadId === actividadId) ||
    ENCUESTAS_POR_ACTIVIDAD[0];
  return [
    sectionTitle(`Encuesta de Satisfacción: ${cfg.actividadNombre} (Dimensión ${cfg.dimension})`),
    pText(cfg.introduccion, { italic: true, color: MUTED }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          children: [
            cell('Nombre del participante (opcional):', { widthPct: 30, bold: true, fill: ZEBRA }),
            cell('', { widthPct: 26 }),
            cell('Fecha de respuesta:', { widthPct: 22, bold: true, fill: ZEBRA }),
            cell('____ / ____ / 2027', { widthPct: 22 }),
          ],
        }),
        new TableRow({
          children: [
            cell('Área / Cargo (opcional):', { widthPct: 30, bold: true, fill: ZEBRA }),
            cell('', { widthPct: 26 }),
            cell('Actividad evaluada:', { widthPct: 22, bold: true, fill: YELLOW_SOFT }),
            cell(cfg.actividadNombre, { widthPct: 22, bold: true, color: NAVY }),
          ],
        }),
      ],
    }),
    pText(
      'Marque con una X su calificación:   1 = Muy insatisfecho   |   2 = Insatisfecho   |   3 = Neutral   |   4 = Satisfecho   |   5 = Muy satisfecho',
      { bold: true, size: 22, color: RED, before: 120 }
    ),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cell('#', { widthPct: 6, header: true, align: AlignmentType.CENTER }),
            cell('Criterio y pregunta específica', { widthPct: 64, header: true }),
            cell('1', { widthPct: 6, header: true, align: AlignmentType.CENTER }),
            cell('2', { widthPct: 6, header: true, align: AlignmentType.CENTER }),
            cell('3', { widthPct: 6, header: true, align: AlignmentType.CENTER }),
            cell('4', { widthPct: 6, header: true, align: AlignmentType.CENTER }),
            cell('5', { widthPct: 6, header: true, align: AlignmentType.CENTER }),
          ],
        }),
        ...cfg.preguntas.map((q, idx) =>
          new TableRow({
            cantSplit: true,
            children: [
              cell(String(idx + 1), { widthPct: 6, align: AlignmentType.CENTER, bold: true }),
              cell(`${q.criterio}: ${q.enunciado}`, { widthPct: 64 }),
              cell('[  ]', { widthPct: 6, align: AlignmentType.CENTER }),
              cell('[  ]', { widthPct: 6, align: AlignmentType.CENTER }),
              cell('[  ]', { widthPct: 6, align: AlignmentType.CENTER }),
              cell('[  ]', { widthPct: 6, align: AlignmentType.CENTER }),
              cell('[  ]', { widthPct: 6, align: AlignmentType.CENTER }),
            ],
          })
        ),
      ],
    }),
    sectionTitle('Preguntas Abiertas y Sugerencias (Campos en Blanco)'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({ children: [cell('1. ¿Qué fue lo que más le gustó de la actividad?\n\n\n', { widthPct: 100 })] }),
        new TableRow({ children: [cell('2. ¿Qué aspectos considera que se pueden mejorar?\n\n\n', { widthPct: 100 })] }),
        new TableRow({ children: [cell('3. ¿Qué otras actividades le gustaría que se realizaran en Frikaz S.A.S.?\n\n\n', { widthPct: 100 })] }),
        new TableRow({ children: [cell('4. Comentarios u observaciones adicionales:\n\n\n', { widthPct: 100 })] }),
      ],
    }),
  ];
}

/**
 * 5. Formato de lista de asistencia COMPLETAMENTE EN BLANCO
 */
function buildListaAsistenciaWordBody(): (Paragraph | Table)[] {
  return [
    sectionTitle('Lista Oficial de Asistencia — Formato en Blanco'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          children: [
            cell('Nombre de la actividad:', { widthPct: 22, bold: true, fill: YELLOW_SOFT }),
            cell('', { widthPct: 33 }),
            cell('Dimensión:', { widthPct: 18, bold: true, fill: YELLOW_SOFT }),
            cell('', { widthPct: 27 }),
          ],
        }),
        new TableRow({
          children: [
            cell('Fecha:', { widthPct: 22, bold: true, fill: ZEBRA }),
            cell('____ / ____ / 2027', { widthPct: 33 }),
            cell('Horario (Inicio - Fin):', { widthPct: 18, bold: true, fill: ZEBRA }),
            cell('____ : ____  a  ____ : ____', { widthPct: 27 }),
          ],
        }),
        new TableRow({
          children: [
            cell('Lugar:', { widthPct: 22, bold: true, fill: ZEBRA }),
            cell('', { widthPct: 33 }),
            cell('Responsable:', { widthPct: 18, bold: true, fill: ZEBRA }),
            cell('', { widthPct: 27 }),
          ],
        }),
      ],
    }),
    pText('', { before: 80, after: 40 }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cell('N.º', { widthPct: 7, header: true, align: AlignmentType.CENTER }),
            cell('Nombre completo', { widthPct: 28, header: true }),
            cell('Cargo', { widthPct: 19, header: true }),
            cell('Área', { widthPct: 15, header: true }),
            cell('Documento / ID', { widthPct: 16, header: true }),
            cell('Firma', { widthPct: 15, header: true }),
          ],
        }),
        ...Array.from({ length: 15 }).map((_, idx) =>
          new TableRow({
            cantSplit: true,
            children: [
              cell(String(idx + 1), { widthPct: 7, align: AlignmentType.CENTER, bold: true }),
              cell('', { widthPct: 28 }),
              cell('', { widthPct: 19 }),
              cell('', { widthPct: 15 }),
              cell('', { widthPct: 16 }),
              cell('', { widthPct: 15 }),
            ],
          })
        ),
      ],
    }),
    pText('Total de asistentes: ________     |     Observaciones: ____________________________________________________', {
      before: 100,
    }),
    buildSignatureBlock('Responsable de la jornada', 'Vo. Bo. Gerente'),
  ];
}

/**
 * 6. Formato de acta de ejecución de actividades COMPLETAMENTE EN BLANCO
 */
function buildActaEjecucionBody(): (Paragraph | Table)[] {
  return [
    sectionTitle('Acta de Ejecución de Actividades de Bienestar'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({ children: [cell('Acta N.º:', { widthPct: 25, bold: true, fill: YELLOW_SOFT }), cell('', { widthPct: 25 }), cell('Fecha de ejecución:', { widthPct: 25, bold: true, fill: YELLOW_SOFT }), cell('____ / ____ / 2027', { widthPct: 25 })] }),
        new TableRow({ children: [cell('Actividad realizada:', { widthPct: 25, bold: true, fill: ZEBRA }), cell('', { colSpan: 3 })] }),
        new TableRow({ children: [cell('Dimensión asociada:', { widthPct: 25, bold: true, fill: ZEBRA }), cell('', { widthPct: 25 }), cell('Total asistentes:', { widthPct: 25, bold: true, fill: ZEBRA }), cell('', { widthPct: 25 })] }),
        new TableRow({ children: [cell('Lugar:', { widthPct: 25, bold: true, fill: ZEBRA }), cell('', { widthPct: 25 }), cell('Horario (Inicio - Fin):', { widthPct: 25, bold: true, fill: ZEBRA }), cell('____:____ a ____:____', { widthPct: 25 })] }),
        new TableRow({ children: [cell('Objetivo y desarrollo de la actividad:', { colSpan: 4, bold: true, fill: YELLOW_SOFT })] }),
        new TableRow({ children: [cell('\n\n\n\n', { colSpan: 4 })] }),
        new TableRow({ children: [cell('Recursos utilizados y valor ejecutado (COP):', { colSpan: 4, bold: true, fill: YELLOW_SOFT })] }),
        new TableRow({ children: [cell('\n\n\n', { colSpan: 4 })] }),
        new TableRow({ children: [cell('Resultados observados, evidencias y compromisos:', { colSpan: 4, bold: true, fill: YELLOW_SOFT })] }),
        new TableRow({ children: [cell('\n\n\n\n', { colSpan: 4 })] }),
      ],
    }),
    pText('', { before: 120 }),
    buildSignatureBlock('Responsable de ejecución', 'Gerente Frikaz S.A.S.'),
  ];
}

/**
 * 7. Formato de registro de evidencias COMPLETAMENTE EN BLANCO
 */
function buildRegistroEvidenciasBody(): (Paragraph | Table)[] {
  return [
    sectionTitle('Registro y Control de Evidencias (Formato en Blanco)'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cell('#', { widthPct: 6, header: true, align: AlignmentType.CENTER }),
            cell('Actividad', { widthPct: 25, header: true }),
            cell('Tipo de evidencia / soporte', { widthPct: 27, header: true }),
            cell('Fecha soporte', { widthPct: 14, header: true, align: AlignmentType.CENTER }),
            cell('Archivo / Código', { widthPct: 16, header: true }),
            cell('Cumple', { widthPct: 12, header: true, align: AlignmentType.CENTER }),
          ],
        }),
        ...Array.from({ length: 12 }).map((_, idx) =>
          new TableRow({
            cantSplit: true,
            children: [
              cell(String(idx + 1), { widthPct: 6, align: AlignmentType.CENTER, bold: true }),
              cell('', { widthPct: 25 }),
              cell('', { widthPct: 27 }),
              cell('', { widthPct: 14 }),
              cell('', { widthPct: 16 }),
              cell('[  ] Sí  [  ] No', { widthPct: 12, align: AlignmentType.CENTER, size: 20 }),
            ],
          })
        ),
      ],
    }),
    pText('', { before: 120 }),
    buildSignatureBlock('Responsable del archivo documental', 'Verificado por Gerente'),
  ];
}

/**
 * 8. Formato de informe de resultados COMPLETAMENTE EN BLANCO
 */
function buildInformeResultadosBody(): (Paragraph | Table)[] {
  return [
    sectionTitle('Informe Consolidado de Resultados (Formato en Blanco)'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({ children: [cell('Periodo / Vigencia evaluada:', { widthPct: 38, bold: true, fill: YELLOW_SOFT }), cell('', { widthPct: 62 })] }),
        new TableRow({ children: [cell('Número de actividades ejecutadas:', { widthPct: 38, bold: true, fill: ZEBRA }), cell('', { widthPct: 62 })] }),
        new TableRow({ children: [cell('Total de asistencias registradas:', { widthPct: 38, bold: true, fill: ZEBRA }), cell('', { widthPct: 62 })] }),
        new TableRow({ children: [cell('Promedio y % de satisfacción:', { widthPct: 38, bold: true, fill: ZEBRA }), cell('', { widthPct: 62 })] }),
        new TableRow({ children: [cell('Presupuesto programado vs. ejecutado:', { widthPct: 38, bold: true, fill: ZEBRA }), cell('', { widthPct: 62 })] }),
      ],
    }),
    sectionTitle('Detalle de Resultados por Actividad'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cell('Actividad', { widthPct: 26, header: true }),
            cell('Dimensión', { widthPct: 16, header: true }),
            cell('Fecha', { widthPct: 13, header: true, align: AlignmentType.CENTER }),
            cell('Asistentes', { widthPct: 11, header: true, align: AlignmentType.CENTER }),
            cell('Satisfacción', { widthPct: 12, header: true, align: AlignmentType.CENTER }),
            cell('% Cumpl.', { widthPct: 10, header: true, align: AlignmentType.CENTER }),
            cell('Ejecutado', { widthPct: 12, header: true, align: AlignmentType.RIGHT }),
          ],
        }),
        ...Array.from({ length: 10 }).map(() =>
          new TableRow({
            cantSplit: true,
            children: [
              cell('', { widthPct: 26 }),
              cell('', { widthPct: 16 }),
              cell('', { widthPct: 13 }),
              cell('', { widthPct: 11 }),
              cell('', { widthPct: 12 }),
              cell('', { widthPct: 10 }),
              cell('', { widthPct: 12 }),
            ],
          })
        ),
      ],
    }),
    sectionTitle('Conclusiones y Recomendaciones'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [new TableRow({ children: [cell('\n\n\n\n\n', { widthPct: 100 })] })],
    }),
    pText('', { before: 100 }),
    buildSignatureBlock(),
  ];
}

/**
 * 9. Formato de plan de mejora COMPLETAMENTE EN BLANCO
 */
function buildPlanMejoraBody(): (Paragraph | Table)[] {
  return [
    sectionTitle('Plan de Mejora Continua (Formato en Blanco)'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cell('N.º', { widthPct: 6, header: true, align: AlignmentType.CENTER }),
            cell('Actividad / Fuente', { widthPct: 22, header: true }),
            cell('Oportunidad de mejora detectada', { widthPct: 26, header: true }),
            cell('Acción de mejora propuesta', { widthPct: 24, header: true }),
            cell('Responsable', { widthPct: 12, header: true }),
            cell('Plazo / Estado', { widthPct: 10, header: true }),
          ],
        }),
        ...Array.from({ length: 10 }).map((_, j) =>
          new TableRow({
            cantSplit: true,
            children: [
              cell(String(j + 1), { widthPct: 6, align: AlignmentType.CENTER, bold: true }),
              cell('', { widthPct: 22 }),
              cell('', { widthPct: 26 }),
              cell('', { widthPct: 24 }),
              cell('', { widthPct: 12 }),
              cell('', { widthPct: 10 }),
            ],
          })
        ),
      ],
    }),
    pText('', { before: 120 }),
    buildSignatureBlock(),
  ];
}

/**
 * 10. Formato de seguimiento de compromisos COMPLETAMENTE EN BLANCO
 */
function buildSeguimientoCompromisosBody(): (Paragraph | Table)[] {
  return [
    sectionTitle('Seguimiento de Compromisos (Formato en Blanco)'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cell('N.º', { widthPct: 7, header: true, align: AlignmentType.CENTER }),
            cell('Compromiso adquirido', { widthPct: 33, header: true }),
            cell('Responsable', { widthPct: 20, header: true }),
            cell('Fecha pactada', { widthPct: 14, header: true, align: AlignmentType.CENTER }),
            cell('Estado', { widthPct: 13, header: true, align: AlignmentType.CENTER }),
            cell('Observaciones', { widthPct: 13, header: true }),
          ],
        }),
        ...Array.from({ length: 10 }).map((_, idx) =>
          new TableRow({
            cantSplit: true,
            children: [
              cell(String(idx + 1), { widthPct: 7, align: AlignmentType.CENTER, bold: true }),
              cell('', { widthPct: 33 }),
              cell('', { widthPct: 20 }),
              cell('', { widthPct: 14 }),
              cell('', { widthPct: 13 }),
              cell('', { widthPct: 13 }),
            ],
          })
        ),
      ],
    }),
    pText('', { before: 120 }),
    buildSignatureBlock(),
  ];
}

/**
 * 11. Formato de registro de entrega de bonos y reconocimientos COMPLETAMENTE EN BLANCO
 */
function buildEntregaBonosReconocimientosBody(): (Paragraph | Table)[] {
  return [
    sectionTitle('A. Control de Entrega de Bonos Familiares (Formato en Blanco)'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cell('#', { widthPct: 6, header: true, align: AlignmentType.CENTER }),
            cell('Nombre del trabajador', { widthPct: 28, header: true }),
            cell('Documento / ID', { widthPct: 16, header: true }),
            cell('Entrega 1 (Fecha / Valor / Firma)', { widthPct: 25, header: true, align: AlignmentType.CENTER }),
            cell('Entrega 2 (Fecha / Valor / Firma)', { widthPct: 25, header: true, align: AlignmentType.CENTER }),
          ],
        }),
        ...Array.from({ length: 12 }).map((_, idx) =>
          new TableRow({
            cantSplit: true,
            children: [
              cell(String(idx + 1), { widthPct: 6, align: AlignmentType.CENTER, bold: true }),
              cell('', { widthPct: 28 }),
              cell('', { widthPct: 16 }),
              cell('', { widthPct: 25 }),
              cell('', { widthPct: 25 }),
            ],
          })
        ),
      ],
    }),
    sectionTitle('B. Registro de Reconocimientos: Trabajador del Mes (Formato en Blanco)'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cell('Mes', { widthPct: 15, header: true }),
            cell('Colaborador reconocido', { widthPct: 29, header: true }),
            cell('Área', { widthPct: 16, header: true }),
            cell('Mérito / Criterio', { widthPct: 16, header: true }),
            cell('Valor (COP)', { widthPct: 11, header: true, align: AlignmentType.RIGHT }),
            cell('Firma recibido', { widthPct: 13, header: true }),
          ],
        }),
        ...Array.from({ length: 12 }).map(() =>
          new TableRow({
            cantSplit: true,
            children: [
              cell('', { widthPct: 15 }),
              cell('', { widthPct: 29 }),
              cell('', { widthPct: 16 }),
              cell('', { widthPct: 16 }),
              cell('', { widthPct: 11 }),
              cell('', { widthPct: 13 }),
            ],
          })
        ),
      ],
    }),
    pText('', { before: 100 }),
    buildSignatureBlock(),
  ];
}

/**
 * 12. Formato de registro de convenios COMPLETAMENTE EN BLANCO
 */
function buildRegistroConveniosBody(): (Paragraph | Table)[] {
  return [
    sectionTitle('Registro Institucional de Convenios y Alianzas (Formato en Blanco)'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cell('#', { widthPct: 6, header: true, align: AlignmentType.CENTER }),
            cell('Nombre del convenio', { widthPct: 21, header: true }),
            cell('Entidad aliada', { widthPct: 17, header: true }),
            cell('Beneficios para trabajadores', { widthPct: 24, header: true }),
            cell('Datos de contacto', { widthPct: 17, header: true }),
            cell('Vigencia y responsable', { widthPct: 15, header: true }),
          ],
        }),
        ...Array.from({ length: 10 }).map((_, idx) =>
          new TableRow({
            cantSplit: true,
            children: [
              cell(String(idx + 1), { widthPct: 6, align: AlignmentType.CENTER, bold: true }),
              cell('', { widthPct: 21 }),
              cell('', { widthPct: 17 }),
              cell('', { widthPct: 24 }),
              cell('', { widthPct: 17 }),
              cell('', { widthPct: 15 }),
            ],
          })
        ),
      ],
    }),
    pText('', { before: 120 }),
    buildSignatureBlock(),
  ];
}

export async function generateWordFormatBlob(
  key: FormatoWordKey,
  state: BienestarState,
  actividadId = 'act-1'
): Promise<{ blob: Blob; filename: string }> {
  const logoAsset = await loadInstitutionalQualityLogo();
  const act =
    state.planBienestar.find((a) => a.id === actividadId) ||
    state.planBienestar[0];
  const actSlug = (act?.actividad || 'actividad')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 26);

  let doc: Document;
  let filename: string;

  const empresa = state.planGeneral.empresa || 'Frikaz S.A.S.';

  switch (key) {
    case 'portada':
      doc = wrapInInstitutionalDocument(
        'Portada del Plan Anual de Bienestar Social Laboral 2027',
        'Diligencie los campos en blanco de aprobación, población, presupuesto aprobado y firmas institucionales antes de archivar.',
        logoAsset,
        buildPortadaBody(state),
        empresa
      );
      filename = '01_Portada_Plan_Bienestar_2027_Frikaz.docx';
      break;
    case 'planificacion':
      doc = wrapInInstitutionalDocument(
        'Documento de Planificación General del Programa 2027',
        'Use las casillas vacías de la matriz para registrar fechas reales de ejecución, asistentes y presupuesto ejecutado por cada actividad.',
        logoAsset,
        buildPlanificacionGeneralBody(state),
        empresa
      );
      filename = '02_Planificacion_General_Programa_2027_Frikaz.docx';
      break;
    case 'ficha':
      doc = wrapInInstitutionalDocument(
        `Ficha Técnica de Actividad: ${act.actividad}`,
        'Complete los espacios en blanco de fecha real, participantes, recursos utilizados y firmas al ejecutar la actividad.',
        logoAsset,
        buildFichaActividadBody(act),
        empresa
      );
      filename = `03_Ficha_Tecnica_${actSlug}_Frikaz.docx`;
      break;
    case 'encuesta':
      doc = wrapInInstitutionalDocument(
        `Encuesta de Satisfacción: ${act.actividad}`,
        'Diligencie la fecha, marque con X una sola opción de 1 a 5 por cada pregunta y complete las preguntas abiertas.',
        logoAsset,
        buildEncuestaWordBody(act.id),
        empresa
      );
      filename = `04_Encuesta_Satisfaccion_${actSlug}_Frikaz.docx`;
      break;
    case 'asistencia':
      doc = wrapInInstitutionalDocument(
        'Formato Oficial de Lista de Asistencia 2027',
        'Registre el nombre de la actividad, fecha, horario, lugar, responsable y los datos y firma de cada participante asistente.',
        logoAsset,
        buildListaAsistenciaWordBody(),
        empresa
      );
      filename = '05_Lista_Asistencia_En_Blanco_Frikaz.docx';
      break;
    case 'acta':
      doc = wrapInInstitutionalDocument(
        'Acta de Ejecución de Actividades de Bienestar',
        'Complete todos los campos del acta al finalizar la jornada e incluya las firmas de soporte.',
        logoAsset,
        buildActaEjecucionBody(),
        empresa
      );
      filename = '06_Acta_Ejecucion_Actividades_2027_Frikaz.docx';
      break;
    case 'evidencias':
      doc = wrapInInstitutionalDocument(
        'Formato de Registro de Evidencias 2027',
        'Registre cada soporte fotográfico o documental generado durante el plan indicando código, fecha y verificación.',
        logoAsset,
        buildRegistroEvidenciasBody(),
        empresa
      );
      filename = '07_Registro_Evidencias_2027_Frikaz.docx';
      break;
    case 'informe':
      doc = wrapInInstitutionalDocument(
        'Informe de Resultados del Plan Anual de Bienestar 2027',
        'Consolide los indicadores reales obtenidos al cierre del período, detalle por actividad, conclusiones y firmas.',
        logoAsset,
        buildInformeResultadosBody(),
        empresa
      );
      filename = '08_Informe_Resultados_2027_Frikaz.docx';
      break;
    case 'mejora':
      doc = wrapInInstitutionalDocument(
        'Plan de Mejora Continua del Bienestar Laboral',
        'Registre las oportunidades de mejora reales detectadas en encuestas o seguimiento, la acción definida, el responsable y el plazo.',
        logoAsset,
        buildPlanMejoraBody(),
        empresa
      );
      filename = '09_Plan_de_Mejora_2027_Frikaz.docx';
      break;
    case 'compromisos':
      doc = wrapInInstitutionalDocument(
        'Seguimiento de Compromisos de Bienestar Social Laboral',
        'Anote cada compromiso pactado en reuniones o actividades junto con su responsable, fecha límite y estado de cierre.',
        logoAsset,
        buildSeguimientoCompromisosBody(),
        empresa
      );
      filename = '10_Seguimiento_Compromisos_2027_Frikaz.docx';
      break;
    case 'bonos':
      doc = wrapInInstitutionalDocument(
        'Registro de Entrega de Bonos y Reconocimientos 2027',
        'Registre manualmente al trabajador beneficiario, documento, fecha, valor entregado y firma de recibido.',
        logoAsset,
        buildEntregaBonosReconocimientosBody(),
        empresa
      );
      filename = '11_Entrega_Bonos_y_Reconocimientos_2027_Frikaz.docx';
      break;
    case 'convenios':
      doc = wrapInInstitutionalDocument(
        'Registro Institucional de Convenios Vigentes 2027',
        'Diligencie los convenios vigentes, entidad aliada, beneficios acordados, contacto, vigencia y responsable.',
        logoAsset,
        buildRegistroConveniosBody(),
        empresa
      );
      filename = '12_Registro_Convenios_2027_Frikaz.docx';
      break;
  }

  const blob = await Packer.toBlob(doc);
  return { blob, filename };
}
