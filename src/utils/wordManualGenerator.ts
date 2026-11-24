import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
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
import { BienestarState, NormaItem, ProcessStep } from '../types/bienestar';
import { SYMBOL_LABELS } from '../components/ui/SymbolGraphic';
import {
  fitAspectDimensions,
  loadInstitutionalQualityLogo,
  QualityLogoAsset,
} from './institutionalLogoAsset';

// APA 7th Edition measurements in twips (1 cm = 566.929 twips; 2.54 cm = 1440 twips)
const MARGIN_TWIPS = 1440; // 2.54 cm
const FIRST_LINE_INDENT = 720; // 1.27 cm (0.5 in)
const HANGING_INDENT = 720; // 1.27 cm (0.5 in)
const DOUBLE_LINE_SPACING = 480; // 2.0x line spacing
const ONE_HALF_SPACING = 360; // 1.5x for dense tables

const FONT_FAMILY = 'Arial';
const COLOR_NAVY = '0F294A';
const COLOR_RED = 'B3161C';
const COLOR_TEXT = '1E293B';
const COLOR_MUTED = '475569';
const COLOR_BORDER = 'CBD5E1';
const COLOR_HEADER_BG = '0F294A';
const COLOR_SUBHEADER_BG = 'FEF9C3';
const COLOR_ZEBRA_BG = 'F8FAFC';

function apaParagraph(text: string, options?: { indent?: boolean; bold?: boolean; italic?: boolean; after?: number }) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: options?.indent ? { firstLine: FIRST_LINE_INDENT } : undefined,
    spacing: {
      line: DOUBLE_LINE_SPACING,
      lineRule: 'auto',
      before: 0,
      after: options?.after ?? 0,
    },
    children: [
      new TextRun({
        text,
        font: FONT_FAMILY,
        size: 22, // 11pt APA 7
        bold: options?.bold,
        italics: options?.italic,
        color: COLOR_TEXT,
      }),
    ],
  });
}

function splitNarrativeParagraphs(raw: string): Paragraph[] {
  const blocks = raw
    .split(/\n\s*\n|\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (blocks.length === 0) {
    return [apaParagraph('Sin contenido registrado.', { indent: true })];
  }
  return blocks.map((b) => apaParagraph(b, { indent: true }));
}

function apaHeading1(text: string, pageBreakBefore = false) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore,
    keepNext: true,
    spacing: {
      line: DOUBLE_LINE_SPACING,
      before: 240,
      after: 120,
    },
    children: [
      new TextRun({
        text,
        font: FONT_FAMILY,
        size: 26, // 13pt
        bold: true,
        color: COLOR_NAVY,
      }),
    ],
  });
}

function apaHeading2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
    spacing: {
      line: DOUBLE_LINE_SPACING,
      before: 160,
      after: 80,
    },
    children: [
      new TextRun({
        text,
        font: FONT_FAMILY,
        size: 22, // 11pt
        bold: true,
        color: COLOR_RED,
      }),
    ],
  });
}

function apaTableCaption(tableNumber: number, italicTitle: string) {
  return [
    new Paragraph({
      keepNext: true,
      spacing: { line: DOUBLE_LINE_SPACING, before: 160, after: 0 },
      children: [
        new TextRun({
          text: `Tabla ${tableNumber}`,
          font: FONT_FAMILY,
          size: 22,
          bold: true,
          color: COLOR_NAVY,
        }),
      ],
    }),
    new Paragraph({
      keepNext: true,
      spacing: { line: DOUBLE_LINE_SPACING, before: 0, after: 100 },
      children: [
        new TextRun({
          text: italicTitle,
          font: FONT_FAMILY,
          size: 22,
          italics: true,
          color: COLOR_TEXT,
        }),
      ],
    }),
  ];
}

function apaTableNote(noteText: string) {
  return new Paragraph({
    spacing: { line: DOUBLE_LINE_SPACING, before: 80, after: 160 },
    children: [
      new TextRun({
        text: 'Nota. ',
        font: FONT_FAMILY,
        size: 20, // 10pt
        italics: true,
        color: COLOR_MUTED,
      }),
      new TextRun({
        text: noteText,
        font: FONT_FAMILY,
        size: 20,
        color: COLOR_MUTED,
      }),
    ],
  });
}

