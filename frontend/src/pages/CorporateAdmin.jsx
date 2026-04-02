import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Users, BarChart3, CreditCard, Download, Plus, Loader2, Mail, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CorporateAdmin() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteDepartment, setInviteDepartment] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: corporate } = useQuery({
    queryKey: ['corporateAccount', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const accounts = await base44.entities.CorporateAccount.filter({
        admin_email: user.email
      });
      return accounts.length > 0 ? accounts[0] : null;
    },
    enabled: !!user?.email
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['corporateEmployees', corporate?.id],
    queryFn: async () => {
      if (!corporate?.id) return [];
      return await base44.entities.CorporateEmployee.filter({
        corporate_account_id: corporate.id
      });
    },
    enabled: !!corporate?.id
  });

  const handleInviteEmployee = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    setIsInviting(true);

    try {
      // Create employee record
      await base44.entities.CorporateEmployee.create({
        corporate_account_id: corporate.id,
        employee_email: inviteEmail,
        employee_name: inviteName || inviteEmail,
        department: inviteDepartment || '',
        status: 'invited',
        invitation_sent_date: new Date().toISOString().split('T')[0]
      });

      // Send invitation email
      await base44.integrations.Core.SendEmail({
        to: inviteEmail,
        subject: `You're Invited to VitaPlate via ${corporate.company_name}`,
        body: `
Hi ${inviteName || 'there'},

${corporate.company_name} has invited you to join VitaPlate, a personalized nutrition platform designed to help you achieve your health goals.

As an employee, you get full access to VitaPlate Pro at no cost - it's provided as a wellness benefit by your company!

Click here to get started: [signup_link_here]

What you get:
• Personalized meal plans
• AI nutrition coach
• Lab result tracking
• Recipe library with 10,000+ options
• Integration with health apps

Enjoy!
        `
      });

      toast.success('Invitation sent!');
      setInviteEmail('');
      setInviteName('');
      setInviteDepartment('');
      setShowInviteDialog(false);
    } catch (error) {
      toast.error('Failed to send invitation');
      console.error('Invite error:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const invitedEmployees = employees.filter(e => e.status === 'invited').length;
  const seatsUsed = employees.filter(e => e.status !== 'cancelled').length;
  const avgHealthScore = employees.filter(e => e.health_score).length > 0
    ? Math.round(employees.filter(e => e.health_score).reduce((sum, e) => sum + e.health_score, 0) / employees.filter(e => e.health_score).length)
    : 0;

  if (!corporate) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-slate-600 mb-4">No corporate account found</p>
          <Button>Create Corporate Account</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{corporate.company_name}</h1>
        <p className="text-slate-600 mt-1">Corporate Wellness Dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <Users className="w-5 h-5 text-blue-600 mb-2" />
            <p className="text-sm text-slate-600 mb-1">Seats Used</p>
            <p className="text-3xl font-bold text-slate-900">
              {seatsUsed}/{corporate.seat_count}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <Mail className="w-5 h-5 text-emerald-600 mb-2" />
            <p className="text-sm text-slate-600 mb-1">Active Employees</p>
            <p className="text-3xl font-bold text-slate-900">{activeEmployees}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <BarChart3 className="w-5 h-5 text-indigo-600 mb-2" />
            <p className="text-sm text-slate-600 mb-1">Avg Health Score</p>
            <p className="text-3xl font-bold text-slate-900">{avgHealthScore}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <CreditCard className="w-5 h-5 text-purple-600 mb-2" />
            <p className="text-sm text-slate-600 mb-1">Monthly Cost</p>
            <p className="text-3xl font-bold text-slate-900">${corporate.total_monthly_cost}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Employee Management</CardTitle>
                <CardDescription>{employees.length} total employees</CardDescription>
              </div>
              <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Invite Employee
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Employee</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Department</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Joined</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Last Active</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => (
                      <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-slate-900">{emp.employee_name || emp.employee_email}</p>
                            <p className="text-xs text-slate-500">{emp.employee_email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600">{emp.department || '—'}</td>
                        <td className="py-4 px-4">
                          <Badge className={emp.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                            {emp.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600">
                          {emp.signup_date ? new Date(emp.signup_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600">
                          {emp.last_active_date ? new Date(emp.last_active_date).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="py-4 px-4">
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-700">Active Users</span>
                    <span className="font-semibold text-slate-900">{activeEmployees}/{activeEmployees + invitedEmployees}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600"
                      style={{ width: `${activeEmployees > 0 ? (activeEmployees / (activeEmployees + invitedEmployees)) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-slate-700">Pending Invitations: {invitedEmployees}</p>
                  <p className="text-xs text-slate-600">
                    {invitedEmployees} employees are waiting to accept their invitations
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Health Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-700">Avg Health Score</span>
                    <span className="font-semibold text-slate-900">{avgHealthScore}/100</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600"
                      style={{ width: `${avgHealthScore}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Excellent (80+)</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {employees.filter(e => e.health_score >= 80).length}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Good (60-79)</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {employees.filter(e => e.health_score >= 60 && e.health_score < 80).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Current Plan</label>
                  <p className="text-lg font-semibold text-slate-900 mb-4">
                    {corporate.seat_count} Seats @ ${corporate.price_per_seat}/month
                  </p>

                  <label className="text-sm font-medium text-slate-700 mb-1 block">Monthly Cost</label>
                  <p className="text-2xl font-bold text-slate-900">${corporate.total_monthly_cost}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Billed on the {new Date(corporate.billing_period_start).getDate()}th of each month
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Next Billing Date</label>
                  <p className="text-slate-900 mb-4">
                    {corporate.billing_period_end ? new Date(corporate.billing_period_end).toLocaleDateString() : 'N/A'}
                  </p>

                  <label className="text-sm font-medium text-slate-700 mb-1 block">Subscription Status</label>
                  <Badge className={corporate.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                    {corporate.subscription_status}
                  </Badge>

                  <Button className="w-full mt-6" variant="outline">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Update Payment Method
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Need more seats?</strong> Contact your account manager to upgrade your plan.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Employee</DialogTitle>
            <DialogDescription>
              Send an invitation to join VitaPlate via {corporate.company_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Email Address *"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              type="email"
            />
            <Input
              placeholder="Full Name"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
            />
            <Input
              placeholder="Department"
              value={inviteDepartment}
              onChange={(e) => setInviteDepartment(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInviteEmployee}
              disabled={isInviting || !inviteEmail.trim()}
              className="gap-2"
            >
              {isInviting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}