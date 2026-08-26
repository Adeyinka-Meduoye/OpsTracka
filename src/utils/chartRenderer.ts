export interface ChartDataItem {
  name: string;
  projectName?: string;
  boxes: number;
  files: number;
  pages: number;
}

/**
 * Generates a high-resolution 2x retina Canvas PNG Data URL representing the bar chart
 * for inclusion in PDF exports, print windows, and report documents.
 */
export const generateChartDataUrl = (
  data: ChartDataItem[],
  title = 'Output Volume Performance Chart'
): string => {
  if (!data || data.length === 0) {
    // Return empty fallback
    const emptyCanvas = document.createElement('canvas');
    emptyCanvas.width = 800;
    emptyCanvas.height = 300;
    const ctx = emptyCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 800, 300);
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data available for chart generation', 400, 150);
    }
    return emptyCanvas.toDataURL('image/png');
  }

  const width = 900;
  const height = 380;
  const canvas = document.createElement('canvas');
  canvas.width = width * 2; // 2x retina
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Card outline
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);

  // Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, 24, 32);

  // Legend (Top Right)
  const legendX = width - 360;
  const legendY = 24;

  // Pages Legend (Emerald)
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(legendX, legendY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#334155';
  ctx.font = '500 12px sans-serif';
  ctx.fillText('Pages Digitized', legendX + 10, legendY + 4);

  // Files Legend (Blue)
  const legendX2 = legendX + 120;
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.arc(legendX2, legendY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#334155';
  ctx.fillText('Files Sorted', legendX2 + 10, legendY + 4);

  // Boxes Legend (Amber)
  const legendX3 = legendX2 + 105;
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(legendX3, legendY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#334155';
  ctx.fillText('Boxes', legendX3 + 10, legendY + 4);

  // Chart plotting boundaries
  const plotLeft = 70;
  const plotRight = width - 30;
  const plotTop = 60;
  const plotBottom = height - 60;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  // Determine max value for Y scale
  const maxPages = Math.max(...data.map((d) => d.pages), 0);
  const maxFiles = Math.max(...data.map((d) => d.files), 0);
  const maxBoxes = Math.max(...data.map((d) => d.boxes), 0);
  const rawMax = Math.max(maxPages, maxFiles, maxBoxes, 10);

  // Round up to nice number
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const yMax = Math.ceil(rawMax / magnitude) * magnitude || 10;

  // Draw horizontal grid lines & Y-axis labels
  const gridSteps = 5;
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';

  for (let i = 0; i <= gridSteps; i++) {
    const val = Math.round((yMax / gridSteps) * i);
    const yPos = plotBottom - (plotHeight / gridSteps) * i;

    // Grid line
    ctx.beginPath();
    ctx.moveTo(plotLeft, yPos);
    ctx.lineTo(plotRight, yPos);
    ctx.stroke();

    // Y Axis label
    ctx.fillStyle = '#64748b';
    ctx.fillText(val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`, plotLeft - 10, yPos + 4);
  }

  // Draw X-axis line
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(plotLeft, plotBottom);
  ctx.lineTo(plotRight, plotBottom);
  ctx.stroke();

  // Draw Bars for each data item
  const groupCount = data.length;
  const groupWidth = plotWidth / groupCount;
  const barPadding = Math.max(4, groupWidth * 0.15);
  const availableBarSpace = groupWidth - barPadding * 2;
  const barWidth = Math.min(28, availableBarSpace / 3);

  data.forEach((item, index) => {
    const groupCenterX = plotLeft + index * groupWidth + groupWidth / 2;

    const barPagesHeight = (item.pages / yMax) * plotHeight;
    const barFilesHeight = (item.files / yMax) * plotHeight;
    const barBoxesHeight = (item.boxes / yMax) * plotHeight;

    const xPages = groupCenterX - (barWidth * 1.5);
    const xFiles = groupCenterX - (barWidth * 0.5);
    const xBoxes = groupCenterX + (barWidth * 0.5);

    // Draw Pages Bar (Emerald)
    if (item.pages > 0) {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(xPages, plotBottom - barPagesHeight, barWidth - 2, barPagesHeight, [3, 3, 0, 0]);
      ctx.fill();

      // Value label on top
      if (barWidth >= 16) {
        ctx.fillStyle = '#065f46';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          item.pages >= 1000 ? `${Math.round(item.pages / 1000)}k` : `${item.pages}`,
          xPages + (barWidth - 2) / 2,
          plotBottom - barPagesHeight - 4
        );
      }
    }

    // Draw Files Bar (Blue)
    if (item.files > 0) {
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(xFiles, plotBottom - barFilesHeight, barWidth - 2, barFilesHeight, [3, 3, 0, 0]);
      ctx.fill();

      if (barWidth >= 16) {
        ctx.fillStyle = '#1e40af';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          item.files >= 1000 ? `${Math.round(item.files / 1000)}k` : `${item.files}`,
          xFiles + (barWidth - 2) / 2,
          plotBottom - barFilesHeight - 4
        );
      }
    }

    // Draw Boxes Bar (Amber)
    if (item.boxes > 0) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(xBoxes, plotBottom - barBoxesHeight, barWidth - 2, barBoxesHeight, [3, 3, 0, 0]);
      ctx.fill();

      if (barWidth >= 16) {
        ctx.fillStyle = '#92400e';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${item.boxes}`,
          xBoxes + (barWidth - 2) / 2,
          plotBottom - barBoxesHeight - 4
        );
      }
    }

    // X Axis Label
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 10px sans-serif';
    ctx.textAlign = 'center';

    const truncatedLabel = item.name.length > 14 ? `${item.name.substring(0, 12)}…` : item.name;
    ctx.fillText(truncatedLabel, groupCenterX, plotBottom + 16);

    if (item.projectName && item.projectName !== item.name) {
      ctx.fillStyle = '#64748b';
      ctx.font = '9px sans-serif';
      const subLabel = item.projectName.length > 15 ? `${item.projectName.substring(0, 13)}…` : item.projectName;
      ctx.fillText(subLabel, groupCenterX, plotBottom + 28);
    }
  });

  return canvas.toDataURL('image/png');
};
