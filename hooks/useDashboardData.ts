import { useMemo } from 'react';
import { DomainData, DateRange, OrderData, ColumnMapping, Kpi } from '../types';

const formatCurrency = (value: number, includePrefix = true) => {
    const formatted = value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return includePrefix ? `Rs. ${formatted}` : formatted;
};
const formatNumber = (value: number) => value.toLocaleString('en-IN');

const getRevenue = (item: OrderData, mapping: ColumnMapping): number => {
    if (mapping.revenue) {
        return Number(item[mapping.revenue]!) || 0;
    }
    if (mapping.price && mapping.quantity) {
        const quantity = Number(item[mapping.quantity]!) || 0;
        const price = Number(item[mapping.price]!) || 0;
        return quantity * price;
    }
    return 0;
};

function parseDate(dateValue: any): Date | null {
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
        date = new Date(Date.UTC(year, month - 1, day));
        if (!isNaN(date.getTime())) return date;
    }
    return null;
}

export const useDashboardData = (domainData: DomainData | null, dateRange: DateRange, selectedBrand: string) => {
  const availableBrands = useMemo(() => {
    if (!domainData?.data || !domainData.mapping?.brand) return [];
    const brandSet = new Set<string>();
    const { data, mapping } = domainData;
    data.forEach(item => {
      const brand = item[mapping.brand!];
      if (brand) brandSet.add(String(brand));
    });
    return Array.from(brandSet).sort();
  }, [domainData]);
  
  const filteredData = useMemo(() => {
    if (!domainData?.data || !domainData?.mapping) return [];
    let data = domainData.data;
    const { mapping } = domainData;

    if (mapping.brand && selectedBrand !== 'All Brands') {
      data = data.filter(order => String(order[mapping.brand!]) === selectedBrand);
    }

    if (!mapping.date || (!dateRange.start && !dateRange.end)) return data;
    
    if (dateRange.start && dateRange.end) {
        const startTime = dateRange.start.getTime();
        const endTime = dateRange.end.getTime();
        return data.filter(order => {
          const orderDate = parseDate(order[mapping.date!]);
          if (!orderDate) return false;
          const time = orderDate.getTime();
          return time >= startTime && time <= endTime;
        });
    }
    return data;
  }, [domainData, dateRange, selectedBrand]);

    const { returnCount, returnTotalValue } = useMemo(() => {
        const mapping = domainData?.mapping;
        if (!filteredData.length || !mapping?.returnDate) {
            return { returnCount: 0, returnTotalValue: 0 };
        }

        const returnRows = filteredData.filter(d => {
            const val = d[mapping.returnDate!];
            return val !== null && val !== undefined && String(val).trim() !== '';
        });
        
        const totalValue = returnRows.reduce((acc, order) => acc + getRevenue(order, mapping!), 0);

        return { returnCount: returnRows.length, returnTotalValue: totalValue };
    }, [filteredData, domainData?.mapping]);

    const totalCustomers = useMemo(() => {
        const mapping = domainData?.mapping;
        if (!filteredData.length || !mapping?.customer) return 0;
        return filteredData.filter(order => {
            const customer = order[mapping.customer!];
            return customer !== null && customer !== undefined && String(customer).trim() !== '';
        }).length;
    }, [filteredData, domainData?.mapping]);

    const totalOrdersCount = useMemo(() => {
        const mapping = domainData?.mapping;
        if (!filteredData.length) return 0;
        if (mapping?.orderId) {
            const orderIdSet = new Set<string | number | null>();
            filteredData.forEach(order => {
                const id = order[mapping.orderId!];
                if (id !== null && id !== undefined && String(id).trim() !== '') {
                    orderIdSet.add(id);
                }
            });
            return orderIdSet.size > 0 ? orderIdSet.size : filteredData.length;
        }
        return filteredData.length;
    }, [filteredData, domainData?.mapping]);

  const kpis = useMemo((): Kpi[] => {
    const mapping = domainData?.mapping;
    if (!filteredData.length || !mapping) return [];
    
    const totalRevenue = filteredData.reduce((acc, order) => acc + getRevenue(order, mapping), 0);
    
    const deliveredOrders = mapping.deliveredDate ? filteredData.filter(d => {
        const val = d[mapping.deliveredDate!];
        return val !== null && val !== undefined && String(val).trim() !== '';
    }).length : 0;

    const cancelledOrders = mapping.cancelledDate ? filteredData.filter(d => {
        const val = d[mapping.cancelledDate!];
        return val !== null && val !== undefined && String(val).trim() !== '';
    }).length : 0;

    const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    return [
      { title: "Total Revenue", value: formatCurrency(totalRevenue, false) },
      { title: "Total Delivered Orders", value: formatNumber(deliveredOrders) },
      { title: "Total Cancelled Orders", value: formatNumber(cancelledOrders) },
      { title: "Total Orders", value: formatNumber(totalOrdersCount) },
      { title: "Total Customers", value: formatNumber(totalCustomers) },
      { title: "Avg Order", value: formatCurrency(avgOrderValue, false) },
      { title: "Total Returns Created", value: formatNumber(returnCount) },
      { title: "Total Return Value", value: formatCurrency(returnTotalValue, false) },
    ];
  }, [filteredData, domainData?.mapping, totalCustomers, totalOrdersCount, returnCount, returnTotalValue]);

  const aggregateBy = (data: OrderData[], mapping: ColumnMapping | null, key: keyof ColumnMapping, aggFn: (current: number, item: OrderData) => number) => {
      if (!mapping || !mapping[key]) return [];
      const aggregation = new Map<string, number>();
      data.forEach(item => {
          const groupKey = String(item[mapping[key]!]);
          if (!groupKey || groupKey === 'null' || groupKey === 'undefined') return;
          const currentVal = aggregation.get(groupKey) || 0;
          aggregation.set(groupKey, aggFn(currentVal, item));
      });
      return Array.from(aggregation.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
  };
  
  const topBrandsByRevenue = useMemo(() => aggregateBy(filteredData, domainData?.mapping, 'brand', (curr, item) => curr + getRevenue(item, domainData!.mapping!)).slice(0, 10), [filteredData, domainData?.mapping]);
  const topCitiesByRevenue = useMemo(() => aggregateBy(filteredData, domainData?.mapping, 'city', (curr, item) => curr + getRevenue(item, domainData!.mapping!)).slice(0, 10), [filteredData, domainData?.mapping]);
  
  const aggregateByCount = (data: OrderData[], mapping: ColumnMapping | null, key: keyof ColumnMapping) => aggregateBy(data, mapping, key, curr => curr + 1);

  const topCancellationReasons = useMemo(() => {
    const mapping = domainData?.mapping;
    if (!mapping?.cancelledDate || !mapping?.cancellationReason) return [];
    const cancelledData = filteredData.filter(d => {
        const val = d[mapping.cancelledDate!];
        return val !== null && val !== undefined && String(val).trim() !== '';
    });
    return aggregateByCount(cancelledData, mapping, 'cancellationReason').slice(0, 10);
  }, [filteredData, domainData?.mapping]);

  const orderStatusDistribution = useMemo(() => aggregateByCount(filteredData, domainData?.mapping, 'orderStatus'), [filteredData, domainData?.mapping]);
  const courierUsageShare = useMemo(() => aggregateByCount(filteredData, domainData?.mapping, 'courier'), [filteredData, domainData?.mapping]);
  const topCitiesByOrderCount = useMemo(() => aggregateByCount(filteredData, domainData?.mapping, 'city').slice(0, 10), [filteredData, domainData?.mapping]);
  const topSkusByOrders = useMemo(() => aggregateByCount(filteredData, domainData?.mapping, 'sku').slice(0, 10), [filteredData, domainData?.mapping]);
  const topArticleTypesByOrders = useMemo(() => aggregateByCount(filteredData, domainData?.mapping, 'articleType').slice(0, 10), [filteredData, domainData?.mapping]);
  const orderCountByState = useMemo(() => aggregateByCount(filteredData, domainData?.mapping, 'state'), [filteredData, domainData?.mapping]);
  
  const dailyOrderVolume = useMemo(() => {
    const mapping = domainData?.mapping;
    if (!filteredData.length || !mapping?.date) return [];
    const aggregation = new Map<string, number>();
    filteredData.forEach(item => {
        const date = parseDate(item[mapping.date!]);
        if (!date) return;
        const dateKey = date.toISOString().split('T')[0];
        aggregation.set(dateKey, (aggregation.get(dateKey) || 0) + 1);
    });
    return Array.from(aggregation.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredData, domainData?.mapping]);

  const discountVsRevenue = useMemo(() => {
    const mapping = domainData?.mapping;
    if (!mapping?.articleType || !mapping.discount) return [];
    const aggregation = new Map<string, { totalRevenue: number, totalDiscount: number, count: number }>();
    filteredData.forEach(item => {
      const articleType = String(item[mapping.articleType!]);
      if (!articleType || articleType === 'null' || articleType === 'undefined') return;
      const revenue = getRevenue(item, mapping);
      const discount = Number(item[mapping.discount!]) || 0;
      const current = aggregation.get(articleType) || { totalRevenue: 0, totalDiscount: 0, count: 0 };
      current.totalRevenue += revenue;
      const discountAmount = (discount / 100) * revenue;
      current.totalDiscount += discountAmount;
      current.count += 1;
      aggregation.set(articleType, current);
    });
    return Array.from(aggregation.entries())
      .map(([name, { totalRevenue, totalDiscount }]) => ({
        name,
        revenue: totalRevenue,
        avgDiscount: totalRevenue > 0 ? (totalDiscount / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);
  }, [filteredData, domainData?.mapping]);

  const topItems = useMemo(() => aggregateBy(filteredData, domainData?.mapping, 'item', (curr, item) => curr + getRevenue(item, domainData!.mapping!)).slice(0, 10), [filteredData, domainData?.mapping]);
  const brandDistribution = useMemo(() => aggregateByCount(filteredData, domainData?.mapping, 'brand'), [filteredData, domainData?.mapping]);

  return { 
    kpis, filteredData, availableBrands, 
    topBrandsByRevenue, topCancellationReasons, orderStatusDistribution,
    courierUsageShare, dailyOrderVolume, topCitiesByOrderCount,
    topSkusByOrders, topArticleTypesByOrders, discountVsRevenue,
    orderCountByState, topCitiesByRevenue,
    topItems, brandDistribution, topCities: topCitiesByRevenue,
  };
};