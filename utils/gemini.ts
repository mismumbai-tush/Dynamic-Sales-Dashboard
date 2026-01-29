import { GoogleGenAI, Type } from "@google/genai";
import { ColumnMapping, OrderData, PptSlide, Kpi } from '../types';

async function getAiClient() {
  // Check if API key is in environment
  let apiKey = process.env.API_KEY;
  
  // If not, check if we need to open the selector (Aistudio environment)
  if (!apiKey && typeof window !== 'undefined' && (window as any).aistudio) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }
    // After calling openSelectKey, we assume the key is now injected into process.env.API_KEY
    apiKey = process.env.API_KEY;
  }

  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure it is configured in your environment or select one via the key icon.");
  }

  return new GoogleGenAI({ apiKey });
}

export async function analyzeCsvData(headers: string[], sampleData: OrderData[]): Promise<ColumnMapping> {
  try {
    const ai = await getAiClient();

    const prompt = `
      You are an expert data analyst. Your primary goal is to identify columns in a CSV file that represent key business metrics.
      Here are the column headers: ${headers.join(', ')}
      Here is a sample of the data (first 5 rows): ${JSON.stringify(sampleData, null, 2)}
      
      Analyze the headers and data to find the best match for each of the following metrics.
      1.  **revenue**: Look for total sale amount.
      2.  **price**: Price per item.
      3.  **quantity**: Number of items sold.
      4.  **date**: Primary date of transaction.
      5.  **customer**: Customer name or ID.
      6.  **item**: Product name.
      7.  **city**: Shipping city.
      8.  **state**: Shipping state.
      9.  **zipcode**: Shipping zipcode.
      10. **brand**: Product brand.
      11. **orderStatus**: Order status.
      12. **cancellationReason**: Reason for cancellation.
      13. **courier**: Courier service.
      14. **sku**: SKU identifier.
      15. **articleType**: Product category.
      16. **discount**: Discount percentage.
      17. **orderId**: Unique order identifier.
      18. **deliveredDate**: Delivery date.
      19. **cancelledDate**: Cancellation date.
      20. **returnDate**: Return creation date.
      
      Return a minified JSON object mapping these 20 fields to the exact column names found in the header list.
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING }, customer: { type: Type.STRING }, item: { type: Type.STRING },
        quantity: { type: Type.STRING }, price: { type: Type.STRING }, city: { type: Type.STRING },
        state: { type: Type.STRING }, zipcode: { type: Type.STRING }, revenue: { type: Type.STRING }, 
        brand: { type: Type.STRING }, orderStatus: { type: Type.STRING }, cancellationReason: { type: Type.STRING },
        courier: { type: Type.STRING }, sku: { type: Type.STRING }, articleType: { type: Type.STRING }, 
        discount: { type: Type.STRING }, deliveredDate: { type: Type.STRING }, cancelledDate: { type: Type.STRING }, 
        returnDate: { type: Type.STRING }, orderId: { type: Type.STRING }
      },
      required: [
          'date', 'customer', 'item', 'quantity', 'price', 'city', 'state', 'zipcode', 'revenue', 'brand',
          'orderStatus', 'cancellationReason', 'courier', 'sku', 'articleType', 'discount',
          'deliveredDate', 'cancelledDate', 'returnDate', 'orderId'
      ],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema },
    });
    
    const mapping = JSON.parse(response.text.trim());
    const finalMapping: ColumnMapping = {
        date: null, customer: null, item: null, quantity: null, price: null, city: null, state: null, zipcode: null, revenue: null, brand: null,
        orderStatus: null, cancellationReason: null, courier: null, sku: null, articleType: null, discount: null,
        deliveredDate: null, cancelledDate: null, returnDate: null, orderId: null
    };

    for (const key in mapping) {
        const value = mapping[key];
        if (value && headers.includes(value)) {
            finalMapping[key as keyof ColumnMapping] = value;
        }
    }
    return finalMapping;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback logic: Try to guess some common columns if AI fails
    const guess: any = {};
    headers.forEach(h => {
      const low = h.toLowerCase();
      if (low.includes('revenue') || low.includes('sale') || low.includes('amount')) guess.revenue = h;
      if (low.includes('date') && !low.includes('deliver') && !low.includes('cancel')) guess.date = h;
      if (low.includes('order id') || low.includes('transaction')) guess.orderId = h;
      if (low.includes('city')) guess.city = h;
      if (low.includes('brand')) guess.brand = h;
    });
    return {
      date: guess.date || null, customer: null, item: null, quantity: null, price: null, city: guess.city || null, state: null, zipcode: null, revenue: guess.revenue || null, brand: guess.brand || null,
      orderStatus: null, cancellationReason: null, courier: null, sku: null, articleType: null, discount: null,
      deliveredDate: null, cancelledDate: null, returnDate: null, orderId: guess.orderId || null
    };
  }
}

export async function generatePptInsights(
  kpis: Kpi[],
  topItems: any[],
  topCities: any[],
  domain: string,
  month: string,
  year: number
): Promise<PptSlide[]> {
  const ai = await getAiClient();

  const prompt = `
    Create a 4-slide business presentation for "${domain}" for ${month} ${year}.
    Data: KPIs: ${JSON.stringify(kpis)}, Top Items: ${JSON.stringify(topItems.slice(0,5))}, Top Cities: ${JSON.stringify(topCities.slice(0,5))}.
    Follow the schema precisely.
  `;
  
  const slideContentSchema = {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ['title', 'kpi', 'chart', 'summary'] },
        title: { type: Type.STRING },
        text: { type: Type.STRING },
        chartType: { type: Type.STRING, enum: ['TopItemsChart', 'BrandDistributionChart'] }
      }
  };

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        slideTitle: { type: Type.STRING },
        content: { type: Type.ARRAY, items: slideContentSchema }
      },
    },
  };
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema },
  });
  return JSON.parse(response.text.trim());
}