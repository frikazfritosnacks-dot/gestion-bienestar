import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { ENCUESTAS_POR_ACTIVIDAD } from '../data/planBienestarData';
import {
  BienestarState,
  ListaAsistenciaActividad,
  ProgramaBienestar,
  RespuestaEncuesta,
} from '../types/bienestar';
import {
  fitAspectDimensions,
  loadInstitutionalQualityLogo,
  QualityLogoAsset,
} from './institutionalLogoAsset';
import { FormatoWordKey, generateWordFormatBlob } from './wordFormatsGenerator';

const FRIKAZ_NAVY = 'FF0F294A';
const FRIKAZ_RED = 'FFD61F26';
const FRIKAZ_YELLOW = 'FFFACC15';
const FRIKAZ_YELLOW_SOFT = 'FFFEF9C3';
const FRIKAZ_RED_SOFT = 'FFFEF2F2';
const FRIKAZ_BLUE_SOFT = 'FFEFF6FF';
const WHITE = 'FFFFFFFF';
const BORDER_COLOR = 'FFCBD5E1';

const MONTHS_2027 = [
  'Ene 27', 'Feb 27', 'Mar 27', 'Abr 27', 'May 27', 'Jun 27',
  'Jul 27', 'Ago 27', 'Sep 27', 'Oct 27', 'Nov 27', 'Dic 27',
];

function applyThinBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: BORDER_COLOR } },
    left: { style: 'thin', color: { argb: BORDER_COLOR } },
    bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
    right: { style: 'thin', color: { argb: BORDER_COLOR } },
  };
}

const QUALITY_BOX_BORDER = 'FF1E293B';

function applyQualityBoxBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: QUALITY_BOX_BORDER } },
    left: { style: 'thin', color: { argb: QUALITY_BOX_BORDER } },
    bottom: { style: 'thin', color: { argb: QUALITY_BOX_BORDER } },
    right: { style: 'thin', color: { argb: QUALITY_BOX_BORDER } },
  };
}

/**
 * Caja de Calidad institucional única y obligatoria en filas 1-3 para todos los libros Excel,
 * fiel al formato oficial: fondo blanco limpio, bordes nítidos oscuros y grilla 3 columnas
 * (logo izquierdo en 3 filas, razón social + título en columna central, CÓDIGO/VERSIÓN/FECHA a la derecha).
 */
function addQualityHeader(
  wb: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  title: string,
  colCount: number,
  logoAsset: QualityLogoAsset | null,
  meta?: {
    empresa?: string;
    codigo?: string;
    version?: string;
    fecha?: string;
  }
) {
  const safeCols = Math.max(colCount, 5);
  const logoColEnd = safeCols >= 10 ? 2 : 1;
  const metaColSpan = safeCols >= 14 ? 3 : safeCols >= 8 ? 2 : 1;
  const midStart = logoColEnd + 1;
  const midEnd = safeCols - metaColSpan;
  const metaStart = safeCols - metaColSpan + 1;

  const empresa = meta?.empresa?.trim() || 'Frikaz S.A.S.';
  const cleanCode = meta?.codigo?.trim() || '';
  const cleanVersion = meta?.version?.trim() || '';
  const cleanDate = meta?.fecha?.trim() || '';

  ws.getRow(1).height = 22;
  ws.getRow(2).height = 22;
  ws.getRow(3).height = 22;

  for (let r = 1; r <= 3; r++) {
    for (let c = 1; c <= safeCols; c++) {
      const cell = ws.getCell(r, c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: WHITE } };
      applyQualityBoxBorder(cell);
    }
  }

  // Columna izquierda (filas 1-3): Logotipo oficial
  ws.mergeCells(1, 1, 3, logoColEnd);
  if (logoAsset) {
    const imgId = wb.addImage({
      base64: logoAsset.base64,
      extension: 'png',
    });
    const fit = fitAspectDimensions(logoAsset.width, logoAsset.height, 118, 56);
    ws.addImage(imgId, {
      tl: { col: 0.14, row: 0.14 },
      ext: { width: fit.width, height: fit.height },
      editAs: 'oneCell',
    });
  } else {
    ws.getCell(1, 1).value = empresa;
    ws.getCell(1, 1).font = { name: 'Calibri', size: 12, bold: true, color: { argb: FRIKAZ_RED } };
    ws.getCell(1, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // Columna central (filas 1-2: empresa, fila 3: título del formato)
  ws.mergeCells(1, midStart, 2, midEnd);
  const companyCell = ws.getCell(1, midStart);
  companyCell.value = empresa;
  companyCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: QUALITY_BOX_BORDER } };
  companyCell.alignment = { horizontal: 'center', vertical: 'middle' };

  if (midEnd > midStart) {
    ws.mergeCells(3, midStart, 3, midEnd);
  }
  const titleCell = ws.getCell(3, midStart);
  titleCell.value = title.toUpperCase();
  titleCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: QUALITY_BOX_BORDER } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  // Columna derecha (fila 1: CÓDIGO, fila 2: VERSIÓN, fila 3: FECHA)
  const metaRows: Array<[number, string]> = [
    [1, `CÓDIGO: ${cleanCode}`],
    [2, `VERSIÓN: ${cleanVersion}`],
    [3, `FECHA: ${cleanDate}`],
  ];
  for (const [rIdx, label] of metaRows) {
    if (safeCols > metaStart) {
      ws.mergeCells(rIdx, metaStart, rIdx, safeCols);
    }
    const mCell = ws.getCell(rIdx, metaStart);
    mCell.value = label;
    mCell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: QUALITY_BOX_BORDER } };
    mCell.alignment = { horizontal: 'left', vertical: 'middle' };
  }
}

function addInstructionsRow(
  ws: ExcelJS.Worksheet,
  rowIdx: number,
  colCount: number,
  instructions: string
) {
  ws.mergeCells(rowIdx, 1, rowIdx, colCount);
  const row = ws.getRow(rowIdx);
  row.height = 24;
  const cell = row.getCell(1);
  cell.value = `INSTRUCCIONES DE DILIGENCIAMIENTO: ${instructions}`;
  cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: FRIKAZ_NAVY } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_BLUE_SOFT } };
  cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  for (let c = 1; c <= colCount; c++) applyThinBorder(row.getCell(c));
}

function styleTableHeaderRow(row: ExcelJS.Row, colCount: number) {
  row.height = 26;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_NAVY } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    applyThinBorder(cell);
  }
}

async function workbookToBuffer(wb: ExcelJS.Workbook): Promise<ArrayBuffer> {
  return wb.xlsx.writeBuffer();
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 1. Presupuesto general anual 2027 (Formato en blanco con fórmulas automáticas)
 */
export async function buildPresupuestoGeneral2027Workbook(
  _state?: BienestarState,
  logoArg?: QualityLogoAsset | null
): Promise<ExcelJS.Workbook> {
  const logo = logoArg !== undefined ? logoArg : await loadInstitutionalQualityLogo();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Frikaz S.A.S.';
  const ws = wb.addWorksheet('Presupuesto General');

  ws.columns = [
    { width: 7 },
    { width: 36 },
    { width: 16 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 18 },
    { width: 15 },
    { width: 28 },
  ];

  addQualityHeader(
    wb,
    ws,
    'PRESUPUESTO GENERAL ANUAL 2027 · FORMATO EN BLANCO',
    9,
    logo
  );
  addInstructionsRow(
    ws,
    4,
    9,
    'Registre el nombre de cada actividad, dimensión y los valores asignados y ejecutados en COP. Las columnas Disponible, Diferencia, % Ejecución y Totales se calculan automáticamente.'
  );

  const rMeta = ws.getRow(5);
  rMeta.height = 22;
  ws.mergeCells(5, 1, 5, 3);
  rMeta.getCell(1).value = 'Presupuesto General Proyectado / Aprobado (COP):';
  rMeta.getCell(1).font = { bold: true, size: 10, color: { argb: FRIKAZ_NAVY } };
  rMeta.getCell(4).value = null;
  rMeta.getCell(4).numFmt = '$#,##0';
  ws.mergeCells(5, 5, 5, 7);
  rMeta.getCell(5).value = 'Población beneficiaria:';
  rMeta.getCell(5).font = { bold: true, size: 10, color: { argb: FRIKAZ_NAVY } };
  rMeta.getCell(8).value = '';
  for (let c = 1; c <= 9; c++) applyThinBorder(rMeta.getCell(c));

  const headerRow = ws.getRow(6);
  headerRow.values = [
    'N.º',
    'Actividad',
    'Dimensión',
    'Presupuesto Asignado',
    'Dinero Ejecutado',
    'Dinero Disponible',
    'Diferencia (Pres. - Ejec.)',
    '% Ejecución',
    'Estado Presupuestal',
  ];
  styleTableHeaderRow(headerRow, 9);

  const emptyRows = 12;
  ws.autoFilter = `A6:I${6 + emptyRows}`;

  for (let idx = 0; idx < emptyRows; idx++) {
    const rowIdx = 7 + idx;
    const row = ws.getRow(rowIdx);
    row.height = 22;
    row.values = [
      idx + 1,
      '',
      '',
      null,
      null,
      { formula: `IF(OR(ISNUMBER(D${rowIdx}),ISNUMBER(E${rowIdx})),N(D${rowIdx})-N(E${rowIdx}),"")` },
      { formula: `IF(OR(ISNUMBER(D${rowIdx}),ISNUMBER(E${rowIdx})),N(D${rowIdx})-N(E${rowIdx}),"")` },
      { formula: `IFERROR(E${rowIdx}/D${rowIdx},"")` },
      '',
    ];
    for (let c = 1; c <= 9; c++) {
      const cell = row.getCell(c);
      cell.font = { size: 10, color: { argb: FRIKAZ_NAVY }, bold: c >= 6 && c <= 8 };
      if (c >= 4 && c <= 7) cell.numFmt = '$#,##0';
      if (c === 8) cell.numFmt = '0.0%';
      cell.alignment = {
        horizontal: c === 1 || c === 8 ? 'center' : c >= 4 && c <= 7 ? 'right' : 'left',
        vertical: 'middle',
        wrapText: true,
      };
      applyThinBorder(cell);
    }
  }

  const totIdx = 7 + emptyRows;
  const totRow = ws.getRow(totIdx);
  totRow.height = 26;
  totRow.getCell(2).value = 'TOTAL GENERAL PRESUPUESTADO';
  totRow.getCell(4).value = { formula: `SUM(D7:D${totIdx - 1})` };
  totRow.getCell(5).value = { formula: `SUM(E7:E${totIdx - 1})` };
  totRow.getCell(6).value = { formula: `D${totIdx}-E${totIdx}` };
  totRow.getCell(7).value = { formula: `D${totIdx}-E${totIdx}` };
  totRow.getCell(8).value = { formula: `IFERROR(E${totIdx}/D${totIdx},0)` };
  for (let c = 1; c <= 9; c++) {
    const cell = totRow.getCell(c);
    cell.font = { bold: true, size: 10, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_NAVY } };
    if (c >= 4 && c <= 7) cell.numFmt = '$#,##0';
    if (c === 8) cell.numFmt = '0.0%';
    applyThinBorder(cell);
  }

  return wb;
}

