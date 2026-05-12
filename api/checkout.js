// api/checkout.js
// Vercel Serverless Function — tworzy Stripe Checkout Session
// Wymagane zmienne środowiskowe w Vercel Dashboard:
//   STRIPE_SECRET_KEY=sk_live_...  (lub sk_test_... do testów)
//   NEXT_PUBLIC_URL=https://twoja-domena.pl

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Brak produktów w koszyku' });
  }

  // Budujemy line_items dla Stripe
  const line_items = items.map(function(item) {
    return {
      price_data: {
        currency: 'pln',
        product_data: {
          name: item.name,
          description: 'Plik STL — wysyłka na email w ciągu 24h',
        },
        unit_amount: Math.round(item.price * 100), // Stripe wymaga groszy
      },
      quantity: item.qty,
    };
  });

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'blik', 'p24'],
      line_items: line_items,
      mode: 'payment',
      success_url: baseUrl + '/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:  baseUrl + '/shop.html?cancelled=true',
      locale: 'pl',
      shipping_address_collection: null, // produkty cyfrowe — nie trzeba adresu
      metadata: {
        type: 'digital_product',
        items: JSON.stringify(items.map(function(i){ return i.name; })),
      },
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
