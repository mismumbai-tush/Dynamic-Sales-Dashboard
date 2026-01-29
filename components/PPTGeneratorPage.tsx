import React, { useState, useMemo } from 'react';
import { AllData, PptSlide, DomainData } from '../types';
import { useDashboardData } from '../hooks/useDashboardData';
import { generatePptInsights } from '../utils/gemini';
import PresentationView from './PresentationView';

interface PPTGeneratorPageProps {
  allData: AllData;
  domains: string[];
}

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthAbbreviations = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


// FIX: Removed apiKey prop. Gemini API calls will use environment variables directly.
const PPTGeneratorPage: React.FC<PPTGeneratorPageProps> = ({ allData, domains }) => {
  const [selectedDomain, setSelectedDomain] = useState(domains[0]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [pageLimit, setPageLimit] = useState(5);
  const [generatedPpt, setGeneratedPpt] = useState<PptSlide[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    // FIX: Explicitly type domainData to correct type inference issue.
    Object.values(allData).forEach((domainData: DomainData) => {
        if (domainData?.data && domainData.mapping.date) {
            domainData.data.forEach(item => {
                const date = new Date(item[domainData.mapping.date!] as string);
                if (!isNaN(date.getTime())) yearSet.add(date.getFullYear());
            });
        }
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [allData]);

  const domainDataForPeriod = useMemo(() => {
    if (!selectedYear || !selectedMonth) return null;

    const yearNum = parseInt(selectedYear, 10);
    const isAllMonths = selectedMonth === '-1';
    const monthNum = isAllMonths ? 0 : parseInt(selectedMonth, 10);
    
    const startDate = new Date(yearNum, monthNum, 1);
    const endDate = isAllMonths 
        ? new Date(yearNum, 11, 31, 23, 59, 59, 999) 
        : new Date(yearNum, monthNum + 1, 0, 23, 59, 59, 999);

    // FIX: Ensure dataToProcess is always of type AllData to prevent type widening.
    let dataToProcess: AllData = allData;
    if (selectedDomain !== 'All Domains') {
        const domainData = allData[selectedDomain];
        dataToProcess = domainData ? { [selectedDomain]: domainData } : {};
    }
    
    const consolidatedData = Object.values(dataToProcess).flatMap(d => d?.data || []);
    const anyMapping = Object.values(dataToProcess).find(d => d?.mapping)?.mapping;
    if (!anyMapping?.date || consolidatedData.length === 0) return null;

    const filteredData = consolidatedData.filter(row => {
        const date = new Date(row[anyMapping.date!] as string);
        return !isNaN(date.getTime()) && date >= startDate && date <= endDate;
    });

    return { data: filteredData, mapping: anyMapping };
  }, [selectedDomain, selectedYear, selectedMonth, allData]);

  // FIX: Destructure all required values from useDashboardData, including topCities and brandDistribution, to resolve property access errors.
  const { kpis, topItems, brandDistribution, topCities } = useDashboardData(domainDataForPeriod, { start: null, end: null }, 'All Brands');

  const handleGenerate = async () => {
    if (!domainDataForPeriod || !domainDataForPeriod.data.length) {
        setError("No data available for the selected period. Please choose a different period or domain.");
        return;
    }
    setError(null);
    setIsLoading(true);
    setGeneratedPpt(null);

    const monthName = selectedMonth === '-1' ? 'All Months' : months[parseInt(selectedMonth)];

    try {
        const ppt = await generatePptInsights(
            kpis, topItems, topCities, 
            selectedDomain, monthName, parseInt(selectedYear)
        );
        setGeneratedPpt(ppt);
    } catch (err: any) {
        setError(err.message || 'Failed to generate presentation.');
    } finally {
        setIsLoading(false);
    }
  };

  const commonInputStyles = "bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-200 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";
  
  return (
    <div className="space-y-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Presentation Settings</h3>
            <div className="flex flex-wrap items-center gap-4">
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
                 <button 
                    onClick={handleGenerate} 
                    disabled={isLoading || !selectedDomain || !selectedYear || !selectedMonth}
                    className="px-5 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Generating...' : 'Generate Presentation'}
                </button>
            </div>
             {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
        </div>

        {generatedPpt && (
            <PresentationView 
                slides={generatedPpt}
                // FIX: Pass all required chart data, including brandDistribution and topCities, to the PresentationView component.
                chartData={{ topItems, brandDistribution, topCities }}
            />
        )}
    </div>
  );
};

export default PPTGeneratorPage;
