import React, { useEffect, useMemo, useState, useRef, KeyboardEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
// Inlined components (moved from src/components to keep this page self-contained)
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Check, Calendar, MapPin, Star, Award, Phone, Edit, Save } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// --- resize & crop helper (AvatarUpload) ---
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

// --- AvatarUpload (inlined for doctor page) ---
const AvatarUploadInline: React.FC<{ current?: string | null; uploadPath?: string; onUploaded?: (url: string) => void }> = ({ current, uploadPath = '/api/v1/users/me/avatar', onUploaded }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const { fetchWithAuth, updateUser, user } = useAuth();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(current || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  useEffect(() => { setPreview(current ?? null); }, [current]);
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const onDrop = (e: DragEvent) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer?.files?.[0]; if (f) void handleFile(f); };
    const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragOver(true); };
    const onDragLeave = (e: DragEvent) => { e.preventDefault(); setIsDragOver(false); };
    el.addEventListener('drop', onDrop as any); el.addEventListener('dragover', onDragOver as any); el.addEventListener('dragleave', onDragLeave as any);
    return () => { el.removeEventListener('drop', onDrop as any); el.removeEventListener('dragover', onDragOver as any); el.removeEventListener('dragleave', onDragLeave as any); };
  }, []);
  const handleFile = async (file?: File) => {
    if (!file) return;
    try {
      const dataUrl = await resizeAndCropToSquare(file, 512);
      setPreview(dataUrl); setUploading(true); setProgress(5);
      const bump = (p: number) => setProgress((prev) => Math.min(95, prev + p));
      const progInterval = setInterval(() => bump(Math.random() * 12), 250);
      const res = await fetch(dataUrl); const blob = await res.blob();
      const fd = new FormData(); const uploadFile = new File([blob], file.name.replace(/\s+/g, '_'), { type: 'image/jpeg' }); fd.append('avatar', uploadFile);
      const resp = await fetch(`${API_URL}${uploadPath}`, { method: 'POST', body: fd, credentials: 'include' });
      clearInterval(progInterval); setProgress(90);
      if (!resp.ok) { const txt = await resp.text(); throw new Error(txt || 'upload-failed'); }
      const json = await resp.json(); const url = json?.avatar || json?.url || json?.data?.avatar; const finalUrl = url || dataUrl;
      try { updateUser({ avatar: finalUrl }); } catch {}
      setProgress(100); setTimeout(() => setProgress(0), 700); setUploading(false); toast({ title: 'Avatar uploaded', description: 'Your profile picture was updated.' }); onUploaded?.(finalUrl);
    } catch (e: any) { setUploading(false); setProgress(0); toast({ title: 'Upload failed', description: e?.message || 'Unable to upload avatar', variant: 'destructive' }); setPreview(current ?? null); }
  };
  const onKeyPress = (e: KeyboardEvent<HTMLDivElement>) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } };
  const initials = (name?: string) => { if (!name) return ''; return name.split(' ').map((n) => n[0]).slice(0,2).join('').toUpperCase(); };
  return (
    <div className="flex items-center gap-4">
      <div ref={dropRef} tabIndex={0} onKeyDown={onKeyPress} className={`relative w-32 h-32 rounded-full overflow-hidden flex items-center justify-center border focus:outline-none focus:ring-2 focus:ring-primary transition-transform ${isDragOver ? 'scale-105 ring-2 ring-primary/30' : ''}`} aria-label="Avatar upload dropzone">
        <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.98 }} className="w-full h-full">
          {preview ? (<img src={preview} alt="avatar-preview" className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 text-white font-semibold"><span className="text-xl">{initials(useAuth().user?.name)}</span></div>)}
        </motion.div>
        {uploading && (<svg className="absolute w-36 h-36" viewBox="0 0 36 36"><path className="opacity-20" d="M18 2.0845a15.9155 15.9155 0 1 0 0 31.831 15.9155 15.9155 0 1 0 0-31.831" fill="none" stroke="#e6e6e6" strokeWidth="2" /><path d="M18 2.0845a15.9155 15.9155 0 1 0 0 31.831" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray={`${progress},100`} strokeLinecap="round" /></svg>)}
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium">Profile Photo</label>
        <div className="flex items-center gap-2">
          <button type="button" className="px-3 py-2 rounded-md bg-white border hover:shadow-sm text-sm" onClick={() => inputRef.current?.click()} aria-label="Upload photo">Change</button>
          <button type="button" className="px-3 py-2 rounded-md bg-muted/10 text-sm" onClick={() => { setPreview(null); (async () => { try { const resp = await fetch(`${API_URL}${uploadPath}`, { method: 'DELETE', credentials: 'include' }); if (resp.ok) { updateUser({ avatar: '' }); toast({ title: 'Avatar removed', description: 'Your profile photo was removed.' }); onUploaded?.(''); } else { throw new Error('delete-failed'); } } catch (e: any) { toast({ title: 'Remove failed', description: e?.message || 'Unable to remove avatar', variant: 'destructive' }); } })(); }}>Remove</button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.currentTarget.value = ''; }} />
      </div>
    </div>
  );
};

