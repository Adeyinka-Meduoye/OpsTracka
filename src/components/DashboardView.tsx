import React, { useState } from 'react';
import { Project, StaffEntry, User } from '../types';
import { LayoutDashboard, TrendingUp, Package, FileText, BookOpen, Shield, Filter, FileSpreadsheet, Calendar, Printer, FileDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { exportEntriesToCSV } from '../utils/exportCsv';
import { exportEntriesToPDF } from '../utils/exportPdf';
import { generateChartDataUrl } from '../utils/chartRenderer';

interface DashboardViewProps {
  projects: Project[];
  entries: StaffEntry[];
  users: User[];
  currentUser: User | null;
  darkMode?: boolean;
}

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

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    // Staff Name filter (for admin / team lead)
    if (!isStaff && selectedStaffName !== 'all' && e.staffName.toLowerCase() !== selectedStaffName.toLowerCase()) {
      return false;
    }

    // Project filter
    if (selectedProjectId !== 'all' && e.projectId !== selectedProjectId) {
      return false;
    }

    // Operation filter
    if (selectedOperationId !== 'all' && e.operationId !== selectedOperationId) {
      return false;
    }

    // Specific Date Picker Filter
    if (targetDate.trim()) {
      if (e.date !== targetDate.trim()) {
        return false;
      }
    }

    return true;
  });

  const totalBoxes = filteredEntries.reduce((a, b) => a + b.boxes, 0);
  const totalFiles = filteredEntries.reduce((a, b) => a + b.files, 0);
  const totalPages = filteredEntries.reduce((a, b) => a + b.pages, 0);

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

    // Collect all unique custom field labels across projects referenced in entries
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
    </div>
  );
};
