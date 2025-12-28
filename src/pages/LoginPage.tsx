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
import { Heart, Eye, EyeOff } from 'lucide-react';

type UserRole = 'admin' | 'doctor' | 'patient';

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

    try {
      // Call login API — send JSON object (axios will serialize)
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        data: { email, password },
        auth: false,
      });

      const user = res.user || res.data?.user || res;
      // Fetch wrapped vault key separately (requires MFA confirmation). The server issues HttpOnly cookie on login.
      const key_data = await apiFetch({ path: '/vault/key', method: 'GET', headers: { 'X-MFA-Verified': 'true' } }).catch(() => null);
      if (!user) throw new Error('Invalid login response');

      // Unwrap master key using the password provided by the user
      let masterKey: CryptoKey | null = null;
      if (key_data && key_data.encrypted_master_key) {
          try {
          const wrappedBlob = {
            cipher_text: key_data.encrypted_master_key,
            iv: key_data.key_encryption_iv,
            salt: key_data.key_derivation_salt,
          };

          masterKey = await unwrapMasterKey(wrappedBlob, password);
          // Vault unlocked
        } catch (err) {
          console.error('Failed to unwrap key:', err);
          toast({ variant: 'destructive', title: 'Decryption Failed', description: 'Could not unlock your medical records.' });
          return;
        }
      } else {
        console.warn('No encryption key found for this user.');
        toast({ title: 'Legacy Account', description: 'No encryption key available for this account.' });
        return;
      }

      // Complete login: server sets HttpOnly cookie; store user and masterKey in memory only
      login(user, masterKey as CryptoKey);

      toast({ title: 'Welcome back!', description: 'Secure session established.' });
      // Role-aware routing
      const role = (user.role as UserRole) || 'patient';
      if (role === 'admin') navigate('/admin-dashboard', { replace: true });
      else if (role === 'doctor') navigate('/doctor/dashboard', { replace: true });
      else if (role === 'patient') navigate('/patient/dashboard', { replace: true });
      else navigate(from, { replace: true });

    } catch (error: any) {
      // Detailed debug logging for login failures
      // eslint-disable-next-line no-console
      console.error('FULL LOGIN ERROR OBJECT:', error);
      if (error && error.response) {
        // eslint-disable-next-line no-console
        console.log('SERVER DATA:', error.response.data);
      } else {
        // eslint-disable-next-line no-console
        console.log('NETWORK/CORS ERROR DETECTED');
      }
      toast({
        title: 'Login Failed',
        description: (error as any)?.message || 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Demo accounts removed for production security


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

            {/* Demo accounts removed in production build */}

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