/**
 * 2. Desglose presupuestal por actividad (Formato en blanco con fórmulas automáticas)
 */
export async function buildDesglosePresupuestalWorkbook(
  _state?: BienestarState,
  logoArg?: QualityLogoAsset | null
): Promise<ExcelJS.Workbook> {
  const logo = logoArg !== undefined ? logoArg : await loadInstitutionalQualityLogo();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Frikaz S.A.S.';
  const ws = wb.addWorksheet('Desglose Presupuestal');

  ws.columns = [
    { width: 28 },
    { width: 15 },
    { width: 38 },
    { width: 11 },
    { width: 18 },
    { width: 16 },
    { width: 18 },
    { width: 24 },
    { width: 16 },
  ];

  addQualityHeader(
    wb,
    ws,
    'DESGLOSE PRESUPUESTAL POR ACTIVIDAD · FORMATO EN BLANCO',
    9,
    logo
  );
  addInstructionsRow(
    ws,
    4,
    9,
    'Ingrese cada recurso o material, su cantidad y valor unitario en COP. La columna Valor Total (=Cantidad*Valor unitario) y la fila Total se calculan automáticamente.'
  );

  const headerRow = ws.getRow(5);
  headerRow.values = [
    'Actividad',
    'Dimensión',
    'Recurso o material',
    'Cantidad',
    'Unidad de medida',
    'Valor unitario',
    'Valor total',
    'Frecuencia de compra',
    'Ejecutado',
  ];
  styleTableHeaderRow(headerRow, 9);

  const rowsCount = 20;
  ws.autoFilter = `A5:I${5 + rowsCount}`;

  for (let idx = 0; idx < rowsCount; idx++) {
    const rowIdx = 6 + idx;
    const row = ws.getRow(rowIdx);
    row.height = 22;
    row.values = [
      '',
      '',
      '',
      null,
      '',
      null,
      { formula: `IF(AND(ISNUMBER(D${rowIdx}),ISNUMBER(F${rowIdx})),D${rowIdx}*F${rowIdx},"")` },
      '',
      null,
    ];
    for (let c = 1; c <= 9; c++) {
      const cell = row.getCell(c);
      cell.font = { size: 10, color: { argb: FRIKAZ_NAVY }, bold: c === 7 };
      if (c === 6 || c === 7 || c === 9) cell.numFmt = '$#,##0';
      cell.alignment = {
        horizontal: c === 4 ? 'center' : c === 6 || c === 7 || c === 9 ? 'right' : 'left',
        vertical: 'middle',
        wrapText: true,
      };
      applyThinBorder(cell);
    }
  }

  const totIdx = 6 + rowsCount;
  const totRow = ws.getRow(totIdx);
  totRow.height = 25;
  totRow.getCell(1).value = 'TOTAL RECURSOS REGISTRADOS';
  totRow.getCell(7).value = { formula: `SUM(G6:G${totIdx - 1})` };
  totRow.getCell(9).value = { formula: `SUM(I6:I${totIdx - 1})` };
  for (let c = 1; c <= 9; c++) {
    const cell = totRow.getCell(c);
    cell.font = { bold: true, size: 10, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_NAVY } };
    if (c === 7 || c === 9) cell.numFmt = '$#,##0';
    applyThinBorder(cell);
  }

  return wb;
}

/**
 * 3. Cronograma anual 2027 (Formato en blanco con los 15 parámetros)
 */
export async function buildCronogramaAnual2027Workbook(
  _state?: BienestarState,
  logoArg?: QualityLogoAsset | null
): Promise<ExcelJS.Workbook> {
  const logo = logoArg !== undefined ? logoArg : await loadInstitutionalQualityLogo();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Frikaz S.A.S.';
  const ws = wb.addWorksheet('Cronograma Anual 2027');

  ws.columns = [
    { width: 26 },
    { width: 15 },
    { width: 30 },
    { width: 28 },
    { width: 28 },
    { width: 22 },
    { width: 26 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
    { width: 22 },
    { width: 18 },
    { width: 24 },
    { width: 24 },
    { width: 15 },
  ];

  addQualityHeader(
    wb,
    ws,
    'CRONOGRAMA ANUAL 2027 · FORMATO EN BLANCO (15 PARÁMETROS)',
    15,
    logo
  );
  addInstructionsRow(
    ws,
    4,
    15,
    'Complete los 15 parámetros por cada actividad programada. El total de presupuesto asignado se suma automáticamente en la fila inferior.'
  );

  const headerRow = ws.getRow(5);
  headerRow.values = [
    '1. Nombre de la actividad',
    '2. Dimensión',
    '3. Objetivo específico',
    '4. Metodología',
    '5. Descripción de la actividad',
    '6. Responsable',
    '7. Recursos necesarios',
    '8. Presupuesto asignado',
    '9. Fecha de inicio',
    '10. Fecha de finalización',
    '11. Frecuencia',
    '12. Duración estimada',
    '13. Indicador de cumplimiento',
    '14. Evidencia de ejecución',
    '15. Estado',
  ];
  styleTableHeaderRow(headerRow, 15);

  const rowsCount = 12;
  ws.autoFilter = `A5:O${5 + rowsCount}`;

  for (let idx = 0; idx < rowsCount; idx++) {
    const rowIdx = 6 + idx;
    const row = ws.getRow(rowIdx);
    row.height = 24;
    row.values = ['', '', '', '', '', '', '', null, '', '', '', '', '', '', ''];
    for (let c = 1; c <= 15; c++) {
      const cell = row.getCell(c);
      cell.font = { size: 9.5, color: { argb: FRIKAZ_NAVY } };
      if (c === 8) cell.numFmt = '$#,##0';
      cell.alignment = {
        horizontal: c === 8 ? 'right' : c === 9 || c === 10 || c === 15 ? 'center' : 'left',
        vertical: 'middle',
        wrapText: true,
      };
      applyThinBorder(cell);
    }
  }

  const totIdx = 6 + rowsCount;
  const totRow = ws.getRow(totIdx);
  totRow.height = 24;
  totRow.getCell(1).value = 'TOTAL PRESUPUESTO CRONOGRAMA';
  totRow.getCell(8).value = { formula: `SUM(H6:H${totIdx - 1})` };
  totRow.getCell(8).numFmt = '$#,##0';
  for (let c = 1; c <= 15; c++) {
    const cell = totRow.getCell(c);
    cell.font = { bold: true, size: 10, color: { argb: FRIKAZ_NAVY } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_YELLOW_SOFT } };
    applyThinBorder(cell);
  }

  return wb;
}

/**
 * 4. Diagrama de Gantt 2027 (Formato en blanco con conteos automáticos)
 */
