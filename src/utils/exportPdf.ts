import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StaffEntry, Project } from '../types';

export const exportEntriesToPDF = (
  entries: StaffEntry[],
  projects: Project[],
  filterTitle: string,
  targetDate?: string
) => {
  const doc = new jsPDF();
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

  doc.setFillColor(241, 245, 249); // Slate-100
  doc.roundedRect(14, 58, pageWidth - 28, 20, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Total Boxes: ${totalBoxes}`, 20, 71);
  doc.text(`Total Files: ${totalFiles}`, 80, 71);
  doc.text(`Total Pages: ${totalPages.toLocaleString()}`, 140, 71);

  // Table Data
  const tableColumn = ['Date', 'Staff', 'Project', 'Operation', 'Boxes', 'Files', 'Pages'];
  const tableRows = entries.map((e) => {
    const proj = projects.find((p) => p.id === e.projectId);
    const op = proj?.operations?.find((o) => o.id === e.operationId);
    return [
      e.date,
      e.staffName,
      proj?.name || 'Project',
      op?.name || 'Operation',
      e.boxes,
      e.files,
      e.pages.toLocaleString(),
    ];
  });

  autoTable(doc, {
    startY: 85,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
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
