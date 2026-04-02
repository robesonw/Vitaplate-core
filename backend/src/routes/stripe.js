import { Router } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_TO_PLAN = {
  [process.env.STRIPE_PRICE_PRO]:     { plan: 'pro',     limit: 3 },
  [process.env.STRIPE_PRICE_PREMIUM]: { plan: 'premium', limit: 999 },
};

const router = Router();

// POST /api/stripe/create-checkout — create Stripe checkout session
router.post('/create-checkout', requireAuth, async (req, res) => {
  try {
    const { planId } = req.body; // 'pro' | 'premium'
    const priceId = planId === 'premium' ? process.env.STRIPE_PRICE_PREMIUM : process.env.STRIPE_PRICE_PRO;

    const session = await stripe.checkout.sessions.create({
      mode:               'subscription',
      payment_method_types: ['card'],
      line_items:         [{ price: priceId, quantity: 1 }],
      success_url:        `${process.env.FRONTEND_URL}/Dashboard?subscription=success`,
      cancel_url:         `${process.env.FRONTEND_URL}/Pricing`,
      customer_email:     req.user.email,
      metadata:           { user_email: req.user.email, user_id: req.userId, plan_id: planId },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stripe/webhook — handle Stripe events
router.post('/webhook', async (req, res) => {
  const sig     = req.headers['stripe-signature'];
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Stripe event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session   = event.data.object;
        const userEmail = session.metadata?.user_email;
        const planId    = session.metadata?.plan_id ?? 'pro';
        const priceId   = session.line_items?.data?.[0]?.price?.id;
        const planInfo  = PRICE_TO_PLAN[priceId] ?? { plan: planId, limit: 3 };

        if (userEmail) {
          const user = await prisma.user.findUnique({ where: { email: userEmail } });
          if (user) {
            await prisma.userSettings.upsert({
              where:  { userId: user.id },
              create: { userId: user.id, subscriptionPlan: planInfo.plan, subscriptionStatus: 'trialing', stripeCustomerId: session.customer, stripeSubscriptionId: session.subscription, aiCreditsLimit: planInfo.limit },
              update: { subscriptionPlan: planInfo.plan, subscriptionStatus: 'trialing', stripeCustomerId: session.customer, stripeSubscriptionId: session.subscription, aiCreditsLimit: planInfo.limit },
            });
            await prisma.notification.create({
              data: { userId: user.id, type: 'subscription_started', title: 'Welcome to VitaPlate Pro! 🎉', message: `Your ${planInfo.plan} plan is now active. You have ${planInfo.limit} AI meal generations per month.`, actionUrl: '/Dashboard' },
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub       = event.data.object;
        const userEmail = sub.metadata?.user_email;
        const priceId   = sub.items?.data[0]?.price?.id;
        const planInfo  = PRICE_TO_PLAN[priceId] ?? { plan: 'free', limit: 1 };

        if (userEmail) {
          const user = await prisma.user.findUnique({ where: { email: userEmail } });
          if (user) {
            await prisma.userSettings.update({
              where: { userId: user.id },
              data:  { subscriptionPlan: planInfo.plan, subscriptionStatus: sub.status, aiCreditsLimit: planInfo.limit },
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub       = event.data.object;
        const userEmail = sub.metadata?.user_email;

        if (userEmail) {
          const user = await prisma.user.findUnique({ where: { email: userEmail } });
          if (user) {
            await prisma.userSettings.update({
              where: { userId: user.id },
              data:  { subscriptionPlan: 'free', subscriptionStatus: 'canceled', aiCreditsLimit: 1 },
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice   = event.data.object;
        const userEmail = invoice.customer_email;
        if (userEmail) {
          const user = await prisma.user.findUnique({ where: { email: userEmail } });
          if (user) {
            await prisma.userSettings.update({ where: { userId: user.id }, data: { subscriptionStatus: 'past_due' } });
            await prisma.notification.create({
              data: { userId: user.id, type: 'payment_failed', title: 'Payment Failed', message: 'Your subscription payment failed. Please update your payment method to keep access.', actionUrl: '/Settings' },
            });
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  res.json({ received: true });
});

export default router;
