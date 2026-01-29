import React, { useState, useMemo, useEffect } from 'react';
import { AllData } from '../types';

interface DeleteDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (domain: string, year: number, month: number) => void;
  allData: AllData;
  domains: string[];
}

const monthAbbreviations = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Utility for robust date parsing to find available years/months
function robustParseDate(dateValue: any): Date | null {
    if (!dateValue) return null;
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) return dateValue;
    let date = new Date(dateValue);
    if (!isNaN(date.getTime())) return date;
    const s = String(dateValue);
    // Handle DD-MM-YYYY or DD/MM/YYYY
    const parts = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (parts) {
        const day = parseInt(parts[1], 10);
        const month = parseInt(parts[2], 10);
        let year = parseInt(parts[3], 10);
        if (year < 100) year += 2000;
        date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) return date;
    }
    return null;
}

const DeleteDataModal: React.FC<DeleteDataModalProps> = ({ isOpen, onClose, onDelete, allData, domains }) => {
  const domainOptions = ['All Domains', ...domains];
  const [selectedDomain, setSelectedDomain] = useState(domainOptions[0]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // Re-scan when domain changes
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    const domainsToScan = selectedDomain === 'All Domains' 
      ? Object.values(allData) 
      : [allData[selectedDomain]].filter(Boolean);

    domainsToScan.forEach(domainState => {
      if (!domainState?.data || !domainState.data.length) return;
      
      const { data, mapping } = domainState;
      // Use mapped date or find one manually
      const dateKey = mapping.date || Object.keys(data[0]).find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('on'));
      
      if (!dateKey) return;

      data.forEach(item => {
        const date = robustParseDate(item[dateKey]);
        if (date) yearSet.add(date.getFullYear());
      });
    });

    return Array.from(yearSet).sort((a, b) => b - a);
  }, [allData, selectedDomain]);

  const handleDelete = () => {
    if (!selectedDomain || !selectedYear || !selectedMonth) {
      alert("Please select a domain, year, and month to delete.");
      return;
    }
    const monthName = selectedMonth === '-1' ? `the entire year of` : monthAbbreviations[parseInt(selectedMonth)];
    const confirmationText = `Are you sure you want to delete all data for ${selectedDomain} in ${monthName} ${selectedYear}? This action cannot be undone.`;
    
    if (window.confirm(confirmationText)) {
        onDelete(selectedDomain, parseInt(selectedYear), parseInt(selectedMonth));
        onClose();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedYear('');
      setSelectedMonth('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const commonInputStyles = "w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-200 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="relative w-full max-w-lg p-6 bg-gray-800 border border-gray-700 rounded-lg shadow-xl animate-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">Purge Sales Data</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">Select the specific period and domain for which you want to delete data. This action is irreversible and persists across sessions.</p>
        
        <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Target Domain</label>
              <select value={selectedDomain} onChange={e => { setSelectedDomain(e.target.value); setSelectedYear(''); setSelectedMonth(''); }} className={commonInputStyles}>
                {domainOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Available Year</label>
                <select value={selectedYear} onChange={e => { setSelectedYear(e.target.value); setSelectedMonth(''); }} className={commonInputStyles} disabled={availableYears.length === 0}>
                  <option value="">{availableYears.length === 0 ? 'No Data Found' : '-- Select --'}</option>
                  {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Target Month</label>
                <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className={commonInputStyles} disabled={!selectedYear}>
                  <option value="">-- Select --</option>
                  {monthAbbreviations.map((month, index) => <option key={month} value={index}>{month}</option>)}
                  <option value="-1">All Months (Entire Year)</option>
                </select>
              </div>
            </div>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={handleDelete}
            disabled={!selectedDomain || !selectedYear || !selectedMonth}
            className="w-full px-4 py-4 font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg shadow-red-900/20 active:scale-[0.98]"
          >
            Permanently Purge Records
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDataModal;