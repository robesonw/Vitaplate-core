import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Bell, Shield, Palette, LogOut } from 'lucide-react';
import AffiliateSettings from '../components/settings/AffiliateSettings';
import ReferralSection from '../components/settings/ReferralSection';
import { toast } from 'sonner';

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(true);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  // Load user's weekly digest preference
  useEffect(() => {
    if (user?.weekly_digest_enabled !== undefined) {
      setWeeklyDigestEnabled(user.weekly_digest_enabled);
    }
  }, [user]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = async (checked) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    toast.success(`Dark mode ${checked ? 'enabled' : 'disabled'}`);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const digestMutation = useMutation({
    mutationFn: (enabled) => base44.auth.updateMe({ weekly_digest_enabled: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success(`Weekly digest ${weeklyDigestEnabled ? 'enabled' : 'disabled'}`);
    },
    onError: () => {
      toast.error('Failed to update preference');
      setWeeklyDigestEnabled(!weeklyDigestEnabled);
    },
  });

  const handleDigestToggle = (checked) => {
    setWeeklyDigestEnabled(checked);
    digestMutation.mutate(checked);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">
          Manage your account and application preferences
        </p>
      </div>

      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-2xl">
                  {user?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">Change Avatar</Button>
                <p className="text-sm text-slate-500 mt-2">JPG, GIF or PNG. Max size 2MB</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input defaultValue={user?.full_name} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input defaultValue={user?.email} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Input defaultValue={user?.role} disabled className="capitalize" />
            </div>

            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Manage how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Email Notifications</p>
                <p className="text-sm text-slate-500">Receive meal plan reminders via email</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Weekly Health Digest</p>
                <p className="text-sm text-slate-500">Every Monday morning, get a personalized summary of your nutrition, lab insights, and AI coaching tips</p>
              </div>
              <Switch checked={weeklyDigestEnabled} onCheckedChange={handleDigestToggle} disabled={digestMutation.isPending} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Plan Reminders</p>
                <p className="text-sm text-slate-500">Reminders for upcoming meals</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-600" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize how the app looks and feels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Dark Mode</p>
                <p className="text-sm text-slate-500">Use dark theme throughout the app</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Compact View</p>
                <p className="text-sm text-slate-500">Show more content on screen</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
            
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
            
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" placeholder="••••••••" />
            </div>

            <Button variant="outline">Update Password</Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Referral Program */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <ReferralSection user={user} />
      </motion.div>

      {/* Affiliate Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <AffiliateSettings />
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-rose-200">
          <CardHeader>
            <CardTitle className="text-rose-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-rose-200 bg-rose-50">
              <div>
                <p className="font-medium text-rose-900">Sign Out</p>
                <p className="text-sm text-rose-700">Sign out of your account</p>
              </div>
              <Button variant="outline" onClick={handleLogout} className="border-rose-300 text-rose-700 hover:bg-rose-100">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-rose-200 bg-rose-50">
              <div>
                <p className="font-medium text-rose-900">Delete Account</p>
                <p className="text-sm text-rose-700">Permanently delete your account and all data</p>
              </div>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}