// --- ChipInput (inlined) ---
const ChipInputInline: React.FC<{ value?: string[]; onChange?: (v: string[]) => void; placeholder?: string }> = ({ value = [], onChange, placeholder }) => {
  const [chips, setChips] = useState<string[]>(value);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const addChip = (t: string) => { const v = t.trim(); if (!v) return; if (chips.includes(v)) return setText(''); const next = [...chips, v]; setChips(next); onChange?.(next); setText(''); };
  const removeChip = (idx: number) => { const next = chips.filter((_, i) => i !== idx); setChips(next); onChange?.(next); };
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); addChip(text); } if (e.key === 'Backspace' && !text && chips.length) { removeChip(chips.length - 1); } };
  return (<div className="border rounded-md p-2 flex flex-wrap items-center gap-2" onClick={() => inputRef.current?.focus()}>{chips.map((c, i) => (<div key={i} className="px-2 py-1 bg-muted/20 rounded-full text-sm flex items-center gap-2"><span>{c}</span><button aria-label={`Remove ${c}`} className="text-xs" onClick={() => removeChip(i)}>×</button></div>))}<input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} placeholder={placeholder} className="flex-1 min-w-[120px] p-1 bg-transparent outline-none text-sm" /></div>);
};

// --- SaveButton (inlined) ---
const SaveButtonInline: React.FC<{ saving: boolean; success?: boolean; onClick?: () => void; children?: React.ReactNode }> = ({ saving, success, onClick, children }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => { if (!saving && success) { setShowSuccess(true); const t = setTimeout(() => setShowSuccess(false), 900); return () => clearTimeout(t); } }, [saving, success]);
  return (<motion.button onClick={onClick} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 bg-blue-600 text-white" whileTap={{ scale: 0.98 }} aria-live="polite"><AnimatePresence mode="wait">{saving ? (<motion.div key="spinner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none" /><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg></motion.div>) : showSuccess ? (<motion.div key="check" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}><Check className="w-5 h-5 text-emerald-200" /></motion.div>) : (<motion.div key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{children || 'Save'}</motion.div>)}</AnimatePresence></motion.button>);
};
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  name: z.string().min(1),
  specialty: z.string().optional().or(z.literal('')),
  about: z.string().max(500).optional().or(z.literal('')),
  specializations: z.array(z.string()).optional(),
  experience: z.number().min(0, 'Experience must be 0 or greater').optional(),
  location: z.string().optional().or(z.literal('')),
  education: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

