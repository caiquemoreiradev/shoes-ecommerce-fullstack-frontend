const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {

  const products = req.body ? JSON.parse(req.body) : ''

  const productsFormatted = products !== '' ? products.map(item => {

    const newItem = {
      price: item.product.stripePriceId,
      quantity: item.quantity
    }

    return newItem;
  }) : []

  switch (req.method) {
    case "POST":
      try {
        // Create Checkout Sessions from body params.
        const session = await stripe.checkout.sessions.create({
          ui_mode: 'embedded',
          submit_type: 'pay',
          billing_address_collection: 'auto',
          shipping_address_collection: {
            allowed_countries: ['US', 'CA'],
          },
          line_items: productsFormatted,
          mode: 'payment',
          return_url:
            `${req.headers.origin}/return?session_id={CHECKOUT_SESSION_ID}`,
        });

        res.send({ clientSecret: session.client_secret });
      } catch (err) {
        res.status(err.statusCode || 500).json(err.message);
      }
      break;
    case "GET":
      try {
        const session =
          await stripe.checkout.sessions.retrieve(req.query.session_id);

        res.send({
          status: session.status,
          customer_email: session.customer_details.email
        });
      } catch (err) {
        res.status(err.statusCode || 500).json(err.message);
      }
      break;
    default:
      res.setHeader('Allow', req.method);
      res.status(405).end('Method Not Allowed');
  }
}