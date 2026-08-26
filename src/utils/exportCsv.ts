import { Project, StaffEntry } from '../types';
import { ChartDataItem } from './chartRenderer';

const formatDateToYMD = (dateInput: string) => {
  if (!dateInput) return '';
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

export const exportEntriesToCSV = (
  entries: StaffEntry[],
  projects: Project[],
  filename = 'opstrack_report.csv',
  chartData?: ChartDataItem[]
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

  const lines: string[] = [];

  // 1. Granular Operations Log Table FIRST
  lines.push('"=== GRANULAR SHIFT ENTRIES LOG ==="');
  const baseHeaders = ['Entry ID', 'Project', 'Operation', 'Date', 'Staff Name', 'Boxes', 'Files', 'Pages', 'Notes', 'Created At'];
  const cfHeaders = customFieldEntries.map(([_, label]) => label);
  const headers = [...baseHeaders, ...cfHeaders];
  lines.push(headers.join(','));

  const rows = entries.map((ent) => {
    const proj = projects.find((p) => p.id === ent.projectId);
    const op = proj?.operations.find((o) => o.id === ent.operationId);
    
    const formattedDate = formatDateToYMD(ent.date);
    const formattedCreatedAt = formatDateToYMD(ent.createdAt);
    
    const baseRow = [
      `"${ent.id}"`,
      `"${proj?.name || 'Unknown Project'}"`,
      `"${op?.name || 'Unknown Operation'}"`,
      `="\t${formattedDate}"`, // Force Excel to treat as text in YYYY-MM-DD format
      `"${ent.staffName}"`,
      ent.boxes,
      ent.files,
      ent.pages,
      `"${(ent.notes || '').replace(/"/g, '""')}"`,
      `="\t${formattedCreatedAt}"`,
    ];

    const cfValues = customFieldEntries.map(([cfId]) => {
      const val = ent.customFieldValues?.[cfId] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    });

    return [...baseRow, ...cfValues].join(',');
  });

  lines.push(...rows);

  // 2. Chart Aggregation & Performance Summary Table AFTER the Table
  if (chartData && chartData.length > 0) {
    lines.push(''); // Empty line separator
    lines.push('"=== PERFORMANCE ANALYTICS & AGGREGATED METRICS SUMMARY ==="');
    lines.push('"Operation / Stage","Project Name","Total Boxes Processed","Total Files Sorted","Total Pages Digitized","% Volume Share"');
    
    const totalPagesAll = chartData.reduce((acc, curr) => acc + curr.pages, 0) || 1;
    
    for (const item of chartData) {
      const share = ((item.pages / totalPagesAll) * 100).toFixed(1) + '%';
      const fullProjectName = item.projectName || item.name;
      lines.push(
        `"${item.name.replace(/"/g, '""')}","${fullProjectName.replace(/"/g, '""')}",${item.boxes},${item.files},${item.pages},"${share}"`
      );
    }
  }

  // Prepend UTF-8 BOM (\uFEFF) so Excel opens CSV with correct encoding
  const csvContent = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