const DoctorProfilePage: React.FC = () => {
  const { id } = useParams();
  const { user, fetchWithAuth, updateUser } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [doctor, setDoctor] = useState<any>(null);

  useEffect(() => {
    // fetch doctor profile from API (fallback to mock if error)
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/doctors/${id}`);
        if (!res.ok) throw new Error('not-found');
        const data = await res.json();
        if (mounted) setDoctor(data);
      } catch (e) {
        // fallback mock (preserve original data)
        if (mounted)
          setDoctor({
            id: '1',
            name: 'Dr. Sarah Johnson',
            specialty: 'Cardiology',
            image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
            rating: 4.9,
            reviewCount: 127,
            experience: '15+ years',
            location: 'Downtown Medical Center',
            education: 'Harvard Medical School',
            certifications: ['Board Certified Cardiologist', 'FACC', 'FSCAI'],
            specializations: ['Heart Surgery', 'Cardiac Catheterization', 'Preventive Cardiology'],
            about: 'Dr. Johnson is a board-certified cardiologist with over 15 years of experience...',
            languages: ['English', 'Spanish'],
            insuranceAccepted: ['Blue Cross', 'Aetna', 'Cigna', 'United Healthcare']
          });
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const canEdit = useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.role === 'doctor' && user.id === id;
  }, [user, id]);

  const defaultVals: FormValues = useMemo(() => ({
    name: doctor?.name || '',
    specialty: doctor?.specialty || '',
    about: doctor?.about || '',
    specializations: doctor?.specializations || [],
    experience: typeof doctor?.experience === 'string' ? Number(doctor.experience.replace(/[^0-9]/g, '')) || 0 : (doctor?.experience || 0),
    location: doctor?.location || '',
    education: doctor?.education || '',
  }), [doctor]);

  const { control, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultVals,
    mode: 'onBlur',
  });

  useEffect(() => reset(defaultVals), [defaultVals, reset]);

  const onSave = async (vals: FormValues) => {
    if (!canEdit) return toast({ title: 'Unauthorized', description: 'You cannot edit this profile', variant: 'destructive' });
    try {
      const payload = {
        name: vals.name,
        specialty: vals.specialty,
        about: vals.about,
        specializations: vals.specializations || [],
        experience: vals.experience,
        location: vals.location,
        education: vals.education,
      };

      const res = await fetchWithAuth(`${API_URL}/api/v1/doctors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'save-failed');
      }

      const json = await res.json();
      setDoctor(json || { ...doctor, ...payload });
      if (user?.id === id) updateUser(json || payload);
      toast({ title: 'Saved', description: 'Doctor profile updated.' });
      setEditing(false);
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Unable to save', variant: 'destructive' });
    }
  };

  if (!doctor) {
    // skeleton loader
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl h-64" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-card mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
                <div className="mx-auto md:mx-0">
                  <AvatarUpload current={doctor.image} onUploaded={(url) => setDoctor((d:any)=>({ ...d, image: url }))} />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold text-foreground mb-2">{doctor.name}</h1>
                  <p className="text-xl text-primary mb-4">{doctor.specialty}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
                    <div className="flex items-center space-x-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{doctor.rating}</span>
                      <span className="text-muted-foreground">({doctor.reviewCount} reviews)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-5 h-5 text-primary" />
                      <span>{doctor.experience} experience</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span>{doctor.location}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button className="flex-1" asChild>
                      <Link to="/book-appointment">
                        <Calendar className="mr-2 h-4 w-4" />
                        Book Appointment
                      </Link>
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Phone className="mr-2 h-4 w-4" />
                      Contact Office
                    </Button>
                    {canEdit && (
                        <Button variant="outline" onClick={() => setEditing((s) => !s)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {editing ? 'Cancel' : 'Edit Profile'}
                        </Button>
                      )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {!editing ? (
                <>
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle>About Dr. {doctor.name.split(' ')[1]}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{doctor.about}</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle>Specializations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {(doctor.specializations || []).map((spec: string, index: number) => (
                          <Badge key={index} variant="secondary">{spec}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit(onSave)} className="space-y-6 lg:col-span-2">
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle>Edit Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Controller control={control} name="name" render={({ field }) => (
                            <input className="input" {...field} />
                          )} />
                        </div>
                        <div className="space-y-2">
                          <Label>Specialty</Label>
                          <Controller control={control} name="specialty" render={({ field }) => (
                            <input className="input" {...field} />
                          )} />
                        </div>
                        <div className="space-y-2">
                          <Label>Specializations</Label>
                          <Controller control={control} name="specializations" render={({ field }) => (
                            <ChipInput value={field.value || []} onChange={(v) => field.onChange(v)} placeholder="Type and press Enter" />
                          )} />
                        </div>
                        <div className="space-y-2">
                          <Label>About</Label>
                          <Controller control={control} name="about" render={({ field }) => (
                            <div>
                              <textarea className="textarea" {...field} maxLength={500} rows={5} />
                              <div className="text-xs text-muted-foreground mt-1">{(field.value || '').length}/500</div>
                            </div>
                          )} />
                        </div>
                        <div className="space-y-2">
                          <Label>Years of Experience</Label>
                          <Controller control={control} name="experience" render={({ field }) => (
                            <input type="number" min={0} className="input" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                          )} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => { setEditing(false); reset(defaultVals); }}>Cancel</Button>
                    <SaveButton saving={false} onClick={() => { void handleSubmit(onSave)(); }}>
                      Save
                    </SaveButton>
                  </div>
                </motion.form>
              )}
            </div>

            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Education</h4>
                    <p className="text-sm text-muted-foreground">{doctor.education}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Languages</h4>
                    <p className="text-sm text-muted-foreground">{(doctor.languages || []).join(', ')}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Insurance Accepted</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(doctor.insuranceAccepted || []).map((insurance: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center">
                        <div className="w-2 h-2 bg-primary rounded-full mr-2" />
                        {insurance}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DoctorProfilePage;