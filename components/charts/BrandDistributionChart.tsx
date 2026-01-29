import React from 'react';
import { GenericPieChart } from './GenericCharts';

interface BrandDistributionChartProps {
  data: any[];
}

export const BrandDistributionChart: React.FC<BrandDistributionChartProps> = ({ data }) => {
  return (
    <GenericPieChart 
      data={data} 
      title="Brand Distribution" 
    />
  );
};
