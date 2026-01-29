import React, { useState, useEffect, useRef } from 'react';
import { DateRangePicker } from 'react-date-range';
import { DateRange } from '../types';

interface DateFilterProps {
  setDateRange: (range: DateRange) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ setDateRange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAllTime, setIsAllTime] = useState(true);
  const [selection, setSelection] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }
  ]);
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleSelect = (ranges: any) => {
    const { selection } = ranges;
    setSelection([selection]);
    const startDate = selection.startDate;
    const endDate = selection.endDate;
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    setDateRange({ start: startDate, end: endDate });
    setIsAllTime(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const clearFilter = () => {
    const today = new Date();
    setSelection([{ startDate: today, endDate: today, key: 'selection' }]);
    setDateRange({ start: null, end: null });
    setIsAllTime(true);
    setIsOpen(false);
  };


  return (
    <div className="relative" ref={pickerRef}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-sm text-gray-200 focus:ring-blue-500 focus:border-blue-500 w-64 text-left"
        >
          {isAllTime ? 'All Time' : `${formatDate(selection[0].startDate)} to ${formatDate(selection[0].endDate)}`}
        </button>
        <button onClick={clearFilter} className="px-3 py-1.5 text-sm bg-gray-600 text-gray-200 rounded-md hover:bg-gray-500 transition-colors">
          Clear
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-10">
          <DateRangePicker
            ranges={selection}
            onChange={handleSelect}
            months={2}
            direction="horizontal"
            showDateDisplay={false}
          />
        </div>
      )}
    </div>
  );
};

export default DateFilter;