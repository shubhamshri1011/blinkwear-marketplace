import { NextResponse } from 'next/server';
import { createCatalogClient } from '@/lib/supabase/catalog';
import { hasSupabaseEnv } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

export const DEFAULT_SERVICE_AREAS = [
  { state: 'Madhya Pradesh', city: 'Bhopal', is_active: true, delivery_charge: null, delivery_promise_text: null },
  { state: 'Maharashtra', city: 'Pune', is_active: true, delivery_charge: null, delivery_promise_text: null },
];

export async function GET() {
  if (!hasSupabaseEnv()) {
    console.error(
      '[API /api/cities] Supabase environment variables missing; returning default service areas fallback.'
    );
    return NextResponse.json({
      areas: DEFAULT_SERVICE_AREAS,
      cities: DEFAULT_SERVICE_AREAS.map((a) => a.city),
    });
  }

  try {
    const supabase = createCatalogClient();
    if (!supabase) {
      return NextResponse.json({
        areas: DEFAULT_SERVICE_AREAS,
        cities: DEFAULT_SERVICE_AREAS.map((a) => a.city),
      });
    }
    const { data, error } = await supabase
      .from('service_areas')
      .select('state, city, is_active, delivery_charge, delivery_promise_text')
      .eq('is_active', true)
      .order('state', { ascending: true })
      .order('city', { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        areas: DEFAULT_SERVICE_AREAS,
        cities: DEFAULT_SERVICE_AREAS.map((a) => a.city),
      });
    }

    return NextResponse.json({
      areas: data,
      cities: data.map((a) => a.city),
    });
  } catch (err) {
    console.error('Error fetching service areas:', err);
    return NextResponse.json({
      areas: DEFAULT_SERVICE_AREAS,
      cities: DEFAULT_SERVICE_AREAS.map((a) => a.city),
    });
  }
}
