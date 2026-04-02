import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const plans = [
  {
    name: 'Starter',
    price: 0,
    period: 'Forever Free',
    description: 'Get started with the referral program',
    maxClients: 0,
    features: [
      'Unique referral code',
      'Share patient link',
      'Track patient signups',
      '$2 per patient commission',
      'View patient directory'
    ],
    cta: 'Get Started',
    stripe_price_id: null,
    popular: false
  },
  {
    name: 'Pro Practitioner',
    price: 49,
    period: '/month',
    description: 'Manage multiple client accounts',
    maxClients: 10,
    features: [
      'Everything in Starter',
      'Manage up to 10 clients',
      'View client lab results',
      'View nutrition logs',
      'Create custom meal plans',
      'Messaging with clients',
      'Private practice notes',
      'Client health dashboards'
    ],
    cta: 'Upgrade to Pro',
    stripe_price_id: 'price_pro_practitioner', // Will be configured in Stripe
    popular: true
  },
  {
    name: 'Elite Practitioner',
    price: 99,
    period: '/month',
    description: 'Unlimited client management',
    maxClients: null,
    features: [
      'Everything in Pro',
      'Unlimited clients',
      'Advanced analytics',
      'Client progress reports',
      'API access for integrations',
      'Priority support',
      'Custom branding options',
      'Team member access'
    ],
    cta: 'Upgrade to Elite',
    stripe_price_id: 'price_elite_practitioner', // Will be configured in Stripe
    popular: false
  }
];

export default function PractitionerPricing() {
  const [isLoading, setIsLoading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: userSettings } = useQuery({
    queryKey: ['userSettings', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const settings = await base44.entities.UserSettings.filter({
        created_by: user.email
      });
      return settings.length > 0 ? settings[0] : null;
    },
    enabled: !!user?.email
  });

  const currentPlan = userSettings?.subscription_plan || 'free';

  const handleCheckout = async (plan) => {
    if (!plan.stripe_price_id) {
      toast.info('You already have access to this plan');
      return;
    }

    if (currentPlan === plan.name.toLowerCase().replace(' ', '_')) {
      toast.info(`You're already on the ${plan.name} plan`);
      return;
    }

    setIsLoading(true);

    try {
      // Check if running in iframe
      if (window.self !== window.top) {
        toast.error('Checkout only works from the published app. Please visit the app directly.');
        setIsLoading(false);
        return;
      }

      const res = await base44.functions.invoke('createCheckoutSession', {
        plan_name: plan.name,
        price_id: plan.stripe_price_id,
        plan_type: 'practitioner'
      });

      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Practitioner Plans</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Scale your practice with VitaPlate. Manage multiple clients, track outcomes, and grow your referral earnings.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, idx) => (
            <Card
              key={idx}
              className={`relative flex flex-col ${
                plan.popular
                  ? 'border-indigo-500 shadow-2xl md:scale-105'
                  : 'border-slate-200'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600">
                  Most Popular
                </Badge>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col space-y-6">
                {/* Pricing */}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                    <span className="text-slate-600">{plan.period}</span>
                  </div>
                  {plan.maxClients !== null && (
                    <p className="text-sm text-slate-600 mt-2">
                      Up to {plan.maxClients} client{plan.maxClients !== 1 ? 's' : ''}
                    </p>
                  )}
                  {plan.maxClients === null && (
                    <p className="text-sm text-slate-600 mt-2">Unlimited clients</p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3 flex-1">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button
                  onClick={() => handleCheckout(plan)}
                  disabled={isLoading || currentPlan === plan.name.toLowerCase().replace(' ', '_')}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'variant outline'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : currentPlan === plan.name.toLowerCase().replace(' ', '_') ? (
                    'Current Plan'
                  ) : (
                    plan.cta
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Can I change plans anytime?</h4>
              <p className="text-slate-700">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">What payment methods do you accept?</h4>
              <p className="text-slate-700">
                We accept all major credit cards, Apple Pay, and Google Pay through Stripe.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">How do client commissions work?</h4>
              <p className="text-slate-700">
                You earn $2/month for each active patient who maintains a Pro subscription on VitaPlate. Payments are processed monthly.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Do I need a practitioner account to earn commissions?</h4>
              <p className="text-slate-700">
                No! You can start earning commissions with the free Starter plan. Pro and Elite plans add client management features.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Is there a contract or commitment?</h4>
              <p className="text-slate-700">
                No contracts. Cancel anytime. You'll have access to your account through the end of your current billing period.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}