import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zwzvdcfpwprfighayyvj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3enZkY2Zwd3ByZmlnaGF5eXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODk0MzcsImV4cCI6MjA4MzI2NTQzN30.TqnfdC2dhaz0LatWjZ0VHp_P2nAcDMzjibe4EfsIvQ4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DOMAIN_TABLES = ["myntra", "amazon", "flipkart", "ajio", "shopify"];

/**
 * Saves data to a table named after the domain (lowercase).
 * Assumes table schema: id (int8, pk), payload (jsonb)
 */
export async function saveDomainData(domain: string, data: any) {
  const tableName = domain.toLowerCase();
  
  // We use id: 1 as a single-row state holder for that domain's entire dataset + mapping
  const { error } = await supabase
    .from(tableName)
    .upsert({ id: 1, payload: data }, { onConflict: 'id' });
  
  if (error) {
    console.error(`Error saving data to table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Fetches data from all domain-specific tables and centralizes it.
 */
export async function fetchAllSalesData() {
  const centralizedData: Record<string, any> = {};

  const fetchPromises = DOMAIN_TABLES.map(async (table) => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('payload')
        .eq('id', 1)
        .single();

      if (error) {
        // Table might be empty or not exist, we log but don't stop the whole process
        console.debug(`Note: No data or table found for ${table}`);
        return;
      }

      if (data && data.payload) {
        // Map back to proper casing for the UI
        const domainKey = table === 'ajio' ? 'AJIO' : table.charAt(0).toUpperCase() + table.slice(1);
        centralizedData[domainKey] = data.payload;
      }
    } catch (err) {
      console.error(`Failed fetching from table ${table}:`, err);
    }
  });

  await Promise.all(fetchPromises);
  return centralizedData;
}
