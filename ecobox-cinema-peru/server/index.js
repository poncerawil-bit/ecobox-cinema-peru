// Simple Express server to create a Stripe Checkout Session and handle webhooks
require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const bodyParser = require('body-parser');
const cors = require('cors');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { items, userId } = req.body;
    const line_items = items.map(i => ({ price_data: { currency: 'usd', product_data: { name: i.name }, unit_amount: Math.round(i.price * 100) }, quantity: 1 }));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${req.headers.origin}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
      metadata: { userId: userId || 'guest' }
    });
    res.json({ sessionId: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Payment succeeded for session:', session.id);
    // Aquí podrías marcar la orden en Firestore usando session.metadata
  }

  res.json({ received: true });
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