export async function buildDiagramaGantt2027Workbook(
  _state?: BienestarState,
  logoArg?: QualityLogoAsset | null
): Promise<ExcelJS.Workbook> {
  const logo = logoArg !== undefined ? logoArg : await loadInstitutionalQualityLogo();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Frikaz S.A.S.';
  const ws = wb.addWorksheet('Diagrama de Gantt 2027');

  ws.columns = [
    { width: 6 },
    { width: 32 },
    { width: 22 },
    { width: 24 },
    { width: 15 },
    { width: 13 },
    ...MONTHS_2027.map(() => ({ width: 8 })),
    { width: 13 },
  ];

  addQualityHeader(
    wb,
    ws,
    'DIAGRAMA DE GANTT ANUAL 2027 · FORMATO EN BLANCO',
    19,
    logo
  );
  addInstructionsRow(
    ws,
    4,
    19,
    'Registre cada actividad y marque con "X" los meses de ejecución entre Ene 27 y Dic 27. Los conteos mensuales y por actividad se calculan automáticamente.'
  );

  const headerRow = ws.getRow(5);
  headerRow.values = [
    'N.º',
    'Actividad',
    'Frecuencia',
    'Responsable',
    'Estado',
    '% Cumpl.',
    ...MONTHS_2027,
    'Meses Activos',
  ];
  styleTableHeaderRow(headerRow, 19);

  const rowsCount = 12;
  ws.autoFilter = `A5:S${5 + rowsCount}`;

  for (let idx = 0; idx < rowsCount; idx++) {
    const rowIdx = 6 + idx;
    const row = ws.getRow(rowIdx);
    row.height = 22;
    row.values = [
      idx + 1,
      '',
      '',
      '',
      '',
      null,
      '', '', '', '', '', '', '', '', '', '', '', '',
      { formula: `COUNTIF(G${rowIdx}:R${rowIdx},"X")` },
    ];
    for (let c = 1; c <= 19; c++) {
      const cell = row.getCell(c);
      cell.font = { size: 9.5, bold: c === 19, color: { argb: FRIKAZ_NAVY } };
      if (c === 6) cell.numFmt = '0%';
      if (c === 19) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_YELLOW_SOFT } };
      }
      cell.alignment = {
        horizontal: c === 1 || c >= 5 ? 'center' : 'left',
        vertical: 'middle',
        wrapText: true,
      };
      applyThinBorder(cell);
    }
  }

  const totRow = ws.getRow(6 + rowsCount);
  totRow.height = 24;
  totRow.getCell(2).value = 'ACTIVIDADES PROGRAMADAS POR MES';
  totRow.getCell(6).value = { formula: `IFERROR(AVERAGE(F6:F${5 + rowsCount}),0)` };
  totRow.getCell(6).numFmt = '0.0%';
  for (let c = 7; c <= 18; c++) {
    const colL = ws.getColumn(c).letter;
    totRow.getCell(c).value = {
      formula: `COUNTIF(${colL}6:${colL}${5 + rowsCount},"X")`,
    };
  }
  totRow.getCell(19).value = { formula: `SUM(S6:S${5 + rowsCount})` };
  for (let c = 1; c <= 19; c++) {
    const cell = totRow.getCell(c);
    cell.font = { bold: true, size: 10, color: { argb: FRIKAZ_NAVY } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_YELLOW } };
    cell.alignment = { horizontal: c >= 6 ? 'center' : 'left', vertical: 'middle' };
    applyThinBorder(cell);
  }

  return wb;
}

/**
 * 5. Seguimiento de ejecución de actividades (Formato en blanco)
 */
export async function buildSeguimientoActividadesWorkbook(
  _state?: BienestarState,
  logoArg?: QualityLogoAsset | null
): Promise<ExcelJS.Workbook> {
  const logo = logoArg !== undefined ? logoArg : await loadInstitutionalQualityLogo();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Frikaz S.A.S.';
  const ws = wb.addWorksheet('Seguimiento Actividades');

  ws.columns = [
    { width: 6 },
    { width: 32 },
    { width: 15 },
    { width: 13 },
    { width: 13 },
    { width: 22 },
    { width: 16 },
    { width: 15 },
    { width: 24 },
    { width: 28 },
  ];

  addQualityHeader(
    wb,
    ws,
    'SEGUIMIENTO DE EJECUCIÓN DE ACTIVIDADES · FORMATO EN BLANCO',
    10,
    logo
  );
  addInstructionsRow(
    ws,
    4,
    10,
    'Diligencie los datos de cada actividad ejecutada, su porcentaje de cumplimiento (0 a 100%) y las evidencias de respaldo.'
  );

  const headerRow = ws.getRow(5);
  headerRow.values = [
    'N.º',
    'Actividad',
    'Dimensión',
    'Fecha inicio',
    'Fecha fin',
    'Responsable',
    'Estado',
    '% Cumplimiento',
    'Meta definida',
    'Evidencias registradas',
  ];
  styleTableHeaderRow(headerRow, 10);

  const rowsCount = 12;
  ws.autoFilter = `A5:J${5 + rowsCount}`;

  for (let idx = 0; idx < rowsCount; idx++) {
    const rowIdx = 6 + idx;
    const row = ws.getRow(rowIdx);
    row.height = 24;
    row.values = [idx + 1, '', '', '', '', '', '', null, '', ''];
    for (let c = 1; c <= 10; c++) {
      const cell = row.getCell(c);
      cell.font = { size: 10, color: { argb: FRIKAZ_NAVY } };
      if (c === 8) cell.numFmt = '0%';
      cell.alignment = {
        horizontal: c === 1 || c === 4 || c === 5 || c === 7 || c === 8 ? 'center' : 'left',
        vertical: 'middle',
        wrapText: true,
      };
      applyThinBorder(cell);
    }
  }

  const avgRowIdx = 6 + rowsCount;
  const avgRow = ws.getRow(avgRowIdx);
  avgRow.height = 24;
  avgRow.getCell(2).value = 'PROMEDIO GLOBAL DE CUMPLIMIENTO';
  avgRow.getCell(8).value = { formula: `IFERROR(AVERAGE(H6:H${avgRowIdx - 1}),0)` };
  avgRow.getCell(8).numFmt = '0.0%';
  for (let c = 1; c <= 10; c++) {
    const cell = avgRow.getCell(c);
    cell.font = { bold: true, size: 10, color: { argb: FRIKAZ_NAVY } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_YELLOW_SOFT } };
    cell.alignment = { horizontal: c === 8 ? 'center' : 'left', vertical: 'middle' };
    applyThinBorder(cell);
  }

  return wb;
}

/**
 * 6A. Plantilla de Lista de Asistencia EN BLANCO (para Opción 1 y Formatos Institucionales)
 */
export async function buildPlantillaAsistenciaEnBlancoWorkbook(
  opts?: { actividadNombre?: string; dimension?: string; general?: boolean },
  logoArg?: QualityLogoAsset | null
): Promise<ExcelJS.Workbook> {
  const logo = logoArg !== undefined ? logoArg : await loadInstitutionalQualityLogo();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Frikaz S.A.S.';
  const ws = wb.addWorksheet('Lista de Asistencia');

  ws.columns = [
    { width: 8 },
    { width: 32 },
    { width: 24 },
    { width: 20 },
    { width: 24 },
    { width: 24 },
  ];

  addQualityHeader(
    wb,
    ws,
    'LISTA DE ASISTENCIA · PLAN ANUAL DE BIENESTAR SOCIAL LABORAL',
    6,
    logo
  );
  addInstructionsRow(
    ws,
    4,
    6,
    'Complete los datos de la jornada (fecha, horarios, lugar y responsable) y registre a cada trabajador participante con su firma. El total de asistentes se calcula automáticamente.'
  );

  const actLabel = opts?.general ? '' : opts?.actividadNombre || '';
  const dimLabel = opts?.general ? '' : opts?.dimension || '';

  const metaPairs: Array<[string, ExcelJS.CellValue, string, ExcelJS.CellValue]> = [
    ['Nombre de la actividad:', actLabel, 'Dimensión:', dimLabel],
    ['Fecha:', '', 'Lugar:', ''],
    ['Hora de inicio:', '', 'Hora de finalización:', ''],
    ['Responsable:', '', 'Total de asistentes:', { formula: 'COUNTA(B11:B30)' }],
  ];

  metaPairs.forEach((pair, idx) => {
    const rowIdx = 5 + idx;
    const row = ws.getRow(rowIdx);
    row.height = 21;
    ws.mergeCells(rowIdx, 2, rowIdx, 3);
    ws.mergeCells(rowIdx, 5, rowIdx, 6);

    row.getCell(1).value = pair[0];
    row.getCell(1).font = { bold: true, size: 10, color: { argb: FRIKAZ_NAVY } };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_BLUE_SOFT } };

    row.getCell(2).value = pair[1];
    row.getCell(2).font = { size: 10, color: { argb: FRIKAZ_NAVY } };

    row.getCell(4).value = pair[2];
    row.getCell(4).font = { bold: true, size: 10, color: { argb: FRIKAZ_NAVY } };
    row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_BLUE_SOFT } };

    row.getCell(5).value = pair[3];
    row.getCell(5).font = { bold: idx === 3, size: 10, color: { argb: FRIKAZ_RED } };

    for (let c = 1; c <= 6; c++) applyThinBorder(row.getCell(c));
  });

  const headerRow = ws.getRow(10);
  headerRow.values = ['N.º', 'Nombre completo', 'Cargo', 'Área', 'Documento / ID', 'Firma'];
  styleTableHeaderRow(headerRow, 6);
  ws.autoFilter = 'A10:F30';

  for (let i = 0; i < 20; i++) {
    const rowIdx = 11 + i;
    const row = ws.getRow(rowIdx);
    row.height = 21;
    row.values = [i + 1, '', '', '', '', ''];
    for (let c = 1; c <= 6; c++) {
      const cell = row.getCell(c);
      cell.font = { size: 10, color: { argb: FRIKAZ_NAVY } };
      cell.alignment = { horizontal: c === 1 ? 'center' : 'left', vertical: 'middle' };
      if (i % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
      applyThinBorder(cell);
    }
  }

  ws.mergeCells(32, 1, 32, 3);
  ws.mergeCells(32, 4, 32, 6);
  const f1 = ws.getRow(32);
  f1.height = 24;
  f1.getCell(1).value = 'Nombre del responsable: ';
  f1.getCell(4).value = 'Firma del responsable: ';
  f1.getCell(1).font = { bold: true, size: 10, color: { argb: FRIKAZ_NAVY } };
  f1.getCell(4).font = { bold: true, size: 10, color: { argb: FRIKAZ_NAVY } };
  for (let c = 1; c <= 6; c++) applyThinBorder(f1.getCell(c));

  ws.mergeCells(33, 1, 34, 6);
  const f2 = ws.getRow(33);
  f2.height = 24;
  f2.getCell(1).value = 'Observaciones: ';
  f2.getCell(1).alignment = { vertical: 'top', wrapText: true };
  for (let c = 1; c <= 6; c++) applyThinBorder(f2.getCell(c));

  return wb;
}

