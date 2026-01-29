import React, { useState } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { DomainData, DateRange } from '../types';
import KPI from './KPI';
import DateFilter from './DateFilter';
import DataTable from './DataTable';
import InsightTable from './InsightTable';
import { GenericBarChart, GenericPieChart, DailyTrendChart, DiscountRevenueChart } from './charts/GenericCharts';
import { RevenueIcon, DeliveredIcon, CancelledIcon, OrdersIcon, UniqueCustomerIcon, ReturnIcon, AvgOrderIcon } from './Icons';

const NoDataPlaceholder = ({ domain }: { domain: string }) => (
    <div className="flex flex-col items-center justify-center h-[500px] text-center bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-3xl p-12">
        <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-slate-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        </div>
        <h2 className="text-3xl font-black text-white mb-3">Intelligence Awaits</h2>
        <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
            {domain === 'All Domains' 
                ? 'Integrate your first sales domain to begin visualizing real-time metrics and AI-driven growth insights.' 
                : `The data engine is ready for ${domain}. Please provide an Excel or CSV file to initiate the visualization.`}
        </p>
        <p className="mt-8 text-xs font-bold text-slate-600 uppercase tracking-widest">Step 1: Click "Upload New Data" in the header</p>
    </div>
);

const kpiIcons: { [key: string]: React.ReactNode } = {
    "Total Revenue": <RevenueIcon />,
    "Total Delivered Orders": <DeliveredIcon />,
    "Total Cancelled Orders": <CancelledIcon />,
    "Total Orders": <OrdersIcon />,
    "Total Customers": <UniqueCustomerIcon />,
    "Avg Order": <RevenueIcon />,
    "Total Returns Created": <ReturnIcon />,
    "Total Return Value": <RevenueIcon />,
};

interface DashboardPageProps {
  domain: string;
  domainData: DomainData | null;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ domain, domainData }) => {
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  
  const { 
    kpis, filteredData, availableBrands, 
    topBrandsByRevenue, topCancellationReasons, orderStatusDistribution,
    courierUsageShare, dailyOrderVolume, topCitiesByOrderCount,
    topSkusByOrders, topArticleTypesByOrders, discountVsRevenue,
    orderCountByState, topCitiesByRevenue
  } = useDashboardData(domainData, dateRange, selectedBrand);

  if (!domainData || !domainData.data.length) {
    return <NoDataPlaceholder domain={domain} />;
  }

  // Helper to check if KPI has a meaningful value
  const hasValue = (val: string | number) => {
    if (typeof val === 'string') {
        const numeric = val.replace(/[^0-9.-]+/g, "");
        return numeric !== "" && parseFloat(numeric) !== 0;
    }
    return val !== 0;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-sm font-bold text-blue-500 uppercase tracking-[0.3em]">Operational Overview</h2>
          <p className="text-white/60 text-xs mt-1">Real-time analysis across integrated platforms.</p>
        </div>
        <div className="flex items-center gap-3">
          {availableBrands.length > 0 && (
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all w-full md:w-auto"
            >
              <option value="All Brands">Filter by Brand</option>
              {availableBrands.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          )}
          <DateFilter setDateRange={setDateRange} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.filter(kpi => hasValue(kpi.value)).map((kpi) => (
          <KPI key={kpi.title} title={kpi.title} value={kpi.value} icon={kpiIcons[kpi.title]} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {dailyOrderVolume.length > 0 && (
          <div className="lg:col-span-12 bg-slate-900/40 backdrop-blur-sm p-8 rounded-3xl border border-slate-800">
            <DailyTrendChart data={dailyOrderVolume} title="Transaction Momentum" dataKey="count" color="#3b82f6" />
          </div>
        )}
        
        {topBrandsByRevenue.length > 0 && (
          <div className="lg:col-span-6 bg-slate-900/40 backdrop-blur-sm p-8 rounded-3xl border border-slate-800">
            <GenericBarChart data={topBrandsByRevenue} title="Top Brand Performance" dataKey="value" color="#10b981" formatAsCurrency={true}/>
          </div>
        )}
        
        {topCancellationReasons.length > 0 && (
          <div className="lg:col-span-6 bg-slate-900/40 backdrop-blur-sm p-8 rounded-3xl border border-slate-800">
            <GenericBarChart data={topCancellationReasons} title="Churn Analysis" dataKey="value" color="#f59e0b"/>
          </div>
        )}

        {orderStatusDistribution.length > 0 && (
          <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-sm p-8 rounded-3xl border border-slate-800">
              <GenericPieChart data={orderStatusDistribution} title="Fullfillment Health" />
          </div>
        )}

        {courierUsageShare.length > 0 && (
          <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-sm p-8 rounded-3xl border border-slate-800">
              <GenericPieChart data={courierUsageShare} title="Courier Distribution" />
          </div>
        )}
        
        {topCitiesByOrderCount.length > 0 && (
          <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-sm p-8 rounded-3xl border border-slate-800">
              <GenericBarChart data={topCitiesByOrderCount} title="Geographic Density" dataKey="value" color="#ec4899" />
          </div>
        )}

        {topSkusByOrders.length > 0 && (
          <div className="lg:col-span-6 bg-slate-900/40 backdrop-blur-sm p-8 rounded-3xl border border-slate-800">
            <GenericBarChart data={topSkusByOrders} title="Top Performing SKUs" dataKey="value" color="#6366f1" />
          </div>
        )}

        {topArticleTypesByOrders.length > 0 && (
          <div className="lg:col-span-6 bg-slate-900/40 backdrop-blur-sm p-8 rounded-3xl border border-slate-800">
            <GenericBarChart data={topArticleTypesByOrders} title="Article Categories" dataKey="value" color="#06b6d4" />
          </div>
        )}

        {discountVsRevenue.length > 0 && (
          <div className="lg:col-span-12 bg-slate-900/40 backdrop-blur-sm p-8 rounded-3xl border border-slate-800">
            <DiscountRevenueChart data={discountVsRevenue} title="Revenue vs. Margin Analysis" />
          </div>
        )}
        
        {orderCountByState.length > 0 && (
          <div className="lg:col-span-12 bg-slate-900/40 backdrop-blur-sm p-8 rounded-3xl border border-slate-800">
              <GenericBarChart data={orderCountByState} title="State-wise Distribution" dataKey="value" color="#f97316" layout="horizontal" />
          </div>
        )}

        {topCitiesByRevenue.length > 0 && (
          <div className="lg:col-span-6 bg-slate-900/40 backdrop-blur-sm p-8 rounded-3xl border border-slate-800">
            <InsightTable 
              data={topCitiesByRevenue} 
              title="Revenue Leaderboard: Cities"
              columns={[{header: 'City', accessor: 'name'}, {header: 'Total Revenue', accessor: 'value', format: 'currency'}]}
            />
          </div>
        )}
        
        {topCancellationReasons.length > 0 && (
          <div className="lg:col-span-6 bg-slate-900/40 backdrop-blur-sm p-8 rounded-3xl border border-slate-800">
            <InsightTable 
              data={topCancellationReasons} 
              title="Logistics Friction Points"
              columns={[{header: 'Reason', accessor: 'name'}, {header: 'Incidents', accessor: 'value'}]}
            />
          </div>
        )}

      </div>
      
      {filteredData.length > 0 && (
        <div className="bg-slate-900/40 backdrop-blur-sm p-8 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="mb-6">
            <h3 className="text-xl font-black text-white">Consolidated Raw Feed</h3>
            <p className="text-slate-500 text-sm mt-1">Audit-ready granular transaction records.</p>
          </div>
          <DataTable data={filteredData} />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;