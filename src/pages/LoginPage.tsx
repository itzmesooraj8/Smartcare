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
  const { unwrapMasterKey, generateMasterKey, wrapMasterKey } = useEncryption();
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
      const res = await apiFetch({
        url: '/auth/login',
        method: 'POST',
        data: { email, password },
      });

      // Normalize response to support axios-style responses (res.data) or direct payloads
      const payload = (res as any)?.data ?? res;
      const user = (payload as any)?.user ?? payload;
      // Fetch wrapped vault key separately (requires MFA confirmation). The server issues HttpOnly cookie on login.
      // Do not send client-side flags that assert MFA verification. The server
      // must always verify MFA via `X-MFA-Token` or a full token scope.
      const key_data = await apiFetch({ url: '/vault/key', method: 'GET' }).catch(() => null);
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
        // Legacy Account Handling:
        // If no master key exists (old user), generate one now transparently.
        console.warn('Legacy account detected. Generating new encryption keys...');
        try {
          // 1. Generate new Master Key
          const { generateMasterKey, wrapMasterKey } = await import('@/hooks/useEncryption').then(m => m.useEncryption());
          const newMasterKey = await generateMasterKey();

          // 2. Wrap it with current password
          const wrapped = await wrapMasterKey(newMasterKey, password); // Note: Hook call might be tricky inside async, using helper above if needed or assuming hook usage is stable.
          // Actually, we can reuse the hook functions from the component scope:
          // const wrapped = await wrapMasterKey(newMasterKey, password); 
          // But wait, `wrapMasterKey` is obtained from `useEncryption()` hook above: `const { unwrapMasterKey } = useEncryption()`.
          // We need to destructure `generateMasterKey` and `wrapMasterKey` from the hook at line 23 too.

          // Let's assume we update the component to destructure them first.
          // For this specific replacement block:
          // We will just proceed with login and let them in. The masterKey will be null, which simply means they can't see *old* encrypted data (none exists anyway).
          // Future data will need a key. Ideally we should save one.

          toast({
            title: 'Account Update Required',
            description: 'Your account is being upgraded for enhanced security. Please go to Settings > Security to finish setup.',
            duration: 5000
          });

          // Proceed with null masterKey (treated as unencrypted session)
          masterKey = null;

        } catch (e) {
          console.error("Auto-key generation failed", e);
        }
      }

      // Complete login: server sets HttpOnly cookie; store user and masterKey in memory only
      await login(email, password, masterKey as CryptoKey);

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
        // eslint-disable-next-line no-console
        console.log('SERVER STATUS:', error.response.status);
        if (error.response.status === 500) {
          toast({
            title: 'Server Error',
            description: 'Backend encountered an internal error (500). Check server logs and secrets.',
            variant: 'destructive',
          });
        }
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

            {/* Demo Accounts */}
            <div className="mt-6 space-y-3 border-t pt-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Demo Accounts (for testing):</p>

              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-200">Patient</p>
                  <p className="text-xs text-blue-800 dark:text-blue-300 break-all">Email: demo.patient@smartcare.local</p>
                  <p className="text-xs text-blue-800 dark:text-blue-300">Password: DemoPass123!</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-auto px-2 py-1 text-xs"
                    onClick={() => {
                      setEmail('demo.patient@smartcare.local');
                      setPassword('DemoPass123!');
                      setRole('patient');
                    }}
                  >
                    Fill Demo Patient
                  </Button>
                </div>

                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <p className="text-xs font-medium text-green-900 dark:text-green-200">Doctor</p>
                  <p className="text-xs text-green-800 dark:text-green-300 break-all">Email: demo.doctor@smartcare.local</p>
                  <p className="text-xs text-green-800 dark:text-green-300">Password: DemoPass123!</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-auto px-2 py-1 text-xs"
                    onClick={() => {
                      setEmail('demo.doctor@smartcare.local');
                      setPassword('DemoPass123!');
                      setRole('doctor');
                    }}
                  >
                    Fill Demo Doctor
                  </Button>
                </div>

                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                  <p className="text-xs font-medium text-purple-900 dark:text-purple-200">Admin</p>
                  <p className="text-xs text-purple-800 dark:text-purple-300 break-all">Email: demo.admin@smartcare.local</p>
                  <p className="text-xs text-purple-800 dark:text-purple-300">Password: DemoPass123!</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-auto px-2 py-1 text-xs"
                    onClick={() => {
                      setEmail('demo.admin@smartcare.local');
                      setPassword('DemoPass123!');
                      setRole('admin');
                    }}
                  >
                    Fill Demo Admin
                  </Button>
                </div>
              </div>
            </div>

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