/**
 * 6B. Lista de Asistencia DILIGENCIADA (Opción 2: descarga exacta del registro guardado)
 */
export async function buildListaAsistenciaDiligenciadaWorkbook(
  lista: ListaAsistenciaActividad,
  logoArg?: QualityLogoAsset | null
): Promise<ExcelJS.Workbook> {
  const logo = logoArg !== undefined ? logoArg : await loadInstitutionalQualityLogo();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Frikaz S.A.S.';
  const ws = wb.addWorksheet('Lista Diligenciada');

  ws.columns = [
    { width: 8 },
    { width: 32 },
    { width: 24 },
    { width: 20 },
    { width: 24 },
    { width: 24 },
  ];

  const regCode = `ASIST-2027-${String(lista.numeroRegistro || 1).padStart(3, '0')}`;
  addQualityHeader(
    wb,
    ws,
    `LISTA DE ASISTENCIA DILIGENCIADA · ${regCode}`,
    6,
    logo,
    { fecha: lista.fecha || '' }
  );

  const metaPairs: Array<[string, ExcelJS.CellValue, string, ExcelJS.CellValue]> = [
    ['Nombre de la actividad:', lista.nombreActividad, 'Dimensión:', lista.dimension],
    ['Fecha:', lista.fecha, 'Lugar:', lista.lugar],
    ['Hora de inicio:', lista.horaInicio, 'Hora de finalización:', lista.horaFin],
    [
      'Responsable:',
      lista.responsable,
      'Total de asistentes:',
      { formula: `COUNTA(B10:B${9 + Math.max(lista.participantes.length, 10)})` },
    ],
  ];

  metaPairs.forEach((pair, idx) => {
    const rowIdx = 5 + idx;
    const row = ws.getRow(rowIdx);
    row.height = 21;
    ws.mergeCells(rowIdx, 2, rowIdx, 3);
    ws.mergeCells(rowIdx, 5, rowIdx, 6);

    row.getCell(1).value = pair[0];
    row.getCell(1).font = { bold: true, size: 10, color: { argb: FRIKAZ_NAVY } };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_BLUE_SOFT } };

    row.getCell(2).value = pair[1];
    row.getCell(2).font = { size: 10, bold: idx === 0, color: { argb: FRIKAZ_NAVY } };

    row.getCell(4).value = pair[2];
    row.getCell(4).font = { bold: true, size: 10, color: { argb: FRIKAZ_NAVY } };
    row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_BLUE_SOFT } };

    row.getCell(5).value = pair[3];
    row.getCell(5).font = { bold: idx === 3, size: 10, color: { argb: FRIKAZ_RED } };

    for (let c = 1; c <= 6; c++) applyThinBorder(row.getCell(c));
  });

  const headerRow = ws.getRow(9);
  headerRow.values = ['N.º', 'Nombre completo', 'Cargo', 'Área', 'Documento / ID', 'Firma / Constancia'];
  styleTableHeaderRow(headerRow, 6);

  const rowTotal = Math.max(lista.participantes.length, 10);
  ws.autoFilter = `A9:F${9 + rowTotal}`;

  for (let i = 0; i < rowTotal; i++) {
    const p = lista.participantes[i];
    const rowIdx = 10 + i;
    const row = ws.getRow(rowIdx);
    row.height = 21;
    row.values = [
      i + 1,
      p?.nombreCompleto || '',
      p?.cargo || '',
      p?.area || '',
      p?.documento || '',
      p?.firma || '',
    ];
    for (let c = 1; c <= 6; c++) {
      const cell = row.getCell(c);
      cell.font = { size: 10, color: { argb: FRIKAZ_NAVY } };
      cell.alignment = { horizontal: c === 1 ? 'center' : 'left', vertical: 'middle' };
      if (i % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
      applyThinBorder(cell);
    }
  }

  const footerRow1 = 11 + rowTotal;
  ws.mergeCells(footerRow1, 1, footerRow1, 3);
  ws.mergeCells(footerRow1, 4, footerRow1, 6);
  const f1 = ws.getRow(footerRow1);
  f1.height = 22;
  f1.getCell(1).value = `Nombre del responsable: ${lista.responsable}`;
  f1.getCell(4).value = `Firma / Constancia responsable: ${lista.firmaResponsable || 'Registrada'}`;
  f1.getCell(1).font = { bold: true, size: 10, color: { argb: FRIKAZ_NAVY } };
  f1.getCell(4).font = { bold: true, size: 10, color: { argb: FRIKAZ_NAVY } };
  for (let c = 1; c <= 6; c++) applyThinBorder(f1.getCell(c));

  const footerRow2 = footerRow1 + 1;
  ws.mergeCells(footerRow2, 1, footerRow2 + 1, 6);
  const f2 = ws.getRow(footerRow2);
  f2.height = 24;
  f2.getCell(1).value = `Observaciones: ${lista.observaciones || 'Ninguna'}`;
  f2.getCell(1).alignment = { vertical: 'top', wrapText: true };
  for (let c = 1; c <= 6; c++) applyThinBorder(f2.getCell(c));

  return wb;
}

/**
 * 6C. Consolidado General de Asistencias (Todas las jornadas guardadas + Historial por Colaborador)
 */
export async function buildConsolidadoAsistenciasWorkbook(
  listas: ListaAsistenciaActividad[],
  planBienestar: ProgramaBienestar[],
  logoArg?: QualityLogoAsset | null
): Promise<ExcelJS.Workbook> {
  const logo = logoArg !== undefined ? logoArg : await loadInstitutionalQualityLogo();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Frikaz S.A.S.';

  const ws = wb.addWorksheet('Consolidado Asistencias');
  ws.columns = [
    { width: 16 },
    { width: 28 },
    { width: 15 },
    { width: 13 },
    { width: 14 },
    { width: 22 },
    { width: 28 },
    { width: 20 },
    { width: 18 },
    { width: 24 },
  ];

  addQualityHeader(
    wb,
    ws,
    'CONSOLIDADO GENERAL DE ASISTENCIA A ACTIVIDADES · 2027',
    10,
    logo
  );

  const header = ws.getRow(5);
  header.values = [
    'N.º Registro',
    'Actividad',
    'Dimensión',
    'Fecha',
    'Horario',
    'Responsable',
    'Participante',
    'Cargo',
    'Área',
    'Observaciones de jornada',
  ];
  styleTableHeaderRow(header, 10);

  let rowCursor = 6;
  listas.forEach((l) => {
    const regCode = `ASIST-2027-${String(l.numeroRegistro || 1).padStart(3, '0')}`;
    l.participantes.forEach((p) => {
      const row = ws.getRow(rowCursor++);
      row.height = 22;
      row.values = [
        regCode,
        l.nombreActividad,
        l.dimension,
        l.fecha,
        `${l.horaInicio}-${l.horaFin}`,
        l.responsable,
        p.nombreCompleto,
        p.cargo,
        p.area,
        l.observaciones || '',
      ];
      for (let c = 1; c <= 10; c++) {
        row.getCell(c).font = { size: 9.5, color: { argb: FRIKAZ_NAVY } };
        row.getCell(c).alignment = { vertical: 'middle', wrapText: true };
        applyThinBorder(row.getCell(c));
      }
    });
  });

  if (rowCursor > 6) {
    ws.autoFilter = `A5:J${rowCursor - 1}`;
  }

  // Hoja 2: Resumen por las 9 actividades
  const wsAct = wb.addWorksheet('Resumen por Actividad');
  wsAct.columns = [
    { width: 6 },
    { width: 34 },
    { width: 16 },
    { width: 18 },
    { width: 20 },
    { width: 22 },
  ];
  addQualityHeader(
    wb,
    wsAct,
    'RESUMEN DE PARTICIPACIÓN POR ACTIVIDAD · 2027',
    6,
    logo
  );
  const ah = wsAct.getRow(5);
  ah.values = ['N.º', 'Actividad', 'Dimensión', 'Listas Guardadas', 'Total Asistencias', '% Participación Prom.'];
  styleTableHeaderRow(ah, 6);

  planBienestar.forEach((act, idx) => {
    const actLists = listas.filter((l) => l.actividadId === act.id);
    const totalPart = actLists.reduce((acc, l) => acc + l.participantes.length, 0);
    const pct = actLists.length > 0 ? Math.min(1, totalPart / (actLists.length * 10)) : 0;
    const row = wsAct.getRow(6 + idx);
    row.height = 24;
    row.values = [act.numero || idx + 1, act.actividad, act.dimension, actLists.length, totalPart, pct];
    row.getCell(6).numFmt = '0.0%';
    for (let c = 1; c <= 6; c++) {
      row.getCell(c).font = { size: 10, color: { argb: FRIKAZ_NAVY }, bold: c >= 4 };
      row.getCell(c).alignment = { horizontal: c >= 4 || c === 1 ? 'center' : 'left', vertical: 'middle' };
      applyThinBorder(row.getCell(c));
    }
  });

  // Hoja 3: Historial por trabajador
  const wsColab = wb.addWorksheet('Historial por Trabajador');
  wsColab.columns = [{ width: 30 }, { width: 22 }, { width: 18 }, { width: 18 }, { width: 42 }];
  addQualityHeader(
    wb,
    wsColab,
    'HISTORIAL DE PARTICIPACIÓN POR COLABORADOR',
    5,
    logo
  );
  const ch = wsColab.getRow(5);
  ch.values = ['Colaborador', 'Último Cargo', 'Última Área', 'Total Asistencias', 'Actividades / Fechas Registradas'];
  styleTableHeaderRow(ch, 5);

  const workerMap = new Map<
    string,
    { nombre: string; cargo: string; area: string; count: number; detail: string[] }
  >();
  listas.forEach((l) => {
    l.participantes.forEach((p) => {
      const key = p.nombreCompleto.trim().toLowerCase();
      if (!key) return;
      const existing = workerMap.get(key) || {
        nombre: p.nombreCompleto.trim(),
        cargo: p.cargo,
        area: p.area,
        count: 0,
        detail: [],
      };
      existing.count += 1;
      existing.cargo = p.cargo || existing.cargo;
      existing.area = p.area || existing.area;
      existing.detail.push(`${l.nombreActividad} (${l.fecha})`);
      workerMap.set(key, existing);
    });
  });

  Array.from(workerMap.values()).forEach((w, idx) => {
    const row = wsColab.getRow(6 + idx);
    row.height = 24;
    row.values = [w.nombre, w.cargo, w.area, w.count, w.detail.join(' | ')];
    for (let c = 1; c <= 5; c++) {
      row.getCell(c).font = { size: 10, color: { argb: FRIKAZ_NAVY }, bold: c === 4 };
      row.getCell(c).alignment = { horizontal: c === 4 ? 'center' : 'left', vertical: 'middle', wrapText: true };
      applyThinBorder(row.getCell(c));
    }
  });

  return wb;
}

