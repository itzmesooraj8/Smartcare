import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Arrow */}
            <div className="mb-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Back
                </Link>
              </Button>
            </div>
            {/* ...existing code... */}

            <div className="grid gap-6">
              {/* Profile Header */}
              <Card className="shadow-card">
                <CardHeader>
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 rounded-full medical-gradient flex items-center justify-center">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{user?.name}</CardTitle>
                      <CardDescription className="text-lg capitalize">
                        {user?.role} • SmartCare Patient
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Personal Information */}
              <Card className="shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Personal Information</CardTitle>
                    <Button size="sm" variant="outline">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="flex items-center text-sm font-medium">
                        <User className="mr-2 h-4 w-4" />
                        Full Name
                      </Label>
                      <Input 
                        id="fullName" 
                        value={user?.name || ''} 
                        readOnly 
                        className="bg-muted/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center text-sm font-medium">
                        <Mail className="mr-2 h-4 w-4" />
                        Email Address
                      </Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={user?.email || ''} 
                        readOnly 
                        className="bg-muted/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center text-sm font-medium">
                        <Phone className="mr-2 h-4 w-4" />
                        Phone Number
                      </Label>
                      <Input 
                        id="phone" 
                        value={user?.phone || 'Not provided'} 
                        readOnly 
                        className="bg-muted/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="flex items-center text-sm font-medium">
                        <Calendar className="mr-2 h-4 w-4" />
                        Date of Birth
                      </Label>
                      <Input 
                        id="dateOfBirth" 
                        value={user?.dateOfBirth || 'Not provided'} 
                        readOnly 
                        className="bg-muted/30"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address" className="flex items-center text-sm font-medium">
                        <MapPin className="mr-2 h-4 w-4" />
                        Address
                      </Label>
                      <Input 
                        id="address" 
                        value={user?.address || 'Not provided'} 
                        readOnly 
                        className="bg-muted/30"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card className="shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Emergency Contact</CardTitle>
                    <Button size="sm" variant="outline">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyName">Contact Name</Label>
                      <Input 
                        id="emergencyName" 
                        placeholder="Enter emergency contact name"
                        className="bg-muted/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Contact Phone</Label>
                      <Input 
                        id="emergencyPhone" 
                        placeholder="Enter emergency contact phone"
                        className="bg-muted/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyRelation">Relationship</Label>
                      <Input 
                        id="emergencyRelation" 
                        placeholder="e.g., Spouse, Parent, Sibling"
                        className="bg-muted/30"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <Button variant="outline">
                  Cancel
                </Button>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default ProfilePage;