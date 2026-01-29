import React from 'react';
import { PptSlide } from '../types';
import { TopItemsChart } from './charts/TopItemsChart';
import { BrandDistributionChart } from './charts/BrandDistributionChart';


interface PresentationViewProps {
  slides: PptSlide[];
  chartData: {
    topItems: any[];
    brandDistribution: any[];
    // FIX: Add topCities to the chartData type to allow passing city data for context, resolving the type error.
    topCities: any[];
  }
}

const ChartComponent = ({ type, data }: { type: string, data: any }) => {
    switch (type) {
        case 'TopItemsChart': return <TopItemsChart data={data.topItems} />;
        case 'BrandDistributionChart': return <BrandDistributionChart data={data.brandDistribution} />;
        default: return null;
    }
};


const PresentationView: React.FC<PresentationViewProps> = ({ slides, chartData }) => {
  return (
    <div className="space-y-8">
      {slides.map((slide, slideIndex) => (
        <div key={slideIndex} className="bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-lg flex flex-col min-h-[400px]">
          <h2 className="text-2xl font-bold text-blue-400 mb-6 border-b-2 border-gray-700 pb-3">{slide.slideTitle}</h2>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
            {slide.content.map((content, contentIndex) => (
              <div key={contentIndex} className={`${content.type === 'chart' ? 'md:col-span-2' : ''}`}>
                {content.title && <h3 className="text-xl font-semibold text-white mb-3">{content.title}</h3>}
                {content.text && <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{content.text}</p>}
                {content.chartType && <ChartComponent type={content.chartType} data={chartData} />}
              </div>
            ))}
          </div>
           <div className="text-right text-sm text-gray-500 mt-8 pt-4 border-t border-gray-700">Slide {slideIndex + 1} of {slides.length}</div>
        </div>
      ))}
    </div>
  );
};

export default PresentationView;
