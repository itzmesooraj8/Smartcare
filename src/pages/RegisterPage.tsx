import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const passwordStrength = (pw: string) => {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(4, score);
};

const schema = z
  .object({
    name: z.string().min(2, 'Please enter your full name'),
    email: z.string().email('Please enter a valid email'),
    role: z.enum(['patient', 'doctor', 'admin']).default('patient'),
    password: z.string().min(8, 'Password must be 8+ characters'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v === true, { message: 'You must accept the terms' }),
  })
  .superRefine((vals, ctx) => {
    if (vals.password !== vals.confirmPassword) {
      ctx.addIssue({ path: ['confirmPassword'], message: 'Passwords do not match', code: 'custom' });
    }
  });

type FormValues = z.infer<typeof schema>;

const RegisterPage: React.FC = () => {
  const { register: registerApi, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onBlur' });

  const [licenseFileName, setLicenseFileName] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const pw = watch('password') || '';
  const selectedRole = watch('role');
  const strength = passwordStrength(pw);

  const onSubmit = async (data: FormValues) => {
    try {
      await registerApi({ name: data.name, email: data.email, password: data.password, role: data.role });
      toast({ title: 'Account Created', description: 'Welcome to SmartCare!' });
      navigate('/dashboard');
    } catch (e: any) {
      toast({ title: 'Registration failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key="register-card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.32 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-card">
            <CardHeader className="p-6">
              <CardTitle className="text-2xl font-semibold text-center">Create Account</CardTitle>
              <CardDescription className="text-center text-sm">Join SmartCare to manage your health</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
                  <motion.div>
                    <Controller
                      control={control}
                      name="name"
                      render={({ field }) => (
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" placeholder="Your full name" aria-label="Full name" {...field} />
                          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
                        </div>
                      )}
                    />
                  </motion.div>

                  <motion.div>
                    <Controller
                      control={control}
                      name="email"
                      render={({ field }) => (
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" placeholder="you@company.com" aria-label="Email" {...field} />
                          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                        </div>
                      )}
                    />
                  </motion.div>

                  <motion.div>
                    <Controller
                      control={control}
                      name="role"
                      render={({ field }) => (
                        <div>
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

                  <motion.div>
                    <Controller
                      control={control}
                      name="password"
                      render={({ field }) => (
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <div className="relative">
                            <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create password" {...field} aria-label="Password" />
                            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-1 top-1/2 -translate-y-1/2 p-2">
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <div className="mt-2">
                            <div className="h-2 bg-muted rounded-md overflow-hidden">
                              <div
                                className={`h-full transition-all`} style={{ width: `${(strength / 4) * 100}%`, background: strength >= 3 ? 'linear-gradient(90deg,#34d399,#10b981)' : strength === 2 ? '#f59e0b' : '#ef4444' }}
                              />
                            </div>
                            <p className="text-xs mt-1 text-muted-foreground">Strength: {['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength]}</p>
                          </div>
                          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
                        </div>
                      )}
                    />
                  </motion.div>

                  <motion.div>
                    <Controller
                      control={control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <div>
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <div className="relative">
                            <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="Confirm password" {...field} aria-label="Confirm password" />
                            <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute right-1 top-1/2 -translate-y-1/2 p-2">
                              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
                        </div>
                      )}
                    />
                  </motion.div>

                  <AnimatePresence>
                    {selectedRole === 'doctor' && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22 }}
                      >
                        <div className="space-y-2">
                          <Label>Medical License (doctors)</Label>
                          <div className="flex items-center gap-2">
                            <input
                              id="license"
                              type="file"
                              accept="application/pdf,image/*"
                              className="hidden"
                              onChange={(e) => setLicenseFileName(e.target.files?.[0]?.name ?? null)}
                            />
                            <label htmlFor="license">
                              <Button onClick={() => { const el = document.getElementById('license') as HTMLInputElement | null; el?.click(); }} type="button" className="bg-blue-600 text-white hover:bg-blue-700">
                                {licenseFileName ? 'Change License' : 'Upload License'}
                              </Button>
                            </label>
                            <span className="text-sm text-muted-foreground">{licenseFileName ?? 'No file selected'}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div>
                    <Controller
                      control={control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input type="checkbox" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />
                          <span className="text-sm">I agree to the <Link to="/terms" className="text-primary">Terms</Link> and <Link to="/privacy" className="text-primary">Privacy</Link></span>
                        </label>
                      )}
                    />
                    {errors.acceptTerms && <p className="text-xs text-destructive mt-1">{errors.acceptTerms.message as string}</p>}
                  </motion.div>
                </motion.div>

                <div>
                  <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isSubmitting || isLoading}>
                    {isSubmitting || isLoading ? <LoadingSpinner size="sm" text="" /> : 'Create Account'}
                  </Button>
                </div>

                <div className="mt-3">
                  <a
                    href={`${API_URL}/api/v1/auth/google`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 bg-white text-sm hover:shadow-sm"
                  >
                    <img src="/google-icon.svg" alt="Google" className="w-4 h-4" />
                    Sign up with Google
                  </a>
                </div>
              </form>

              <div className="mt-6 text-center">
                <span className="text-sm text-muted-foreground">Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in here</Link></span>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-4">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-smooth">← Back to Homepage</Link>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RegisterPage;
