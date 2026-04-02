import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle2, Users, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function PractitionerSignup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    profession: '',
    license_number: '',
    practice_location: '',
    practice_name: '',
    website: '',
    bio: '',
    specialties: [],
    patients_per_month: 0,
    payment_method: 'paypal'
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name || !formData.email || !formData.profession || !formData.practice_location) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // Check if application already exists
      const existing = await base44.entities.PractitionerApplication.filter({
        email: formData.email
      });

      if (existing.length > 0) {
        toast.error('An application with this email already exists');
        setIsLoading(false);
        return;
      }

      // Create application
      await base44.entities.PractitionerApplication.create({
        ...formData,
        status: 'pending',
        show_in_directory: true
      });

      toast.success('Application submitted! We\'ll review it within 2 business days.');
      navigate('/');
    } catch (error) {
      toast.error('Failed to submit application');
      console.error('Submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            VitaPlate Practitioner Program
          </h1>
          <p className="text-xl text-slate-600">
            Recommend personalized nutrition to your patients and earn commissions
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <Users className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Manage Referrals</h3>
              <p className="text-sm text-slate-600">
                Track all patient referrals in one dashboard with unique practitioner codes
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <DollarSign className="w-8 h-8 text-emerald-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Earn Commissions</h3>
              <p className="text-sm text-slate-600">
                $2/month per active patient. Paid monthly via PayPal or bank transfer
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <TrendingUp className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Patient Insights</h3>
              <p className="text-sm text-slate-600">
                View patient lab results and nutrition data (with their consent)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Apply for Practitioner Program</CardTitle>
            <CardDescription>
              Fill out the form below to join our network of healthcare practitioners
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 text-sm">Personal Information</h3>
                <div className="space-y-4">
                  <Input
                    placeholder="Full Name *"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email Address *"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* Professional Info */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 text-sm">Professional Information</h3>
                <div className="space-y-4">
                  <Select value={formData.profession} onValueChange={(value) => handleInputChange('profession', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Profession *" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registered_dietitian">Registered Dietitian (RD)</SelectItem>
                      <SelectItem value="nutritionist">Nutritionist</SelectItem>
                      <SelectItem value="doctor">Doctor (MD/DO)</SelectItem>
                      <SelectItem value="nurse_practitioner">Nurse Practitioner</SelectItem>
                      <SelectItem value="health_coach">Health Coach</SelectItem>
                      <SelectItem value="wellness_consultant">Wellness Consultant</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="License/Certification Number"
                    value={formData.license_number}
                    onChange={(e) => handleInputChange('license_number', e.target.value)}
                  />

                  <Input
                    placeholder="Practice Location (City, State) *"
                    value={formData.practice_location}
                    onChange={(e) => handleInputChange('practice_location', e.target.value)}
                    required
                  />

                  <Input
                    placeholder="Practice/Organization Name"
                    value={formData.practice_name}
                    onChange={(e) => handleInputChange('practice_name', e.target.value)}
                  />

                  <Input
                    placeholder="Website (optional)"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* About Your Practice */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 text-sm">About Your Practice</h3>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Brief professional bio (for directory listing)"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="h-24"
                  />

                  <Input
                    type="number"
                    placeholder="Est. new patients per month"
                    value={formData.patients_per_month}
                    onChange={(e) => handleInputChange('patients_per_month', Number(e.target.value))}
                    min="0"
                  />

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Areas of Specialization
                    </label>
                    <Textarea
                      placeholder="e.g., Diabetes management, Weight loss, Heart health, Inflammation management"
                      value={formData.specialties.join(', ')}
                      onChange={(e) => handleInputChange('specialties', e.target.value.split(',').map(s => s.trim()))}
                      className="h-20"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Info */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 text-sm">Payment Preference</h3>
                <Select value={formData.payment_method} onValueChange={(value) => handleInputChange('payment_method', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer (ACH)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-2">
                  You'll provide payment details after approval
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Application
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-500 text-center">
                Applications are reviewed within 2 business days. You'll receive an email with your unique practitioner code once approved.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="mt-8 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">How do I earn commissions?</h4>
              <p className="text-sm text-slate-600">
                You earn $2/month for each patient who signs up with your referral code and maintains an active Pro subscription.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">When will I get paid?</h4>
              <p className="text-sm text-slate-600">
                Earnings are calculated monthly and paid on the 15th via PayPal or bank transfer.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Can I see my patients' data?</h4>
              <p className="text-sm text-slate-600">
                Patients choose whether to share their data with you when they sign up. You'll only see lab results, nutrition data, and progress metrics for patients who consent.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Do I need a license?</h4>
              <p className="text-sm text-slate-600">
                We welcome all healthcare professionals including RDs, MDs, nurses, health coaches, and wellness consultants. Professional credentials are verified during application.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}