import { sb } from './sb.js';

export const DEFAULT_SETTINGS = {
  id: 1,
  shop_name: 'Mr Sadu',
  tagline: 'Juice Bar & Burger Shop',
  address: '',
  phone: '',
  whatsapp: '',
  review_link: '',
  social_facebook: '',
  social_instagram: 'https://www.instagram.com/mr.batzy?utm_source=qr',
  social_tiktok: '',
  service_charge_enabled: false,
  service_charge_pct: 10,
  discount_pct: 0,
  cashier: '',
  payment_methods: ['cash', 'card', 'bank', 'qr'],
  bill_footer: 'Thank you! Come again.',
};

export const state = {
  user: null,
  settings: { ...DEFAULT_SETTINGS },
  own: new Set(), // "orderId:status" keys created by this device (so we don't alert ourselves)
};

// Cashier on duty belongs to THIS device (each counter/phone has its own), not to the shared settings
export const getCashier = () => { try { return localStorage.getItem('mb_cashier') || ''; } catch { return ''; } };
export function setCashier(name) {
  try { localStorage.setItem('mb_cashier', String(name || '').trim()); } catch { /* ignore */ }
  window.dispatchEvent(new Event('settings-changed')); window.dispatchEvent(new Event('cashier-changed'));
}

export async function loadSettings() {
  const { data } = await sb.from('settings').select('*').eq('id', 1).maybeSingle();
  state.settings = { ...DEFAULT_SETTINGS, ...(data || {}) };
  return state.settings;
}

export async function saveSettings(patch) {
  const next = { ...state.settings, ...patch, id: 1 };
  let { error } = await sb.from('settings').upsert(next), socialMissing = false;
  if (error && /social_/i.test(error.message || '')) {   // sql/update-19.sql not run yet: keep every other setting working
    const lean = { ...next }; ['social_facebook', 'social_instagram', 'social_tiktok'].forEach(k => delete lean[k]);
    ({ error } = await sb.from('settings').upsert(lean)); socialMissing = !error;
  }
  if (error) throw error;
  state.settings = next;
  window.dispatchEvent(new Event('settings-changed'));
  return { socialMissing };
}
