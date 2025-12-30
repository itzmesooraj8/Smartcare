import React, { useMemo, useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/lib/api';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, Check } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// --- resize & crop helper (from AvatarUpload) ---
async function resizeAndCropToSquare(file: File, size = 256): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = URL.createObjectURL(file);
  });

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const { width: iw, height: ih } = img;
  const side = Math.min(iw, ih);
  const sx = (iw - side) / 2;
  const sy = (ih - side) / 2;

  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.92);
}

// --- AvatarUpload (inlined) ---
// React hooks already imported above

const AvatarUpload: React.FC<{ current?: string | null; uploadPath?: string; onUploaded?: (url: string) => void }> = ({ current, uploadPath = '/api/v1/users/me/avatar', onUploaded }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const auth = useAuth();
  const user = auth.user;
  const fetchWithAuth = (auth as any).fetchWithAuth ?? (async (input: RequestInfo, init?: RequestInit) => fetch(input, init));
  const updateUser = (auth as any).updateUser;
  const { toast } = useToast();

  const [preview, setPreview] = useState<string | null>(current || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    setPreview(current ?? null);
  }, [current]);

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const f = e.dataTransfer?.files?.[0];
      if (f) void handleFile(f);
    };
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };
    el.addEventListener('drop', onDrop as any);
    el.addEventListener('dragover', onDragOver as any);
    el.addEventListener('dragleave', onDragLeave as any);
    return () => {
      el.removeEventListener('drop', onDrop as any);
      el.removeEventListener('dragover', onDragOver as any);
      el.removeEventListener('dragleave', onDragLeave as any);
    };
  }, []);

  const handleFile = async (file?: File) => {
    if (!file) return;
    try {
      const dataUrl = await resizeAndCropToSquare(file, 512);
      setPreview(dataUrl);
      setUploading(true);
      setProgress(5);

      const bump = (p: number) => setProgress((prev) => Math.min(95, prev + p));
      const progInterval = setInterval(() => bump(Math.random() * 12), 250);

      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const fd = new FormData();
      const uploadFile = new File([blob], file.name.replace(/\s+/g, '_'), { type: 'image/jpeg' });
      fd.append('avatar', uploadFile);

      const resp = await fetch(`${API_URL}${uploadPath}`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });

      clearInterval(progInterval);
      setProgress(90);

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'upload-failed');
      }

      const json = await resp.json();
      const url = json?.avatar || json?.url || json?.data?.avatar;
      const finalUrl = url || dataUrl;

      try { updateUser({ avatar: finalUrl }); } catch {}

      setProgress(100);
      setTimeout(() => setProgress(0), 700);
      setUploading(false);
      toast({ title: 'Avatar uploaded', description: 'Your profile picture was updated.' });
      onUploaded?.(finalUrl);
    } catch (e: any) {
      setUploading(false);
      setProgress(0);
      toast({ title: 'Upload failed', description: e?.message || 'Unable to upload avatar', variant: 'destructive' });
      setPreview(current ?? null);
    }
  };

  const onKeyPress = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const initials = (name?: string) => {
    if (!name) return '';
    return name.split(' ').map((n) => n[0]).slice(0,2).join('').toUpperCase();
  };

  return (
    <div className="flex items-center gap-4">
      <div
        ref={dropRef}
        tabIndex={0}
        onKeyDown={onKeyPress}
        className={`relative w-28 h-28 rounded-full overflow-hidden flex items-center justify-center border focus:outline-none focus:ring-2 focus:ring-primary transition-transform ${isDragOver ? 'scale-105 ring-2 ring-primary/30' : ''}`}
        aria-label="Avatar upload dropzone"
      >
        <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.98 }} className="w-full h-full">
          {preview ? (
            <img src={preview} alt="avatar-preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 text-white font-semibold">
              <span className="text-xl">{initials(user?.name)}</span>
            </div>
          )}
        </motion.div>

        {uploading && (
          <svg className="absolute w-32 h-32" viewBox="0 0 36 36">
            <path className="opacity-20" d="M18 2.0845a15.9155 15.9155 0 1 0 0 31.831 15.9155 15.9155 0 1 0 0-31.831" fill="none" stroke="#e6e6e6" strokeWidth="2" />
            <path d="M18 2.0845a15.9155 15.9155 0 1 0 0 31.831" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray={`${progress},100`} strokeLinecap="round" />
          </svg>
        )}
      </div>

      <div className="flex flex-col">
        <label className="text-sm font-medium">Profile Photo</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-2 rounded-md bg-white border hover:shadow-sm text-sm"
            onClick={() => inputRef.current?.click()}
            aria-label="Upload photo"
          >
            Change
          </button>
          <button
            type="button"
            className="px-3 py-2 rounded-md bg-muted/10 text-sm"
            onClick={() => {
              setPreview(null);
              (async () => {
                try {
                  const resp = await fetch(`${API_URL}${uploadPath}`, { method: 'DELETE', credentials: 'include' });
                  if (resp.ok) {
                    updateUser({ avatar: '' });
                    toast({ title: 'Avatar removed', description: 'Your profile photo was removed.' });
                    onUploaded?.('');
                  } else {
                    throw new Error('delete-failed');
                  }
                } catch (e: any) {
                  toast({ title: 'Remove failed', description: e?.message || 'Unable to remove avatar', variant: 'destructive' });
                }
              })();
            }}
          >
            Remove
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.currentTarget.value = '';
          }}
        />
      </div>
    </div>
  );
};

