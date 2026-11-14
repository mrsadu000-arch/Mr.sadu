// "Social Media" tab: Facebook / Instagram / TikTok / Google Review links shown at the end of every WhatsApp bill.
import { state, saveSettings } from '../state.js';
import { socialLines } from '../bill.js';
import { $, $$, esc, toast, errMsg } from '../utils.js';

const FIELDS = [
  { k: 'social_facebook', label: '📘 Facebook', ph: 'https://www.facebook.com/yourpage' },
  { k: 'social_instagram', label: '📸 Instagram', ph: 'https://www.instagram.com/yourshop' },
  { k: 'social_tiktok', label: '🎵 TikTok', ph: 'https://www.tiktok.com/@yourshop' },
  { k: 'review_link', label: '⭐ Google Review', ph: 'https://g.page/r/XXXXXXXX/review' },
];

export async function render(root) {
  const val = k => state.settings[k] || '';
  root.innerHTML = `<div class="page-head"><h1>Social Media</h1></div>
    <div class="card" style="max-width:720px">
      <p class="muted" style="margin-top:0">Add your shop's links. Every link you fill in is added at the bottom of the bills sent on WhatsApp (text and picture). An empty box is simply not shown. Printed bills do not show these links.</p>
      ${FIELDS.map(f => `<label>${f.label}
        <div class="row" style="gap:8px;flex-wrap:nowrap"><input data-k="${f.k}" type="url" placeholder="${f.ph}" value="${esc(val(f.k))}" style="flex:1;min-width:0">
        <button class="btn ghost sm" type="button" data-open="${f.k}">Open</button><button class="btn ghost sm" type="button" data-rm="${f.k}">Remove</button></div></label>`).join('')}
      <div class="row wrap" style="margin-top:10px"><button class="btn" id="save">Save</button></div>
      <hr style="border:0;border-top:1px solid var(--line);margin:18px 0">
      <h2>Preview of the WhatsApp bill ending</h2>
      <div id="pv" style="background:#0f2a1c;border-radius:12px;padding:12px;white-space:pre-wrap;font-size:13px;word-break:break-all"></div>
      <hr style="border:0;border-top:1px solid var(--line);margin:18px 0">
      <h2>How to get the Google review link</h2>
      <ol class="muted" style="padding-left:18px;margin:0">
        <li>Open Google Maps and find your business profile (or open the Google Business Profile app).</li>
        <li>Tap Share review form / Get more reviews.</li>
        <li>Copy the link (it looks like https://g.page/r/…/review) and paste it above.</li>
      </ol>
    </div>`;
  const read = () => Object.fromEntries(FIELDS.map(f => [f.k, ($(`[data-k="${f.k}"]`, root).value || '').trim()]));
  const pv = () => { const sl = socialLines(read()); $('#pv', root).textContent = (sl.length ? 'Follow us & rate us 👇\n' + sl.map(([l, u]) => `${l}: ${u}`).join('\n') + '\n\n' : '') + (state.settings.bill_footer || 'Thank you!'); };
  pv();
  $$('[data-k]', root).forEach(i => { i.oninput = pv; });
  const persist = async (patch, okMsg) => {
    try {
      const r = await saveSettings(patch);
      if (r && r.socialMissing && FIELDS.some(f => f.k !== 'review_link' && f.k in patch)) toast('Facebook / Instagram / TikTok could not be saved yet – run sql/update-19.sql in Supabase first', 'err');
      else toast(okMsg);
    } catch (e) { toast(errMsg(e), 'err'); }
  };
  $('#save', root).onclick = () => {
    const v = read();
    for (const f of FIELDS) if (v[f.k] && !/^https?:\/\//i.test(v[f.k])) return toast(`${f.label.replace(/^\S+\s/, '')} link must start with https://`, 'err');
    persist(v, 'Saved');
  };
  $$('[data-open]', root).forEach(b => { b.onclick = () => { const v = $(`[data-k="${b.dataset.open}"]`, root).value.trim(); if (!v) return toast('Enter the link first', 'err'); window.open(v, '_blank', 'noopener'); }; });
  $$('[data-rm]', root).forEach(b => { b.onclick = async () => { $(`[data-k="${b.dataset.rm}"]`, root).value = ''; pv(); await persist({ [b.dataset.rm]: '' }, 'Removed'); }; });
}
