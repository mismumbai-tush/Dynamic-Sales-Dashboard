import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './Sidebar';
import DashboardPage from './DashboardPage';
import UploadModal from './UploadModal';
import DeleteDataModal from './DeleteDataModal';
import PPTGeneratorPage from './PPTGeneratorPage';
import { AllData, DomainData, OrderData, ColumnMapping } from '../types';
import { supabase, fetchAllSalesData, saveDomainData } from '../utils/supabase';

interface DashboardLayoutProps {
  onLogout: () => void;
}

type View = 'Dashboard' | 'PPT';

function robustParseDate(dateValue: any): Date | null {
    if (!dateValue) return null;
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) return dateValue;
    let date = new Date(dateValue);
    if (!isNaN(date.getTime())) return date;
    const s = String(dateValue);
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

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onLogout }) => {
  const UPLOAD_DOMAINS = ["Myntra", "Amazon", "Flipkart", "AJIO", "Shopify"];
  const SIDEBAR_DOMAINS = ["All Domains", ...UPLOAD_DOMAINS];

  const [activeDomain, setActiveDomain] = useState(SIDEBAR_DOMAINS[0]);
  const [allData, setAllData] = useState<AllData>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('Dashboard');
  const [uploadSummary, setUploadSummary] = useState<{ domain: string; added: number; duplicates: number } | null>(null);

  // Load from Supabase on start
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAllSalesData();
        setAllData(data);
      } catch (err) {
        console.error("Failed to fetch data from Supabase, falling back to local storage", err);
        const savedData = localStorage.getItem('salesDashboardData');
        if (savedData) setAllData(JSON.parse(savedData));
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadData();
  }, []);

  const handleFileUpload = async (domain: string, newData: OrderData[], newMapping: ColumnMapping) => {
    const existingDomainData = allData[domain];
    const existingData = existingDomainData?.data || [];

    const rowToString = (row: OrderData): string => {
      return JSON.stringify(Object.entries(row).sort((a, b) => a[0].localeCompare(b[0])));
    };

    const allKnownRows = new Set(existingData.map(rowToString));
    let duplicateCount = 0;

    const uniqueNewData = newData.filter(row => {
      const rowString = rowToString(row);
      if (allKnownRows.has(rowString)) {
        duplicateCount++;
        return false; 
      }
      allKnownRows.add(rowString); 
      return true;
    });

    const consolidatedData = [...existingData, ...uniqueNewData];
    const newDomainState = { data: consolidatedData, mapping: newMapping };

    try {
      // Logic in saveDomainData handles lowercase table names
      await saveDomainData(domain, newDomainState);
      setAllData(prev => ({ ...prev, [domain]: newDomainState }));
      setUploadSummary({ domain, added: uniqueNewData.length, duplicates: duplicateCount });
      setTimeout(() => setUploadSummary(null), 8000);
      setActiveDomain(domain);
      setCurrentView('Dashboard');
    } catch (err) {
      alert(`Failed to save data to Supabase table for ${domain}. Please ensure the table exists.`);
    }
  };

  const handleDataDelete = async (domain: string, year: number, month: number) => {
    const domainsToPurge = domain === 'All Domains' ? Object.keys(allData) : [domain];
    const nextAllData = { ...allData };

    for (const dom of domainsToPurge) {
      const domainState = nextAllData[dom];
      if (!domainState) continue;

      const { data, mapping } = domainState;
      const dateKey = mapping.date || Object.keys(data[0] || {}).find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('on'));
      
      if (!dateKey) continue;

      const newData = data.filter(row => {
        const date = robustParseDate(row[dateKey]);
        if (!date) return true;
        const matchesYear = date.getFullYear() === year;
        const matchesMonth = month === -1 ? true : date.getMonth() === month;
        return !(matchesYear && matchesMonth);
      });

      nextAllData[dom] = { ...domainState, data: newData };
      try {
        await saveDomainData(dom, nextAllData[dom]);
      } catch (err) {
        console.error(`Failed to update table for ${dom} after purge`, err);
      }
    }

    setAllData(nextAllData);
  };

  const currentDomainData = useMemo<DomainData | null>((() => {
    if (activeDomain === 'All Domains') {
      const allDomainValues = Object.values(allData).filter((d: any): d is DomainData => !!d?.data?.length);
      if (allDomainValues.length === 0) return null;

      const standardKeys: (keyof ColumnMapping)[] = [
        'date', 'customer', 'item', 'quantity', 'price', 'city', 'state', 
        'zipcode', 'revenue', 'brand', 'orderStatus', 'cancellationReason', 
        'courier', 'sku', 'articleType', 'discount', 'deliveredDate', 'cancelledDate', 'returnDate', 'orderId'
      ];
      
      const consolidatedData: OrderData[] = allDomainValues.flatMap(domainState => {
        const { data, mapping } = domainState;
        return data.map(row => {
          const normalizedRow: OrderData = {};
          for (const key of standardKeys) {
            const mappedKey = mapping[key];
            if (mappedKey && row[mappedKey] !== undefined && row[mappedKey] !== null) {
              normalizedRow[key] = row[mappedKey];
            } else {
              normalizedRow[key] = null;
            }
          }
          if (normalizedRow['revenue'] === null && normalizedRow['price'] !== null && normalizedRow['quantity'] !== null) {
              const price = Number(normalizedRow['price']);
              const quantity = Number(normalizedRow['quantity']);
              if (!isNaN(price) && !isNaN(quantity)) normalizedRow['revenue'] = price * quantity;
          }
          return normalizedRow;
        });
      });
      
      const consolidatedMapping: ColumnMapping = {
        date: 'date', customer: 'customer', item: 'item', quantity: 'quantity', 
        price: 'price', city: 'city', state: 'state', zipcode: 'zipcode', 
        revenue: 'revenue', brand: 'brand', orderStatus: 'orderStatus', 
        cancellationReason: 'cancellationReason', courier: 'courier', sku: 'sku', 
        articleType: 'articleType', discount: 'discount',
        deliveredDate: 'deliveredDate', cancelledDate: 'cancelledDate', returnDate: 'returnDate', orderId: 'orderId'
      };

      return { data: consolidatedData, mapping: consolidatedMapping };
    }
    return allData[activeDomain] || null;
  }), [activeDomain, allData]);

  if (isInitialLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Multi-Table Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar 
        domains={SIDEBAR_DOMAINS} 
        activeDomain={activeDomain} 
        setActiveDomain={setActiveDomain} 
        onLogout={onLogout}
        setCurrentView={setCurrentView}
        activeView={currentView}
        openDeleteModal={() => setIsDeleteModalOpen(true)}
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col relative">
        {uploadSummary && (
          <div className="fixed top-6 right-6 z-[60] animate-in slide-in-from-right fade-in duration-300">
            <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-xl flex items-start gap-4 max-w-sm">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 w-5 h-5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Cloud Sync Success: {uploadSummary.domain}</h4>
                <p className="text-slate-400 text-xs mt-1">Saved to <span className="text-blue-400 font-mono">supabase.{uploadSummary.domain.toLowerCase()}</span></p>
                <p className="text-slate-400 text-xs mt-1">Successfully added <span className="text-blue-400 font-bold">{uploadSummary.added}</span> unique records.</p>
                {uploadSummary.duplicates > 0 && (
                  <p className="text-amber-400 text-xs mt-1 font-medium">Filtered <span className="font-bold">{uploadSummary.duplicates}</span> duplicates.</p>
                )}
              </div>
              <button onClick={() => setUploadSummary(null)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          </div>
        )}

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-white">
            {currentView === 'Dashboard' ? `${activeDomain} Dashboard` : 'PPT Generator'}
          </h1>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-2.5 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors duration-300"
          >
            Upload New Data
          </button>
        </header>
        <div className="flex-1">
          {currentView === 'Dashboard' ? (
            <DashboardPage key={activeDomain} domain={activeDomain} domainData={currentDomainData} />
          ) : (
            <PPTGeneratorPage allData={allData} domains={SIDEBAR_DOMAINS} />
          )}
        </div>
      </main>
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleFileUpload}
        domains={UPLOAD_DOMAINS}
      />
      <DeleteDataModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDataDelete}
        allData={allData}
        domains={UPLOAD_DOMAINS}
      />
    </div>
  );
};

export default DashboardLayout;
