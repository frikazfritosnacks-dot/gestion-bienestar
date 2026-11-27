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
  PageOrientation,
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
import {
  FlowchartDiagramPageAsset,
  generateFlowchartDiagramPages,
} from './flowchartDiagramRenderer';

// Mediciones formales APA 7ª edición en twips (1 pulgada = 2.54 cm = 1440 twips)
const MARGIN_TWIPS = 1440; // 2.54 cm
const BODY_HEADER_TOP_MARGIN = 1920; // Espacio superior amplio para la Caja de Calidad en encabezado sin traslape
const LANDSCAPE_SIDE_MARGIN = 1080; // 1.9 cm lateral en hoja horizontal para la Matriz completa
const HEADER_OFFSET_TWIPS = 420;
const FOOTER_OFFSET_TWIPS = 540;
const FIRST_LINE_INDENT = 720; // 1.27 cm (0.5 in)
const HANGING_INDENT = 720; // 1.27 cm (sangría francesa APA)
const BODY_LINE_SPACING = 360; // Interlineado formal 1.5 líneas (APA / formal institucional)
const TABLE_LINE_SPACING = 276; // 1.15x limpio y legible para tablas extensas

const FONT_FAMILY = 'Times New Roman';
// Paleta ejecutiva y académica sobria (fondo blanco, texto negro y azul marino institucional discreto)
const COLOR_NAVY = '0F294A';
const COLOR_BLACK = '000000';
const COLOR_TEXT = '000000';
const COLOR_MUTED = '334155';
const COLOR_BORDER = 'CBD5E1';
const COLOR_HEADER_BORDER = '334155';
const COLOR_HEADER_BG = 'F1F5F9';
const COLOR_ZEBRA_BG = 'F8FAFC';

function apaNarrativeParagraph(
  text: string,
  options?: { indent?: boolean; bold?: boolean; italic?: boolean; after?: number; justify?: boolean }
) {
  return new Paragraph({
    alignment: options?.justify === false ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
    indent: options?.indent === false ? undefined : { firstLine: FIRST_LINE_INDENT },
    spacing: {
      line: BODY_LINE_SPACING,
      lineRule: 'auto',
      before: 0,
      after: options?.after ?? 80,
    },
    children: [
      new TextRun({
        text,
        font: FONT_FAMILY,
        size: 24, // 12pt Times New Roman
        bold: options?.bold,
        italics: options?.italic,
        color: COLOR_TEXT,
      }),
    ],
  });
}

function formalBodyParagraph(text: string, options?: { bold?: boolean; after?: number }) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: {
      line: BODY_LINE_SPACING, // 1.5x
      lineRule: 'auto',
      before: 40,
      after: options?.after ?? 100,
    },
    children: [
      new TextRun({
        text,
        font: FONT_FAMILY,
        size: 24, // 12pt Times New Roman
        bold: options?.bold,
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
    return [apaNarrativeParagraph('Sin contenido registrado.')];
  }
  return blocks.map((b) => apaNarrativeParagraph(b));
}

/**
 * Título Nivel 1 (APA 7ª ed. + jerarquía institucional formal)
 */
function apaHeading1(text: string, pageBreakBefore = false) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore,
    keepNext: true,
    alignment: AlignmentType.LEFT,
    spacing: {
      line: BODY_LINE_SPACING,
      before: 220,
      after: 120,
    },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_NAVY },
    },
    children: [
      new TextRun({
        text,
        font: FONT_FAMILY,
        size: 28, // 14pt Times New Roman
        bold: true,
        color: COLOR_NAVY,
      }),
    ],
  });
}

/**
 * Título Nivel 2 (APA 7ª ed.: alineado a la izquierda, negrita, 12pt)
 */
function apaHeading2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
    alignment: AlignmentType.LEFT,
    spacing: {
      line: BODY_LINE_SPACING,
      before: 160,
      after: 80,
    },
    children: [
      new TextRun({
        text,
        font: FONT_FAMILY,
        size: 24, // 12pt Times New Roman
        bold: true,
        color: COLOR_NAVY,
      }),
    ],
  });
}

function apaTableCaption(tableNumber: number, italicTitle: string) {
  return [
    new Paragraph({
      keepNext: true,
      alignment: AlignmentType.LEFT,
      spacing: { line: BODY_LINE_SPACING, before: 140, after: 20 },
      children: [
        new TextRun({
          text: `Tabla ${tableNumber}`,
          font: FONT_FAMILY,
          size: 24, // 12pt
          bold: true,
          color: COLOR_BLACK,
        }),
      ],
    }),
    new Paragraph({
      keepNext: true,
      alignment: AlignmentType.LEFT,
      spacing: { line: BODY_LINE_SPACING, before: 0, after: 80 },
      children: [
        new TextRun({
          text: italicTitle,
          font: FONT_FAMILY,
          size: 24, // 12pt
          italics: true,
          color: COLOR_TEXT,
        }),
      ],
    }),
  ];
}

