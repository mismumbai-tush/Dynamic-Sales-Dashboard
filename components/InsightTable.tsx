import React from 'react';

interface Column {
    header: string;
    accessor: string;
    format?: 'currency' | 'number';
}

interface InsightTableProps {
  data: any[];
  title: string;
  columns: Column[];
}

const InsightTable: React.FC<InsightTableProps> = ({ data, title, columns }) => {
    if (!data.length) {
        return null; // Don't show anything if no data
    }
    
    const formatValue = (value: any, format?: 'currency' | 'number') => {
        if (format === 'currency') return `Rs. ${Number(value).toLocaleString('en-IN')}`;
        if (format === 'number') return Number(value).toLocaleString('en-IN');
        return String(value);
    };

    return (
        <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">{title}</h3>
            <div className="overflow-y-auto max-h-96">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-slate-800 sticky top-0">
                        <tr>
                            {columns.map(col => (
                                <th key={col.accessor} scope="col" className="px-4 py-3 whitespace-nowrap font-bold tracking-wider">{col.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index} className="bg-slate-900 border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                {columns.map(col => (
                                    <td key={col.accessor} className="px-4 py-3 whitespace-nowrap font-medium">
                                        {formatValue(row[col.accessor], col.format)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InsightTable;