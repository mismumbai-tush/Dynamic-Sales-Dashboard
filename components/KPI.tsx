import React from 'react';

interface KPIProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
}

const KPI: React.FC<KPIProps> = ({ title, value, icon }) => (
  <div className="relative group overflow-hidden bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-2xl transition-all duration-300 hover:border-blue-500/30 hover:-translate-y-1 hover:shadow-blue-500/10">
    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-colors"></div>
    <div className="relative flex items-center">
      {icon && (
          <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-slate-800/80 rounded-2xl border border-white/5 shadow-inner">
              {icon}
          </div>
      )}
      <div className="ml-5">
          <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">{title}</h3>
          <p className="mt-1 text-3xl font-black text-white tracking-tight leading-none drop-shadow-sm">{value}</p>
      </div>
    </div>
  </div>
);

export default KPI;