function apaTableNote(noteText: string) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 300, before: 80, after: 140 },
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
        size: 20, // 10pt
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
    valign?: typeof VerticalAlign.TOP | typeof VerticalAlign.CENTER | typeof VerticalAlign.BOTTOM;
    size?: number;
  }
) {
  return new TableCell({
    width: options?.widthPct ? { size: options.widthPct, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: options?.valign ?? VerticalAlign.CENTER,
    shading: options?.header
      ? { type: ShadingType.CLEAR, color: 'auto', fill: COLOR_HEADER_BG }
      : options?.fill
        ? { type: ShadingType.CLEAR, color: 'auto', fill: options.fill }
        : { type: ShadingType.CLEAR, color: 'auto', fill: 'FFFFFF' },
    margins: {
      top: 80,
      bottom: 80,
      left: 100,
      right: 100,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: options?.header ? COLOR_HEADER_BORDER : COLOR_BORDER },
      bottom: {
        style: BorderStyle.SINGLE,
        size: options?.header ? 8 : 4,
        color: options?.header ? COLOR_HEADER_BORDER : COLOR_BORDER,
      },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    },
    children: [
      new Paragraph({
        alignment: options?.align ?? AlignmentType.LEFT,
        spacing: { line: TABLE_LINE_SPACING, before: 0, after: 0 },
        children: [
          new TextRun({
            text,
            font: FONT_FAMILY,
            size: options?.size ?? 20, // 10pt en tablas
            bold: options?.bold || options?.header,
            color: options?.header ? COLOR_BLACK : options?.color ?? COLOR_TEXT,
          }),
        ],
      }),
    ],
  });
}

/**
 * Extrae metadatos verificables exclusivamente a partir de la norma registrada en la herramienta,
 * sin inventar años, artículos ni entidades cuando no están confirmados.
 */
function extractNormMetadata(norma: NormaItem): {
  year: string;
  emitter: string;
  article: string;
} {
  const name = norma.nombre.trim();
  const yearMatch = name.match(/\b(19\d{2}|20\d{2})\b/);
  const year = yearMatch
    ? yearMatch[1]
    : /constitución política/i.test(name)
      ? '1991'
      : 'No especificado';

  let emitter = 'Autoridad competente (ver disposición)';
  if (/constitución política/i.test(name)) {
    emitter = 'Asamblea Nacional Constituyente';
  } else if (/código sustantivo/i.test(name) || /^ley\b/i.test(norma.jerarquia) || /^ley\s+\d+/i.test(name)) {
    emitter = 'Congreso de la República de Colombia';
  } else if (/decreto/i.test(norma.jerarquia) || /^decreto\s+\d+/i.test(name)) {
    emitter = 'Presidencia de la República de Colombia';
  } else if (/resolución\s+2646/i.test(name)) {
    emitter = 'Ministerio de la Protección Social';
  } else if (/resolución\s+(0312|2764|3461)/i.test(name)) {
    emitter = 'Ministerio del Trabajo';
  } else if (/resolución/i.test(norma.jerarquia)) {
    emitter = 'Ministerio / Entidad emisora competente';
  }

  const artMatch = name.match(/(art[íi]culos?\s+[\d,\sy]+)/i);
  const article = artMatch ? artMatch[1] : 'Articulado integral vigente';

  return { year, emitter, article };
}

/**
 * Convierte las disposiciones registradas en el Normograma en referencias bibliográficas APA 7 ordenadas alfabéticamente.
 */
function buildGroundedApaReferences(state: BienestarState): string[] {
  const refs = new Set<string>();
  const introLower = state.manual.introduccion.toLowerCase();

  if (introLower.includes('chunga')) {
    refs.add(
      'Chunga Díaz, T. O., & Escuza Pasco, M. E. (2023). La importancia de la satisfacción laboral en el ámbito profesional: una revisión sistemática. Diversitas: Perspectivas en Psicología, 19(1), 127–143. https://doi.org/10.15332/22563067.9109'
    );
  }
  if (introLower.includes('2466')) {
    refs.add(
      'Congreso de la República de Colombia. (2025). Ley 2466 de 2025, por medio de la cual se modifica parcialmente normas laborales y se adopta una reforma laboral para el trabajo decente y digno en Colombia.'
    );
  }
  if (introLower.includes('garcía-rubiano') || introLower.includes('garcia-rubiano')) {
    refs.add(
      'García-Rubiano, M., Toro, R., Díaz-Fúnez, P. A., Mañas-Rodríguez, M. Á., Pazmay-Ramos, S. G., & Matabanchoy-Tulcan, S. M. (2024). El papel del clima organizacional como mediador entre la disposición al cambio y el bienestar eudaimónico. Suma Psicológica, 31(1), 37–44. https://doi.org/10.14349/sumapsi.2024.v31.n1.5'
    );
  }
  if (introLower.includes('max-neef')) {
    refs.add(
      'Max-Neef, M., Elizalde, A., & Hopenhayn, M. (1986). Desarrollo a escala humana: Una opción para el futuro.'
    );
  }
  if (introLower.includes('mendoza-vargas')) {
    refs.add(
      'Mendoza-Vargas, J. M., Burbano-Pantoja, V. M. Á., & Mendoza-Vargas, H. H. (2022). Relación entre clima organizacional y desempeño laboral: estudio focalizado en el laboratorio empresarial LAEMCO en Tunja (Colombia). Información Tecnológica, 33(6), 157–166. https://doi.org/10.4067/S0718-07642022000600157'
    );
  }
  if (
    introLower.includes('organización mundial de la salud') ||
    introLower.includes('oms')
  ) {
    refs.add(
      'Organización Mundial de la Salud. (2010). Entornos laborales saludables: Fundamentos y modelo de la OMS.'
    );
    if (introLower.includes('2022')) {
      refs.add(
        'Organización Mundial de la Salud. (2022). WHO guidelines on mental health at work. World Health Organization.'
      );
    }
  }
  if (introLower.includes('rosero-lasso')) {
    refs.add(
      'Rosero-Lasso, D. A., Chaucanes-Figueroa, J. J., & Chavez-Martinez, J. L. (2025). Relación entre clima organizacional y satisfacción laboral en el Centro Hospital Guaitarilla (Nariño-Colombia), 2023. Hacia la Promoción de la Salud, 30(2), 85–94. https://doi.org/10.17151/hpsal.2025.30.2.8'
    );
  }

  state.normograma.forEach((norma) => {
    const cleanName = norma.nombre.trim();
    if (!cleanName) return;
    const meta = extractNormMetadata(norma);
    if (/constitución/i.test(cleanName)) {
      refs.add(
        `Asamblea Nacional Constituyente. (1991). ${cleanName}. República de Colombia.`
      );
    } else if (/código sustantivo/i.test(cleanName)) {
      refs.add(
        `Congreso de la República de Colombia. ${cleanName}. Diario Oficial de Colombia.`
      );
    } else {
      const yearPart = meta.year !== 'No especificado' ? ` (${meta.year}).` : '.';
      refs.add(
        `${meta.emitter}.${yearPart} ${cleanName} [${norma.jerarquia}]. Normograma institucional de ${state.manual.portada.empresa}.`
      );
    }
  });

  const yearMatch = state.manual.portada.fechaActualizacion.match(/(\d{4})/);
  const docYear = yearMatch ? yearMatch[1] : 's. f.';
  const codLabel = state.manual.portada.codigoDocumental?.trim() || 'Pendiente de asignación';
  const verLabel = state.manual.portada.version?.trim() || 'Pendiente de asignación';
  refs.add(
    `${state.manual.portada.empresa} (${docYear}). ${state.manual.portada.nombreDocumento} [Código ${codLabel}, Versión ${verLabel}]. ${state.manual.portada.areaResponsable}.`
  );

  return Array.from(refs).sort((a, b) => a.localeCompare(b, 'es'));
}

