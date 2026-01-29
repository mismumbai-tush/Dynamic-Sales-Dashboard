import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList, 
  PieChart, Pie, Cell, Legend, AreaChart, Area, ComposedChart, Line 
} from 'recharts';

const CustomTooltip = ({ active, payload, label, valueFormatter, isCurrency = false }: any) => {
    if (active && payload && payload.length) {
        const value = isCurrency ? `Rs. ${payload[0].value.toLocaleString('en-IN')}` : payload[0].value.toLocaleString('en-IN');
        return (
            <div className="bg-slate-950 p-4 border border-slate-700 rounded-2xl shadow-2xl">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">{payload[0].payload.name}</p>
                <p className="text-white text-lg font-black">{`${value}`}</p>
            </div>
        );
    }
    return null;
};

// --- Bar Chart ---
interface GenericBarChartProps {
  data: any[];
  title: string;
  dataKey: string;
  color: string;
  layout?: 'horizontal' | 'vertical';
  formatAsCurrency?: boolean;
}

export const GenericBarChart: React.FC<GenericBarChartProps> = ({ data, title, dataKey, color, layout = 'vertical', formatAsCurrency = false }) => {
  if (!BarChart || !data || !data.length) return <div className="text-center text-slate-500 py-12 font-bold uppercase tracking-widest text-xs">No data for {title}.</div>;
  
  const valueFormatter = (value: any) => formatAsCurrency ? `Rs. ${Number(value).toLocaleString('en-IN')}` : Number(value).toLocaleString('en-IN');

  return (
    <div className="w-full">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">{title}</h3>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout={layout} margin={layout === 'vertical' ? { top: 5, right: 40, left: 100, bottom: 5 } : { top: 5, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            {layout === 'vertical' ? (
                <>
                    <XAxis type="number" stroke="#475569" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} tickFormatter={valueFormatter} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#475569" width={100} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} interval={0} axisLine={false} tickLine={false} />
                </>
            ) : (
                <>
                    <XAxis dataKey="name" type="category" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} interval={0} angle={-45} textAnchor="end" height={100} axisLine={false} tickLine={false} />
                    <YAxis type="number" stroke="#475569" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} tickFormatter={valueFormatter} axisLine={false} tickLine={false} />
                </>
            )}
            <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} content={<CustomTooltip isCurrency={formatAsCurrency} />} />
            <Bar dataKey={dataKey} fill={color} radius={[0, 8, 8, 0]} barSize={20}>
               <LabelList dataKey={dataKey} position={layout === 'vertical' ? 'right' : 'top'} formatter={valueFormatter} style={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- Pie Chart ---
interface GenericPieChartProps {
    data: any[],
    title: string;
}
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
export const GenericPieChart: React.FC<GenericPieChartProps> = ({ data, title }) => {
    if (!PieChart || !data || !data.length) return <div className="text-center text-slate-500 py-12 font-bold uppercase tracking-widest text-xs">No data for {title}.</div>;

    const topData = data.slice(0, 5);
    if (data.length > 5) {
        const otherValue = data.slice(5).reduce((acc, item) => acc + item.value, 0);
        topData.push({ name: 'Others', value: otherValue });
    }

    return (
        <div className="w-full">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">{title}</h3>
            <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie 
                          data={topData} 
                          dataKey="value" 
                          nameKey="name" 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={80}
                          outerRadius={120} 
                          paddingAngle={5}
                          stroke="none"
                        >
                            {topData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


// --- Daily Trend Chart ---
interface DailyTrendChartProps {
    data: any[];
    title: string;
    dataKey: string;
    color: string;
}
export const DailyTrendChart: React.FC<DailyTrendChartProps> = ({ data, title, dataKey, color }) => {
  if (!AreaChart || !data || !data.length) return <div className="text-center text-slate-500 py-12 font-bold uppercase tracking-widest text-xs">No data for {title}.</div>;
  return (
    <div className="w-full">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">{title}</h3>
      <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" stroke="#475569" tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#475569" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#color-${dataKey})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- Discount vs Revenue Chart ---
interface DiscountRevenueChartProps {
    data: any[],
    title: string;
}
export const DiscountRevenueChart: React.FC<DiscountRevenueChartProps> = ({ data, title }) => {
  if (!ComposedChart || !data || !data.length) return <div className="text-center text-slate-500 py-12 font-bold uppercase tracking-widest text-xs">No data for {title}.</div>;
  return (
    <div className="w-full">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">{title}</h3>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{top: 20, right: 20, bottom: 80, left: 20}}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} angle={-45} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} tickFormatter={(v) => `Rs. ${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} tickFormatter={(v) => `${v.toFixed(1)}%`} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" iconType="circle" />
            <Bar dataKey="revenue" yAxisId="left" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} barSize={30} />
            <Line type="monotone" dataKey="avgDiscount" yAxisId="right" stroke="#10b981" strokeWidth={3} name="Avg Discount %" dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#020617' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};