/**
 * 7. Encuestas de satisfacción y consolidación (Plantilla EN BLANCO para Formatos Institucionales)
 */
export async function buildEncuestaSatisfaccionWorkbook(
  _state?: BienestarState,
  _actividadIdFilter?: string,
  logoArg?: QualityLogoAsset | null
): Promise<ExcelJS.Workbook> {
  const logo = logoArg !== undefined ? logoArg : await loadInstitutionalQualityLogo();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Frikaz S.A.S.';

  const wsRes = wb.addWorksheet('Consolidación Encuestas');
  wsRes.columns = [
    { width: 28 },
    { width: 14 },
    { width: 24 },
    { width: 13 },
    { width: 13 },
    { width: 13 },
    { width: 13 },
    { width: 13 },
    { width: 13 },
    { width: 13 },
    { width: 13 },
    { width: 14 },
    { width: 14 },
    { width: 28 },
    { width: 28 },
  ];

  addQualityHeader(
    wb,
    wsRes,
    'ENCUESTA DE SATISFACCIÓN · FORMATO EN BLANCO (ESCALA 1 A 5)',
    15,
    logo
  );
  addInstructionsRow(
    wsRes,
    4,
    15,
    'Ingrese las calificaciones del 1 al 5 en cada criterio. Las columnas Promedio (/5), % Satisfacción y el Promedio General inferior se calculan automáticamente.'
  );

  const headerRow = wsRes.getRow(5);
  headerRow.values = [
    'Actividad evaluada',
    'Fecha',
    'Participante / Área',
    'Organización',
    'Claridad',
    'Cumplim. Obj.',
    'Materiales',
    'Participación',
    'Duración',
    'Utilidad',
    'Satisf. Gral',
    'Promedio (/5)',
    '% Satisfacción',
    'Lo que más gustó',
    'Aspectos a mejorar',
  ];
  styleTableHeaderRow(headerRow, 15);

  const totalRows = 25;
  wsRes.autoFilter = `A5:O${5 + totalRows}`;

  for (let i = 0; i < totalRows; i++) {
    const rowIdx = 6 + i;
    const row = wsRes.getRow(rowIdx);
    row.height = 22;
    row.values = [
      '',
      '',
      '',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      { formula: `IF(COUNT(D${rowIdx}:K${rowIdx})>0,AVERAGE(D${rowIdx}:K${rowIdx}),"")` },
      { formula: `IF(ISNUMBER(L${rowIdx}),L${rowIdx}/5,"")` },
      '',
      '',
    ];

    for (let c = 1; c <= 15; c++) {
      const cell = row.getCell(c);
      cell.font = { size: 10, color: { argb: FRIKAZ_NAVY }, bold: c === 12 || c === 13 };
      cell.alignment =
        c >= 4 && c <= 13
          ? { horizontal: 'center', vertical: 'middle' }
          : { vertical: 'middle', wrapText: true };
      if (c === 12) cell.numFmt = '0.00';
      if (c === 13) cell.numFmt = '0.0%';
      if (c >= 4 && c <= 11) {
        cell.dataValidation = {
          type: 'whole',
          operator: 'between',
          allowBlank: true,
          formulae: [1, 5],
        };
      }
      applyThinBorder(cell);
    }
  }

  const summaryRowIdx = 6 + totalRows;
  const sumRow = wsRes.getRow(summaryRowIdx);
  sumRow.height = 24;
  sumRow.getCell(1).value = 'PROMEDIO GENERAL DEL PLAN';
  for (let c = 4; c <= 12; c++) {
    const colLetter = wsRes.getColumn(c).letter;
    sumRow.getCell(c).value = {
      formula: `IFERROR(AVERAGE(${colLetter}6:${colLetter}${summaryRowIdx - 1}),0)`,
    };
    sumRow.getCell(c).numFmt = '0.00';
  }
  sumRow.getCell(13).value = { formula: `IFERROR(L${summaryRowIdx}/5,0)` };
  sumRow.getCell(13).numFmt = '0.0%';
  for (let c = 1; c <= 15; c++) {
    const cell = sumRow.getCell(c);
    cell.font = { bold: true, size: 10, color: { argb: FRIKAZ_NAVY } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_YELLOW_SOFT } };
    cell.alignment = { horizontal: c >= 4 && c <= 13 ? 'center' : 'left', vertical: 'middle' };
    applyThinBorder(cell);
  }

  const wsBank = wb.addWorksheet('Cuestionarios en Blanco');
  wsBank.columns = [{ width: 32 }, { width: 16 }, { width: 24 }, { width: 58 }, { width: 20 }];
  addQualityHeader(
    wb,
    wsBank,
    'CUESTIONARIOS ESPECÍFICOS EN BLANCO · 2027',
    5,
    logo
  );
  const bh = wsBank.getRow(5);
  bh.values = ['Actividad', 'Dimensión', 'Criterio evaluado', 'Pregunta específica', 'Calificación (1-5)'];
  styleTableHeaderRow(bh, 5);
  let rCursor = 6;
  ENCUESTAS_POR_ACTIVIDAD.forEach((enc) => {
    enc.preguntas.forEach((q) => {
      const row = wsBank.getRow(rCursor++);
      row.height = 22;
      row.values = [enc.actividadNombre, enc.dimension, q.criterio, q.enunciado, null];
      for (let c = 1; c <= 5; c++) {
        row.getCell(c).font = { size: 10, color: { argb: FRIKAZ_NAVY } };
        row.getCell(c).alignment = { vertical: 'middle', wrapText: true };
        applyThinBorder(row.getCell(c));
      }
    });
  });

  return wb;
}

/**
 * 7B. Exportación REAL de Encuestas Registradas + Consolidado (para Registro de Encuestas de Satisfacción)
 */