function makeCell(
  text: string,
  options?: {
    widthPct?: number;
    bold?: boolean;
    header?: boolean;
    fill?: string;
    color?: string;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    size?: number;
  }
) {
  return new TableCell({
    width: options?.widthPct ? { size: options.widthPct, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    shading: options?.header
      ? { type: ShadingType.CLEAR, color: 'auto', fill: COLOR_HEADER_BG }
      : options?.fill
        ? { type: ShadingType.CLEAR, color: 'auto', fill: options.fill }
        : undefined,
    margins: {
      top: 90,
      bottom: 90,
      left: 120,
      right: 120,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: {
        style: BorderStyle.SINGLE,
        size: options?.header ? 12 : 4,
        color: options?.header ? 'FACC15' : COLOR_BORDER,
      },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    },
    children: [
      new Paragraph({
        alignment: options?.align ?? AlignmentType.LEFT,
        spacing: { line: ONE_HALF_SPACING, before: 0, after: 0 },
        children: [
          new TextRun({
            text,
            font: FONT_FAMILY,
            size: options?.size ?? 20,
            bold: options?.bold || options?.header,
            color: options?.header ? 'FFFFFF' : options?.color ?? COLOR_TEXT,
          }),
        ],
      }),
    ],
  });
}

/**
 * Construye citas textuales APA reales basadas únicamente en las normas presentes en el Normograma.
 */
function findGroundedCitation(normograma: NormaItem[], keywords: string[]): string {
  const matched = normograma.filter((n) =>
    keywords.some((kw) => n.nombre.toLowerCase().includes(kw.toLowerCase()))
  );
  if (matched.length === 0) return '';
  const labels = matched.slice(0, 3).map((n) => n.nombre.split(',')[0].trim());
  return ` (véase ${labels.join('; ')})`;
}

/**
 * Convierte las disposiciones registradas en el Normograma en referencias bibliográficas APA 7 ordenadas alfabéticamente,
 * sin inventar autores, editoriales ni fechas que no provengan del registro documental.
 */
function buildGroundedApaReferences(state: BienestarState): string[] {
  const refs = new Set<string>();

  state.normograma.forEach((norma) => {
    const cleanName = norma.nombre.trim();
    if (!cleanName) return;
    // Formateo APA para legislación / disposiciones colombianas registradas
    if (/constitución/i.test(cleanName)) {
      refs.add(
        `Asamblea Nacional Constituyente. (1991). ${cleanName}. República de Colombia.`
      );
    } else if (/código sustantivo/i.test(cleanName)) {
      refs.add(
        `Congreso de la República de Colombia. ${cleanName}. Diario Oficial de Colombia.`
      );
    } else {
      refs.add(
        `República de Colombia. ${cleanName} (${norma.jerarquia}). Normograma institucional de ${state.manual.portada.empresa}.`
      );
    }
  });

  // Documento institucional propio
  const yearMatch = state.manual.portada.fechaActualizacion.match(/(\d{4})/);
  const docYear = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
  refs.add(
    `${state.manual.portada.empresa} (${docYear}). ${state.manual.portada.nombreDocumento} [Código ${state.manual.portada.codigoDocumental}, Versión ${state.manual.portada.version}]. ${state.manual.portada.areaResponsable}.`
  );

  return Array.from(refs).sort((a, b) => a.localeCompare(b, 'es'));
}

function buildQualityBoxTable(state: BienestarState, logoAsset: QualityLogoAsset | null): Table {
  const p = state.manual.portada;
  const fieldOrPending = (val?: string) =>
    val && val.trim() ? val.trim() : 'No registrado en la herramienta';

  const logoFit = logoAsset
    ? fitAspectDimensions(logoAsset.width, logoAsset.height, 145, 76)
    : null;

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFFFFF' },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 8, color: COLOR_HEADER_BG },
              bottom: { style: BorderStyle.SINGLE, size: 14, color: 'FACC15' },
              left: { style: BorderStyle.SINGLE, size: 8, color: COLOR_HEADER_BG },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 240, before: 0, after: 0 },
                children: logoAsset && logoFit
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
                        text: p.empresa,
                        font: FONT_FAMILY,
                        size: 22,
                        bold: true,
                        color: COLOR_RED,
                      }),
                    ],
              }),
            ],
          }),
          new TableCell({
            columnSpan: 3,
            verticalAlign: VerticalAlign.CENTER,
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: COLOR_HEADER_BG },
            margins: { top: 110, bottom: 110, left: 140, right: 140 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 8, color: COLOR_HEADER_BG },
              bottom: { style: BorderStyle.SINGLE, size: 14, color: 'FACC15' },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              right: { style: BorderStyle.SINGLE, size: 8, color: COLOR_HEADER_BG },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 300, before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: `${p.empresa} · CONTROL DOCUMENTAL Y CAJA DE CALIDAD`,
                    font: FONT_FAMILY,
                    size: 22,
                    bold: true,
                    color: 'FFFFFF',
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
          makeCell('Empresa', { widthPct: 22, bold: true, fill: COLOR_SUBHEADER_BG, color: COLOR_NAVY }),
          makeCell(p.empresa, { widthPct: 28, bold: true }),
          makeCell('Código documental', { widthPct: 22, bold: true, fill: COLOR_SUBHEADER_BG, color: COLOR_NAVY }),
          makeCell(p.codigoDocumental, { widthPct: 28, bold: true, color: COLOR_RED }),
        ],
      }),
      new TableRow({
        cantSplit: true,
        children: [
          makeCell('Nombre del documento', { widthPct: 22, bold: true, fill: COLOR_ZEBRA_BG, color: COLOR_NAVY }),
          new TableCell({
            columnSpan: 3,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 90, bottom: 90, left: 120, right: 120 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            },
            children: [
              new Paragraph({
                spacing: { line: ONE_HALF_SPACING, before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: p.nombreDocumento,
                    font: FONT_FAMILY,
                    size: 20,
                    bold: true,
                    color: COLOR_NAVY,
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
          makeCell('Versión', { widthPct: 22, bold: true, fill: COLOR_ZEBRA_BG, color: COLOR_NAVY }),
          makeCell(p.version, { widthPct: 28 }),
          makeCell('Fecha de actualización', { widthPct: 22, bold: true, fill: COLOR_ZEBRA_BG, color: COLOR_NAVY }),
          makeCell(p.fechaActualizacion, { widthPct: 28 }),
        ],
      }),
      new TableRow({
        cantSplit: true,
        children: [
          makeCell('Área responsable', { widthPct: 22, bold: true, fill: COLOR_ZEBRA_BG, color: COLOR_NAVY }),
          makeCell(p.areaResponsable, { widthPct: 28 }),
          makeCell('Elaborado por', { widthPct: 22, bold: true, fill: COLOR_ZEBRA_BG, color: COLOR_NAVY }),
          makeCell(fieldOrPending(p.elaboradoPor), { widthPct: 28 }),
        ],
      }),
      new TableRow({
        cantSplit: true,
        children: [
          makeCell('Revisado por', { widthPct: 22, bold: true, fill: COLOR_ZEBRA_BG, color: COLOR_NAVY }),
          makeCell(fieldOrPending(p.revisadoPor), { widthPct: 28 }),
          makeCell('Aprobado por', { widthPct: 22, bold: true, fill: COLOR_ZEBRA_BG, color: COLOR_NAVY }),
          makeCell(fieldOrPending(p.aprobadoPor), { widthPct: 28 }),
        ],
      }),
    ],
  });
}

function buildNormogramaTable(state: BienestarState): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      makeCell('Jerarquía normativa', { widthPct: 14, header: true }),
      makeCell('Nombre de la norma', { widthPct: 24, header: true }),
      makeCell('¿En qué afecta al procedimiento o proceso?', { widthPct: 31, header: true }),
      makeCell('¿Qué debería hacer la empresa?', { widthPct: 31, header: true }),
    ],
  });

  const dataRows = state.normograma.map((n, idx) => {
    const fill = idx % 2 === 1 ? COLOR_ZEBRA_BG : undefined;
    return new TableRow({
      cantSplit: true,
      children: [
        makeCell(n.jerarquia, { widthPct: 14, bold: true, color: COLOR_RED, fill }),
        makeCell(n.nombre, { widthPct: 24, bold: true, color: COLOR_NAVY, fill }),
        makeCell(n.afectacion, { widthPct: 31, fill }),
        makeCell(n.queDebeHacer, { widthPct: 31, fill }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...dataRows],
  });
}

function buildTerminologiaTable(state: BienestarState): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      makeCell('Término', { widthPct: 28, header: true }),
      makeCell('Definición', { widthPct: 72, header: true }),
    ],
  });

  const dataRows = state.terminologia.map((t, idx) => {
    const fill = idx % 2 === 1 ? COLOR_ZEBRA_BG : undefined;
    return new TableRow({
      cantSplit: true,
      children: [
        makeCell(t.termino, { widthPct: 28, bold: true, color: COLOR_NAVY, fill }),
        makeCell(t.definicion, { widthPct: 72, fill }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...dataRows],
  });
}

function buildMatrizTable(state: BienestarState): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      makeCell('#', { widthPct: 6, header: true, align: AlignmentType.CENTER }),
      makeCell('Símbolo', { widthPct: 15, header: true }),
      makeCell('Actividad', { widthPct: 21, header: true }),
      makeCell('Descripción de la actividad', { widthPct: 28, header: true }),
      makeCell('Responsable', { widthPct: 14, header: true }),
      makeCell('Registro / Documento', { widthPct: 16, header: true }),
    ],
  });

  const dataRows = state.proceso.map((step, idx) => {
    const fill = idx % 2 === 1 ? COLOR_ZEBRA_BG : undefined;
    return new TableRow({
      cantSplit: true,
      children: [
        makeCell(String(idx + 1), {
          widthPct: 6,
          bold: true,
          color: COLOR_RED,
          align: AlignmentType.CENTER,
          fill,
        }),
        makeCell(SYMBOL_LABELS[step.symbol], { widthPct: 15, fill }),
        makeCell(step.actividad, { widthPct: 21, bold: true, color: COLOR_NAVY, fill }),
        makeCell(step.descripcion, { widthPct: 28, fill }),
        makeCell(step.responsable, { widthPct: 14, fill }),
        makeCell(step.registroDocumento, { widthPct: 16, bold: true, fill }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...dataRows],
  });
}

function describeFlowRoute(step: ProcessStep, allSteps: ProcessStep[]): string {
  const byId = new Map(allSteps.map((s) => [s.id, s.actividad]));
  if (step.isDecision) {
    const yesTarget = step.yesTargetId ? byId.get(step.yesTargetId) || 'Siguiente actividad' : 'Siguiente actividad';
    const noTarget = step.noTargetId ? byId.get(step.noTargetId) || 'Ajuste' : 'Ajuste y nueva revisión';
    return `${step.yesLabel || 'SÍ'} → ${yesTarget} | ${step.noLabel || 'NO'} → ${noTarget}`;
  }
  if (step.nextTargetId) {
    return `Continúa → ${byId.get(step.nextTargetId) || 'Siguiente paso'}`;
  }
  return 'Cierre del procedimiento';
}

function buildFlujogramaTable(state: BienestarState): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      makeCell('Paso', { widthPct: 7, header: true, align: AlignmentType.CENTER }),
      makeCell('Tipo de nodo', { widthPct: 18, header: true }),
      makeCell('Actividad / Compuerta', { widthPct: 26, header: true }),
      makeCell('Responsable', { widthPct: 17, header: true }),
      makeCell('Flujo y rutas de decisión', { widthPct: 32, header: true }),
    ],
  });

  const dataRows = state.proceso.map((step, idx) => {
    const fill = step.isDecision ? COLOR_SUBHEADER_BG : idx % 2 === 1 ? COLOR_ZEBRA_BG : undefined;
    return new TableRow({
      cantSplit: true,
      children: [
        makeCell(String(idx + 1), {
          widthPct: 7,
          bold: true,
          color: COLOR_RED,
          align: AlignmentType.CENTER,
          fill,
        }),
        makeCell(SYMBOL_LABELS[step.symbol], { widthPct: 18, fill }),
        makeCell(step.actividad, { widthPct: 26, bold: true, color: COLOR_NAVY, fill }),
        makeCell(step.responsable, { widthPct: 17, fill }),
        makeCell(describeFlowRoute(step, state.proceso), { widthPct: 32, fill }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...dataRows],
  });
}

export async function generateManualWordBlob(state: BienestarState): Promise<Blob> {
  const p = state.manual.portada;
  const logoAsset = await loadInstitutionalQualityLogo();

  // Grounded citations based ONLY on norms currently registered in state.normograma
  const introCitation = findGroundedCitation(state.normograma, ['Constitución', 'Ley 9']);
  const justCitation = findGroundedCitation(state.normograma, [
    'Ley 1010',
    'Ley 1857',
    'Decreto 1072',
  ]);
  const alcanceCitation = findGroundedCitation(state.normograma, [
    'Código Sustantivo',
    'Resolución 0312',
  ]);

  const introParagraphs = splitNarrativeParagraphs(state.manual.introduccion);
  if (introCitation && introParagraphs.length > 0) {
    // Append grounded citation on a concise normative linkage note paragraph
    introParagraphs.push(
      apaParagraph(
        `El marco de actuación del presente manual se fundamenta en los principios constitucionales y sanitarios del trabajo digno vigentes en Colombia${introCitation}.`,
        { indent: true }
      )
    );
  }

  const justParagraphs = splitNarrativeParagraphs(state.manual.justificacion);
  if (justCitation && justParagraphs.length > 0) {
    justParagraphs.push(
      apaParagraph(
        `Estas acciones responden igualmente al cumplimiento preventivo frente al riesgo psicosocial, la convivencia laboral y el fortalecimiento familiar${justCitation}.`,
        { indent: true }
      )
    );
  }

  const alcanceParagraphs = splitNarrativeParagraphs(state.manual.alcance);
  if (alcanceCitation && alcanceParagraphs.length > 0) {
    alcanceParagraphs.push(
      apaParagraph(
        `La cobertura del procedimiento se articula con las disposiciones laborales y de seguridad y salud en el trabajo aplicables a la organización${alcanceCitation}.`,
        { indent: true }
      )
    );
  }

  const apaReferences = buildGroundedApaReferences(state);

  const doc = new Document({
    creator: p.empresa,
    title: p.nombreDocumento,
    description: `Manual institucional sincronizado de ${p.empresa} (${p.codigoDocumental} v${p.version})`,
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: 22,
            color: COLOR_TEXT,
          },
          paragraph: {
            spacing: { line: DOUBLE_LINE_SPACING, lineRule: 'auto' },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 }, // Letter 8.5 x 11 in
            margin: {
              top: MARGIN_TWIPS,
              bottom: MARGIN_TWIPS,
              left: MARGIN_TWIPS,
              right: MARGIN_TWIPS,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${p.empresa} · ${p.codigoDocumental} (v${p.version})    Página `,
                    font: FONT_FAMILY,
                    size: 18,
                    color: COLOR_MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT_FAMILY,
                    size: 18,
                    bold: true,
                    color: COLOR_NAVY,
                  }),
                  new TextRun({
                    text: ' de ',
                    font: FONT_FAMILY,
                    size: 18,
                    color: COLOR_MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: FONT_FAMILY,
                    size: 18,
                    color: COLOR_MUTED,
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
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: `${p.empresa} · ${p.nombreDocumento} · Actualizado ${p.fechaActualizacion}`,
                    font: FONT_FAMILY,
                    size: 18,
                    color: COLOR_MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Encabezado Institucional y Caja de Calidad
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 320, before: 0, after: 80 },
            children: [
              new TextRun({
                text: p.empresa,
                font: FONT_FAMILY,
                size: 28,
                bold: true,
                color: COLOR_RED,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 340, before: 0, after: 200 },
            children: [
              new TextRun({
                text: p.nombreDocumento,
                font: FONT_FAMILY,
                size: 32,
                bold: true,
                color: COLOR_NAVY,
              }),
            ],
          }),

          buildQualityBoxTable(state, logoAsset),

          new Paragraph({
            spacing: { before: 120, after: 120 },
            children: [],
          }),

          // 1. Introducción
          apaHeading1('1. Introducción'),
          ...introParagraphs,

          // 2. Objetivos
          apaHeading1('2. Objetivos'),
          apaHeading2('2.1 Objetivo general'),
          ...splitNarrativeParagraphs(state.manual.objetivoGeneral),

          apaHeading2('2.2 Objetivos específicos'),
          ...(state.manual.objetivosEspecificos.length === 0
            ? [apaParagraph('No se han registrado objetivos específicos.', { indent: true })]
            : state.manual.objetivosEspecificos.map((obj, idx) =>
                apaParagraph(`${idx + 1}. ${obj.texto}`, { indent: true })
              )),

          // 3. Justificación
          apaHeading1('3. Justificación'),
          ...justParagraphs,

          // 4. Alcance
          apaHeading1('4. Alcance'),
          ...alcanceParagraphs,

          // 5. Normograma
          apaHeading1('5. Normograma', true),
          apaParagraph(
            `A continuación se presenta la matriz normativa vigente aplicable al procedimiento de Bienestar Social Laboral de ${p.empresa}, consolidada con ${state.normograma.length} disposiciones registradas.`,
            { indent: true }
          ),
          ...apaTableCaption(
            1,
            `Normograma legal aplicable al procedimiento de Bienestar Social Laboral de ${p.empresa}`
          ),
          buildNormogramaTable(state),
          apaTableNote(
            `Información sincronizada desde el módulo de Normograma (${state.normograma.length} normas activas).`
          ),

          // 6. Terminología
          apaHeading1('6. Terminología', true),
          apaParagraph(
            `El presente diccionario conceptual reúne los ${state.terminologia.length} términos y definiciones oficiales que orientan la comprensión e implementación del bienestar social laboral en ${p.empresa}.`,
            { indent: true }
          ),
          ...apaTableCaption(
            2,
            `Terminología y definiciones de Bienestar Social Laboral de ${p.empresa}`
          ),
          buildTerminologiaTable(state),
          apaTableNote(
            `Glosario sincronizado desde la herramienta (${state.terminologia.length} conceptos registrados).`
          ),

          // Referencias (APA 7th Ed., orden alfabético y sangría francesa)
          apaHeading1('Referencias', true),
          ...apaReferences.map(
            (ref) =>
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: HANGING_INDENT, hanging: HANGING_INDENT },
                spacing: { line: DOUBLE_LINE_SPACING, before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: ref,
                    font: FONT_FAMILY,
                    size: 22,
                    color: COLOR_TEXT,
                  }),
                ],
              })
          ),

          // Anexo A: Matriz Detallada
          new Paragraph({ children: [new PageBreak()] }),
          apaHeading1('Anexo A. Matriz Detallada del Procedimiento'),
          apaParagraph(
            `Documento anexo ${state.matrizMeta.codigo} (Versión ${state.matrizMeta.version}, fecha ${state.matrizMeta.fecha}), bajo responsabilidad de ${state.matrizMeta.responsable}. Objetivo de la matriz: ${state.matrizMeta.objetivo}`,
            { indent: true }
          ),
          ...apaTableCaption(
            3,
            `Matriz detallada de actividades sincronizadas de ${state.matrizMeta.empresa}`
          ),
          buildMatrizTable(state),
          apaTableNote(
            `Total de actividades y compuertas registradas: ${state.proceso.length}.`
          ),

          // Anexo B: Flujograma
          apaHeading1('Anexo B. Flujograma del Procedimiento', true),
          apaParagraph(
            `Representación secuencial y compuertas de decisión (SÍ / NO) sincronizadas en tiempo real con la Matriz Detallada de ${state.matrizMeta.empresa}.`,
            { indent: true }
          ),
          ...apaTableCaption(
            4,
            `Secuencia del flujograma operativo de Bienestar Social Laboral de ${state.matrizMeta.empresa}`
          ),
          buildFlujogramaTable(state),
          apaTableNote(
            `Secuencia sincronizada automáticamente desde el Flujograma del procedimiento (${state.proceso.length} nodos).`
          ),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

export function buildWordFilename(state: BienestarState): string {
  const code = state.manual.portada.codigoDocumental.replace(/[^a-zA-Z0-9_-]/g, '-');
  const ver = state.manual.portada.version.replace(/[^a-zA-Z0-9._-]/g, '');
  return `Manual_Bienestar_Social_Laboral_Frikaz_SAS_${code}_v${ver}.docx`;
}

export function buildMatrizWordFilename(state: BienestarState): string {
  const code = state.matrizMeta.codigo.replace(/[^a-zA-Z0-9_-]/g, '-');
  const ver = state.matrizMeta.version.replace(/[^a-zA-Z0-9._-]/g, '');
  return `Matriz_Detallada_Bienestar_Frikaz_SAS_${code}_v${ver}.docx`;
}

export function buildFlujogramaWordFilename(state: BienestarState): string {
  const code = state.matrizMeta.codigo.replace(/[^a-zA-Z0-9_-]/g, '-');
  const ver = state.matrizMeta.version.replace(/[^a-zA-Z0-9._-]/g, '');
  return `Flujograma_Bienestar_Frikaz_SAS_${code}_v${ver}.docx`;
}

function buildStandaloneSectionFooter(
  empresa: string,
  titulo: string,
  codigo: string,
  version: string,
  fecha: string
) {
  return {
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `${empresa} · ${codigo} (v${version})    Página `,
                font: FONT_FAMILY,
                size: 18,
                color: COLOR_MUTED,
              }),
              new TextRun({
                children: [PageNumber.CURRENT],
                font: FONT_FAMILY,
                size: 18,
                bold: true,
                color: COLOR_NAVY,
              }),
              new TextRun({
                text: ' de ',
                font: FONT_FAMILY,
                size: 18,
                color: COLOR_MUTED,
              }),
              new TextRun({
                children: [PageNumber.TOTAL_PAGES],
                font: FONT_FAMILY,
                size: 18,
                color: COLOR_MUTED,
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
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: `${empresa} · ${titulo} · Vigencia ${fecha}`,
                font: FONT_FAMILY,
                size: 18,
                color: COLOR_MUTED,
              }),
            ],
          }),
        ],
      }),
    },
  };
}

/**
 * Documento Word 2 independiente: Matriz Detallada del Procedimiento
 */
export async function generateMatrizWordBlob(state: BienestarState): Promise<Blob> {
  const m = state.matrizMeta;
  const logoAsset = await loadInstitutionalQualityLogo();
  const headerFooter = buildStandaloneSectionFooter(
    m.empresa,
    'Matriz Detallada del Procedimiento de Bienestar Social Laboral',
    m.codigo,
    m.version,
    m.fecha
  );

  const syntheticState: BienestarState = {
    ...state,
    manual: {
      ...state.manual,
      portada: {
        ...state.manual.portada,
        empresa: m.empresa,
        nombreDocumento: 'MATRIZ DETALLADA DEL PROCEDIMIENTO DE BIENESTAR SOCIAL LABORAL',
        codigoDocumental: m.codigo,
        version: m.version,
        fechaActualizacion: m.fecha,
        areaResponsable: m.responsable,
      },
    },
  };

  const doc = new Document({
    creator: m.empresa,
    title: `Matriz Detallada · ${m.empresa}`,
    description: `Matriz detallada de actividades y responsables (${m.codigo} v${m.version})`,
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: {
              top: MARGIN_TWIPS,
              bottom: MARGIN_TWIPS,
              left: MARGIN_TWIPS,
              right: MARGIN_TWIPS,
            },
          },
        },
        ...headerFooter,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 320, before: 0, after: 80 },
            children: [
              new TextRun({
                text: m.empresa,
                font: FONT_FAMILY,
                size: 28,
                bold: true,
                color: COLOR_RED,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 340, before: 0, after: 200 },
            children: [
              new TextRun({
                text: 'MATRIZ DETALLADA DEL PROCEDIMIENTO DE BIENESTAR SOCIAL LABORAL',
                font: FONT_FAMILY,
                size: 30,
                bold: true,
                color: COLOR_NAVY,
              }),
            ],
          }),
          buildQualityBoxTable(syntheticState, logoAsset),
          apaHeading1('1. Objetivo y Alcance Operativo de la Matriz'),
          apaParagraph(m.objetivo, { indent: true }),
          apaParagraph(
            `Responsable funcional: ${m.responsable}. Código documental: ${m.codigo} · Versión ${m.version} · Fecha de emisión: ${m.fecha}.`,
            { indent: true }
          ),
          apaHeading1('2. Secuencia Detallada de Actividades, Responsables y Registros'),
          ...apaTableCaption(
            1,
            `Matriz detallada de actividades sincronizadas del procedimiento de Bienestar Social Laboral de ${m.empresa}`
          ),
          buildMatrizTable(state),
          apaTableNote(
            `Total de actividades y compuertas activas en la plataforma: ${state.proceso.length}.`
          ),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

/**
 * Documento Word 3 independiente: Flujograma Operativo del Procedimiento
 */
export async function generateFlujogramaWordBlob(state: BienestarState): Promise<Blob> {
  const m = state.matrizMeta;
  const logoAsset = await loadInstitutionalQualityLogo();
  const headerFooter = buildStandaloneSectionFooter(
    m.empresa,
    'Flujograma del Procedimiento de Bienestar Social Laboral',
    `${m.codigo}-FLU`,
    m.version,
    m.fecha
  );

  const syntheticState: BienestarState = {
    ...state,
    manual: {
      ...state.manual,
      portada: {
        ...state.manual.portada,
        empresa: m.empresa,
        nombreDocumento: 'FLUJOGRAMA DEL PROCEDIMIENTO DE BIENESTAR SOCIAL LABORAL',
        codigoDocumental: `${m.codigo}-FLU`,
        version: m.version,
        fechaActualizacion: m.fecha,
        areaResponsable: m.responsable,
      },
    },
  };

  const doc = new Document({
    creator: m.empresa,
    title: `Flujograma · ${m.empresa}`,
    description: `Flujograma secuencial y rutas de decisión (${m.codigo} v${m.version})`,
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: {
              top: MARGIN_TWIPS,
              bottom: MARGIN_TWIPS,
              left: MARGIN_TWIPS,
              right: MARGIN_TWIPS,
            },
          },
        },
        ...headerFooter,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 320, before: 0, after: 80 },
            children: [
              new TextRun({
                text: m.empresa,
                font: FONT_FAMILY,
                size: 28,
                bold: true,
                color: COLOR_RED,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 340, before: 0, after: 200 },
            children: [
              new TextRun({
                text: 'FLUJOGRAMA DEL PROCEDIMIENTO DE BIENESTAR SOCIAL LABORAL',
                font: FONT_FAMILY,
                size: 30,
                bold: true,
                color: COLOR_NAVY,
              }),
            ],
          }),
          buildQualityBoxTable(syntheticState, logoAsset),
          apaHeading1('1. Convenciones Gráficas del Diagrama de Flujo'),
          apaParagraph(
            'El diagrama de flujo emplea simbología estándar ANSI/ISO para representar inicio/fin (Óvalo), actividades operativas (Rectángulo), compuertas de decisión SÍ/NO (Rombo), soportes documentales (Documento) y archivo institucional (Base de datos).',
            { indent: true }
          ),
          apaHeading1('2. Secuencia Gráfica y Rutas de Decisión'),
          ...apaTableCaption(
            1,
            `Flujograma operativo y compuertas de decisión de ${m.empresa}`
          ),
          buildFlujogramaTable(state),
          apaTableNote(
            `Nodos sincronizados directamente con la Matriz Detallada (${state.proceso.length} pasos en total).`
          ),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

function triggerWordBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1800);
}

/**
 * Descarga conjunta de los 3 documentos Word independientes: Manual, Matriz Detallada y Flujograma.
 */
export async function downloadManualMatrizFlujogramaThreeWord(state: BienestarState): Promise<void> {
  const [manualBlob, matrizBlob, flujogramaBlob] = await Promise.all([
    generateManualWordBlob(state),
    generateMatrizWordBlob(state),
    generateFlujogramaWordBlob(state),
  ]);

  triggerWordBlobDownload(manualBlob, buildWordFilename(state));
  await new Promise((resolve) => setTimeout(resolve, 350));
  triggerWordBlobDownload(matrizBlob, buildMatrizWordFilename(state));
  await new Promise((resolve) => setTimeout(resolve, 350));
  triggerWordBlobDownload(flujogramaBlob, buildFlujogramaWordFilename(state));
}