function qualityBoxCellBorder() {
  return {
    top: { style: BorderStyle.SINGLE, size: 6, color: '1E293B' },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: '1E293B' },
    left: { style: BorderStyle.SINGLE, size: 6, color: '1E293B' },
    right: { style: BorderStyle.SINGLE, size: 6, color: '1E293B' },
  };
}

/**
 * Caja de Calidad institucional única y obligatoria de Frikaz S.A.S.:
 * fondo blanco limpio, bordes nítidos oscuros y grilla 3 columnas (logo izquierdo en 3 filas,
 * razón social + título del documento en columna central, CÓDIGO / VERSIÓN / FECHA a la derecha).
 */
function buildQualityBoxTable(
  state: BienestarState,
  logoAsset: QualityLogoAsset | null,
  compact = false
): Table {
  const p = state.manual.portada;
  const logoFit = logoAsset
    ? fitAspectDimensions(logoAsset.width, logoAsset.height, compact ? 104 : 128, compact ? 46 : 64)
    : null;

  const cleanCode = p.codigoDocumental?.trim() || '';
  const cleanVersion = p.version?.trim() || '';
  const cleanDate = p.fechaActualizacion?.trim() || '';
  const titleText = p.nombreDocumento?.trim() || 'MANUAL DE PROCEDIMIENTO';
  const padV = compact ? 38 : 65;
  const fontSizeRight = compact ? 16 : 18;
  const fontSizeCenterTitle = compact ? 16 : 18;

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
            margins: { top: padV, bottom: padV, left: 70, right: 70 },
            borders: qualityBoxCellBorder(),
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 200, before: 0, after: 0 },
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
                          text: p.empresa,
                          font: FONT_FAMILY,
                          size: 20,
                          bold: true,
                          color: COLOR_NAVY,
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
            margins: { top: padV + 10, bottom: padV + 10, left: 100, right: 100 },
            borders: qualityBoxCellBorder(),
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 220, before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: p.empresa,
                    font: FONT_FAMILY,
                    size: compact ? 20 : 22,
                    bold: true,
                    color: COLOR_BLACK,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFFFFF' },
            margins: { top: padV, bottom: padV, left: 90, right: 90 },
            borders: qualityBoxCellBorder(),
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { line: 200, before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: `CÓDIGO: ${cleanCode}`,
                    font: FONT_FAMILY,
                    size: fontSizeRight,
                    bold: true,
                    color: COLOR_BLACK,
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
            margins: { top: padV, bottom: padV, left: 90, right: 90 },
            borders: qualityBoxCellBorder(),
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { line: 200, before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: `VERSIÓN: ${cleanVersion}`,
                    font: FONT_FAMILY,
                    size: fontSizeRight,
                    bold: true,
                    color: COLOR_BLACK,
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
            margins: { top: padV, bottom: padV, left: 100, right: 100 },
            borders: qualityBoxCellBorder(),
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 200, before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: titleText.toUpperCase(),
                    font: FONT_FAMILY,
                    size: fontSizeCenterTitle,
                    bold: true,
                    color: COLOR_BLACK,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFFFFF' },
            margins: { top: padV, bottom: padV, left: 90, right: 90 },
            borders: qualityBoxCellBorder(),
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { line: 200, before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: `FECHA: ${cleanDate}`,
                    font: FONT_FAMILY,
                    size: fontSizeRight,
                    bold: true,
                    color: COLOR_BLACK,
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

function buildPortadaSectionChildren(
  state: BienestarState,
  logoAsset: QualityLogoAsset | null
): (Paragraph | Table)[] {
  const p = state.manual.portada;
  const fieldOrPending = (val?: string) =>
    val && val.trim() ? val.trim() : 'Pendiente de asignación';
  const logoFit = logoAsset
    ? fitAspectDimensions(logoAsset.width, logoAsset.height, 190, 96)
    : null;
  const yearMatch = p.fechaActualizacion?.match(/(\d{4})/);
  const yearLabel = yearMatch ? yearMatch[1] : String(new Date().getFullYear());

  return [
    buildQualityBoxTable(state, logoAsset, false),
    new Paragraph({ spacing: { before: 420, after: 220 }, children: [] }),

    // Logotipo institucional centrado en la portada
    ...(logoAsset && logoFit
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 260 },
            children: [
              new ImageRun({
                data: logoAsset.bytes,
                transformation: {
                  width: logoFit.width,
                  height: logoFit.height,
                },
                type: 'png',
              }),
            ],
          }),
        ]
      : []),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 340, before: 80, after: 120 },
      children: [
        new TextRun({
          text: p.empresa.toUpperCase(),
          font: FONT_FAMILY,
          size: 32, // 16pt
          bold: true,
          color: COLOR_NAVY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 380, before: 80, after: 120 },
      children: [
        new TextRun({
          text: 'MANUAL DE PROCEDIMIENTO',
          font: FONT_FAMILY,
          size: 40, // 20pt
          bold: true,
          color: COLOR_BLACK,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 340, before: 40, after: 360 },
      children: [
        new TextRun({
          text: p.nombreDocumento,
          font: FONT_FAMILY,
          size: 26, // 13pt
          bold: true,
          color: COLOR_NAVY,
        }),
      ],
    }),

    // Tabla formal de identificación documental y control de aprobaciones
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            makeCell('Información de identificación documental', {
              widthPct: 100,
              header: true,
              align: AlignmentType.CENTER,
              size: 22,
            }),
          ],
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            makeCell('Empresa', { widthPct: 35, bold: true, fill: COLOR_ZEBRA_BG, size: 22 }),
            makeCell(fieldOrPending(p.empresa), { widthPct: 65, bold: true, size: 22 }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            makeCell('Título del documento', { widthPct: 35, bold: true, fill: COLOR_ZEBRA_BG, size: 22 }),
            makeCell(fieldOrPending(p.nombreDocumento), { widthPct: 65, size: 22 }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            makeCell('Área responsable', { widthPct: 35, bold: true, fill: COLOR_ZEBRA_BG, size: 22 }),
            makeCell(fieldOrPending(p.areaResponsable), { widthPct: 65, size: 22 }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            makeCell('Código documental', { widthPct: 35, bold: true, fill: COLOR_ZEBRA_BG, size: 22 }),
            makeCell(fieldOrPending(p.codigoDocumental), { widthPct: 65, size: 22 }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            makeCell('Versión', { widthPct: 35, bold: true, fill: COLOR_ZEBRA_BG, size: 22 }),
            makeCell(fieldOrPending(p.version), { widthPct: 65, size: 22 }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            makeCell('Fecha de actualización', { widthPct: 35, bold: true, fill: COLOR_ZEBRA_BG, size: 22 }),
            makeCell(fieldOrPending(p.fechaActualizacion), { widthPct: 65, size: 22 }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            makeCell('Elaborado por', { widthPct: 35, bold: true, fill: COLOR_ZEBRA_BG, size: 22 }),
            makeCell(fieldOrPending(p.elaboradoPor), { widthPct: 65, size: 22 }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            makeCell('Revisado por', { widthPct: 35, bold: true, fill: COLOR_ZEBRA_BG, size: 22 }),
            makeCell(fieldOrPending(p.revisadoPor), { widthPct: 65, size: 22 }),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            makeCell('Aprobado por', { widthPct: 35, bold: true, fill: COLOR_ZEBRA_BG, size: 22 }),
            makeCell(fieldOrPending(p.aprobadoPor), { widthPct: 65, size: 22 }),
          ],
        }),
      ],
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: BODY_LINE_SPACING, before: 420, after: 40 },
      children: [
        new TextRun({
          text: `${p.empresa} · ${fieldOrPending(p.areaResponsable)}`,
          font: FONT_FAMILY,
          size: 24,
          bold: true,
          color: COLOR_NAVY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: BODY_LINE_SPACING, before: 0, after: 0 },
      children: [
        new TextRun({
          text: `Colombia · ${yearLabel}`,
          font: FONT_FAMILY,
          size: 24,
          color: COLOR_MUTED,
        }),
      ],
    }),
  ];
}

function buildNormogramaTable(state: BienestarState): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      makeCell('Norma o disposición', { widthPct: 16, header: true, size: 20 }),
      makeCell('Año', { widthPct: 7, header: true, align: AlignmentType.CENTER, size: 20 }),
      makeCell('Entidad emisora', { widthPct: 14, header: true, size: 20 }),
      makeCell('Artículo o apartado aplicable', { widthPct: 12, header: true, size: 20 }),
      makeCell('Descripción y relación con el procedimiento', { widthPct: 26, header: true, size: 20 }),
      makeCell('Aplicación en Frikaz S.A.S.', { widthPct: 25, header: true, size: 20 }),
    ],
  });

  const dataRows = state.normograma.map((n, idx) => {
    const fill = idx % 2 === 1 ? COLOR_ZEBRA_BG : undefined;
    const meta = extractNormMetadata(n);
    return new TableRow({
      cantSplit: true,
      children: [
        makeCell(`${n.nombre} (${n.jerarquia})`, {
          widthPct: 16,
          bold: true,
          color: COLOR_BLACK,
          fill,
          valign: VerticalAlign.TOP,
          size: 20,
        }),
        makeCell(meta.year, {
          widthPct: 7,
          align: AlignmentType.CENTER,
          valign: VerticalAlign.TOP,
          fill,
          size: 20,
        }),
        makeCell(meta.emitter, { widthPct: 14, fill, valign: VerticalAlign.TOP, size: 20 }),
        makeCell(meta.article, { widthPct: 12, fill, valign: VerticalAlign.TOP, size: 20 }),
        makeCell(n.afectacion, { widthPct: 26, fill, valign: VerticalAlign.TOP, size: 20 }),
        makeCell(n.queDebeHacer, { widthPct: 25, fill, valign: VerticalAlign.TOP, size: 20 }),
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
  const sortedTerms = [...state.terminologia].sort((a, b) =>
    a.termino.localeCompare(b.termino, 'es', { sensitivity: 'base' })
  );

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      makeCell('Término', { widthPct: 28, header: true, size: 22 }),
      makeCell('Definición', { widthPct: 72, header: true, size: 22 }),
    ],
  });

  const dataRows = sortedTerms.map((t, idx) => {
    const fill = idx % 2 === 1 ? COLOR_ZEBRA_BG : undefined;
    return new TableRow({
      cantSplit: true,
      children: [
        makeCell(t.termino, {
          widthPct: 28,
          bold: true,
          color: COLOR_BLACK,
          fill,
          valign: VerticalAlign.TOP,
          size: 22,
        }),
        makeCell(t.definicion, { widthPct: 72, fill, valign: VerticalAlign.TOP, size: 22 }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...dataRows],
  });
}

function buildConveniosResumenTable(state: BienestarState): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      makeCell('Entidad oficial', { widthPct: 20, header: true, size: 18 }),
      makeCell('Tipo', { widthPct: 16, header: true, size: 18 }),
      makeCell('Actividades del Plan relacionadas', { widthPct: 24, header: true, size: 18 }),
      makeCell('Beneficio / Estado de gestión', { widthPct: 20, header: true, size: 18 }),
      makeCell('Canal oficial publicado', { widthPct: 20, header: true, size: 18 }),
    ],
  });

  const dataRows = state.convenios.map((conv, idx) => {
    const fill = idx % 2 === 1 ? COLOR_ZEBRA_BG : undefined;
    const acts = (conv.actividadesPlan || []).join(', ') || conv.nombreConvenio;
    const estado = conv.estadoGestion || 'Por consultar';
    const tipoBen = conv.tipoBeneficio ? `${conv.tipoBeneficio} · ` : '';
    const web = conv.paginaWebOficial || conv.datosContacto;
    return new TableRow({
      cantSplit: true,
      children: [
        makeCell(conv.entidad, {
          widthPct: 20,
          bold: true,
          color: COLOR_BLACK,
          fill,
          valign: VerticalAlign.TOP,
          size: 18,
        }),
        makeCell(conv.tipoEntidad || 'Institución', {
          widthPct: 16,
          fill,
          valign: VerticalAlign.TOP,
          size: 18,
        }),
        makeCell(acts, { widthPct: 24, fill, valign: VerticalAlign.TOP, size: 18 }),
        makeCell(`${tipoBen}Estado: ${estado}`, {
          widthPct: 20,
          fill,
          valign: VerticalAlign.TOP,
          size: 18,
        }),
        makeCell(`${web} (${conv.datosContacto})`, {
          widthPct: 20,
          fill,
          valign: VerticalAlign.TOP,
          size: 18,
        }),
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
    const yesTarget = step.yesTargetId
      ? byId.get(step.yesTargetId) || 'Siguiente actividad'
      : 'Siguiente actividad';
    const noTarget = step.noTargetId
      ? byId.get(step.noTargetId) || 'Ajuste'
      : 'Ajuste y nueva revisión';
    return `Control de aprobación: ${step.yesLabel || 'SÍ'} -> ${yesTarget} | ${step.noLabel || 'NO'} -> ${noTarget} (retorna a revisión)`;
  }
  if (step.isAdjustment && step.nextTargetId) {
    return `Corrección y retorno -> ${byId.get(step.nextTargetId) || 'Revisión'}`;
  }
  if (step.nextTargetId) {
    return `Continúa -> ${byId.get(step.nextTargetId) || 'Siguiente paso'}`;
  }
  return 'Cierre formal del procedimiento';
}

/**
 * Matriz Detallada completa (7 columnas, todas las filas sin recortar ni resumir,
 * repetición automática de encabezados en saltos de página).
 */
function buildMatrizTable(state: BienestarState): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      makeCell('#', { widthPct: 4, header: true, align: AlignmentType.CENTER, size: 20 }),
      makeCell('Símbolo / Tipo', { widthPct: 12, header: true, size: 20 }),
      makeCell('Actividad', { widthPct: 16, header: true, size: 20 }),
      makeCell('Descripción detallada de la actividad', { widthPct: 29, header: true, size: 20 }),
      makeCell('Responsable / Cargo', { widthPct: 11, header: true, size: 20 }),
      makeCell('Registro / Documento / Evidencia', { widthPct: 13, header: true, size: 20 }),
      makeCell('Secuencia / Control y Flujo (SÍ / NO)', { widthPct: 15, header: true, size: 20 }),
    ],
  });

  const dataRows = state.proceso.map((step, idx) => {
    const fill = idx % 2 === 1 ? COLOR_ZEBRA_BG : undefined;
    return new TableRow({
      cantSplit: true,
      children: [
        makeCell(String(idx + 1), {
          widthPct: 4,
          bold: true,
          color: COLOR_TEXT,
          align: AlignmentType.CENTER,
          valign: VerticalAlign.TOP,
          fill,
          size: 20,
        }),
        makeCell(SYMBOL_LABELS[step.symbol], { widthPct: 12, fill, valign: VerticalAlign.TOP, size: 20 }),
        makeCell(step.actividad, {
          widthPct: 16,
          bold: true,
          color: COLOR_BLACK,
          fill,
          valign: VerticalAlign.TOP,
          size: 20,
        }),
        makeCell(step.descripcion, { widthPct: 29, fill, valign: VerticalAlign.TOP, size: 20 }),
        makeCell(step.responsable, { widthPct: 11, fill, valign: VerticalAlign.TOP, size: 20 }),
        makeCell(step.registroDocumento, {
          widthPct: 13,
          bold: true,
          fill,
          valign: VerticalAlign.TOP,
          size: 20,
        }),
        makeCell(describeFlowRoute(step, state.proceso), {
          widthPct: 15,
          fill,
          valign: VerticalAlign.TOP,
          size: 20,
          color: COLOR_BLACK,
        }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...dataRows],
  });
}

function buildFlowchartVisualParagraphs(
  pages: FlowchartDiagramPageAsset[],
  empresa: string,
  totalSteps: number
): Paragraph[] {
  if (pages.length === 0) {
    return [
      formalBodyParagraph(
        'Nota técnica: La secuencia gráfica completa se acompaña en la Matriz Detallada del presente manual.'
      ),
    ];
  }

  const out: Paragraph[] = [];
  pages.forEach((page, idx) => {
    const fit = fitAspectDimensions(page.width, page.height, 580, 720);
    out.push(
      new Paragraph({
        pageBreakBefore: idx > 0,
        keepNext: true,
        alignment: AlignmentType.LEFT,
        spacing: { before: 120, after: 20 },
        children: [
          new TextRun({
            text: `Figura ${page.pageNumber}`,
            font: FONT_FAMILY,
            size: 24,
            bold: true,
            color: COLOR_BLACK,
          }),
        ],
      }),
      new Paragraph({
        keepNext: true,
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 80 },
        children: [
          new TextRun({
            text: `Diagrama de flujo del procedimiento de Bienestar Social Laboral (${page.rangeLabel})`,
            font: FONT_FAMILY,
            size: 24,
            italics: true,
            color: COLOR_TEXT,
          }),
        ],
      }),
      new Paragraph({
        keepNext: true,
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 60 },
        children: [
          new ImageRun({
            data: page.bytes,
            transformation: {
              width: fit.width,
              height: fit.height,
            },
            type: 'png',
          }),
        ],
      }),
      apaTableNote(
        `Elaboración institucional de ${empresa} mediante simbología estándar ANSI/ISO (${totalSteps} etapas sincronizadas con la Matriz Detallada).`
      )
    );
  });

  return out;
}

/**
 * Encabezado y pie de página institucional para todas las páginas de contenido:
 * incluye la Caja de Calidad institucional de Frikaz S.A.S. y numeración de páginas.
 */
function buildBodySectionHeaderFooter(
  state: BienestarState,
  logoAsset: QualityLogoAsset | null,
  subtitleLabel?: string
) {
  const p = state.manual.portada;
  const codePart = p.codigoDocumental?.trim() ? ` · Código ${p.codigoDocumental.trim()}` : '';
  const verPart = p.version?.trim() ? ` · Versión ${p.version.trim()}` : '';
  const datePart = p.fechaActualizacion?.trim() ? ` · Fecha ${p.fechaActualizacion.trim()}` : '';
  const titleLabel = subtitleLabel ? `${p.nombreDocumento} · ${subtitleLabel}` : p.nombreDocumento;

  return {
    headers: {
      default: new Header({
        children: [
          buildQualityBoxTable(state, logoAsset, true),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 40, after: 0 },
            children: [
              new TextRun({
                text: `${p.empresa}${codePart}${verPart}    Página `,
                font: FONT_FAMILY,
                size: 16,
                color: COLOR_MUTED,
              }),
              new TextRun({
                children: [PageNumber.CURRENT],
                font: FONT_FAMILY,
                size: 16,
                bold: true,
                color: COLOR_NAVY,
              }),
              new TextRun({
                text: ' de ',
                font: FONT_FAMILY,
                size: 16,
                color: COLOR_MUTED,
              }),
              new TextRun({
                children: [PageNumber.TOTAL_PAGES],
                font: FONT_FAMILY,
                size: 16,
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
            border: {
              top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            },
            spacing: { before: 40, after: 0 },
            children: [
              new TextRun({
                text: `${p.empresa} · ${titleLabel}${datePart}`,
                font: FONT_FAMILY,
                size: 16,
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
 * Documento Word único e integral del Manual de Procedimiento de Frikaz S.A.S.
 * Estructura obligatoria en orden exacto + normas APA 7ª edición + Caja de Calidad en todos los apartados:
 * 1. Portada
 * 2. Introducción
 * 3. Objetivos (general y específicos)
 * 4. Alcance
 * 5. Justificación
 * 6. Normograma
 * 7. Flujograma (diagrama visual ANSI/ISO completo)
 * 8. Matriz Detallada (hoja horizontal completa, encabezados repetitivos)
 * 9. Terminología (ordenada alfabéticamente)
 * + Referencias (APA 7ª ed.)
 */
export async function generateManualWordBlob(state: BienestarState): Promise<Blob> {
  const p = state.manual.portada;
  const [logoAsset, diagramPages] = await Promise.all([
    loadInstitutionalQualityLogo(),
    generateFlowchartDiagramPages(state.proceso),
  ]);

  // 2. Introducción (contenido fiel al Manual vigente sin anexos artificiales)
  const introParagraphs = splitNarrativeParagraphs(state.manual.introduccion);

  // 4. Alcance
  const alcanceParagraphs = splitNarrativeParagraphs(state.manual.alcance);

  // 5. Justificación
  const justParagraphs = splitNarrativeParagraphs(state.manual.justificacion);

  const apaReferences = buildGroundedApaReferences(state);

  const portraitBodyHF = buildBodySectionHeaderFooter(state, logoAsset);
  const landscapeMatrizHF = buildBodySectionHeaderFooter(state, logoAsset, 'Matriz Detallada');

  const doc = new Document({
    creator: p.empresa,
    title: `Manual de Procedimiento · ${p.empresa}`,
    description: `${p.nombreDocumento} - ${p.empresa}`,
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: 24, // 12pt
            color: COLOR_TEXT,
          },
          paragraph: {
            spacing: { line: BODY_LINE_SPACING, lineRule: 'auto' },
          },
        },
        heading1: {
          run: {
            font: FONT_FAMILY,
            size: 28, // 14pt
            bold: true,
            color: COLOR_NAVY,
          },
          paragraph: {
            spacing: { line: BODY_LINE_SPACING, before: 220, after: 120 },
          },
        },
        heading2: {
          run: {
            font: FONT_FAMILY,
            size: 24, // 12pt
            bold: true,
            color: COLOR_NAVY,
          },
          paragraph: {
            spacing: { line: BODY_LINE_SPACING, before: 160, after: 80 },
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
            font: FONT_FAMILY,
            size: 24,
            color: COLOR_TEXT,
          },
          paragraph: {
            spacing: { line: BODY_LINE_SPACING, lineRule: 'auto' },
          },
        },
      ],
    },
    sections: [
      // 1. PORTADA INDEPENDIENTE (Página 1)
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
        children: buildPortadaSectionChildren(state, logoAsset),
      },

      // 2..7: INTRODUCCIÓN, OBJETIVOS, ALCANCE, JUSTIFICACIÓN, NORMOGRAMA, FLUJOGRAMA
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: {
              top: BODY_HEADER_TOP_MARGIN,
              bottom: MARGIN_TWIPS,
              left: MARGIN_TWIPS,
              right: MARGIN_TWIPS,
              header: HEADER_OFFSET_TWIPS,
              footer: FOOTER_OFFSET_TWIPS,
            },
          },
        },
        ...portraitBodyHF,
        children: [
          // 2. Introducción
          apaHeading1('Introducción'),
          ...introParagraphs,

          // 3. Objetivos
          apaHeading1('Objetivos'),
          apaHeading2('Objetivo general'),
          ...splitNarrativeParagraphs(state.manual.objetivoGeneral),
          apaNarrativeParagraph(
            `Responsable: ${state.manual.objetivoGeneralResponsable || 'Gerente'}.${
              state.manual.objetivoGeneralFuncion
                ? ` Función breve: ${state.manual.objetivoGeneralFuncion}`
                : ''
            }`,
            { bold: false, indent: true }
          ),

          apaHeading2('Objetivos específicos'),
          ...(state.manual.objetivosEspecificos.length === 0
            ? [apaNarrativeParagraph('No se han registrado objetivos específicos.')]
            : state.manual.objetivosEspecificos.flatMap((obj, idx) => [
                apaNarrativeParagraph(`${idx + 1}. ${obj.texto}`, { after: 30 }),
                apaNarrativeParagraph(
                  `Responsable: ${obj.responsable || 'Gerente'}.${
                    obj.funcionResponsable ? ` Función: ${obj.funcionResponsable}` : ''
                  }`,
                  { indent: true, after: 80 }
                ),
              ])),

          // 4. Alcance
          apaHeading1('Alcance'),
          ...alcanceParagraphs,

          // 5. Justificación
          apaHeading1('Justificación'),
          ...justParagraphs,

          // 5b. Responsables del Plan de Bienestar
          apaHeading1('Responsables del Plan de Bienestar'),
          apaNarrativeParagraph(
            `Cargo principal: ${state.responsablesPlan.cargoPrincipal}. ${state.responsablesPlan.alcanceResponsabilidad}`
          ),
          ...state.responsablesPlan.responsabilidades.map((r) =>
            apaNarrativeParagraph(`${r.numero}. ${r.texto}`, { after: 50 })
          ),

          // 6. Normograma
          apaHeading1('Normograma', true),
          apaNarrativeParagraph(
            `La Tabla 1 reúne las ${state.normograma.length} disposiciones legales y reglamentarias vigentes aplicables al procedimiento de Bienestar Social Laboral en ${p.empresa}, especificando su año de expedición cuando consta en el registro, entidad emisora, apartado aplicable, relación con el procedimiento y aplicación institucional.`
          ),
          ...apaTableCaption(
            1,
            `Normograma legal aplicable al procedimiento de Bienestar Social Laboral de ${p.empresa}`
          ),
          buildNormogramaTable(state),
          apaTableNote(
            `Matriz normativa sincronizada directamente con la plataforma (${state.normograma.length} normas activas).`
          ),

          // 7. Flujograma (diagrama visual completo)
          apaHeading1('Flujograma', true),
          apaNarrativeParagraph(
            `El diagrama visual de flujo representa integralmente la secuencia lógica del procedimiento de Bienestar Social Laboral de ${p.empresa} (${state.proceso.length} etapas), integrando inicio y finalización, actividades operativas, compuertas de decisión (SÍ / NO), ciclos de ajuste, conectores, flechas direccionales y el cargo responsable (${state.responsablesPlan.cargoPrincipal}).`
          ),
          ...buildFlowchartVisualParagraphs(diagramPages, p.empresa, state.proceso.length),
        ],
      },

      // 8. MATRIZ DETALLADA (Sección Horizontal dedicada para máxima legibilidad y encabezados repetidos)
      {
        properties: {
          page: {
            size: {
              width: 12240,
              height: 15840,
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: BODY_HEADER_TOP_MARGIN,
              bottom: LANDSCAPE_SIDE_MARGIN,
              left: LANDSCAPE_SIDE_MARGIN,
              right: LANDSCAPE_SIDE_MARGIN,
              header: HEADER_OFFSET_TWIPS,
              footer: FOOTER_OFFSET_TWIPS,
            },
          },
        },
        ...landscapeMatrizHF,
        children: [
          apaHeading1('Matriz Detallada'),
          formalBodyParagraph(
            `Responsable funcional: ${state.matrizMeta.responsable || 'Pendiente de asignación'}. Código de matriz: ${state.matrizMeta.codigo?.trim() || 'Pendiente de asignación'} · Versión: ${state.matrizMeta.version?.trim() || 'Pendiente de asignación'} · Fecha: ${state.matrizMeta.fecha?.trim() || 'Pendiente de asignación'}. Objetivo operativo: ${state.matrizMeta.objetivo}`
          ),
          ...apaTableCaption(
            2,
            `Matriz detallada completa de actividades, responsables, registros y controles de ${state.matrizMeta.empresa}`
          ),
          buildMatrizTable(state),
          apaTableNote(
            `Total de etapas, actividades y compuertas documentadas sin omisiones ni resúmenes: ${state.proceso.length}.`
          ),
        ],
      },

      // 9. TERMINOLOGÍA + REFERENCIAS (APA 7ª edición) en Vertical
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840, orientation: PageOrientation.PORTRAIT },
            margin: {
              top: BODY_HEADER_TOP_MARGIN,
              bottom: MARGIN_TWIPS,
              left: MARGIN_TWIPS,
              right: MARGIN_TWIPS,
              header: HEADER_OFFSET_TWIPS,
              footer: FOOTER_OFFSET_TWIPS,
            },
          },
        },
        ...portraitBodyHF,
        children: [
          // 9. Terminología (ordenada alfabéticamente)
          apaHeading1('Terminología'),
          apaNarrativeParagraph(
            `La Tabla 3 presenta alfabéticamente los ${state.terminologia.length} términos y definiciones oficiales adoptados para la comprensión e implementación del procedimiento de Bienestar Social Laboral en ${p.empresa}.`
          ),
          ...apaTableCaption(
            3,
            `Glosario y terminología de Bienestar Social Laboral de ${p.empresa} (orden alfabético)`
          ),
          buildTerminologiaTable(state),
          apaTableNote(
            `Terminología sincronizada integralmente desde la plataforma (${state.terminologia.length} conceptos definidos).`
          ),

          // Opciones verificadas de convenios y alianzas externas (informativo)
          apaHeading1('Opciones de Alianzas y Convenios Estratégicos', true),
          apaNarrativeParagraph(
            `La Tabla 4 presenta el directorio de ${state.convenios.length} entidades verificadas en fuentes oficiales colombianas como opciones reales de contacto y gestión para ${p.empresa}. Estas entidades no corresponden a convenios vigentes firmados en este momento; su gestión corresponde a la ${state.responsablesPlan.cargoPrincipal}.`
          ),
          ...apaTableCaption(
            4,
            `Opciones verificadas de contacto y gestión externa para el Plan de Bienestar de ${p.empresa} (no vigentes como convenios firmados)`
          ),
          buildConveniosResumenTable(state),
          apaTableNote(
            'Las actividades internas como flexibilidad horaria, cumpleaños, Trabajador del mes, desayunos comunitarios y bonos familiares son gestionadas directamente por la Gerente.'
          ),

          // Referencias (APA 7ª edición)
          apaHeading1('Referencias', true),
          ...apaReferences.map(
            (ref) =>
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: HANGING_INDENT, hanging: HANGING_INDENT },
                spacing: { line: BODY_LINE_SPACING, before: 0, after: 40 },
                children: [
                  new TextRun({
                    text: ref,
                    font: FONT_FAMILY,
                    size: 24,
                    color: COLOR_TEXT,
                  }),
                ],
              })
          ),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

function sanitizeFilenameToken(raw?: string): string {
  return (raw || '').trim().replace(/[^a-zA-Z0-9_-]/g, '-');
}

export function buildWordFilename(state: BienestarState): string {
  const code = sanitizeFilenameToken(state.manual.portada.codigoDocumental);
  const ver = sanitizeFilenameToken(state.manual.portada.version);
  const suffix = [code, ver ? `v${ver}` : ''].filter(Boolean).join('_');
  return suffix
    ? `Manual_de_Procedimiento_Frikaz_SAS_${suffix}.docx`
    : 'Manual_de_Procedimiento_Frikaz_SAS.docx';
}
