import {createClient} from '@supabase/supabase-js';

export function londonEnquiryMonth(now: Date): string {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return `${formatted.slice(0, 7)}-01`;
}

export async function readLiveDeliveryEmail(siteId: string): Promise<string | undefined> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const secret = process.env.SUPABASE_SECRET_KEY?.trim() ?? '';
  if (url.length === 0 || secret.length === 0) {
    return undefined;
  }
  const supabase = createClient(url, secret, {auth: {persistSession: false, autoRefreshToken: false}});
  const {data, error} = await supabase.from('site_contact').select('delivery_email').eq('site_id', siteId).maybeSingle();
  if (error || data === null) {
    return undefined;
  }
  const email = data.delivery_email;
  return typeof email === 'string' ? email : undefined;
}

export async function recordSiteEnquiry(siteId: string, resendId: string, count: boolean): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const secret = process.env.SUPABASE_SECRET_KEY?.trim() ?? '';
  if (url.length === 0 || secret.length === 0) {
    return;
  }
  const supabase = createClient(url, secret, {auth: {persistSession: false, autoRefreshToken: false}});
  await supabase.rpc('record_site_enquiry', {
    p_site_id: siteId,
    p_month: londonEnquiryMonth(new Date()),
    p_resend_id: resendId,
    p_count: count,
  });
}