export async function buildEncuestasRegistroWorkbook(
  respuestas: RespuestaEncuesta[],
  planBienestar: ProgramaBienestar[],
  filterDescription = 'Todas las respuestas registradas',
  logoArg?: QualityLogoAsset | null
): Promise<ExcelJS.Workbook> {
  const logo = logoArg !== undefined ? logoArg : await loadInstitutionalQualityLogo();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Frikaz S.A.S.';

  const ws = wb.addWorksheet('Registro de Encuestas');
  ws.columns = [
    { width: 15 },
    { width: 28 },
    { width: 15 },
    { width: 13 },
    { width: 24 },
    { width: 20 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 13 },
    { width: 13 },
    { width: 28 },
    { width: 28 },
    { width: 26 },
  ];

  addQualityHeader(
    wb,
    ws,
    'REGISTRO DE ENCUESTAS DE SATISFACCIÓN',
    19,
    logo
  );

  const header = ws.getRow(5);
  header.values = [
    'N.º Registro',
    'Actividad evaluada',
    'Dimensión',
    'Fecha resp.',
    'Participante',
    'Área / Cargo',
    'Org.',
    'Clar.',
    'Obj.',
    'Mat.',
    'Part.',
    'Dur.',
    'Util.',
    'Sat. Gral',
    'Calif. Gral (/5)',
    '% Satisf.',
    'Lo que más gustó',
    'Aspectos a mejorar',
    'Comentarios / Otras act.',
  ];
  styleTableHeaderRow(header, 19);

  const actDimMap = new Map(planBienestar.map((a) => [a.id, a.dimension]));
  respuestas.forEach((r, idx) => {
    const rowIdx = 6 + idx;
    const row = ws.getRow(rowIdx);
    row.height = 24;
    const regNum = `ENC-2027-${String(r.numeroRegistro ?? idx + 1).padStart(3, '0')}`;
    row.values = [
      regNum,
      r.actividadNombre,
      r.dimension || actDimMap.get(r.actividadId) || '',
      r.fechaRealizacion,
      r.nombreParticipante || 'Anónimo',
      r.areaCargo || 'No especificado',
      r.calificaciones.organizacion,
      r.calificaciones.claridad,
      r.calificaciones.cumplimientoObjetivo,
      r.calificaciones.materiales,
      r.calificaciones.participacion,
      r.calificaciones.duracion,
      r.calificaciones.utilidad,
      r.calificaciones.satisfaccionGeneral,
      { formula: `AVERAGE(G${rowIdx}:N${rowIdx})` },
      { formula: `O${rowIdx}/5` },
      r.loQueMasGusto,
      r.aspectosMejorar,
      [r.otrasActividades, r.observaciones].filter(Boolean).join(' | '),
    ];
    for (let c = 1; c <= 19; c++) {
      const cell = row.getCell(c);
      cell.font = { size: 9.5, color: { argb: FRIKAZ_NAVY }, bold: c === 15 || c === 16 };
      if (c === 15) cell.numFmt = '0.00';
      if (c === 16) cell.numFmt = '0.0%';
      cell.alignment = {
        horizontal: c >= 7 && c <= 16 ? 'center' : 'left',
        vertical: 'middle',
        wrapText: true,
      };
      applyThinBorder(cell);
    }
  });

  if (respuestas.length > 0) {
    ws.autoFilter = `A5:S${5 + respuestas.length}`;
    const totIdx = 6 + respuestas.length;
    const totRow = ws.getRow(totIdx);
    totRow.height = 24;
    totRow.getCell(1).value = 'CONSOLIDADO';
    for (let c = 7; c <= 15; c++) {
      const colL = ws.getColumn(c).letter;
      totRow.getCell(c).value = { formula: `AVERAGE(${colL}6:${colL}${totIdx - 1})` };
      totRow.getCell(c).numFmt = '0.00';
    }
    totRow.getCell(16).value = { formula: `O${totIdx}/5` };
    totRow.getCell(16).numFmt = '0.0%';
    for (let c = 1; c <= 19; c++) {
      const cell = totRow.getCell(c);
      cell.font = { bold: true, size: 10, color: { argb: FRIKAZ_NAVY } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_YELLOW_SOFT } };
      applyThinBorder(cell);
    }
  }

  // Hoja 2: Consolidado por actividad
  const wsCons = wb.addWorksheet('Consolidado por Actividad');
  wsCons.columns = [{ width: 34 }, { width: 16 }, { width: 18 }, { width: 18 }, { width: 18 }];
  addQualityHeader(
    wb,
    wsCons,
    'CONSOLIDADO DE SATISFACCIÓN POR ACTIVIDAD · 2027',
    5,
    logo
  );
  const ch = wsCons.getRow(5);
  ch.values = ['Actividad', 'Dimensión', 'Respuestas', 'Promedio (/5)', '% Satisfacción'];
  styleTableHeaderRow(ch, 5);
  planBienestar.forEach((act, idx) => {
    const actResps = respuestas.filter((r) => r.actividadId === act.id);
    const avg =
      actResps.length > 0
        ? actResps.reduce((acc, r) => {
            const vals = Object.values(r.calificaciones);
            return acc + vals.reduce((a, b) => a + b, 0) / vals.length;
          }, 0) / actResps.length
        : 0;
    const row = wsCons.getRow(6 + idx);
    row.height = 23;
    row.values = [act.actividad, act.dimension, actResps.length, Number(avg.toFixed(2)), avg / 5];
    row.getCell(4).numFmt = '0.00';
    row.getCell(5).numFmt = '0.0%';
    for (let c = 1; c <= 5; c++) {
      row.getCell(c).font = { size: 10, color: { argb: FRIKAZ_NAVY }, bold: c >= 3 };
      row.getCell(c).alignment = { horizontal: c >= 3 ? 'center' : 'left', vertical: 'middle' };
      applyThinBorder(row.getCell(c));
    }
  });

  return wb;
}

/**
 * 8. Base de datos de resultados de encuestas (Plantilla EN BLANCO)
 */
export async function buildBaseDatosEncuestasWorkbook(
  state: BienestarState,
  logoArg?: QualityLogoAsset | null
): Promise<ExcelJS.Workbook> {
  const logo = logoArg !== undefined ? logoArg : await loadInstitutionalQualityLogo();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Frikaz S.A.S.';

  const ws = wb.addWorksheet('Base de Datos Encuestas');
  ws.columns = [
    { width: 14 },
    { width: 30 },
    { width: 14 },
    { width: 24 },
    { width: 20 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 15 },
    { width: 30 },
  ];

  addQualityHeader(
    wb,
    ws,
    'BASE DE DATOS DE ENCUESTAS · FORMATO EN BLANCO',
    15,
    logo
  );
  addInstructionsRow(
    ws,
    4,
    15,
    'Registre cada encuesta en una fila nueva sin sobrescribir las anteriores. La columna Promedio (/5) y la hoja Resumen por Actividad se calculan automáticamente.'
  );

  const header = ws.getRow(5);
  header.values = [
    'ID Registro',
    'Actividad',
    'Fecha',
    'Participante',
    'Área / Cargo',
    'C1 Org.',
    'C2 Clar.',
    'C3 Obj.',
    'C4 Mat.',
    'C5 Part.',
    'C6 Dur.',
    'C7 Util.',
    'C8 Sat.',
    'Promedio (/5)',
    'Observaciones / Mejoras',
  ];
  styleTableHeaderRow(header, 15);
  const rowsCount = 30;
  ws.autoFilter = `A5:O${5 + rowsCount}`;

  for (let i = 0; i < rowsCount; i++) {
    const rowIdx = 6 + i;
    const row = ws.getRow(rowIdx);
    row.height = 22;
    row.values = [
      '',
      '',
      '',
      '',
      '',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      { formula: `IF(COUNT(F${rowIdx}:M${rowIdx})>0,AVERAGE(F${rowIdx}:M${rowIdx}),"")` },
      '',
    ];
    for (let c = 1; c <= 15; c++) {
      const cell = row.getCell(c);
      cell.font = { size: 10, color: { argb: FRIKAZ_NAVY }, bold: c === 14 };
      if (c === 14) cell.numFmt = '0.00';
      cell.alignment = {
        horizontal: c >= 6 && c <= 14 ? 'center' : 'left',
        vertical: 'middle',
        wrapText: true,
      };
      applyThinBorder(cell);
    }
  }

  const wsRes = wb.addWorksheet('Resumen por Actividad');
  wsRes.columns = [{ width: 34 }, { width: 16 }, { width: 20 }, { width: 20 }, { width: 18 }];
  addQualityHeader(
    wb,
    wsRes,
    'TABLERO DINÁMICO DE RESULTADOS · EN BLANCO',
    5,
    logo
  );
  const rh = wsRes.getRow(5);
  rh.values = ['Actividad', 'Dimensión', 'Cantidad Respuestas', 'Promedio (/5)', '% Satisfacción'];
  styleTableHeaderRow(rh, 5);
  state.planBienestar.forEach((act, i) => {
    const rIdx = 6 + i;
    const row = wsRes.getRow(rIdx);
    row.height = 24;
    row.values = [
      act.actividad,
      act.dimension,
      { formula: `COUNTIF('Base de Datos Encuestas'!$B$6:$B$${5 + rowsCount},A${rIdx})` },
      {
        formula: `IFERROR(AVERAGEIF('Base de Datos Encuestas'!$B$6:$B$${5 + rowsCount},A${rIdx},'Base de Datos Encuestas'!$N$6:$N$${5 + rowsCount}),0)`,
      },
      { formula: `IFERROR(D${rIdx}/5,0)` },
    ];
    row.getCell(4).numFmt = '0.00';
    row.getCell(5).numFmt = '0.0%';
    for (let c = 1; c <= 5; c++) {
      row.getCell(c).font = { size: 10, color: { argb: FRIKAZ_NAVY }, bold: c >= 3 };
      row.getCell(c).alignment = { horizontal: c >= 3 ? 'center' : 'left', vertical: 'middle' };
      applyThinBorder(row.getCell(c));
    }
  });

  return wb;
}

/**
 * 9. Control de entrega de bonos (Formato completamente EN BLANCO)
 */
