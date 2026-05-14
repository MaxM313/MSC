// api/orders.js — Furgonetka Universal Integration

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Token, Token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Token auth
  const authHeader = req.headers['authorization'] || '';
  const receivedToken = authHeader.replace(/^Bearer\s+/i, '').replace(/^Token\s+/i, '').trim()
    || (req.headers['x-token'] || '').trim()
    || (req.headers['token'] || '').trim()
    || ((req.query && req.query.token) || '').trim();

  if (receivedToken !== process.env.FURGONETKA_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Pobierz sesje BEZ expand — prostsze zapytanie
      const sessions = await stripe.checkout.sessions.list({ limit: 50 });
      const paid = sessions.data.filter(s => s.payment_status === 'paid');

      const orders = await Promise.all(paid.map(async session => {
        // Pobierz line_items osobno
        let items = [];
        try {
          const li = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
          items = li.data;
        } catch(e) {}

        const shipping = session.shipping_details || {};
        const address  = (shipping && shipping.address) || {};
        const customer = session.customer_details || {};

        return {
          id: session.id,
          status: 'new',
          created_at: new Date(session.created * 1000).toISOString(),
          currency: (session.currency || 'pln').toUpperCase(),
          total: ((session.amount_total || 0) / 100).toFixed(2),
          delivery: {
            name:     shipping.name || customer.name || '',
            street:   address.line1 || '',
            city:     address.city || '',
            postcode: address.postal_code || '',
            country:  address.country || 'PL',
            phone:    customer.phone || '',
            email:    customer.email || '',
          },
          products: items.map(item => ({
            name:     item.description || '',
            quantity: item.quantity || 1,
            price:    ((item.amount_total || 0) / 100 / (item.quantity || 1)).toFixed(2),
          })),
        };
      }));

      return res.status(200).json({
        meta: { total: orders.length, per_page: 50, current_page: 1, last_page: 1 },
        data: orders,
      });

    } catch (err) {
      console.error('Orders error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    console.log('Tracking update:', JSON.stringify(body));
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
