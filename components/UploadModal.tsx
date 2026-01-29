import React, { useState } from 'react';
import { analyzeCsvData } from '../utils/gemini';
import { OrderData, ColumnMapping } from '../types';

const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gray-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-400"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>;

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (domain: string, data: OrderData[], mapping: ColumnMapping) => void;
  domains: string[];
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadComplete, domains }) => {
  const [selectedDomain, setSelectedDomain] = useState(domains[0]);
  const [sourceType, setSourceType] = useState<'file' | 'url'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const resetState = () => {
    setFile(null);
    setUrl('');
    setIsLoading(false);
    setError(null);
    setStatusMessage(null);
    setSelectedDomain(domains[0]);
  };

  const handleClose = () => {
    if (isLoading) return;
    resetState();
    onClose();
  };

  const processData = async (data: OrderData[], domain: string) => {
    try {
      if (!data || data.length === 0) {
        throw new Error("The data source is empty. Please provide valid data.");
      }
      
      const headers = Object.keys(data[0]);
      setIsLoading(true);
      setStatusMessage("AI is analyzing data structure...");
      
      const mapping = await analyzeCsvData(headers, data.slice(0, 5));
      
      setStatusMessage("Cleaning and formatting records...");
      const numericMappingKeys: (keyof ColumnMapping)[] = ['quantity', 'price', 'revenue', 'discount'];
      const columnsToSanitize = numericMappingKeys
        .map(key => mapping[key])
        .filter((colName): colName is string => !!colName);

      const sanitizedData = data.map(row => {
        const newRow = { ...row };
        for (const colName of columnsToSanitize) {
          const rawValue = newRow[colName];
          if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') {
            newRow[colName] = null;
          } else {
            const cleanedValue = String(rawValue).replace(/[^0-9.-]+/g, "");
            const numericValue = parseFloat(cleanedValue);
            newRow[colName] = isNaN(numericValue) ? null : numericValue;
          }
        }
        return newRow;
      });

      setStatusMessage("Finalizing upload...");
      await onUploadComplete(domain, sanitizedData, mapping);
      handleClose();

    } catch (err: any) {
      console.error("Processing Error:", err);
      setError(err.message || 'An unknown error occurred during analysis.');
      setIsLoading(false);
      setStatusMessage(null);
    }
  };

  const handleFile = (selectedFile: File, domain: string) => {
    setIsLoading(true);
    setError(null);
    setStatusMessage("Reading file binary...");

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileData = e.target?.result;
        if (!fileData) throw new Error("Could not read file content.");

        let jsonData: OrderData[];
        const fileName = selectedFile.name.toLowerCase();

        if (fileName.endsWith('.csv')) {
          const results = window.Papa.parse(fileData as string, { header: true, skipEmptyLines: true });
          if (results.errors.length) throw new Error(`CSV Error: ${results.errors[0].message}`);
          jsonData = results.data as OrderData[];
        } else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
          const workbook = window.XLSX.read(fileData, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonData = window.XLSX.utils.sheet_to_json(worksheet, { cellDates: true }) as OrderData[];
        } else {
          throw new Error("Unsupported format. Use CSV or Excel.");
        }
        await processData(jsonData, domain);
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
        setStatusMessage(null);
      }
    };
    reader.onerror = () => {
        setError("Disk read error.");
        setIsLoading(false);
    };

    if (selectedFile.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(selectedFile);
    } else {
      reader.readAsBinaryString(selectedFile);
    }
  };

  const handleUrl = async (sourceUrl: string, domain: string) => {
    setIsLoading(true);
    setError(null);
    setStatusMessage(`Fetching remote data...`);
    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error(`Network Error: ${response.statusText}`);
      const jsonData: OrderData[] = await response.json();
      if (!Array.isArray(jsonData)) throw new Error("Remote data must be a JSON array.");
      await processData(jsonData, domain);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      setStatusMessage(null);
    }
  };

  const handleSubmit = () => {
    if (sourceType === 'file' && file) {
      handleFile(file, selectedDomain);
    } else if (sourceType === 'url' && url) {
      handleUrl(url, selectedDomain);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="relative w-full max-w-lg p-6 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-white" disabled={isLoading}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">Import Sales Data</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Target Domain</label>
            <select
              value={selectedDomain}
              onChange={e => setSelectedDomain(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <div className="flex border-b border-gray-600">
              <button onClick={() => setSourceType('file')} disabled={isLoading} className={`flex-1 py-2 text-sm font-medium ${sourceType === 'file' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>File Upload</button>
              <button onClick={() => setSourceType('url')} disabled={isLoading} className={`flex-1 py-2 text-sm font-medium ${sourceType === 'url' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>Remote URL</button>
            </div>
          </div>
          {sourceType === 'file' ? (
            <div className="mt-4 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <UploadIcon />
                  <div className="flex text-sm text-gray-400">
                    <label className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-blue-500">
                      <span>{file ? file.name : 'Choose file...'}</span>
                      <input type="file" className="sr-only" accept=".csv,.xls,.xlsx" onChange={e => setFile(e.target.files?.[0] || null)} disabled={isLoading} />
                    </label>
                  </div>
                </div>
            </div>
          ) : (
            <div className="mt-4">
              <input 
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                placeholder="https://api.example.com/data.json"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
          )}
          {error && <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs text-red-400 mt-4 leading-relaxed">{error}</div>}
          {statusMessage && <div className="flex items-center gap-3 justify-center text-sm text-blue-400 mt-4"><div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>{statusMessage}</div>}
        </div>
        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={isLoading || (!file && !url)}
            className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 transition-all"
          >
            {isLoading ? 'Processing...' : 'Process & Analyze Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;