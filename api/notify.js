// SAROGraphics shop interest notifier.
// POST /api/notify {sku} -> emails Jake via Resend, once per IP per product.
// Dedup layers: cookie (1yr), per-instance IP memory, hourly send cap.
// True cross-instance IP dedup arrives with the order backend (Firestore).
const crypto = require('crypto');

const seen = new Map(); // ipHash -> Set(sku), per warm instance
let sent = 0;
let windowStart = Date.now();

const SKUS = new Set(['CAP_FOREST','TEE_PERF','SINGLET_PERF','SOCKS','STICKER_75','STICKER_PACK','TEE_MINT','TEE_FOREST','TEE_WHITE','CAP_MINT','GENERAL']);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.json({ ok: false, error: 'method' });
  }

  let sku = 'GENERAL';
  try {
    const b = req.body || {};
    if (typeof b.sku === 'string' && SKUS.has(b.sku)) sku = b.sku;
  } catch (e) { /* keep GENERAL */ }

  const ip = ((req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || 'unknown';
  const ipHash = crypto.createHash('sha256').update(ip + (process.env.IP_SALT || 'sgx-2026')).digest('hex').slice(0, 12);

  // Layer 1: cookie
  const cookieMatch = (req.headers.cookie || '').match(/sgx_notify=([^;]+)/);
  const already = cookieMatch ? decodeURIComponent(cookieMatch[1]).split('|') : [];
  if (already.includes(sku)) return res.json({ ok: true, dedup: 'cookie' });

  // Layer 2: per-instance IP memory
  const set = seen.get(ipHash) || new Set();
  const setCookie = () => res.setHeader('Set-Cookie',
    'sgx_notify=' + encodeURIComponent(already.concat(sku).join('|')) + '; Max-Age=31536000; Path=/; SameSite=Lax; Secure');
  if (set.has(sku)) { setCookie(); return res.json({ ok: true, dedup: 'ip' }); }

  // Layer 3: hourly cap so a bot cannot flood the inbox
  if (Date.now() - windowStart > 3600000) { sent = 0; windowStart = Date.now(); }
  if (sent >= 30) { res.statusCode = 429; return res.json({ ok: false, error: 'rate' }); }

  const key = process.env.RESEND_API_KEY;
  if (!key) { res.statusCode = 500; return res.json({ ok: false, error: 'not configured' }); }

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM || 'SAROGraphics Shop <onboarding@resend.dev>',
      to: [process.env.NOTIFY_TO || 'jake.martin@saroarch.com'],
      subject: 'Shop interest: ' + sku,
      text: 'Someone tapped Coming Soon on ' + sku + '\n\nVisitor: ' + ipHash +
            '\nUser agent: ' + (req.headers['user-agent'] || 'unknown').slice(0, 200) +
            '\nTime: ' + new Date().toISOString() +
            '\n\nsarographics.com/shop'
    })
  });

  if (!r.ok) { res.statusCode = 502; return res.json({ ok: false, error: 'email' }); }

  set.add(sku); seen.set(ipHash, set); sent++;
  setCookie();
  return res.json({ ok: true });
};
