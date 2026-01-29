export type OrderData = Record<string, string | number | null>;

export interface ColumnMapping {
  date: string | null;
  customer: string | null;
  item: string | null;
  quantity: string | null;
  price: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  revenue: string | null;
  brand: string | null;
  // Existing fields
  orderStatus: string | null;
  cancellationReason: string | null;
  courier: string | null;
  sku: string | null;
  articleType: string | null;
  discount: string | null;
  // New specific date fields for KPIs
  deliveredDate: string | null; // "delivered on"
  cancelledDate: string | null; // "cancelled on"
  returnDate: string | null;    // "return creation date"
  // Order grouping
  orderId: string | null;       // "order id", "transaction id"
}

export interface DomainData {
  data: OrderData[];
  mapping: ColumnMapping;
}

export type AllData = Record<string, DomainData>;

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface Kpi {
  title: string;
  value: string;
}

export interface PptContent {
    type: 'title' | 'kpi' | 'chart' | 'summary';
    title?: string;
    text?: string;
    chartType?: 'TopItemsChart' | 'BrandDistributionChart';
}

export interface PptSlide {
    slideTitle: string;
    content: PptContent[];
}

// Declare global types for libraries loaded via script tags
declare global {
  // FIX: Renamed 'window' to 'Window' to properly extend the TypeScript global Window interface.
  interface Window {
    Recharts: any;
    Papa: any;
    ReactDateRange: any;
    XLSX: any;
  }
}