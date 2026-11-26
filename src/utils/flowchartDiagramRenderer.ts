import { ProcessStep } from '../types/bienestar';

export interface FlowchartDiagramPageAsset {
  bytes: Uint8Array;
  width: number;
  height: number;
  pageNumber: number;
  totalPages: number;
  rangeLabel: string;
}

export interface FlowchartSheetPlan {
  pageNumber: number;
  totalPages: number;
  steps: ProcessStep[];
  entryConnector?: string;
  exitConnector?: string;
  stepNumbers: Map<string, number>;
  allStepsById: Map<string, ProcessStep>;
  height: number;
  width: number;
}

const CANVAS_WIDTH = 1500;
const SPINE_CENTER_X = 490;
const ADJ_CENTER_X = 1140;

const SHAPE_W = 470;
const OVAL_W = 340;
const OVAL_H = 82;
const RECT_H = 128;
const DIAMOND_W = 470;
const DIAMOND_H = 156;
const ADJ_W = 360;
const ADJ_H = 122;
const ROW_GAP = 64;

function getStepHeight(step: ProcessStep): number {
  if (step.symbol === 'oval') return OVAL_H;
  if (step.symbol === 'diamond' || step.isDecision) return DIAMOND_H;
  return RECT_H;
}

/**
 * Calcula la partición ordenada y sin superposiciones del Flujograma en láminas nítidas
 * (aprox. 5 nodos principales por lámina) con conectores entre páginas (A, B, ...).
 */
export function buildFlowchartSheetPlans(proceso: ProcessStep[]): FlowchartSheetPlan[] {
  const stepNumbers = new Map<string, number>();
  proceso.forEach((s, i) => stepNumbers.set(s.id, i + 1));
  const allStepsById = new Map<string, ProcessStep>(proceso.map((s) => [s.id, s]));

  const adjustmentTargetIds = new Set<string>();
  proceso.forEach((s) => {
    if (s.isAdjustment) adjustmentTargetIds.add(s.id);
    if (s.isDecision && s.noTargetId) {
      const target = allStepsById.get(s.noTargetId);
      if (target && target.isAdjustment) adjustmentTargetIds.add(target.id);
    }
  });

  const mainSpine = proceso.filter((s) => !adjustmentTargetIds.has(s.id));
  if (mainSpine.length === 0) return [];

  // Agrupación equilibrada (máx ~5-6 nodos por lámina para tipografía grande y legible)
  const chunks: ProcessStep[][] = [];
  const MAX_PER_SHEET = 6;
  for (let i = 0; i < mainSpine.length; i += MAX_PER_SHEET) {
    chunks.push(mainSpine.slice(i, i + MAX_PER_SHEET));
  }

  const connectorLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return chunks.map((steps, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === chunks.length - 1;
    const entryConnector = !isFirst ? connectorLetters[idx - 1] || String(idx) : undefined;
    const exitConnector = !isLast ? connectorLetters[idx] || String(idx + 1) : undefined;

    const topPadding = isFirst ? 175 : 130;
    const entryBlockH = entryConnector ? 88 : 0;
    const exitBlockH = exitConnector ? 96 : 0;
    const nodesH = steps.reduce((acc, s, j) => {
      return acc + getStepHeight(s) + (j < steps.length - 1 ? ROW_GAP : 0);
    }, 0);

    const height = Math.max(760, topPadding + entryBlockH + nodesH + exitBlockH + 70);

    return {
      pageNumber: idx + 1,
      totalPages: chunks.length,
      steps,
      entryConnector,
      exitConnector,
      stepNumbers,
      allStepsById,
      width: CANVAS_WIDTH,
      height,
    };
  });
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
      if (lines.length === maxLines - 1) {
        // Última línea permitida: agrega resto y ajusta con puntos suspensivos solo si excede demasiado
        const rest = words.slice(i + 1).join(' ');
        const combined = rest ? `${current} ${rest}` : current;
        if (ctx.measureText(combined).width <= maxWidth) {
          lines.push(combined);
        } else {
          let trimmed = combined;
          while (trimmed.length > 4 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
            trimmed = trimmed.slice(0, -1);
          }
          lines.push(`${trimmed}…`);
        }
        return lines;
      }
    }
  }
  lines.push(current);
  return lines;
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angleRad: number,
  size = 11,
  color = '#1E293B'
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.56);
  ctx.lineTo(-size, size * 0.56);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawConnectorLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = '#1E293B',
  lineWidth = 2.5
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  drawArrowHead(ctx, x2, y2, angle, 11, color);
}

