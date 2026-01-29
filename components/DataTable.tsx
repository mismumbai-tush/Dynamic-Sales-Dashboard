import React, { useState, useMemo, useEffect, useRef } from 'react';
import { OrderData } from '../types';
import { FilterIcon } from './Icons';

interface DataTableProps {
  data: OrderData[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 10;
  
  const headers = useMemo(() => Object.keys(data[0] || {}), [data]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setOpenFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredData = useMemo(() => {
    let dataToFilter = data;
    const activeFilters = Object.entries(filters).filter(([, value]) => value && String(value).trim() !== '');
    
    if (activeFilters.length === 0) {
      return dataToFilter;
    }

    return dataToFilter.filter(row => {
      return activeFilters.every(([key, value]) => {
        const rowValue = row[key];
        if (rowValue === null || rowValue === undefined) return false;
        return String(rowValue).toLowerCase().includes(String(value).toLowerCase());
      });
    });
  }, [data, filters]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, data]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);
  
  const handleFilterChange = (header: string, value: string) => {
    setFilters(prev => ({ ...prev, [header]: value }));
  };

  if (!data.length) {
    return <p className="text-gray-400 text-center py-8">No data available for the selected period.</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-300 uppercase bg-gray-700">
            <tr>
              {headers.map(header => (
                <th key={header} scope="col" className="px-6 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2 relative">
                    <span>{header.replace(/_/g, ' ')}</span>
                    <button 
                      onClick={() => setOpenFilter(openFilter === header ? null : header)}
                      className="p-1 rounded-full hover:bg-gray-600 transition-colors"
                      aria-label={`Filter by ${header}`}
                    >
                      <FilterIcon />
                    </button>
                    {openFilter === header && (
                      <div 
                        ref={filterMenuRef}
                        className="absolute top-full left-0 mt-2 p-2 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-20 w-48"
                      >
                        <input
                          type="text"
                          placeholder={`Filter...`}
                          value={filters[header] || ''}
                          onChange={e => handleFilterChange(header, e.target.value)}
                          className="w-full bg-gray-700 text-white text-sm rounded-md border-gray-500 focus:ring-blue-500 focus:border-blue-500 px-2 py-1"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr key={index} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                {headers.map(header => (
                  <td key={header} className="px-6 py-4 whitespace-nowrap">{String(row[header])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center pt-4">
        <span className="text-sm text-gray-400">
          Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredData.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length} entries
        </span>
        <div className="inline-flex mt-2 xs:mt-0">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-l hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">Prev</button>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium text-white bg-gray-600 border-0 border-l border-gray-700 rounded-r hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
