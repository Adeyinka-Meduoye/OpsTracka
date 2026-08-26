import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Project, StaffEntry, User } from '../types';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  FileText,
  BookOpen,
  Filter,
  FileSpreadsheet,
  Calendar,
  Printer,
  FileDown,
  Search,
  Eye,
  RotateCcw,
  MoveHorizontal,
  X,
  Table as TableIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { exportEntriesToCSV } from '../utils/exportCsv';
import { exportEntriesToPDF } from '../utils/exportPdf';
import { generateChartDataUrl } from '../utils/chartRenderer';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardViewProps {
  projects: Project[];
  entries: StaffEntry[];
  users: User[];
  currentUser: User | null;
  darkMode?: boolean;
}

// Default column widths in pixels
const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  date: 115,
  staffName: 160,
  project: 220,
  operation: 170,
  boxes: 100,
  files: 100,
  pages: 125,
  notes: 240,
  actions: 80,
};

const MIN_COLUMN_WIDTHS: Record<string, number> = {
  date: 85,
  staffName: 110,
  project: 130,
  operation: 110,
  boxes: 70,
  files: 70,
  pages: 85,
  notes: 120,
  actions: 65,
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  entries,
  users,
  currentUser,
  darkMode = true,
}) => {
  const isStaff = currentUser?.role === 'staff';

  // Filter states
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedOperationId, setSelectedOperationId] = useState<string>('all');
  const [selectedStaffName, setSelectedStaffName] = useState<string>('all');
  const [targetDate, setTargetDate] = useState<string>('');
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');
  const [viewingEntry, setViewingEntry] = useState<StaffEntry | null>(null);

  // Column Resizing State
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('opstracka_dashboard_col_widths');
      return saved ? JSON.parse(saved) : { ...DEFAULT_COLUMN_WIDTHS };
    } catch {
      return { ...DEFAULT_COLUMN_WIDTHS };
    }
  });

  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const resizeStartXRef = useRef<number>(0);
  const resizeStartWidthRef = useRef<number>(0);
  const activeColRef = useRef<string | null>(null);

  // Persist column widths
  useEffect(() => {
    try {
      localStorage.setItem('opstracka_dashboard_col_widths', JSON.stringify(columnWidths));
    } catch {}
  }, [columnWidths]);

  // Handle column resizing drag
  const startResizing = useCallback((colKey: string, clientX: number) => {
    activeColRef.current = colKey;
    setResizingCol(colKey);
    resizeStartXRef.current = clientX;
    resizeStartWidthRef.current = columnWidths[colKey] || DEFAULT_COLUMN_WIDTHS[colKey] || 150;

    const handleMouseMove = (e: MouseEvent) => {
      if (!activeColRef.current) return;
      const diff = e.clientX - resizeStartXRef.current;
      const minW = MIN_COLUMN_WIDTHS[activeColRef.current] || 90;
      const newWidth = Math.max(minW, resizeStartWidthRef.current + diff);
      setColumnWidths((prev) => ({
        ...prev,
        [activeColRef.current!]: newWidth,
      }));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!activeColRef.current || !e.touches[0]) return;
      const diff = e.touches[0].clientX - resizeStartXRef.current;
      const minW = MIN_COLUMN_WIDTHS[activeColRef.current] || 90;
      const newWidth = Math.max(minW, resizeStartWidthRef.current + diff);
      setColumnWidths((prev) => ({
        ...prev,
        [activeColRef.current!]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      activeColRef.current = null;
      setResizingCol(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);
  }, [columnWidths]);

  const resetColumnWidths = () => {
    setColumnWidths({ ...DEFAULT_COLUMN_WIDTHS });
  };

  // Staff / Team Lead list for filter
  const staffUsers = users.filter((u) => u.role === 'staff');

  // Gather available operations based on selected project
  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const availableOperations = currentProject
    ? currentProject.operations || []
    : Array.from(
        new Map(
          projects.flatMap((p) => (p.operations || []).map((o) => [o.id, o]))
        ).values()
      );

  // Filter entries based on top-level filter controls
  const filteredEntries = entries.filter((e) => {
    if (!isStaff && selectedStaffName !== 'all' && e.staffName.toLowerCase() !== selectedStaffName.toLowerCase()) {
      return false;
    }

    if (selectedProjectId !== 'all' && e.projectId !== selectedProjectId) {
      return false;
    }

    if (selectedOperationId !== 'all' && e.operationId !== selectedOperationId) {
      return false;
    }

    if (targetDate.trim()) {
      if (e.date !== targetDate.trim()) {
        return false;
      }
    }

    return true;
  });

  // Further filter for table search bar
  const displayedTableEntries = filteredEntries.filter((e) => {
    if (!tableSearchQuery.trim()) return true;
    const q = tableSearchQuery.toLowerCase();
    const proj = projects.find((p) => p.id === e.projectId);
    const op = proj?.operations?.find((o) => o.id === e.operationId);
    return (
      e.staffName.toLowerCase().includes(q) ||
      e.date.toLowerCase().includes(q) ||
      (proj?.name && proj.name.toLowerCase().includes(q)) ||
      (op?.name && op.name.toLowerCase().includes(q)) ||
      (e.notes && e.notes.toLowerCase().includes(q))
    );
  });

  const totalBoxes = filteredEntries.reduce((a, b) => a + b.boxes, 0);
  const totalFiles = filteredEntries.reduce((a, b) => a + b.files, 0);
  const totalPages = filteredEntries.reduce((a, b) => a + b.pages, 0);

  // Collect all unique custom fields across projects referenced in entries
  const customFieldMap = new Map<string, string>(); // cfId -> label
  for (const ent of filteredEntries) {
    const proj = projects.find((p) => p.id === ent.projectId);
    if (proj?.customFields) {
      for (const cf of proj.customFields) {
        customFieldMap.set(cf.id, cf.label);
      }
    }
  }
  const customFieldEntries = Array.from(customFieldMap.entries());

  // Chart Data preparation
  const chartData =
    selectedProjectId === 'all'
      ? projects.map((p) => {
          const projEntries = filteredEntries.filter((e) => e.projectId === p.id);
          return {
            name: p.client,
            projectName: p.name,
            boxes: projEntries.reduce((a, b) => a + b.boxes, 0),
            files: projEntries.reduce((a, b) => a + b.files, 0),
            pages: projEntries.reduce((a, b) => a + b.pages, 0),
          };
        })
      : (currentProject?.operations || []).map((op) => {
          const opEntries = filteredEntries.filter((e) => e.operationId === op.id);
          return {
            name: op.name,
            projectName: op.name,
            boxes: opEntries.reduce((a, b) => a + b.boxes, 0),
            files: opEntries.reduce((a, b) => a + b.files, 0),
            pages: opEntries.reduce((a, b) => a + b.pages, 0),
          };
        });

  const handleExportCSV = () => {
    exportEntriesToCSV(filteredEntries, projects, `filtered_operations_report_${targetDate || 'all_time'}.csv`, chartData);
  };

  const handleExportPDF = () => {
    const filterDesc = selectedProjectId === 'all' ? 'All Projects' : currentProject?.name || 'Selected Project';
    exportEntriesToPDF(filteredEntries, projects, filterDesc, targetDate, chartData);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for printing.');
      return;
    }

    const filterDesc = selectedProjectId === 'all' ? 'All Projects' : currentProject?.name || 'Selected Project';

    // Generate chart data URL for high-resolution visual embedding in the print report
    const chartTitle = `Performance Analytics Output Chart (${filterDesc})`;
    const chartDataUrl = generateChartDataUrl(chartData, chartTitle);

    const rowsHtml = filteredEntries.map((e) => {
      const proj = projects.find((p) => p.id === e.projectId);
      const op = proj?.operations?.find((o) => o.id === e.operationId);

      const cfCells = customFieldEntries.map(([cfId]) => {
        const val = e.customFieldValues?.[cfId];
        const displayVal = val !== undefined && val !== null && val !== '' ? String(val) : '—';
        return `<td style="padding: 8px; border-bottom: 1px solid #cbd5e1;">${displayVal}</td>`;
      }).join('');

      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #cbd5e1;">${e.date}</td>
          <td style="padding: 8px; border-bottom: 1px solid #cbd5e1;">${e.staffName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #cbd5e1;">${proj?.name || 'Project'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #cbd5e1;">${op?.name || 'Operation'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #cbd5e1; text-align: right;">${e.boxes}</td>
          <td style="padding: 8px; border-bottom: 1px solid #cbd5e1; text-align: right;">${e.files}</td>
          <td style="padding: 8px; border-bottom: 1px solid #cbd5e1; text-align: right;">${e.pages.toLocaleString()}</td>
          ${cfCells}
        </tr>
      `;
    }).join('');

    const cfHeaders = customFieldEntries.map(([_, label]) => `<th style="padding: 8px; text-align: left;">${label}</th>`).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OpsTracka - Operations Report</title>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #0f172a; margin: 0; }
            h1 { color: #059669; font-size: 20px; margin-bottom: 4px; }
            .meta { font-size: 12px; color: #475569; margin-bottom: 16px; }
            .metrics { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
            .metric-card { background: #f1f5f9; padding: 12px 16px; border-radius: 8px; border: 1px solid #cbd5e1; min-width: 100px; }
            .metric-card h3 { margin: 0; font-size: 18px; color: #0f172a; }
            .metric-card span { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; }
            .chart-box { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 20px; text-align: center; page-break-inside: avoid; }
            .chart-box img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
            th { background: #059669; color: white; text-align: left; padding: 8px; font-weight: 600; }
            @media print {
              @page { size: landscape; margin: 10mm; }
              .chart-box { border: 1px solid #94a3b8; }
            }
          </style>
        </head>
        <body>
          <h1>OPSTRACKA - DIGITAL OPERATIONS & ANALYTICS REPORT</h1>
          <div class="meta">
            <div><strong>Filter View:</strong> ${filterDesc}</div>
            <div><strong>Target Date:</strong> ${targetDate || 'All Time'}</div>
            <div><strong>Generated On:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <div class="metrics">
            <div class="metric-card">
              <span>Boxes</span>
              <h3>${totalBoxes}</h3>
            </div>
            <div class="metric-card">
              <span>Files</span>
              <h3>${totalFiles}</h3>
            </div>
            <div class="metric-card">
              <span>Pages</span>
              <h3>${totalPages.toLocaleString()}</h3>
            </div>
            ${customFieldEntries.length > 0 ? `
              <div class="metric-card">
                <span>Custom CMS Fields</span>
                <h3>${customFieldEntries.length}</h3>
              </div>
            ` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th style="padding: 8px; text-align: left;">Date</th>
                <th style="padding: 8px; text-align: left;">Team Member / Staff</th>
                <th style="padding: 8px; text-align: left;">Project</th>
                <th style="padding: 8px; text-align: left;">Operation</th>
                <th style="padding: 8px; text-align: right;">Boxes</th>
                <th style="padding: 8px; text-align: right;">Files</th>
                <th style="padding: 8px; text-align: right;">Pages</th>
                ${cfHeaders}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          ${chartDataUrl ? `
            <div class="chart-box" style="margin-top: 24px;">
              <img src="${chartDataUrl}" alt="Operations Analytics Chart" />
            </div>
          ` : ''}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Helper component for Resizable Column Header
  const ResizableHeader: React.FC<{
    colKey: string;
    label: string;
    align?: 'left' | 'right' | 'center';
  }> = ({ colKey, label, align = 'left' }) => {
    const width = columnWidths[colKey] || DEFAULT_COLUMN_WIDTHS[colKey] || 150;
    const isResizing = resizingCol === colKey;

    return (
      <th
        style={{ width: `${width}px`, minWidth: `${MIN_COLUMN_WIDTHS[colKey] || 80}px` }}
        className={`relative px-4 py-3.5 select-none font-bold uppercase text-xs tracking-wider ${
          align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
        } ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}
      >
        <div className="flex items-center justify-between space-x-1">
          <span className="truncate" title={label}>
            {label}
          </span>
          <span className="text-[10px] text-slate-500 font-normal ml-1 opacity-40 hover:opacity-100">
            {width}px
          </span>
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            startResizing(colKey, e.clientX);
          }}
          onTouchStart={(e) => {
            if (e.touches[0]) {
              startResizing(colKey, e.touches[0].clientX);
            }
          }}
          title="Click and drag horizontally to resize this column"
          className={`absolute top-0 right-0 bottom-0 w-2.5 cursor-col-resize flex items-center justify-center group z-10 transition-colors ${
            isResizing ? 'bg-emerald-500/40' : 'hover:bg-emerald-500/20'
          }`}
        >
          <div
            className={`w-[2px] h-4/5 rounded-full transition-all ${
              isResizing ? 'bg-emerald-400 w-[3px]' : 'bg-slate-600/40 group-hover:bg-emerald-400'
            }`}
          />
        </div>
      </th>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-3xl p-6`}>
        <div>
          <h1 className={`text-2xl font-bold flex items-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <LayoutDashboard className="w-7 h-7 text-emerald-400 mr-3" />
            Operations Analytics & Summary Dashboard
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {isStaff
              ? `Team Lead View for ${currentUser.name}: Showing analytics for your contributions.`
              : 'Real-time performance metrics across all active digitization projects, operations, and Team Leads.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 no-print">
          <button
            onClick={handlePrint}
            className={`font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-2 text-sm border ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'}`}
            title="Print Report"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportPDF}
            className={`font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-2 text-sm border ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'}`}
            title="Download PDF Report"
          >
            <FileDown className="w-4 h-4 text-rose-400" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className={`font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-2 text-sm border ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'}`}
            title="Download CSV Spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Download CSV ({filteredEntries.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} border rounded-3xl p-6 no-print`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            <h3 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              Advanced Dashboard Filter Controls (Projects, Operations, Team Lead, Specific Date)
            </h3>
          </div>
          {targetDate && (
            <button
              onClick={() => setTargetDate('')}
              className="text-xs text-emerald-400 hover:underline font-semibold"
            >
              Clear Date Filter (Show All Time)
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Project Filter */}
          <div>
            <label className={`block text-xs font-semibold uppercase mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Project Filter
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedOperationId('all');
              }}
              className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
            >
              <option value="all">All Projects (Global)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                  {p.name} ({p.client})
                </option>
              ))}
            </select>
          </div>

          {/* Operation Filter */}
          <div>
            <label className={`block text-xs font-semibold uppercase mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Operation Filter
            </label>
            <select
              value={selectedOperationId}
              onChange={(e) => setSelectedOperationId(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
            >
              <option value="all">All Operations</option>
              {availableOperations.map((op) => (
                <option key={op.id} value={op.id} className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                  {op.name}
                </option>
              ))}
            </select>
          </div>

          {/* Team Lead Filter */}
          {!isStaff && (
            <div>
              <label className={`block text-xs font-semibold uppercase mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Team Lead Filter
              </label>
              <select
                value={selectedStaffName}
                onChange={(e) => setSelectedStaffName(e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
              >
                <option value="all">All Team Leads</option>
                {staffUsers.map((su) => (
                  <option key={su.id} value={su.name} className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                    {su.name} (@{su.username})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Specific Date Picker Filter */}
          <div>
            <label className={`block text-xs font-semibold uppercase mb-1.5 flex items-center ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              <span>Pick Specific Date</span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
            />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} border rounded-3xl p-6 flex items-center space-x-4`}>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Filtered Boxes Processed</span>
            <h3 className={`text-3xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{totalBoxes}</h3>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} border rounded-3xl p-6 flex items-center space-x-4`}>
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Filtered Files Sorted</span>
            <h3 className={`text-3xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{totalFiles}</h3>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} border rounded-3xl p-6 flex items-center space-x-4`}>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Filtered Pages Digitized</span>
            <h3 className={`text-3xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{totalPages.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} border rounded-3xl p-6 md:p-8`}>
        <h3 className={`text-lg font-bold mb-6 flex items-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          <TrendingUp className="w-5 h-5 text-emerald-400 mr-2" />
          {selectedProjectId === 'all' ? 'Output Volume by Project Client' : `Output Volume by Operation Stages (${currentProject?.name})`}
          {targetDate && <span className="ml-2 text-xs text-emerald-400 font-mono">(Date: {targetDate})</span>}
        </h3>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#cbd5e1'} />
              <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} textAnchor="end" />
              <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                  borderColor: darkMode ? '#334155' : '#cbd5e1',
                  borderRadius: '12px',
                  color: darkMode ? '#fff' : '#0f172a',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="pages" fill="#10b981" name="Pages Digitized" radius={[8, 8, 0, 0]} />
              <Bar dataKey="files" fill="#3b82f6" name="Files Processed" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Analytics Data Table with Horizontal Column Resizing */}
      <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} border rounded-3xl p-6 md:p-8 space-y-5`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className={`text-lg font-bold flex items-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <TableIcon className="w-5 h-5 text-emerald-400 mr-2" />
              Performance Analytics & Granular Operations Table
              <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {displayedTableEntries.length} Records
              </span>
            </h3>
            <p className={`text-xs mt-1 flex items-center ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <MoveHorizontal className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Hover and drag the right edge of any column header to resize horizontally and view long project names or data values.
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            {/* Search Input for Table */}
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                placeholder="Search table records..."
                className={`w-full border rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 pl-9 ${darkMode ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400'}`}
              />
              <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            </div>

            {/* Reset Column Widths Button */}
            <button
              onClick={resetColumnWidths}
              className={`p-2 rounded-xl text-xs flex items-center space-x-1.5 border transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'}`}
              title="Reset column widths to default"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Reset Widths</span>
            </button>
          </div>
        </div>

        {/* Resizable Table Container */}
        <div className={`overflow-x-auto rounded-2xl border ${darkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'}`}>
          <table className="w-full text-left text-sm table-fixed border-collapse">
            <thead className={`border-b ${darkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              <tr>
                <ResizableHeader colKey="date" label="Date" />
                <ResizableHeader colKey="staffName" label="Team Member" />
                <ResizableHeader colKey="project" label="Project Name" />
                <ResizableHeader colKey="operation" label="Operation Stage" />
                <ResizableHeader colKey="boxes" label="Boxes" align="right" />
                <ResizableHeader colKey="files" label="Files" align="right" />
                <ResizableHeader colKey="pages" label="Pages" align="right" />
                <ResizableHeader colKey="notes" label="Notes" />
                {customFieldEntries.map(([cfId, label]) => (
                  <ResizableHeader key={cfId} colKey={`cf_${cfId}`} label={label} />
                ))}
                <ResizableHeader colKey="actions" label="Details" align="center" />
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
              {displayedTableEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={9 + customFieldEntries.length}
                    className={`text-center py-10 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}
                  >
                    {tableSearchQuery ? 'No operational records match your search filter.' : 'No entries found for the selected filter parameters.'}
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {displayedTableEntries.map((ent, idx) => {
                    const proj = projects.find((p) => p.id === ent.projectId);
                    const op = proj?.operations?.find((o) => o.id === ent.operationId);

                    return (
                      <motion.tr
                        key={ent.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15, delay: Math.min(idx * 0.015, 0.3) }}
                        className={darkMode ? 'hover:bg-slate-800/50 transition-colors' : 'hover:bg-slate-100/70 transition-colors'}
                      >
                        {/* Date */}
                        <td
                          style={{ width: `${columnWidths.date || DEFAULT_COLUMN_WIDTHS.date}px` }}
                          className={`px-4 py-3 whitespace-nowrap text-xs font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}
                        >
                          {ent.date}
                        </td>

                        {/* Staff / Team Member */}
                        <td
                          style={{ width: `${columnWidths.staffName || DEFAULT_COLUMN_WIDTHS.staffName}px` }}
                          className={`px-4 py-3 text-xs font-medium break-words ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}
                          title={ent.staffName}
                        >
                          {ent.staffName}
                        </td>

                        {/* Project Name (Fully spelled out, wrapped cleanly without clipping) */}
                        <td
                          style={{ width: `${columnWidths.project || DEFAULT_COLUMN_WIDTHS.project}px` }}
                          className={`px-4 py-3 text-xs font-semibold break-words ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}
                          title={proj?.name || 'Unknown Project'}
                        >
                          {proj?.name || 'Unknown Project'}
                          {proj?.client && (
                            <span className={`block text-[10px] font-normal ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                              {proj.client}
                            </span>
                          )}
                        </td>

                        {/* Operation Stage */}
                        <td
                          style={{ width: `${columnWidths.operation || DEFAULT_COLUMN_WIDTHS.operation}px` }}
                          className={`px-4 py-3 text-xs font-medium break-words ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}
                          title={op?.name || 'Unknown Operation'}
                        >
                          {op?.name || 'Unknown Operation'}
                        </td>

                        {/* Boxes */}
                        <td
                          style={{ width: `${columnWidths.boxes || DEFAULT_COLUMN_WIDTHS.boxes}px` }}
                          className="px-4 py-3 text-xs text-right font-medium"
                        >
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-mono">
                            {ent.boxes}
                          </span>
                        </td>

                        {/* Files */}
                        <td
                          style={{ width: `${columnWidths.files || DEFAULT_COLUMN_WIDTHS.files}px` }}
                          className="px-4 py-3 text-xs text-right font-medium"
                        >
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 font-mono">
                            {ent.files}
                          </span>
                        </td>

                        {/* Pages */}
                        <td
                          style={{ width: `${columnWidths.pages || DEFAULT_COLUMN_WIDTHS.pages}px` }}
                          className="px-4 py-3 text-xs text-right font-bold"
                        >
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 font-mono">
                            {ent.pages.toLocaleString()}
                          </span>
                        </td>

                        {/* Notes */}
                        <td
                          style={{ width: `${columnWidths.notes || DEFAULT_COLUMN_WIDTHS.notes}px` }}
                          className={`px-4 py-3 text-xs break-words ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}
                          title={ent.notes || 'No notes'}
                        >
                          {ent.notes || '—'}
                        </td>

                        {/* Custom CMS Fields */}
                        {customFieldEntries.map(([cfId]) => {
                          const cfVal = ent.customFieldValues?.[cfId];
                          const displayVal = cfVal !== undefined && cfVal !== null && cfVal !== '' ? String(cfVal) : '—';
                          const cfColWidth = columnWidths[`cf_${cfId}`] || 140;

                          return (
                            <td
                              key={cfId}
                              style={{ width: `${cfColWidth}px` }}
                              className={`px-4 py-3 text-xs break-words ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}
                              title={displayVal}
                            >
                              {displayVal}
                            </td>
                          );
                        })}

                        {/* Action - View Details */}
                        <td
                          style={{ width: `${columnWidths.actions || DEFAULT_COLUMN_WIDTHS.actions}px` }}
                          className="px-4 py-3 text-center"
                        >
                          <button
                            onClick={() => setViewingEntry(ent)}
                            className={`p-1.5 rounded-lg transition-colors inline-flex items-center justify-center ${
                              darkMode
                                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                            }`}
                            title="View Full Record Details"
                          >
                            <Eye className="w-4 h-4 text-emerald-400" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Entry Details Modal */}
      {viewingEntry && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'} border rounded-3xl max-w-lg w-full p-8 relative`}>
            <button
              onClick={() => setViewingEntry(null)}
              className={`absolute top-5 right-5 p-2 rounded-xl ${darkMode ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-600 hover:text-slate-900 bg-slate-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Operation Shift Entry Details</h3>
            <div className={`space-y-3 p-5 rounded-2xl border text-sm ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Date:</span>
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{viewingEntry.date}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Team Member / Staff:</span>
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{viewingEntry.staffName}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Project Name:</span>
                <span className="font-semibold text-emerald-500">
                  {projects.find((p) => p.id === viewingEntry.projectId)?.name || 'Project'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Operation Stage:</span>
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {projects
                    .find((p) => p.id === viewingEntry.projectId)
                    ?.operations?.find((o) => o.id === viewingEntry.operationId)?.name || 'Operation'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Boxes:</span>
                <span className="font-semibold text-amber-500">{viewingEntry.boxes}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Files:</span>
                <span className="font-semibold text-blue-500">{viewingEntry.files}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Pages:</span>
                <span className="font-semibold text-emerald-500">{viewingEntry.pages.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Notes:</span>
                <span className={`break-words text-right max-w-xs ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                  {viewingEntry.notes || 'None'}
                </span>
              </div>

              {viewingEntry.customFieldValues && Object.keys(viewingEntry.customFieldValues).length > 0 && (
                <div className="pt-3 mt-3 border-t border-slate-800 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Custom CMS Fields</span>
                  {(() => {
                    const entProj = projects.find((p) => p.id === viewingEntry.projectId);
                    return Object.entries(viewingEntry.customFieldValues).map(([cfId, val]) => {
                      const cfDef = entProj?.customFields?.find((f) => f.id === cfId);
                      const label = cfDef?.label || cfId;
                      return (
                        <div key={cfId} className="flex justify-between text-xs">
                          <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>{label}:</span>
                          <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{String(val) || '—'}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingEntry(null)}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
