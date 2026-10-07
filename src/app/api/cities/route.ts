import { NextResponse } from 'next/server';
import { createCatalogClient } from '@/lib/supabase/catalog';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const supabase = await createCatalogClient();
    const { data, error } = await supabase
      .from('platform_cities')
      .select('name, is_active')
      .eq('is_active', true);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ cities: ['Bhopal', 'Pune'] });
    }

    return NextResponse.json({ cities: data.map((c) => c.name) });
  } catch (err) {
    console.error('Error fetching platform cities:', err);
    return NextResponse.json({ cities: ['Bhopal', 'Pune'] });
  }
}
