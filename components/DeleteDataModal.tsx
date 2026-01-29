import React, { useState, useMemo } from 'react';
import { AllData } from '../types';

interface DeleteDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (domain: string, year: number, month: number) => void;
  allData: AllData;
  domains: string[];
}

const monthAbbreviations = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


const DeleteDataModal: React.FC<DeleteDataModalProps> = ({ isOpen, onClose, onDelete, allData, domains }) => {
  const [selectedDomain, setSelectedDomain] = useState(domains[0]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    const dataToScan = selectedDomain === 'All Domains' ? Object.values(allData) : [allData[selectedDomain]];
    dataToScan.forEach(domainData => {
        if (domainData?.data && domainData.mapping.date) {
            domainData.data.forEach(item => {
                const date = new Date(item[domainData.mapping.date!] as string);
                if (!isNaN(date.getTime())) yearSet.add(date.getFullYear());
            });
        }
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

  if (!isOpen) return null;

  const commonInputStyles = "w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-200 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="relative w-full max-w-lg p-6 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">Delete Sales Data</h2>
        <p className="text-sm text-gray-400 mb-4">Select the specific period and domain for which you want to delete data. This action is irreversible.</p>
        <div className="space-y-4">
            <select value={selectedDomain} onChange={e => setSelectedDomain(e.target.value)} className={commonInputStyles}>
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className={commonInputStyles}>
              <option value="">Select Year</option>
              {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className={commonInputStyles} disabled={!selectedYear}>
              <option value="">Select Month</option>
              {monthAbbreviations.map((month, index) => <option key={month} value={index}>{month}</option>)}
              <option value="-1">All Months</option>
            </select>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleDelete}
            disabled={!selectedDomain || !selectedYear || !selectedMonth}
            className="w-full px-4 py-3 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Delete Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDataModal;