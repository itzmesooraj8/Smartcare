import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useEncryption } from '@/hooks/useEncryption';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Eye, EyeOff } from 'lucide-react';

type UserRole = 'admin' | 'doctor' | 'patient';

type DemoCredentials = Record<UserRole, { email: string; password: string }>;

const MOCK_AUTH_ENABLED = import.meta.env.DEV || import.meta.env.VITE_MOCK_AUTH === 'true';

const DEMO_CREDENTIALS: DemoCredentials = {
  patient: {
    email: import.meta.env.VITE_DEMO_PATIENT_EMAIL || 'demo.patient@smartcare.app',
    password: import.meta.env.VITE_DEMO_PATIENT_PASSWORD || 'demo1234',
  },
  doctor: {
    email: import.meta.env.VITE_DEMO_DOCTOR_EMAIL || 'demo.doctor@smartcare.app',
    password: import.meta.env.VITE_DEMO_DOCTOR_PASSWORD || 'demo1234',
  },
  admin: {
    email: import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'demo.admin@smartcare.app',
    password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'demo1234',
  },
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const { unwrapMasterKey } = useEncryption();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const runLogin = async (loginEmail: string, loginPassword: string, roleOverride?: UserRole) => {
    try {
      if (MOCK_AUTH_ENABLED) {
        await login(loginEmail, loginPassword, null);
        const resolvedRole = roleOverride || (loginEmail.includes('admin') ? 'admin' : loginEmail.includes('doctor') ? 'doctor' : 'patient');
        toast({ title: 'Welcome back!', description: 'Mock mode is enabled for local demos.' });
        if (resolvedRole === 'admin') navigate('/admin-dashboard', { replace: true });
        else if (resolvedRole === 'doctor') navigate('/doctor/dashboard', { replace: true });
        else if (resolvedRole === 'patient') navigate('/patient/dashboard', { replace: true });
        else navigate(from, { replace: true });
        return;
      }

      const res = await apiFetch({
        url: '/auth/login',
        method: 'POST',
        data: { email: loginEmail, password: loginPassword },
      });

      const payload = (res as any)?.data ?? res;
      const user = (payload as any)?.user ?? payload;
      const key_data = await apiFetch({ url: '/vault/key', method: 'GET' }).catch(() => null);
      if (!user) throw new Error('Invalid login response');

      let masterKey: CryptoKey | null = null;
      if (key_data && key_data.encrypted_master_key) {
        try {
          const wrappedBlob = {
            cipher_text: key_data.encrypted_master_key,
            iv: key_data.key_encryption_iv,
            salt: key_data.key_derivation_salt,
          };

          masterKey = await unwrapMasterKey(wrappedBlob, loginPassword);
        } catch (err) {
          console.error('Failed to unwrap key:', err);
          toast({ variant: 'destructive', title: 'Decryption Failed', description: 'Could not unlock your medical records.' });
          return;
        }
      }

      await login(loginEmail, loginPassword, masterKey as CryptoKey);

      toast({ title: 'Welcome back!', description: 'Secure session established.' });
      const userRole = (user.role as UserRole) || 'patient';
      if (userRole === 'admin') navigate('/admin-dashboard', { replace: true });
      else if (userRole === 'doctor') navigate('/doctor/dashboard', { replace: true });
      else if (userRole === 'patient') navigate('/patient/dashboard', { replace: true });
      else navigate(from, { replace: true });

    } catch (error: any) {
      console.error('FULL LOGIN ERROR OBJECT:', error);
      if (error && error.response) {
        console.log('SERVER DATA:', error.response.data);
        console.log('SERVER STATUS:', error.response.status);
        if (error.response.status === 500) {
          toast({
            title: 'Server Error',
            description: 'Backend encountered an internal error (500). Check server logs and secrets.',
            variant: 'destructive',
          });
        }
      } else {
        console.log('NETWORK/CORS ERROR DETECTED');
      }
      toast({
        title: 'Login Failed',
        description: (error as any)?.message || 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    await runLogin(email, password, role);
  };

  const handleDemoLogin = async (demoRole: UserRole) => {
    const creds = DEMO_CREDENTIALS[demoRole];

    setRole(demoRole);
    setEmail(creds.email);
    setPassword(creds.password);

    await runLogin(creds.email, creds.password, demoRole);
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
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your SmartCare account to access your healthcare dashboard
            </CardDescription>
          </CardHeader >
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Account Type</Label>
                <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <div className="flex items-center justify-between">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="space-y-2 rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Try Demo</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    onClick={() => handleDemoLogin('patient')}
                  >
                    Patient Demo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    onClick={() => handleDemoLogin('doctor')}
                  >
                    Doctor Demo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    onClick={() => handleDemoLogin('admin')}
                  >
                    Admin Demo
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" text="" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Create one now
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

export default LoginPage;