export async function buildControlEntregaBonosWorkbook(
  _state?: BienestarState,
  logoArg?: QualityLogoAsset | null
): Promise<ExcelJS.Workbook> {
  const logo = logoArg !== undefined ? logoArg : await loadInstitutionalQualityLogo();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Frikaz S.A.S.';
  const ws = wb.addWorksheet('Control Entrega de Bonos');

  ws.columns = [
    { width: 7 },
    { width: 28 },
    { width: 22 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    { width: 15 },
    { width: 16 },
    { width: 18 },
    { width: 18 },
  ];

  addQualityHeader(
    wb,
    ws,
    'CONTROL DE ENTREGA DE BONOS · FORMATO EN BLANCO',
    10,
    logo
  );
  addInstructionsRow(
    ws,
    4,
    10,
    'Registre el nombre del colaborador, documento, valor de cada entrega, fecha y firma de recibido. La columna Total Asignado y los totales inferiores se calculan automáticamente.'
  );

  const header = ws.getRow(5);
  header.values = [
    'N.º',
    'Trabajador',
    'Cargo',
    'Documento',
    'Bono 1 (Valor)',
    'Fecha / Firma 1',
    'Estado 1',
    'Bono 2 (Valor)',
    'Fecha / Firma 2',
    'Total Entregado',
  ];
  styleTableHeaderRow(header, 10);
  ws.autoFilter = 'A5:J17';

  for (let i = 0; i < 12; i++) {
    const rowIdx = 6 + i;
    const row = ws.getRow(rowIdx);
    row.height = 23;
    row.values = [
      i + 1,
      '',
      '',
      '',
      null,
      '',
      '',
      null,
      '',
      { formula: `IF(OR(ISNUMBER(E${rowIdx}),ISNUMBER(H${rowIdx})),N(E${rowIdx})+N(H${rowIdx}),"")` },
    ];
    for (let c = 1; c <= 10; c++) {
      const cell = row.getCell(c);
      cell.font = { size: 10, color: { argb: FRIKAZ_NAVY }, bold: c === 10 };
      if (c === 5 || c === 8 || c === 10) cell.numFmt = '$#,##0';
      cell.alignment = {
        horizontal: c === 1 || c === 7 ? 'center' : c === 5 || c === 8 || c === 10 ? 'right' : 'left',
        vertical: 'middle',
      };
      applyThinBorder(cell);
    }
  }

  const totRow = ws.getRow(18);
  totRow.height = 25;
  totRow.getCell(2).value = 'TOTAL BONOS ENTREGADOS';
  totRow.getCell(5).value = { formula: 'SUM(E6:E17)' };
  totRow.getCell(8).value = { formula: 'SUM(H6:H17)' };
  totRow.getCell(10).value = { formula: 'SUM(J6:J17)' };
  for (let c = 1; c <= 10; c++) {
    const cell = totRow.getCell(c);
    cell.font = { bold: true, size: 10, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_NAVY } };
    if (c === 5 || c === 8 || c === 10) cell.numFmt = '$#,##0';
    applyThinBorder(cell);
  }

  return wb;
}

/**
 * 10. Registro de reconocimientos al trabajador del mes (Formato EN BLANCO)
 */
export async function buildRegistroTrabajadorMesWorkbook(
  _state?: BienestarState,
  logoArg?: QualityLogoAsset | null
): Promise<ExcelJS.Workbook> {
  const logo = logoArg !== undefined ? logoArg : await loadInstitutionalQualityLogo();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Frikaz S.A.S.';
  const ws = wb.addWorksheet('Trabajador del Mes');

  ws.columns = [
    { width: 6 },
    { width: 16 },
    { width: 30 },
    { width: 18 },
    { width: 32 },
    { width: 18 },
    { width: 16 },
    { width: 20 },
  ];

  addQualityHeader(
    wb,
    ws,
    'REGISTRO DE RECONOCIMIENTOS AL TRABAJADOR DEL MES · EN BLANCO',
    8,
    logo
  );
  addInstructionsRow(
    ws,
    4,
    8,
    'Diligencie el mes, el trabajador reconocido, área, mérito destacado, valor otorgado y firma/acta. Los totales se calculan automáticamente.'
  );

  const header = ws.getRow(5);
  header.values = [
    'N.º',
    'Mes / Fecha',
    'Colaborador Reconocido',
    'Área',
    'Mérito / Criterio Destacado',
    'Valor Reconocimiento',
    'Estado Entrega',
    'Firma / Acta',
  ];
  styleTableHeaderRow(header, 8);
  ws.autoFilter = 'A5:H17';

  for (let i = 0; i < 12; i++) {
    const rIdx = 6 + i;
    const row = ws.getRow(rIdx);
    row.height = 24;
    row.values = [i + 1, '', '', '', '', null, '', ''];
    for (let c = 1; c <= 8; c++) {
      const cell = row.getCell(c);
      cell.font = { size: 10, color: { argb: FRIKAZ_NAVY }, bold: c === 6 };
      if (c === 6) cell.numFmt = '$#,##0';
      cell.alignment = {
        horizontal: c === 1 || c === 7 ? 'center' : c === 6 ? 'right' : 'left',
        vertical: 'middle',
      };
      applyThinBorder(cell);
    }
  }

  const totRow = ws.getRow(18);
  totRow.height = 25;
  totRow.getCell(2).value = 'TOTAL RECONOCIMIENTOS';
  totRow.getCell(3).value = { formula: 'COUNTA(C6:C17) & " registrados"' };
  totRow.getCell(6).value = { formula: 'SUM(F6:F17)' };
  for (let c = 1; c <= 8; c++) {
    const cell = totRow.getCell(c);
    cell.font = { bold: true, size: 10, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_NAVY } };
    if (c === 6) cell.numFmt = '$#,##0';
    applyThinBorder(cell);
  }

  return wb;
}

/**
 * 11. Control de evidencias (Formato EN BLANCO)
 */
export async function buildControlEvidenciasWorkbook(
  _state?: BienestarState,
  logoArg?: QualityLogoAsset | null
): Promise<ExcelJS.Workbook> {
  const logo = logoArg !== undefined ? logoArg : await loadInstitutionalQualityLogo();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Frikaz S.A.S.';
  const ws = wb.addWorksheet('Control de Evidencias');

  ws.columns = [
    { width: 6 },
    { width: 32 },
    { width: 16 },
    { width: 32 },
    { width: 15 },
    { width: 22 },
    { width: 18 },
    { width: 24 },
  ];

  addQualityHeader(
    wb,
    ws,
    'CONTROL DE EVIDENCIAS · FORMATO EN BLANCO',
    8,
    logo
  );
  addInstructionsRow(
    ws,
    4,
    8,
    'Registre cada soporte documental o fotográfico, fecha y responsable. Escriba "Sí" o "No" en la columna Archivo Completo para calcular el % de verificación.'
  );

  const header = ws.getRow(5);
  header.values = [
    'N.º',
    'Actividad',
    'Dimensión',
    'Evidencia soportada',
    'Fecha soporte',
    'Responsable custodia',
    'Archivo Completo (Sí/No)',
    'Observaciones',
  ];
  styleTableHeaderRow(header, 8);

  const rowsCount = 15;
  ws.autoFilter = `A5:H${5 + rowsCount}`;

  for (let idx = 0; idx < rowsCount; idx++) {
    const rowIdx = 6 + idx;
    const row = ws.getRow(rowIdx);
    row.height = 24;
    row.values = [idx + 1, '', '', '', '', '', '', ''];
    for (let c = 1; c <= 8; c++) {
      const cell = row.getCell(c);
      cell.font = { size: 10, color: { argb: FRIKAZ_NAVY } };
      cell.alignment = {
        horizontal: c === 1 || c === 5 || c === 7 ? 'center' : 'left',
        vertical: 'middle',
        wrapText: true,
      };
      applyThinBorder(cell);
    }
  }

  const totIdx = 6 + rowsCount;
  const totRow = ws.getRow(totIdx);
  totRow.height = 24;
  totRow.getCell(2).value = 'COBERTURA DE EVIDENCIAS VERIFICADAS';
  totRow.getCell(7).value = {
    formula: `IFERROR(COUNTIF(G6:G${totIdx - 1},"Sí")/COUNTA(B6:B${totIdx - 1}),0)`,
  };
  totRow.getCell(7).numFmt = '0.0%';
  for (let c = 1; c <= 8; c++) {
    const cell = totRow.getCell(c);
    cell.font = { bold: true, size: 10, color: { argb: FRIKAZ_NAVY } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_YELLOW_SOFT } };
    applyThinBorder(cell);
  }

  return wb;
}

/**
 * 12. Indicadores de cumplimiento del Plan de Bienestar (Formato EN BLANCO)
 */