// --- HolographicCard (inlined) ---
// motion utilities already imported above

const HolographicCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-50, 50], [12, -12]);
  const rotateY = useTransform(x, [-50, 50], [-12, 12]);

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    x.set((px - 0.5) * 100);
    y.set((py - 0.5) * 100);
  };

  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, perspective: 800 }}
      className={`backdrop-blur-md bg-white/50 dark:bg-slate-900/40 rounded-2xl border border-white/10 shadow-2xl p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
};

// --- FloatingLabelInput (inlined) ---
const FloatingLabelInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }> = ({ label, id, className = '', ...props }) => {
  const hasValue = !!(props as any).value || !!(props as any).defaultValue;
  return (
    <div className={`relative text-sm ${className}`}>
      <motion.label htmlFor={id} layoutId={`label-${id}`} className={`absolute left-3 top-2 transition-all pointer-events-none ${hasValue ? 'text-xs -translate-y-3 text-muted-foreground' : 'text-sm text-muted-foreground'}`}>
        {label}
      </motion.label>
      <input id={id} {...(props as any)} className="w-full px-3 pt-5 pb-2 bg-transparent border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
    </div>
  );
};

// --- SaveButton (inlined) ---
// Check and AnimatePresence already imported above

const SaveButton: React.FC<{ saving: boolean; success?: boolean; onClick?: () => void; children?: React.ReactNode }> = ({ saving, success, onClick, children }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    if (!saving && success) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 900);
      return () => clearTimeout(t);
    }
  }, [saving, success]);

  return (
    <motion.button onClick={onClick} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 bg-blue-600 text-white" whileTap={{ scale: 0.98 }} aria-live="polite">
      <AnimatePresence mode="wait">
        {saving ? (
          <motion.div key="spinner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </motion.div>
        ) : showSuccess ? (
          <motion.div key="check" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
            <Check className="w-5 h-5 text-emerald-200" />
          </motion.div>
        ) : (
          <motion.div key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{children || 'Save'}</motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// --- HealthCardFlip (inlined, with save support) ---
const HealthCardFlip: React.FC<{ title: string; value: React.ReactNode; edit?: React.ReactNode; onSave?: (v: any) => Promise<void> }> = ({ title, value, edit, onSave }) => {
  const [flipped, setFlipped] = useState(false);
  const [localValue, setLocalValue] = useState<any>(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => setLocalValue(value), [value]);

  const handleSave = async () => {
    if (!onSave) return setFlipped(false);
    try {
      setSaving(true);
      await onSave(localValue);
      setFlipped(false);
    } catch (e) {
      // toast handled by caller
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="w-full sm:w-60 h-32 bg-white/60 dark:bg-slate-800/60 rounded-lg p-4 border flex flex-col justify-between" whileHover={{ scale: 1.02 }} style={{ perspective: 600 }}>
      <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.6 }} className="w-full h-full relative">
        <motion.div className="absolute inset-0 backface-hidden" style={{ display: flipped ? 'none' : 'block' }}>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="text-lg font-semibold">{value}</div>
        </motion.div>
        <motion.div className="absolute inset-0 backface-hidden p-2" style={{ transform: 'rotateY(180deg)', display: flipped ? 'block' : 'none' }}>
          <div className="flex flex-col h-full">
            <div className="flex-1">{edit ? edit : null}</div>
            <div className="flex items-center justify-end gap-2 mt-2">
              <button type="button" className="px-2 py-1 rounded-md border" onClick={() => setFlipped(false)} disabled={saving}>Cancel</button>
              <button type="button" className="px-3 py-1 rounded-md bg-blue-600 text-white" onClick={handleSave} aria-label={`Save ${title}`}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
      <button aria-label={`Flip ${title}`} className="absolute inset-0 w-full h-full bg-transparent" onClick={() => setFlipped((s) => !s)} />
    </motion.div>
  );
};
// form, zod and utilities are imported at the top

const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

const schema = z.object({
  name: z.string().min(1, 'Please enter your name'),
  phone: z.string().regex(phoneRegex, 'Please enter a valid phone').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().max(500, 'Bio must be 500 chars or less').optional().or(z.literal('')),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().regex(phoneRegex, 'Please enter a valid phone').optional().or(z.literal('')),
  emergencyRelation: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const ProfilePage: React.FC = () => {
  const auth = useAuth();
  const user = auth.user;
  const fetchWithAuth = (auth as any).fetchWithAuth ?? (async (input: RequestInfo, init?: RequestInit) => fetch(input, init));
  const updateUser = (auth as any).updateUser;
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successPulse, setSuccessPulse] = useState(false);
  const [unsaved, setUnsaved] = useState(false);

  const defaultValues: FormValues = useMemo(
    () => ({
      name: user?.name || '',
      phone: (user as any)?.phone || '',
      dateOfBirth: (user as any)?.dateOfBirth || '',
      address: (user as any)?.address || '',
      emergencyName: (user as any)?.emergency?.name || '',
      emergencyPhone: (user as any)?.emergency?.phone || '',
      emergencyRelation: (user as any)?.emergency?.relation || '',
    }),
    [user]
  );

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  });

  // warn on page unload
  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (unsaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [unsaved]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        phone: values.phone || null,
        dateOfBirth: values.dateOfBirth || null,
        address: values.address || null,
        emergency: {
          name: values.emergencyName || null,
          phone: values.emergencyPhone || null,
          relation: values.emergencyRelation || null,
        },
      };

      const res = await fetchWithAuth(`${API_URL}/api/v1/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'save-failed');
      }

      const json = await res.json();
      // update auth user
      updateUser(json || payload);
      toast({ title: 'Profile saved', description: 'Your profile has been updated.' });
      setSuccessPulse(true);
      setTimeout(() => setSuccessPulse(false), 900);
      setEditing(false);
      setUnsaved(false);
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Unable to save profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Save handlers for small health cards
  const saveBloodType = async (val: any) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/api/v1/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloodType: val }),
      });
      if (!res.ok) throw new Error('save-failed');
      const j = await res.json();
      updateUser(j || { bloodType: val });
      toast({ title: 'Saved', description: 'Blood type updated.' });
      setSuccessPulse(true);
      setTimeout(() => setSuccessPulse(false), 800);
    } catch (e: any) {
      toast({ title: 'Sync failed', description: 'Tap to retry.', variant: 'destructive' });
      throw e;
    }
  };

  const saveEmergencyContact = async (val: any) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/api/v1/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergency: val }),
      });
      if (!res.ok) throw new Error('save-failed');
      const j = await res.json();
      updateUser(j || { emergency: val });
      toast({ title: 'Saved', description: 'Emergency contact updated.' });
      setSuccessPulse(true);
      setTimeout(() => setSuccessPulse(false), 800);
    } catch (e: any) {
      toast({ title: 'Sync failed', description: 'Tap to retry.', variant: 'destructive' });
      throw e;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]}</h2>
                <div className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
              </div>
              <div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back
                  </Link>
                </Button>
              </div>
            </div>

            <HolographicCard className={successPulse ? 'ring-2 ring-emerald-200 relative' : 'relative'}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1">
                  <div className="p-4">
                    <AvatarUpload current={user?.avatar ?? null} onUploaded={(url) => { updateUser({ avatar: url }); }} />
                    <div className="mt-4">
                      <div className="text-lg font-semibold">{user?.name}</div>
                      <div className="text-sm text-muted-foreground">{user?.role}</div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <motion.form onSubmit={handleSubmit(onSubmit)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <Card className="shadow-card">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">Digital Health Passport</CardTitle>
                          <div className="text-sm text-muted-foreground">{user?.email}</div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Controller control={control} name="name" render={({ field }) => (
                              <FloatingLabelInput id="name" label="Full name" {...field} readOnly={!editing} />
                            )} />
                            {errors.name && <div className="text-xs text-destructive">{errors.name.message}</div>}
                          </div>

                          <div>
                            <Controller control={control} name="phone" render={({ field }) => (
                              <FloatingLabelInput id="phone" label="Phone number" {...field} readOnly={!editing} />
                            )} />
                            {errors.phone && <div className="text-xs text-destructive">{errors.phone.message}</div>}
                          </div>

                          <div>
                            <Controller control={control} name="dateOfBirth" render={({ field }) => (
                              <FloatingLabelInput id="dateOfBirth" label="Date of birth" type="date" {...field} readOnly={!editing} />
                            )} />
                          </div>

                          <div>
                            <Controller control={control} name="address" render={({ field }) => (
                              <FloatingLabelInput id="address" label="Address" {...field} readOnly={!editing} />
                            )} />
                          </div>

                          <div className="md:col-span-2">
                            <Controller control={control} name="bio" render={({ field }) => (
                              <div>
                                <label className="text-sm text-muted-foreground">Bio</label>
                                <textarea {...field} maxLength={500} rows={4} className="w-full mt-2 p-3 border rounded-md" readOnly={!editing} />
                                <div className="text-xs text-muted-foreground mt-1">{(field.value || '').length}/500</div>
                              </div>
                            )} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <HealthCardFlip title="Blood Type" value={(user as any)?.bloodType || 'Unknown'} edit={<input className="input" defaultValue={(user as any)?.bloodType || ''} onChange={() => {}} />} onSave={saveBloodType} />
                      <HealthCardFlip title="Emergency Contact" value={(user as any)?.emergency?.name || 'Not set'} edit={<div className="space-y-2"><input className="input" defaultValue={(user as any)?.emergency?.name || ''} onChange={() => {}} placeholder="Name" /><input className="input" defaultValue={(user as any)?.emergency?.phone || ''} onChange={() => {}} placeholder="Phone" /></div>} onSave={saveEmergencyContact} />
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => { reset(defaultValues); setEditing(false); setUnsaved(false); }}>
                        Cancel
                      </Button>
                      <SaveButton
                        saving={saving}
                        success={successPulse}
                        onClick={() => {
                          if (editing) {
                            void handleSubmit(onSubmit)();
                          } else {
                            setEditing(true);
                            setUnsaved(true);
                          }
                        }}
                      >
                        {editing ? 'Save Changes' : 'Edit'}
                      </SaveButton>
                      <button type="submit" className="hidden" />
                    </div>
                  </motion.form>
                </div>
              </div>
            </HolographicCard>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ProfilePage;