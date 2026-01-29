import React from 'react';

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-blue-400">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const PresentationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
const LogOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>;

const domainLogos: Record<string, React.ReactNode> = {
  "All Domains": <HomeIcon />,
  "Myntra": (
    <div className="bg-white rounded-md p-1 flex items-center justify-center">
      <img src="https://www.vectorlogo.zone/logos/myntra/myntra-icon.svg" alt="Myntra" className="h-5 w-5 object-contain" />
    </div>
  ),
  "Amazon": (
    <div className="bg-white rounded-md p-1 flex items-center justify-center">
      <img src="https://www.vectorlogo.zone/logos/amazon/amazon-icon.svg" alt="Amazon" className="h-5 w-5 object-contain" />
    </div>
  ),
  "Flipkart": (
    <div className="bg-white rounded-md p-1 flex items-center justify-center">
      <img src="https://www.vectorlogo.zone/logos/flipkart/flipkart-icon.svg" alt="Flipkart" className="h-5 w-5 object-contain" />
    </div>
  ),
  "AJIO": (
    <div className="bg-white rounded-md p-1 flex items-center justify-center">
      <img src="https://www.vectorlogo.zone/logos/ajio/ajio-icon.svg" alt="AJIO" className="h-5 w-5 object-contain" />
    </div>
  ),
  "Shopify": (
    <div className="bg-white rounded-md p-1 flex items-center justify-center">
      <img src="https://www.vectorlogo.zone/logos/shopify/shopify-icon.svg" alt="Shopify" className="h-5 w-5 object-contain" />
    </div>
  ),
};

interface SidebarProps {
  domains: string[];
  activeDomain: string;
  setActiveDomain: (domain: string) => void;
  onLogout: () => void;
  setCurrentView: (view: 'Dashboard' | 'PPT') => void;
  activeView: 'Dashboard' | 'PPT';
  openDeleteModal: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ domains, activeDomain, setActiveDomain, onLogout, setCurrentView, activeView, openDeleteModal }) => {
  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col shadow-2xl">
      <div className="p-8 border-b border-slate-800 flex flex-col items-center gap-4">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <img 
            src="https://www.ginzalimited.com/cdn/shop/files/Ginza_logo.jpg?v=1668509673&width=500" 
            alt="GINZA Logo" 
            className="relative h-14 w-auto rounded-lg shadow-xl"
          />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-bold text-white tracking-tight leading-tight">Ginza Industries</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-blue-500 font-bold">Sales Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        <p className="px-3 pb-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Dashboards</p>
        {domains.map(domain => {
          const isActive = activeDomain === domain && activeView === 'Dashboard';
          return (
            <a
              key={domain}
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveDomain(domain); }}
              className={`group flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 relative ${isActive ? 'bg-blue-600/10 text-blue-400 shadow-sm' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              {isActive && <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full" />}
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-transform duration-200 group-hover:scale-110">
                  {domainLogos[domain] || <div className="w-8 h-8" />}
              </div>
              <span className="ml-3 tracking-wide">{domain}</span>
            </a>
          );
        })}

        <p className="px-3 pt-8 pb-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Strategy Tools</p>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); setCurrentView('PPT'); }}
          className={`group flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 relative ${activeView === 'PPT' ? 'bg-blue-600/10 text-blue-400 shadow-sm' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
        >
          {activeView === 'PPT' && <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full" />}
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
            <PresentationIcon />
          </div>
          <span className="ml-3 tracking-wide">AI Presentations</span>
        </a>
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-1">
        <button
          onClick={openDeleteModal}
          className="w-full flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <DeleteIcon /> <span className="ml-3">Purge Data</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition-all duration-200"
        >
          <LogOutIcon /> <span className="ml-3">End Session</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;