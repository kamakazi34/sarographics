// SAROGraphics Stripe webhook.
// POST /api/stripe-webhook  <-  Stripe checkout.session.completed
//
// Verifies the Stripe signature against the RAW request body, emails Jake the
// order via Resend, and stamps fulfilment_status=new onto the PaymentIntent.
// Stripe is the ledger. There is no separate order database.
//
// Required env vars:
//   STRIPE_WEBHOOK_SECRET   whsec_... for THIS endpoint URL
//   STRIPE_SECRET_KEY       restricted key, read Checkout Sessions + write PaymentIntents
//   RESEND_API_KEY          same key as /api/notify
//   NOTIFY_TO               defaults to jake.martin@saroarch.com
//   NOTIFY_FROM             defaults to the Resend sandbox sender
const crypto = require('crypto');

const TOLERANCE_SECONDS = 300;
const STRIPE_API = 'https://api.stripe.com/v1';

// Best effort replay guard. Stripe retries failed deliveries, and a warm
// instance will skip a repeat. Cross-instance dedup is not needed here because
// the only side effect is an email, and Stripe itself remains the source of truth.
const processed = new Set();

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    if (!req.readable) {
      // The platform already consumed the stream. Re-serialising would change
      // the bytes and break verification, so fail loudly rather than silently.
      return reject(new Error('raw body unavailable'));
    }
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifySignature(rawBody, header, secret) {
  if (!header) return { ok: false, reason: 'missing signature header' };

  const parts = String(header).split(',').reduce((acc, kv) => {
    const i = kv.indexOf('=');
    if (i > 0) {
      const k = kv.slice(0, i).trim();
      const v = kv.slice(i + 1).trim();
      if (k === 'v1') (acc.v1 = acc.v1 || []).push(v);
      else acc[k] = v;
    }
    return acc;
  }, {});

  if (!parts.t || !parts.v1 || !parts.v1.length) {
    return { ok: false, reason: 'malformed signature header' };
  }

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(parts.t));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) {
    return { ok: false, reason: 'timestamp outside tolerance' };
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(Buffer.concat([Buffer.from(parts.t + '.', 'utf8'), rawBody]))
    .digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');

  const match = parts.v1.some((candidate) => {
    const candidateBuf = Buffer.from(candidate, 'utf8');
    if (candidateBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(candidateBuf, expectedBuf);
  });

  return match ? { ok: true } : { ok: false, reason: 'signature mismatch' };
}

async function stripeGet(path, key) {
  const r = await fetch(STRIPE_API + path, {
    headers: { Authorization: 'Bearer ' + key }
  });
  if (!r.ok) throw new Error('stripe GET ' + path + ' failed: ' + r.status);
  return r.json();
}

async function stripePost(path, key, form) {
  const r = await fetch(STRIPE_API + path, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(form).toString()
  });
  if (!r.ok) throw new Error('stripe POST ' + path + ' failed: ' + r.status);
  return r.json();
}

function money(cents, currency) {
  if (typeof cents !== 'number') return 'n/a';
  return (cents / 100).toFixed(2) + ' ' + String(currency || 'aud').toUpperCase();
}

function formatAddress(details) {
  if (!details) return 'No shipping address collected.';
  const a = details.address || {};
  return [
    details.name,
    a.line1,
    a.line2,
    [a.city, a.state, a.postal_code].filter(Boolean).join(' '),
    a.country
  ].filter(Boolean).join('\n');
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.json({ ok: false, error: 'method' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!webhookSecret || !stripeKey) {
    // 500 so Stripe retries once the env vars land.
    res.statusCode = 500;
    return res.json({ ok: false, error: 'not configured' });
  }

  let raw;
  try {
    raw = await readRawBody(req);
  } catch (e) {
    res.statusCode = 400;
    return res.json({ ok: false, error: 'raw body' });
  }

  const verdict = verifySignature(raw, req.headers['stripe-signature'], webhookSecret);
  if (!verdict.ok) {
    // 400 and no retry. A bad signature is never going to become good.
    res.statusCode = 400;
    return res.json({ ok: false, error: 'signature' });
  }

  let event;
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch (e) {
    res.statusCode = 400;
    return res.json({ ok: false, error: 'json' });
  }

  if (event.type !== 'checkout.session.completed') {
    return res.json({ ok: true, ignored: event.type });
  }
  if (processed.has(event.id)) {
    return res.json({ ok: true, dedup: 'event' });
  }

  const session = (event.data && event.data.object) || {};

  try {
    // line_items are not in the event payload, so retrieve them.
    const full = await stripeGet(
      '/checkout/sessions/' + encodeURIComponent(session.id) + '?expand[]=line_items',
      stripeKey
    );

    const items = ((full.line_items && full.line_items.data) || []).map((li) => {
      const qty = li.quantity || 1;
      return {
        line: qty + ' x ' + (li.description || 'item') + '  ' + money(li.amount_total, li.currency),
        sku: (li.price && li.price.metadata && li.price.metadata.sku) || ''
      };
    });

    const skus = items.map((i) => i.sku).filter(Boolean).join(',');

    // Fulfilment state machine lives in Stripe metadata:
    // new -> batched -> ordered_from_fractel -> shipped
    if (full.payment_intent) {
      const pi = typeof full.payment_intent === 'string'
        ? full.payment_intent
        : full.payment_intent.id;
      await stripePost('/payment_intents/' + encodeURIComponent(pi), stripeKey, {
        'metadata[fulfilment_status]': 'new',
        'metadata[skus]': skus.slice(0, 500),
        'metadata[checkout_session]': full.id
      });
    }

    const shipping = full.collected_information
      ? full.collected_information.shipping_details
      : full.shipping_details;

    const body = [
      'New SAROGraphics order.',
      '',
      'Items',
      items.length ? items.map((i) => '  ' + i.line).join('\n') : '  none returned',
      '',
      'Total: ' + money(full.amount_total, full.currency),
      'Email: ' + ((full.customer_details && full.customer_details.email) || 'not supplied'),
      '',
      'Ship to',
      formatAddress(shipping),
      '',
      'Session: ' + full.id,
      'Event: ' + event.id,
      'Time: ' + new Date().toISOString(),
      '',
      'Pre-order apparel waits for the FRACTEL batch. Stickers ship now.',
      '',
      'Please note, this document was formatted using AI but was checked by a human'
    ].join('\n');

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const mail = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + resendKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.NOTIFY_FROM || 'SAROGraphics Shop <onboarding@resend.dev>',
          to: [process.env.NOTIFY_TO || 'jake.martin@saroarch.com'],
          subject: 'Order: ' + (skus || full.id),
          text: body
        })
      });
      // A failed email must not make Stripe retry the whole event, because the
      // PaymentIntent metadata is already written. Log and move on.
      if (!mail.ok) console.error('resend failed', mail.status);
    } else {
      console.error('RESEND_API_KEY missing, order email skipped for', full.id);
    }

    processed.add(event.id);
    return res.json({ ok: true });
  } catch (e) {
    console.error('stripe-webhook error', e && e.message);
    // 500 asks Stripe to retry.
    res.statusCode = 500;
    return res.json({ ok: false, error: 'processing' });
  }
}

module.exports = handler;
// Signature verification needs the exact bytes Stripe signed.
module.exports.config = { api: { bodyParser: false } };
