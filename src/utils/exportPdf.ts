import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StaffEntry, Project } from '../types';

export const exportEntriesToPDF = (
  entries: StaffEntry[],
  projects: Project[],
  filterTitle: string,
  targetDate?: string
) => {
  // Collect all unique custom field labels across projects referenced in entries
  const customFieldMap = new Map<string, string>(); // cfId -> label
  for (const ent of entries) {
    const proj = projects.find((p) => p.id === ent.projectId);
    if (proj?.customFields) {
      for (const cf of proj.customFields) {
        customFieldMap.set(cf.id, cf.label);
      }
    }
  }

  const customFieldEntries = Array.from(customFieldMap.entries()); // [ [id, label], ... ]

  // Use landscape if custom fields are present for optimal table layout
  const orientation = customFieldEntries.length > 0 ? 'landscape' : 'portrait';
  const doc = new jsPDF(orientation);
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background banner
  doc.setFillColor(16, 185, 129); // Emerald-500
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('OPSTRACKA - DIGITAL OPERATIONS REPORT', 14, 18);

  // Metadata
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 38);
  doc.text(`Filter View: ${filterTitle}`, 14, 45);
  if (targetDate) {
    doc.text(`Target Date: ${targetDate}`, 14, 52);
  }

  // Summary Metrics
  const totalBoxes = entries.reduce((a, b) => a + b.boxes, 0);
  const totalFiles = entries.reduce((a, b) => a + b.files, 0);
  const totalPages = entries.reduce((a, b) => a + b.pages, 0);

  const startMetricsY = targetDate ? 58 : 52;
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.roundedRect(14, startMetricsY, pageWidth - 28, 18, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Total Boxes: ${totalBoxes}`, 20, startMetricsY + 11);
  doc.text(`Total Files: ${totalFiles}`, 80, startMetricsY + 11);
  doc.text(`Total Pages: ${totalPages.toLocaleString()}`, 140, startMetricsY + 11);
  if (customFieldEntries.length > 0) {
    doc.text(`Custom CMS Fields: ${customFieldEntries.length} column(s)`, 200, startMetricsY + 11);
  }

  // Table Data
  const baseHeaders = ['Date', 'Staff', 'Project', 'Operation', 'Boxes', 'Files', 'Pages'];
  const cfHeaders = customFieldEntries.map(([_, label]) => label);
  const tableColumn = [...baseHeaders, ...cfHeaders];

  const tableRows = entries.map((e) => {
    const proj = projects.find((p) => p.id === e.projectId);
    const op = proj?.operations?.find((o) => o.id === e.operationId);
    
    const baseRow = [
      e.date,
      e.staffName,
      proj?.name || 'Project',
      op?.name || 'Operation',
      e.boxes,
      e.files,
      e.pages.toLocaleString(),
    ];

    const cfValues = customFieldEntries.map(([cfId]) => {
      const val = e.customFieldValues?.[cfId];
      return val !== undefined && val !== null && val !== '' ? String(val) : '—';
    });

    return [...baseRow, ...cfValues];
  });

  autoTable(doc, {
    startY: startMetricsY + 24,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 2.5,
    },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `OpsTracka Enterprise Archival Digitization Report - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`opstracka_report_${targetDate || 'all_time'}.pdf`);
};

