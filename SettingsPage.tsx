import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings, 
  Bell, 
  Shield, 
  Smartphone, 
  Mail, 
  Lock, 
  Eye, 
  Download,
  Trash2
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Settings
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage your account preferences and privacy settings.
              </p>
            </div>

            <div className="grid gap-6">
              {/* Notification Preferences */}
              <Card className="shadow-card">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">Notification Preferences</CardTitle>
                  </div>
                  <CardDescription>
                    Choose how you want to receive notifications about your healthcare.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <Label htmlFor="email-notifications" className="text-sm font-medium">
                          Email Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive appointment reminders and updates via email
                        </p>
                      </div>
                    </div>
                    <Switch id="email-notifications" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <Label htmlFor="sms-notifications" className="text-sm font-medium">
                          SMS Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive text messages for urgent updates and reminders
                        </p>
                      </div>
                    </div>
                    <Switch id="sms-notifications" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <Label htmlFor="push-notifications" className="text-sm font-medium">
                          Push Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications in your browser
                        </p>
                      </div>
                    </div>
                    <Switch id="push-notifications" defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Privacy & Security */}
              <Card className="shadow-card">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">Privacy & Security</CardTitle>
                  </div>
                  <CardDescription>
                    Manage your privacy settings and account security.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <Label htmlFor="profile-visibility" className="text-sm font-medium">
                          Profile Visibility
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Allow healthcare providers to view your profile
                        </p>
                      </div>
                    </div>
                    <Switch id="profile-visibility" defaultChecked />
                  </div>

                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="mr-2 h-4 w-4" />
                      Two-Factor Authentication
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card className="shadow-card">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Download className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">Data Management</CardTitle>
                  </div>
                  <CardDescription>
                    Download or manage your personal data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Download My Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Account Type</Label>
                      <p className="font-medium capitalize">{user?.role}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Member Since</Label>
                      <p className="font-medium">January 2024</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Last Login</Label>
                      <p className="font-medium">Today at 10:30 AM</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Account Status</Label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        Active
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default SettingsPage;