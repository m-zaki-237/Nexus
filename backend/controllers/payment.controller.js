import Stripe from 'stripe';
import User from '../models/user.model.js';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("Warning: STRIPE_SECRET_KEY is not set in environment variables.");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
};

export const getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      plan: user.plan || 'free',
      status: user.status || 'inactive',
      currentPeriodEnd: user.currentPeriodEnd || null,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd || false,
      stripeCustomerId: user.stripeCustomerId || null,
      stripeSubscriptionId: user.stripeSubscriptionId || null,
    });
  } catch (error) {
    console.error('getSubscription error:', error);
    res.status(500).json({ message: 'Server error retrieving subscription' });
  }
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { priceId } = req.body || {};
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey || secretKey.includes('your_stripe')) {
      return res.status(400).json({ message: 'STRIPE_SECRET_KEY is not configured in backend/.env' });
    }

    const stripe = getStripe();

    let targetPriceId = priceId || process.env.STRIPE_PRO_PRICE_ID;
    if (!targetPriceId || targetPriceId.includes('your_pro_price')) {
      try {
        const product = await stripe.products.create({
          name: 'Nexus Pro Subscription',
          description: 'Nexus Pro Plan - $29/month',
        });
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: 2900,
          currency: 'usd',
          recurring: { interval: 'month' },
        });
        targetPriceId = price.id;
      } catch (e) {
        console.error('Error auto-creating Stripe price:', e.message);
      }
    } else if (targetPriceId.startsWith('prod_')) {
      try {
        const prices = await stripe.prices.list({ product: targetPriceId, active: true, limit: 1 });
        if (prices.data && prices.data.length > 0) {
          targetPriceId = prices.data[0].id;
        } else {
          const price = await stripe.prices.create({
            product: targetPriceId,
            unit_amount: 2900,
            currency: 'usd',
            recurring: { interval: 'month' },
          });
          targetPriceId = price.id;
        }
      } catch (e) {
        console.error('Error fetching price for product ID:', e.message);
      }
    }

    let customerId = user.stripeCustomerId;
    if (customerId && customerId.startsWith('cus_demo')) {
      customerId = null;
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer: customerId,
        client_reference_id: user._id.toString(),
        line_items: [
          {
            price: targetPriceId,
            quantity: 1,
          },
        ],
        success_url: `${clientUrl}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/pricing?canceled=true`,
        metadata: {
          userId: user._id.toString(),
        },
      });
    } catch (err) {
      if (err.message && err.message.includes('No such customer')) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: user._id.toString(),
          },
        });
        customerId = customer.id;
        user.stripeCustomerId = customerId;
        await user.save();

        session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'subscription',
          customer: customerId,
          client_reference_id: user._id.toString(),
          line_items: [
            {
              price: targetPriceId,
              quantity: 1,
            },
          ],
          success_url: `${clientUrl}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${clientUrl}/pricing?canceled=true`,
          metadata: {
            userId: user._id.toString(),
          },
        });
      } else {
        throw err;
      }
    }

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('createCheckoutSession error:', error);
    res.status(500).json({ message: error.message || 'Server error creating checkout session' });
  }
};

export const createPortalSession = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    const isMockStripe =
      !secretKey ||
      secretKey.includes('your_stripe') ||
      secretKey === 'sk_test_placeholder';

    if (isMockStripe) {
      console.log('[Stripe Demo Mode] Customer Portal requested...');
      return res.status(200).json({ url: `${clientUrl}/pricing?demo_portal=true` });
    }

    if (!user.stripeCustomerId) {
      return res.status(400).json({ message: 'No Stripe customer found for this user' });
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${clientUrl}/pricing`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('createPortalSession error:', error);
    res.status(500).json({ message: error.message || 'Server error creating portal session' });
  }
};

export const cancelDemoSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.plan = 'free';
    user.status = 'canceled';
    user.cancelAtPeriodEnd = false;
    await user.save();

    res.status(200).json({ message: 'Subscription canceled successfully' });
  } catch (error) {
    console.error('cancelDemoSubscription error:', error);
    res.status(500).json({ message: 'Server error canceling subscription' });
  }
};

export const handleWebhook = async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Fallback for dev testing if secret is not set
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription') {
          const userId = session.client_reference_id || session.metadata?.userId;
          const subscriptionId = session.subscription;
          const customerId = session.customer;

          let subscription = null;
          if (subscriptionId) {
            subscription = await stripe.subscriptions.retrieve(subscriptionId);
          }

          let user = null;
          if (userId) {
            user = await User.findById(userId);
          }
          if (!user && customerId) {
            user = await User.findOne({ stripeCustomerId: customerId });
          }

          if (user) {
            user.stripeCustomerId = customerId || user.stripeCustomerId;
            user.stripeSubscriptionId = subscriptionId || user.stripeSubscriptionId;
            user.plan = 'pro';
            user.status = subscription ? subscription.status : 'active';
            if (subscription?.current_period_end) {
              user.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
            }
            if (subscription?.cancel_at_period_end !== undefined) {
              user.cancelAtPeriodEnd = subscription.cancel_at_period_end;
            }
            await user.save();
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        let user = await User.findOne({ stripeSubscriptionId: subscription.id });
        if (!user && subscription.customer) {
          user = await User.findOne({ stripeCustomerId: subscription.customer });
        }

        if (user) {
          user.status = subscription.status;
          user.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          user.cancelAtPeriodEnd = subscription.cancel_at_period_end || false;

          if (subscription.status === 'active' || subscription.status === 'trialing') {
            user.plan = 'pro';
          } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
            user.plan = 'free';
          }
          await user.save();
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        let user = await User.findOne({ stripeSubscriptionId: subscription.id });
        if (!user && subscription.customer) {
          user = await User.findOne({ stripeCustomerId: subscription.customer });
        }

        if (user) {
          user.plan = 'free';
          user.status = subscription.status || 'canceled';
          user.cancelAtPeriodEnd = false;
          await user.save();
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        let user = null;
        if (invoice.subscription) {
          user = await User.findOne({ stripeSubscriptionId: invoice.subscription });
        }
        if (!user && invoice.customer) {
          user = await User.findOne({ stripeCustomerId: invoice.customer });
        }

        if (user) {
          user.status = 'past_due';
          await user.save();
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook event:', error);
    res.status(500).json({ message: 'Webhook processing error' });
  }
};