function drawLegendBar(ctx: CanvasRenderingContext2D, y: number) {
  const boxX = 48;
  const boxW = CANVAS_WIDTH - 96;
  const boxH = 74;

  ctx.save();
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(boxX, y, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0F294A';
  ctx.font = 'bold 18px "Times New Roman", Georgia, serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('SIMBOLOGÍA ANSI / ISO:', boxX + 20, y + 37);

  const items: Array<{ type: ProcessStep['symbol']; label: string; x: number }> = [
    { type: 'oval', label: 'Inicio / Fin', x: 300 },
    { type: 'rectangle', label: 'Actividad / Operación', x: 515 },
    { type: 'diamond', label: 'Decisión (SÍ / NO)', x: 800 },
    { type: 'document', label: 'Documento / Soporte', x: 1055 },
    { type: 'cylinder', label: 'Base de datos', x: 1310 },
  ];

  items.forEach((item) => {
    const cx = item.x;
    const cy = y + 37;
    ctx.strokeStyle = '#0F294A';
    ctx.fillStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    if (item.type === 'oval') {
      ctx.beginPath();
      ctx.roundRect(cx - 24, cy - 11, 48, 22, 11);
      ctx.fill();
      ctx.stroke();
    } else if (item.type === 'rectangle') {
      ctx.beginPath();
      ctx.rect(cx - 22, cy - 11, 44, 22);
      ctx.fill();
      ctx.stroke();
    } else if (item.type === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 14);
      ctx.lineTo(cx + 22, cy);
      ctx.lineTo(cx, cy + 14);
      ctx.lineTo(cx - 22, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (item.type === 'document') {
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy - 11);
      ctx.lineTo(cx + 20, cy - 11);
      ctx.lineTo(cx + 20, cy + 8);
      ctx.bezierCurveTo(cx + 8, cy + 14, cx - 8, cy + 2, cx - 20, cy + 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(cx, cy - 8, 18, 5, 0, 0, Math.PI * 2);
      ctx.moveTo(cx - 18, cy - 8);
      ctx.lineTo(cx - 18, cy + 9);
      ctx.ellipse(cx, cy + 9, 18, 5, 0, 0, Math.PI);
      ctx.lineTo(cx + 18, cy - 8);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 16px "Times New Roman", Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(item.label, cx + 30, cy);
  });
  ctx.restore();
}

function drawOffPageConnector(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  letter: string,
  caption: string
) {
  ctx.save();
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#0F294A';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0F294A';
  ctx.font = 'bold 20px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, cx, cy + 1);

  ctx.fillStyle = '#475569';
  ctx.font = 'italic 16px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(caption, cx + 36, cy + 1);
  ctx.restore();
}

function drawStepShape(
  ctx: CanvasRenderingContext2D,
  step: ProcessStep,
  stepNum: number,
  cx: number,
  topY: number
) {
  const h = getStepHeight(step);
  const cy = topY + h / 2;

  ctx.save();

  if (step.symbol === 'oval') {
    const left = cx - OVAL_W / 2;
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#0F294A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(left, topY, OVAL_W, h, h / 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0F294A';
    ctx.font = 'bold 22px "Times New Roman", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${stepNum}. ${step.actividad.toUpperCase()}`, cx, cy - 10);

    ctx.fillStyle = '#475569';
    ctx.font = '16px "Times New Roman", Georgia, serif';
    ctx.fillText(`Responsable: ${step.responsable}`, cx, cy + 16);
    ctx.restore();
    return;
  }

  if (step.symbol === 'diamond' || step.isDecision) {
    const hw = DIAMOND_W / 2;
    const hh = h / 2;
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#0F294A';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx, topY + h);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0F294A';
    ctx.font = 'bold 15px "Times New Roman", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`DECISIÓN #${stepNum} · ${step.responsable.toUpperCase()}`, cx, cy - 30);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 19px "Times New Roman", Georgia, serif';
    const qLines = wrapTextLines(ctx, step.actividad, 280, 2);
    qLines.forEach((line, i) => {
      ctx.fillText(line, cx, cy - 4 + i * 23);
    });

    if (step.registroDocumento && step.registroDocumento !== 'N/A') {
      ctx.fillStyle = '#475569';
      ctx.font = '15px "Times New Roman", Georgia, serif';
      ctx.fillText(`Soporte: ${step.registroDocumento}`, cx, cy + 40);
    }

    ctx.restore();
    return;
  }

  const w = step.isAdjustment ? ADJ_W : SHAPE_W;
  const left = cx - w / 2;

  if (step.symbol === 'document') {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(left, topY);
    ctx.lineTo(left + w, topY);
    ctx.lineTo(left + w, topY + h - 12);
    ctx.bezierCurveTo(
      left + w * 0.66,
      topY + h + 8,
      left + w * 0.34,
      topY + h - 26,
      left,
      topY + h - 6
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (step.symbol === 'cylinder') {
    const capH = 14;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(left, topY + capH);
    ctx.lineTo(left, topY + h - capH);
    ctx.ellipse(cx, topY + h - capH, w / 2, capH, 0, Math.PI, 0, true);
    ctx.lineTo(left + w, topY + capH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx, topY + capH, w / 2, capH, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#F8FAFC';
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = step.isAdjustment ? '#F8FAFC' : '#FFFFFF';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(left, topY, w, h, 8);
    ctx.fill();
    ctx.stroke();
  }

  // Etiqueta discreta de paso
  const badgeY = step.symbol === 'cylinder' ? topY + 34 : topY + 22;
  ctx.fillStyle = '#0F294A';
  ctx.font = 'bold 15px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const tagText = step.isAdjustment
    ? `PASO ${stepNum} · AJUSTE`
    : `PASO ${stepNum}`;
  ctx.fillText(tagText, left + 18, badgeY);

  ctx.fillStyle = '#475569';
  ctx.font = '15px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(step.responsable, left + w - 18, badgeY);

  // Línea separadora fina
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(left + 14, badgeY + 14);
  ctx.lineTo(left + w - 14, badgeY + 14);
  ctx.stroke();

  // Título de la actividad (hasta 3 líneas para evitar recortes)
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 17px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'left';
  const titleLines = wrapTextLines(ctx, step.actividad, w - 36, 3);
  const titleStartY = badgeY + 28;
  titleLines.forEach((line, idx) => {
    ctx.fillText(line, left + 18, titleStartY + idx * 19);
  });

  // Registro documental asociado
  ctx.fillStyle = '#475569';
  ctx.font = '15px "Times New Roman", Georgia, serif';
  const docText = `Registro: ${step.registroDocumento || 'N/A'}`;
  const docLines = wrapTextLines(ctx, docText, w - 36, 1);
  ctx.fillText(docLines[0] || docText, left + 18, topY + h - 22);

  ctx.restore();
}

function drawBadgeLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string
) {
  ctx.save();
  ctx.font = 'bold 15px "Times New Roman", Georgia, serif';
  const w = Math.max(36, ctx.measureText(label).width + 18);
  const h = 24;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#0F294A';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0F294A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y + 1);
  ctx.restore();
}

/**
 * Renderiza todas las láminas visuales del flujograma completo en PNG de alta nitidez
 * usando HTML5 Canvas en el navegador. Si no existe DOM (p. ej. test CLI), retorna [].
 */
export async function generateFlowchartDiagramPages(
  proceso: ProcessStep[]
): Promise<FlowchartDiagramPageAsset[]> {
  if (typeof document === 'undefined') return [];

  const plans = buildFlowchartSheetPlans(proceso);
  const assets: FlowchartDiagramPageAsset[] = [];

  for (const plan of plans) {
    const canvas = document.createElement('canvas');
    const dpiScale = 1.5;
    canvas.width = Math.round(plan.width * dpiScale);
    canvas.height = Math.round(plan.height * dpiScale);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.scale(dpiScale, dpiScale);

    // Fondo blanco limpio
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, plan.width, plan.height);

    // Marco institucional discreto de lámina
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, plan.width - 36, plan.height - 36);

    // Encabezado sobrio de lámina
    const firstNum = plan.stepNumbers.get(plan.steps[0].id) ?? 1;
    const lastStep = plan.steps[plan.steps.length - 1];
    const lastNum = plan.stepNumbers.get(lastStep.id) ?? plan.steps.length;
    const rangeLabel = `Lámina ${plan.pageNumber} de ${plan.totalPages} · Pasos ${firstNum} al ${lastNum}`;

    ctx.fillStyle = '#0F294A';
    ctx.font = 'bold 21px "Times New Roman", Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('DIAGRAMA DE FLUJO DEL PROCEDIMIENTO', 48, 52);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 17px "Times New Roman", Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText(rangeLabel, plan.width - 48, 52);

    let cursorY = 82;
    if (plan.pageNumber === 1) {
      drawLegendBar(ctx, cursorY);
      cursorY += 102;
    } else {
      cursorY += 24;
    }

    // Conector de entrada si viene de lámina anterior
    if (plan.entryConnector) {
      drawOffPageConnector(
        ctx,
        SPINE_CENTER_X,
        cursorY + 24,
        plan.entryConnector,
        `Viene de lámina ${plan.pageNumber - 1}`
      );
      drawConnectorLine(
        ctx,
        SPINE_CENTER_X,
        cursorY + 48,
        SPINE_CENTER_X,
        cursorY + 86
      );
      cursorY += 88;
    }

    // Dibujo secuencial de nodos principales y ramas de decisión SÍ / NO
    plan.steps.forEach((step, idx) => {
      const stepNum = plan.stepNumbers.get(step.id) ?? idx + 1;
      const h = getStepHeight(step);
      const cy = cursorY + h / 2;

      drawStepShape(ctx, step, stepNum, SPINE_CENTER_X, cursorY);

      // Si es compuerta de decisión con nodo lateral de ajuste (NO)
      if (step.isDecision && step.noTargetId) {
        const noNode = plan.allStepsById.get(step.noTargetId);
        if (noNode) {
          const noNum = plan.stepNumbers.get(noNode.id) ?? stepNum + 1;
          const adjTopY = cy - ADJ_H / 2;
          const diamondRightX = SPINE_CENTER_X + DIAMOND_W / 2;
          const adjLeftX = ADJ_CENTER_X - ADJ_W / 2;

          // Flecha horizontal desde el rombo hacia el ajuste
          drawConnectorLine(ctx, diamondRightX, cy, adjLeftX - 2, cy);
          drawBadgeLabel(
            ctx,
            (diamondRightX + adjLeftX) / 2,
            cy,
            step.noLabel || 'NO'
          );

          drawStepShape(ctx, noNode, noNum, ADJ_CENTER_X, adjTopY);

          // Conector ortogonal de retorno hacia el rombo de aprobación
          const loopTopY = cursorY - 22;
          const entryDiamondX = SPINE_CENTER_X + 115;
          const entryDiamondY = cursorY + (h / 2) * (115 / (DIAMOND_W / 2));

          ctx.save();
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2.2;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(ADJ_CENTER_X, adjTopY);
          ctx.lineTo(ADJ_CENTER_X, loopTopY);
          ctx.lineTo(entryDiamondX, loopTopY);
          ctx.lineTo(entryDiamondX, entryDiamondY - 3);
          ctx.stroke();
          ctx.restore();

          drawArrowHead(
            ctx,
            entryDiamondX,
            entryDiamondY - 2,
            Math.PI / 2,
            10,
            '#475569'
          );

          ctx.save();
          ctx.fillStyle = '#475569';
          ctx.font = 'italic 14px "Times New Roman", Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText('Vuelve a revisión', (ADJ_CENTER_X + entryDiamondX) / 2, loopTopY - 12);
          ctx.restore();
        }
      }

      // Flecha vertical hacia el siguiente nodo de la columna principal
      const hasNextInSheet = idx < plan.steps.length - 1;
      if (hasNextInSheet) {
        const nextY = cursorY + h + ROW_GAP;
        drawConnectorLine(
          ctx,
          SPINE_CENTER_X,
          cursorY + h,
          SPINE_CENTER_X,
          nextY - 2
        );
        if (step.isDecision) {
          drawBadgeLabel(
            ctx,
            SPINE_CENTER_X,
            cursorY + h + ROW_GAP / 2,
            step.yesLabel || 'SÍ'
          );
        }
      } else if (plan.exitConnector) {
        const exitCenterY = cursorY + h + 68;
        drawConnectorLine(
          ctx,
          SPINE_CENTER_X,
          cursorY + h,
          SPINE_CENTER_X,
          exitCenterY - 26
        );
        if (step.isDecision) {
          drawBadgeLabel(
            ctx,
            SPINE_CENTER_X,
            cursorY + h + 21,
            step.yesLabel || 'SÍ'
          );
        }
        drawOffPageConnector(
          ctx,
          SPINE_CENTER_X,
          exitCenterY,
          plan.exitConnector,
          `Continúa en lámina ${plan.pageNumber + 1}`
        );
      }

      cursorY += h + ROW_GAP;
    });

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    );
    if (blob) {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      assets.push({
        bytes,
        width: plan.width,
        height: plan.height,
        pageNumber: plan.pageNumber,
        totalPages: plan.totalPages,
        rangeLabel,
      });
    }
  }

  return assets;
}
