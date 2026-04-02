import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Loader2, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

const pricingTiers = [
  { min: 10, max: 50, pricePerSeat: 7 },
  { min: 50, max: 200, pricePerSeat: 5 },
  { min: 200, max: Infinity, pricePerSeat: null, label: 'Contact for quote' }
];

export default function CorporateSignup() {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    industry: '',
    website: '',
    employee_count: 10
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const employeeCount = formData.employee_count || 10;
  const tier = pricingTiers.find(t => employeeCount >= t.min && employeeCount < t.max);
  const monthlyPrice = tier?.pricePerSeat ? (employeeCount * tier.pricePerSeat) : null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.contact_email || !formData.contact_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send email to VitaPlate team
      await base44.integrations.Core.SendEmail({
        to: 'corporate@vitaplate.app', // Update with actual email
        subject: `New Corporate Wellness Inquiry: ${formData.company_name}`,
        body: `
Company: ${formData.company_name}
Contact: ${formData.contact_name}
Email: ${formData.contact_email}
Phone: ${formData.contact_phone}
Industry: ${formData.industry}
Website: ${formData.website}
Employee Count: ${employeeCount}
Estimated Monthly Cost: $${monthlyPrice || 'Custom pricing'}

Please follow up with this prospect.
        `
      });

      // Send confirmation email to user
      await base44.integrations.Core.SendEmail({
        to: formData.contact_email,
        subject: 'VitaPlate Corporate Wellness Program - Demo Request Received',
        body: `
Hi ${formData.contact_name},

Thank you for your interest in VitaPlate's Corporate Wellness Program!

We received your request for ${employeeCount} employees. Based on your company size, your estimated monthly cost would be $${monthlyPrice || 'custom pricing'}.

A member of our team will contact you within 1-2 business days to schedule a demo and discuss your organization's wellness goals.

Best regards,
The VitaPlate Team
        `
      });

      setSubmitted(true);
      toast.success('Request received! Check your email.');

      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          company_name: '',
          contact_name: '',
          contact_email: '',
          contact_phone: '',
          industry: '',
          website: '',
          employee_count: 10
        });
      }, 5000);
    } catch (error) {
      toast.error('Failed to submit request');
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold mb-4">Corporate Wellness Made Simple</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Give your employees access to personalized nutrition guidance. Reduce healthcare costs and boost productivity with VitaPlate's corporate wellness program.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-slate-200">
            <CardContent className="p-8">
              <TrendingUp className="w-10 h-10 text-indigo-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Improved Health Outcomes</h3>
              <p className="text-sm text-slate-600">
                Personalized nutrition plans reduce chronic disease risk and improve employee wellbeing scores.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-8">
              <BarChart3 className="w-10 h-10 text-emerald-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Cost Savings</h3>
              <p className="text-sm text-slate-600">
                Reduce absenteeism, healthcare claims, and insurance premiums. Save $3-4 for every $1 spent on wellness.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-8">
              <Users className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Employee Retention</h3>
              <p className="text-sm text-slate-600">
                Wellness benefits are top reason employees choose employers. Boost satisfaction and loyalty.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Calculator + Form */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Pricing Calculator */}
          <Card className="border-indigo-200 h-fit sticky top-6">
            <CardHeader>
              <CardTitle>Pricing Calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Number of Employees
                </label>
                <Input
                  type="number"
                  min="10"
                  max="10000"
                  value={employeeCount}
                  onChange={(e) => handleInputChange('employee_count', Math.max(10, Number(e.target.value)))}
                  className="text-lg"
                />
              </div>

              <Separator />

              {/* Pricing Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                  <span className="text-sm text-slate-700">
                    {employeeCount} employees × {tier?.pricePerSeat ? `$${tier.pricePerSeat}/month` : 'Custom'}
                  </span>
                  {monthlyPrice && (
                    <span className="font-bold text-lg text-indigo-600">${monthlyPrice}/mo</span>
                  )}
                </div>

                {/* Annual Savings */}
                {monthlyPrice && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-xs text-emerald-700 mb-1">Annual Commitment Savings</p>
                    <p className="font-bold text-lg text-emerald-700">
                      Save ${Math.round(monthlyPrice * 12 * 0.1)}/year
                    </p>
                  </div>
                )}
              </div>

              {/* Tier Badge */}
              <div>
                <p className="text-xs text-slate-600 mb-2">Your Tier:</p>
                {employeeCount < 200 ? (
                  <Badge className="bg-indigo-100 text-indigo-700">
                    ${tier?.pricePerSeat}/employee/month
                  </Badge>
                ) : (
                  <Badge variant="outline">Custom Pricing</Badge>
                )}
              </div>

              {/* Tier Info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                {employeeCount <= 50 && (
                  <>
                    <p className="font-semibold mb-1">10-50 Employees: $7/user/month</p>
                    <p>30% discount vs. individual Pro plan</p>
                  </>
                )}
                {employeeCount > 50 && employeeCount < 200 && (
                  <>
                    <p className="font-semibold mb-1">50-200 Employees: $5/user/month</p>
                    <p>43% discount vs. individual Pro plan</p>
                  </>
                )}
                {employeeCount >= 200 && (
                  <>
                    <p className="font-semibold mb-1">200+ Employees: Custom Pricing</p>
                    <p>Contact our enterprise team for special rates</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Signup Form */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Request a Demo</CardTitle>
              <CardDescription>
                Get a personalized walkthrough of VitaPlate for your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-slate-900 mb-2">Request Received!</h3>
                  <p className="text-slate-600">
                    A member of our team will contact you within 1-2 business days.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Company Name *"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    required
                  />

                  <Input
                    placeholder="Your Name *"
                    value={formData.contact_name}
                    onChange={(e) => handleInputChange('contact_name', e.target.value)}
                    required
                  />

                  <Input
                    type="email"
                    placeholder="Email Address *"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    required
                  />

                  <Input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  />

                  <Input
                    placeholder="Industry"
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                  />

                  <Input
                    placeholder="Company Website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Request Demo'
                    )}
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    No credit card required. We'll send you a personalized demo link.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            What's Included
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 text-lg">For Employees</h3>
              <ul className="space-y-3">
                {[
                  'Personalized meal plans based on health goals',
                  'AI nutrition coach available 24/7',
                  'Recipe library with 10,000+ options',
                  'Lab result tracking & biomarker monitoring',
                  'Integration with wearables (Apple Health, Oura)',
                  'Progress photos & body measurements',
                  'Community & social challenges'
                ].map((feature, i) => (
                  <li key={i} className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 text-lg">For HR Admins</h3>
              <ul className="space-y-3">
                {[
                  'Easy employee onboarding & management',
                  'Aggregate health metrics (anonymized)',
                  'Engagement & utilization analytics',
                  'Wellness program ROI tracking',
                  'Monthly/quarterly reporting',
                  'Dedicated account manager',
                  'Single billing & invoice management',
                  'SSO & compliance ready'
                ].map((feature, i) => (
                  <li key={i} className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}