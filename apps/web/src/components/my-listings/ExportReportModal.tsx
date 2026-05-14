'use client';

import { X, Download, FileText, FileSpreadsheet, File, Calendar, Check } from 'lucide-react';
import { useState } from 'react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportReportModal({ isOpen, onClose }: ExportReportModalProps) {
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [dateRange, setDateRange] = useState('year');
  const [includeSections, setIncludeSections] = useState({
    overview: true,
    listings: true,
    sales: true,
    revenue: true,
    clients: true,
    performance: true,
  });
  const [exporting, setExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setExporting(false);
    setExportComplete(true);
    setTimeout(() => {
      setExportComplete(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  const formats = [
    { value: 'pdf', label: 'PDF Document', icon: FileText, description: 'Best for sharing and printing' },
    { value: 'excel', label: 'Excel Spreadsheet', icon: FileSpreadsheet, description: 'Best for data analysis' },
    { value: 'csv', label: 'CSV File', icon: File, description: 'Best for importing to other tools' },
  ];

  const dateRanges = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Export Report</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {exportComplete ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Complete!</h3>
            <p className="text-gray-600">Your report has been downloaded</p>
          </div>
        ) : (
          <>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Export Format</label>
                  <div className="space-y-2">
                    {formats.map((f) => {
                      const Icon = f.icon;
                      return (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => setFormat(f.value as 'pdf' | 'excel' | 'csv')}
                          className={`w-full p-4 border rounded-lg flex items-center gap-4 transition-all ${
                            format === f.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            format === f.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-gray-900">{f.label}</div>
                            <div className="text-sm text-gray-600">{f.description}</div>
                          </div>
                          {format === f.value && (
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {dateRanges.map((range) => (
                      <option key={range.value} value={range.value}>{range.label}</option>
                    ))}
                  </select>
                </div>

                {dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="date" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="date" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Include Sections</label>
                  <div className="space-y-2">
                    {Object.entries(includeSections).map(([key, value]) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setIncludeSections({ ...includeSections, [key]: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="flex-1 text-sm font-medium text-gray-900 capitalize">{key}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">Report will be downloaded as {format.toUpperCase()}</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={exporting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {exporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
