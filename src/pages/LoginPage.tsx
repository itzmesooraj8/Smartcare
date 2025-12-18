import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Eye, EyeOff, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  role: z.enum(['patient', 'doctor', 'admin']).default('patient'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

const LoginPage: React.FC = () => {
  const { login, isLoading, mockLogin, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect') || '/dashboard';

  const rememberedEmail = typeof window !== 'undefined' ? localStorage.getItem('smartcare_remember_email') : null;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'patient', email: rememberedEmail ?? '', password: '', remember: !!rememberedEmail },
    mode: 'onBlur',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [buttonState, setButtonState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Pre-fill role if query param present
    const r = params.get('role');
    if (r === 'doctor' || r === 'admin' || r === 'patient') setValue('role', r);
  }, []);

  const onSubmit = async (data: FormValues) => {
    // Optimistic UI: set a temporary user immediately so navigation appears instant.
    setButtonState('loading');
    const tempUser = {
      id: data.email,
      email: data.email,
      name: data.email.split('@')[0],
      role: data.role as any,
    };

    // Apply optimistic user state locally (will be replaced by real login result)
    try {
      updateUser(tempUser);
    } catch {}

    // Navigate right away for perceived speed; complete login in background.
    navigate(redirect, { replace: true });

    try {
      await login(data.email, data.password, data.remember);
      setButtonState('success');
      toast({ title: 'Welcome back!', description: 'Signed in successfully.' });
    } catch (err: any) {
      // If backend login fails, allow demo access for local/demo accounts
      const demoEmails = demoCredentials.map((d) => d.email);
      if (demoEmails.includes(data.email) && mockLogin) {
        const demo = demoCredentials.find((d) => d.email === data.email)!;
        const demoUser = {
          id: demo.email,
          email: demo.email,
          name: demo.role === 'admin' ? 'Admin User' : demo.role === 'doctor' ? 'Dr. Demo' : 'Demo Patient',
          role: demo.role as any,
        };
        mockLogin(demoUser, data.remember);
        setButtonState('success');
        toast({ title: 'Signed in (demo)', description: 'Demo account signed in locally.' });
        return;
      }

      // Revert optimistic state and bring user back to login
      try {
        await logout(false);
      } catch {}

      setButtonState('error');
      toast({ title: 'Sign in failed', description: err?.message || 'Invalid credentials', variant: 'destructive' });
      // subtle shake handled by animation state; reset quickly
      setTimeout(() => setButtonState('idle'), 250);

      // Navigate back to login so user can retry
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`, { replace: true });
    }
  };

  const demoCredentials = [
    { role: 'admin', email: 'admin@smartcare.com' },
    { role: 'doctor', email: 'dr.smith@smartcare.com' },
    { role: 'patient', email: 'patient@example.com' },
  ];

  const fillDemo = (r: 'admin' | 'doctor' | 'patient') => {
    const demo = demoCredentials.find((d) => d.role === r);
    if (demo) {
      setValue('role', r as any);
      setValue('email', demo.email);
      setValue('password', 'demo123');
    }
  };

  const currentEmail = watch('email');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-6">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key="auth-card"
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.995 }}
          transition={{ duration: 0.32 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-card overflow-hidden">
            <CardHeader className="space-y-1 p-6">
              <CardTitle className="text-2xl font-semibold text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center text-sm">Sign in to your SmartCare account</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
                  <motion.div variants={fieldVariants}>
                    <Controller
                      control={control}
                      name="role"
                      render={({ field }) => (
                        <div className="space-y-2">
                          <Label htmlFor="role">Account Type</Label>
                          <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
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
                      )}
                    />
                  </motion.div>

                  <motion.div variants={fieldVariants}>
                    <Controller
                      control={control}
                      name="email"
                      render={({ field }) => (
                        <div className="relative">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@company.com"
                            aria-label="Email address"
                            aria-describedby={errors.email ? 'email-error' : undefined}
                            {...field}
                          />
                          {errors.email && (
                            <p id="email-error" className="text-xs text-destructive mt-1">
                              {errors.email.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </motion.div>

                  <motion.div variants={fieldVariants}>
                    <Controller
                      control={control}
                      name="password"
                      render={({ field }) => (
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              aria-label="Password"
                              aria-describedby={errors.password ? 'password-error' : undefined}
                              placeholder="Your secure password"
                              {...field}
                            />
                            <button
                              type="button"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              onClick={() => setShowPassword((s) => !s)}
                              className="absolute right-1 top-1/2 -translate-y-1/2 p-2"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {errors.password && (
                            <p id="password-error" className="text-xs text-destructive mt-1">
                              {errors.password.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </motion.div>

                  <motion.div variants={fieldVariants} className="flex items-center justify-between">
                    <Controller
                      control={control}
                      name="remember"
                      render={({ field }) => (
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            aria-label="Remember me"
                          />
                          <span className="text-sm">Remember me</span>
                        </label>
                      )}
                    />

                    <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </motion.div>
                </motion.div>

                <div>
                  <motion.button
                    layout
                    type="submit"
                    className={`w-full flex items-center justify-center gap-2 rounded-md px-4 py-2 font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 ${
                      buttonState === 'error' ? 'ring-2 ring-red-300' : ''
                    }`}
                    disabled={isSubmitting || isLoading}
                    aria-live="polite"
                    animate={buttonState === 'error' ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
                  >
                    {buttonState === 'loading' ? (
                      <LoadingSpinner size="sm" text="" />
                    ) : buttonState === 'success' ? (
                      <Check className="w-5 h-5 text-emerald-200" />
                    ) : (
                      'Sign In'
                    )}
                  </motion.button>
                </div>

                <div className="mt-3">
                  <a
                    href={`${API_URL}/api/v1/auth/google`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 bg-white text-sm hover:shadow-sm"
                  >
                    <img src="/google-icon.svg" alt="Google" className="w-4 h-4" />
                    Sign in with Google
                  </a>
                </div>
              </form>

              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-3">Demo Accounts - Click to auto-fill:</p>
                <div className="space-y-2">
                  {demoCredentials.map((demo) => (
                    <Button
                      key={demo.role}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left h-auto p-2"
                      onClick={() => fillDemo(demo.role as any)}
                      type="button"
                    >
                      <div>
                        <div className="font-medium capitalize">{demo.role}</div>
                        <div className="text-xs text-muted-foreground">{demo.email}</div>
                      </div>
                    </Button>
                  ))}
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
          </Card>

          <div className="text-center mt-4">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
              ← Back to Homepage
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;