export async function buildIndicadoresCumplimientoWorkbook(
  _state?: BienestarState,
  logoArg?: QualityLogoAsset | null
): Promise<ExcelJS.Workbook> {
  const logo = logoArg !== undefined ? logoArg : await loadInstitutionalQualityLogo();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Frikaz S.A.S.';
  const ws = wb.addWorksheet('Indicadores Plan 2027');

  ws.columns = [
    { width: 6 },
    { width: 30 },
    { width: 15 },
    { width: 14 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 17 },
    { width: 28 },
  ];

  addQualityHeader(
    wb,
    ws,
    'INDICADORES DE CUMPLIMIENTO · FORMATO EN BLANCO',
    10,
    logo
  );
  addInstructionsRow(
    ws,
    4,
    10,
    'Diligencie los resultados por actividad ejecutada. El % de satisfacción y los indicadores consolidados inferiores se calculan automáticamente.'
  );

  const headerRow = ws.getRow(5);
  headerRow.values = [
    'N.º',
    'Actividad',
    'Dimensión',
    'Asistentes',
    'Encuestas',
    'Prom. Satisf. (/5)',
    '% Satisfacción',
    '% Cumplimiento',
    'Presup. Ejecutado',
    'Oportunidades de Mejora',
  ];
  styleTableHeaderRow(headerRow, 10);

  const rowsCount = 12;
  ws.autoFilter = `A5:J${5 + rowsCount}`;

  for (let idx = 0; idx < rowsCount; idx++) {
    const rowIdx = 6 + idx;
    const row = ws.getRow(rowIdx);
    row.height = 24;
    row.values = [
      idx + 1,
      '',
      '',
      null,
      null,
      null,
      { formula: `IF(ISNUMBER(F${rowIdx}),F${rowIdx}/5,"")` },
      null,
      null,
      '',
    ];
    for (let c = 1; c <= 10; c++) {
      const cell = row.getCell(c);
      cell.font = { size: 10, color: { argb: FRIKAZ_NAVY }, bold: c === 7 };
      if (c === 6) cell.numFmt = '0.00';
      if (c === 7 || c === 8) cell.numFmt = '0.0%';
      if (c === 9) cell.numFmt = '$#,##0';
      cell.alignment = {
        horizontal: c === 1 || (c >= 4 && c <= 8) ? 'center' : c === 9 ? 'right' : 'left',
        vertical: 'middle',
        wrapText: true,
      };
      applyThinBorder(cell);
    }
  }

  const sumRowIdx = 6 + rowsCount;
  const sumRow = ws.getRow(sumRowIdx);
  sumRow.height = 25;
  sumRow.getCell(2).value = 'INDICADORES CONSOLIDADOS';
  sumRow.getCell(4).value = { formula: `SUM(D6:D${sumRowIdx - 1})` };
  sumRow.getCell(5).value = { formula: `SUM(E6:E${sumRowIdx - 1})` };
  sumRow.getCell(6).value = { formula: `IFERROR(AVERAGE(F6:F${sumRowIdx - 1}),0)` };
  sumRow.getCell(7).value = { formula: `IFERROR(F${sumRowIdx}/5,0)` };
  sumRow.getCell(8).value = { formula: `IFERROR(AVERAGE(H6:H${sumRowIdx - 1}),0)` };
  sumRow.getCell(9).value = { formula: `SUM(I6:I${sumRowIdx - 1})` };
  for (let c = 1; c <= 10; c++) {
    const cell = sumRow.getCell(c);
    cell.font = { bold: true, size: 10, color: { argb: FRIKAZ_NAVY } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FRIKAZ_RED_SOFT } };
    if (c === 6) cell.numFmt = '0.00';
    if (c === 7 || c === 8) cell.numFmt = '0.0%';
    if (c === 9) cell.numFmt = '$#,##0';
    applyThinBorder(cell);
  }

  return wb;
}

export type FormatoExcelKey =
  | 'presupuesto_general'
  | 'desglose_presupuestal'
  | 'cronograma_anual'
  | 'diagrama_gantt'
  | 'seguimiento'
  | 'asistencia'
  | 'encuesta'
  | 'bd_encuestas'
  | 'entrega_bonos'
  | 'trabajador_mes'
  | 'control_evidencias'
  | 'indicadores';

export async function generateExcelFormatWorkbook(
  key: FormatoExcelKey,
  state: BienestarState,
  logoAsset?: QualityLogoAsset | null
): Promise<{ wb: ExcelJS.Workbook; filename: string }> {
  const logo = logoAsset !== undefined ? logoAsset : await loadInstitutionalQualityLogo();
  switch (key) {
    case 'presupuesto_general':
      return {
        wb: await buildPresupuestoGeneral2027Workbook(state, logo),
        filename: '01_Presupuesto_General_En_Blanco_2027_Frikaz.xlsx',
      };
    case 'desglose_presupuestal':
      return {
        wb: await buildDesglosePresupuestalWorkbook(state, logo),
        filename: '02_Desglose_Presupuestal_En_Blanco_Frikaz.xlsx',
      };
    case 'cronograma_anual':
      return {
        wb: await buildCronogramaAnual2027Workbook(state, logo),
        filename: '03_Cronograma_Anual_2027_En_Blanco_Frikaz.xlsx',
      };
    case 'diagrama_gantt':
      return {
        wb: await buildDiagramaGantt2027Workbook(state, logo),
        filename: '04_Diagrama_de_Gantt_2027_En_Blanco_Frikaz.xlsx',
      };
    case 'seguimiento':
      return {
        wb: await buildSeguimientoActividadesWorkbook(state, logo),
        filename: '05_Seguimiento_Actividades_En_Blanco_Frikaz.xlsx',
      };
    case 'asistencia':
      return {
        wb: await buildPlantillaAsistenciaEnBlancoWorkbook({ general: true }, logo),
        filename: '06_Lista_Asistencia_En_Blanco_Frikaz.xlsx',
      };
    case 'encuesta':
      return {
        wb: await buildEncuestaSatisfaccionWorkbook(state, undefined, logo),
        filename: '07_Encuestas_Satisfaccion_En_Blanco_Frikaz.xlsx',
      };
    case 'bd_encuestas':
      return {
        wb: await buildBaseDatosEncuestasWorkbook(state, logo),
        filename: '08_Base_Datos_Encuestas_En_Blanco_Frikaz.xlsx',
      };
    case 'entrega_bonos':
      return {
        wb: await buildControlEntregaBonosWorkbook(state, logo),
        filename: '09_Control_Entrega_Bonos_En_Blanco_Frikaz.xlsx',
      };
    case 'trabajador_mes':
      return {
        wb: await buildRegistroTrabajadorMesWorkbook(state, logo),
        filename: '10_Registro_Trabajador_del_Mes_En_Blanco_Frikaz.xlsx',
      };
    case 'control_evidencias':
      return {
        wb: await buildControlEvidenciasWorkbook(state, logo),
        filename: '11_Control_de_Evidencias_En_Blanco_Frikaz.xlsx',
      };
    case 'indicadores':
      return {
        wb: await buildIndicadoresCumplimientoWorkbook(state, logo),
        filename: '12_Indicadores_Cumplimiento_En_Blanco_Frikaz.xlsx',
      };
  }
}

export async function downloadSingleExcelFormat(
  key: FormatoExcelKey,
  state: BienestarState
): Promise<string> {
  const { wb, filename } = await generateExcelFormatWorkbook(key, state);
  const buffer = await workbookToBuffer(wb);
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerBlobDownload(blob, filename);
  return filename;
}

export async function downloadWorkbookAsExcel(
  wb: ExcelJS.Workbook,
  filename: string
): Promise<void> {
  const buffer = await workbookToBuffer(wb);
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerBlobDownload(blob, filename);
}

/**
 * Empaqueta en un único archivo .ZIP organizado por carpetas todos los formatos institucionales
 * EN BLANCO en Word (.docx) y los 12 archivos Excel (.xlsx).
 */
export async function downloadAllInstitutionalFormatsZip(state: BienestarState): Promise<void> {
  const logo = await loadInstitutionalQualityLogo();
  const zip = new JSZip();
  const root = zip.folder('Formatos_En_Blanco_Bienestar_2027_Frikaz_SAS');
  if (!root) return;

  const folders = {
    planificacion: root.folder('01_Planificacion'),
    presupuesto: root.folder('02_Presupuesto'),
    cronograma: root.folder('03_Cronograma'),
    asistencia: root.folder('04_Asistencia'),
    encuestas: root.folder('05_Encuestas'),
    seguimiento: root.folder('06_Seguimiento'),
    evaluacion: root.folder('07_Evaluacion'),
    reconocimientos: root.folder('08_Reconocimientos'),
  };

  const excelPlan: Array<{ key: FormatoExcelKey; folder: JSZip | null }> = [
    { key: 'presupuesto_general', folder: folders.presupuesto },
    { key: 'desglose_presupuestal', folder: folders.presupuesto },
    { key: 'cronograma_anual', folder: folders.cronograma },
    { key: 'diagrama_gantt', folder: folders.cronograma },
    { key: 'asistencia', folder: folders.asistencia },
    { key: 'encuesta', folder: folders.encuestas },
    { key: 'bd_encuestas', folder: folders.encuestas },
    { key: 'seguimiento', folder: folders.seguimiento },
    { key: 'control_evidencias', folder: folders.seguimiento },
    { key: 'indicadores', folder: folders.evaluacion },
    { key: 'entrega_bonos', folder: folders.reconocimientos },
    { key: 'trabajador_mes', folder: folders.reconocimientos },
  ];

  for (const item of excelPlan) {
    const { wb, filename } = await generateExcelFormatWorkbook(item.key, state, logo);
    const buffer = await workbookToBuffer(wb);
    item.folder?.file(filename, buffer);
  }

  const staticWordPlan: Array<{ key: FormatoWordKey; folder: JSZip | null }> = [
    { key: 'portada', folder: folders.planificacion },
    { key: 'planificacion', folder: folders.planificacion },
    { key: 'convenios', folder: folders.planificacion },
    { key: 'asistencia', folder: folders.asistencia },
    { key: 'acta', folder: folders.seguimiento },
    { key: 'evidencias', folder: folders.seguimiento },
    { key: 'compromisos', folder: folders.seguimiento },
    { key: 'informe', folder: folders.evaluacion },
    { key: 'mejora', folder: folders.evaluacion },
    { key: 'bonos', folder: folders.reconocimientos },
  ];

  for (const w of staticWordPlan) {
    const { blob, filename } = await generateWordFormatBlob(w.key, state);
    w.folder?.file(filename, await blob.arrayBuffer());
  }

  for (const act of state.planBienestar) {
    const fichaRes = await generateWordFormatBlob('ficha', state, act.id);
    folders.planificacion?.file(fichaRes.filename, await fichaRes.blob.arrayBuffer());

    const encRes = await generateWordFormatBlob('encuesta', state, act.id);
    folders.encuestas?.file(encRes.filename, await encRes.blob.arrayBuffer());
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(zipBlob, 'Formatos_En_Blanco_Bienestar_2027_Frikaz_SAS.zip');
}
