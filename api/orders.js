// api/orders.js — Furgonetka Universal Integration

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Token, Token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Akceptuj token w różnych formatach
  const authHeader = req.headers['authorization'] || '';
  const xToken     = req.headers['x-token'] || '';
  const tokenHeader= req.headers['token'] || '';
  const queryToken = (req.query && req.query.token) || '';

  const receivedToken = authHeader.replace(/^Bearer\s+/i, '').replace(/^Token\s+/i, '').trim()
    || xToken.trim()
    || tokenHeader.trim()
    || queryToken.trim();

  // Loguj co dostajemy (do debugowania)
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('Received token:', receivedToken);
  console.log('Expected token:', process.env.FURGONETKA_TOKEN);

  if (receivedToken !== process.env.FURGONETKA_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized', received: receivedToken ? 'token present but wrong' : 'no token' });
  }

  if (req.method === 'GET') {
    try {
      const sessions = await stripe.checkout.sessions.list({
        limit: 50,
        expand: ['data.line_items', 'data.shipping_details'],
      });

      const paid = sessions.data.filter(s => s.payment_status === 'paid');

      const orders = paid.map(session => {
        const shipping = session.shipping_details || {};
        const address  = shipping.address || {};
        const items    = (session.line_items && session.line_items.data) || [];

        return {
          id: session.id,
          status: 'new',
          created_at: new Date(session.created * 1000).toISOString(),
          currency: session.currency.toUpperCase(),
          total: (session.amount_total / 100).toFixed(2),
          delivery: {
            name:     shipping.name || '',
            street:   address.line1 || '',
            city:     address.city || '',
            postcode: address.postal_code || '',
            country:  address.country || 'PL',
            phone:    '',
            email:    session.customer_details ? session.customer_details.email : '',
          },
          products: items.map(item => ({
            name:     item.description || '',
            quantity: item.quantity,
            price:    (item.amount_total / 100 / item.quantity).toFixed(2),
          })),
        };
      });

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
    const { tracking_number, order_id } = req.body || {};
    console.log(`Tracking — order: ${order_id}, tracking: ${tracking_number}`);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
