// api/contact.js — formularz kontaktowy via Gmail
// Vercel Environment Variables:
//   GMAIL_USER = twojmail@gmail.com
//   GMAIL_PASS = hasło aplikacji Gmail (nie zwykłe hasło!)
//   CONTACT_EMAIL = adres na który mają przychodzić maile

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, service, budget, deadline, source, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Brak wymaganych pól' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0e0e0e;color:#e8e8e8;padding:32px;border-radius:4px;">
      <div style="font-size:24px;font-weight:700;color:#d4f000;margin-bottom:24px;letter-spacing:0.05em;">MAX SPATIAL CRAFT</div>
      <div style="font-size:18px;font-weight:600;margin-bottom:24px;color:#fff;">Nowe zapytanie z formularza</div>

      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#888;width:140px;">Imię i nazwisko</td><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#fff;">${name}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#888;">Email</td><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;"><a href="mailto:${email}" style="color:#d4f000;">${email}</a></td></tr>
        ${service ? `<tr><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#888;">Usługa</td><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#fff;">${service}</td></tr>` : ''}
        ${budget ? `<tr><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#888;">Budżet</td><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#fff;">${budget}</td></tr>` : ''}
        ${deadline ? `<tr><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#888;">Termin</td><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#fff;">${deadline}</td></tr>` : ''}
        ${source ? `<tr><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#888;">Skąd nas zna</td><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#fff;">${source}</td></tr>` : ''}
      </table>

      <div style="margin-top:24px;">
        <div style="color:#888;margin-bottom:8px;">Wiadomość:</div>
        <div style="background:#141414;padding:16px;border-radius:2px;border-left:3px solid #d4f000;color:#e8e8e8;line-height:1.7;">${message.replace(/\n/g, '<br>')}</div>
      </div>

      <div style="margin-top:24px;font-size:11px;color:#444;">
        Wysłano z formularza na maxspatialcraft.com
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"MAX SPATIAL CRAFT" <${process.env.GMAIL_USER}>`,
      to: process.env.CONTACT_EMAIL || process.env.GMAIL_USER,
      replyTo: email,
      subject: `Nowe zapytanie od ${name} — ${service || 'formularz kontaktowy'}`,
      html,
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Mail error:', err.message);
    return res.status(500).json({ error: 'Błąd wysyłki emaila' });
  }
};
