import React from 'react';
import { GenericBarChart } from './GenericCharts';

interface TopItemsChartProps {
  data: any[];
}

export const TopItemsChart: React.FC<TopItemsChartProps> = ({ data }) => {
  return (
    <GenericBarChart 
      data={data} 
      title="Top Selling Items by Revenue" 
      dataKey="value" 
      color="#8884d8"
      formatAsCurrency={true}
    />
  );
};
