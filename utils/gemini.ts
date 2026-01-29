import { GoogleGenAI, Type } from "@google/genai";
import { ColumnMapping, OrderData, PptSlide, Kpi } from '../types';

export async function analyzeCsvData(headers: string[], sampleData: OrderData[]): Promise<ColumnMapping> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert data analyst. Your primary goal is to identify columns in a CSV file that represent key business metrics for a sales and logistics dashboard.
    Here are the column headers: ${headers.join(', ')}
    Here is a sample of the data (first 5 rows): ${JSON.stringify(sampleData, null, 2)}
    
    Analyze the headers and data to find the best match for each of the following metrics.
    1.  **revenue**: Look for total sale amount. Common names: 'final amount', 'total_price', 'revenue', 'sale_amount'.
    2.  **price**: Price per item.
    3.  **quantity**: Number of items sold.
    4.  **date**: The primary date of the transaction. Look for 'order date', 'created on'.
    5.  **customer**: The customer's name or ID.
    6.  **item**: The product's descriptive name.
    7.  **city**: The shipping or customer city.
    8.  **state**: The shipping or customer state.
    9.  **zipcode**: The shipping or customer zipcode/pincode.
    10. **brand**: The product's brand name.
    11. **orderStatus**: The current status of the order.
    12. **cancellationReason**: The reason an order was cancelled. Look for 'cancellation reason', 'reason'.
    13. **courier**: The shipping partner or courier service.
    14. **sku**: The product's Stock Keeping Unit identifier.
    15. **articleType**: The general category of the product.
    16. **discount**: The discount percentage applied.
    17. **orderId**: The unique identifier for the order. Look for 'order id', 'transaction id', 'order_number'.
    
    **CRITICAL NEW FIELDS**:
    18. **deliveredDate**: Look for a column indicating when the item was delivered. Look for "delivered on", "delivery date", "delivered_at".
    19. **cancelledDate**: Look for a column indicating when the item was cancelled. Look for "cancelled on", "cancellation date", "cancelled_at".
    20. **returnDate**: Look for a column indicating when a return was created. Look for "return creation date", "return date", "returned_on".

    Return a single, minified JSON object with your findings. If a metric cannot be found, use an empty string "" for its value.
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema },
    });
    const parsedText = response.text.trim();
    const mapping = JSON.parse(parsedText);
    
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
    console.error("Error analyzing CSV data with Gemini:", error);
    throw new Error("AI analysis of the file failed.");
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are a senior business analyst creating a presentation summary.
    The data is for the domain "${domain}" for the period of ${month}, ${year}.
    
    Here is the key data:
    - Key Performance Indicators: ${JSON.stringify(kpis)}
    - Top Selling Items by Revenue: ${JSON.stringify(topItems.map(i => i.name))}
    - Top 10 Cities by Revenue: ${JSON.stringify(topCities.map(c => c.name))}

    Generate a 4-slide presentation based on this data. Follow the JSON schema precisely.
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
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema },
    });
    const parsedText = response.text.trim();
    return JSON.parse(parsedText);
  } catch (error) {
    console.error("Error generating presentation insights with Gemini:", error);
    throw new Error("AI presentation generation failed.");
  }
}