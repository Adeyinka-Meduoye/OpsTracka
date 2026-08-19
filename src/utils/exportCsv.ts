import { Project, StaffEntry } from '../types';

const formatDateToYMD = (dateInput: string) => {
  if (!dateInput) return '';
  // If string contains ISO timestamp, take date part
  const datePart = dateInput.split('T')[0];
  const parsed = new Date(datePart);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return datePart;
};

export const exportEntriesToCSV = (entries: StaffEntry[], projects: Project[], filename = 'opstrack_report.csv') => {
  const headers = ['Entry ID', 'Project', 'Operation', 'Date', 'Staff Name', 'Boxes', 'Files', 'Pages', 'Notes', 'Created At'];
  
  const rows = entries.map((ent) => {
    const proj = projects.find((p) => p.id === ent.projectId);
    const op = proj?.operations.find((o) => o.id === ent.operationId);
    
    const formattedDate = formatDateToYMD(ent.date);
    const formattedCreatedAt = formatDateToYMD(ent.createdAt);
    
    return [
      `"${ent.id}"`,
      `"${proj?.name || 'Unknown Project'}"`,
      `"${op?.name || 'Unknown Operation'}"`,
      `="\t${formattedDate}"`, // Force Excel to treat as text in YYYY-MM-DD format without ####### error
      `"${ent.staffName}"`,
      ent.boxes,
      ent.files,
      ent.pages,
      `"${(ent.notes || '').replace(/"/g, '""')}"`,
      `="\t${formattedCreatedAt}"`,
    ];
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel opens CSV with correct encoding
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
