// api/checkout.js — Vercel Serverless Function
// Zmienne środowiskowe w Vercel Dashboard:
//   STRIPE_SECRET_KEY = sk_live_... (lub sk_test_... do testów)
//   NEXT_PUBLIC_URL   = https://twoja-domena.pl

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'Brak produktów w koszyku' });

  // Oblicz wartość koszyka i dostawę
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shippingCents = subtotal >= 150 ? 0 : 1500; // grosze

  const line_items = items.map(item => ({
    price_data: {
      currency: 'pln',
      product_data: {
        name: item.name,
        description: 'Wydruk 3D — wysyłka InPost Paczkomat w ciągu 3 dni roboczych',
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.qty,
  }));

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'blik', 'p24'],
      line_items,
      mode: 'payment',
      locale: 'pl',
      shipping_address_collection: {
        allowed_countries: ['PL'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: shippingCents, currency: 'pln' },
            display_name: shippingCents === 0
              ? 'Darmowa dostawa InPost Paczkomat ✓'
              : 'InPost Paczkomat',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 2 },
              maximum: { unit: 'business_day', value: 3 },
            },
          },
        },
      ],
      success_url: baseUrl + '/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:  baseUrl + '/shop.html?cancelled=true',
      metadata: {
        type: 'physical_product',
        items: JSON.stringify(items.map(i => i.name)),
      },
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
