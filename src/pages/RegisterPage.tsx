import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEncryption } from '@/hooks/useEncryption';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Heart, Eye, EyeOff } from 'lucide-react';

type UserRole = 'patient' | 'doctor' | 'admin';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient' as UserRole,
    acceptTerms: false
  });
  // Local state for doctor's license file
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { generateMasterKey, wrapMasterKey } = useEncryption();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.acceptTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    // If registering as a doctor, ensure a license file is provided
    if (formData.role === 'doctor' && !licenseFile) {
      toast({
        title: "License Required",
        description: "Please upload your medical license to register as a doctor.",
        variant: "destructive",
      });
      return;
    }

    // NOTE: current register mock doesn't accept files. In a real app we would send
        // the licenseFile in a multipart/form-data request to the backend here.
        try {
          // Generate and wrap a master key for client-side encryption
          const masterKey = await generateMasterKey();
          const wrapped = await wrapMasterKey(masterKey, formData.password);

          const payload: any = {
            email: formData.email,
            password: formData.password,
            full_name: formData.name,
            role: formData.role,
            encrypted_master_key: wrapped.cipher_text,
            key_encryption_iv: wrapped.iv,
            key_derivation_salt: wrapped.salt,
          };

          await register(payload);
          toast({
            title: "Account Created!",
            description: "Welcome to SmartCare. Your account has been created successfully.",
          });
            // Redirect to role-specific dashboard
            if (formData.role === 'patient') navigate('/patient/dashboard');
            else if (formData.role === 'doctor') navigate('/doctor/dashboard');
            else if (formData.role === 'admin') navigate('/admin-dashboard');
            else navigate('/dashboard');
        } catch (error) {
          toast({
            title: "Registration Failed",
            description: "Something went wrong. Please try again.",
            variant: "destructive",
          });
        }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <span className="text-2xl font-bold text-primary">SmartCare</span>
          </Link>
        </div>

        <Card className="shadow-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Join SmartCare to access personalized healthcare services and manage your health journey
            </CardDescription>
          </CardHeader >
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Account Type</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: UserRole) => handleInputChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient - Access healthcare services</SelectItem>
                    <SelectItem value="doctor">Doctor - Provide medical care</SelectItem>
                    <SelectItem value="admin">Administrator - Manage the system</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Doctor license upload: show only when role is doctor */}
              {formData.role === 'doctor' && (
                <div className="space-y-2">
                  <Label>Medical License</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      id="license"
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0];
                        setLicenseFile(file || null);
                      }}
                    />
                    <label htmlFor="license">
                      <Button type="button" onClick={() => {
                        // trigger file input click by focusing label (native behavior)
                        const input = document.getElementById('license') as HTMLInputElement | null;
                        input?.click();
                      }}>
                        {licenseFile ? 'Change License' : 'Upload License'}
                      </Button>
                    </label>
                    <span className="text-sm text-muted-foreground">{licenseFile ? licenseFile.name : 'No file selected'}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" text="" />
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in here
                </Link>
              </span>
            </div>
          </CardContent>
        </Card >

        <div className="text-center">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-primary transition-smooth"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div >
    </div >
  );
};

export default RegisterPage;