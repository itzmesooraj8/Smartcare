import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEncryption } from '@/hooks/useEncryption';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function CreateMedicalRecord({ patientId }: { patientId: string }) {
  const { masterKey } = useAuth();
  const { encryptData } = useEncryption();
  const { toast } = useToast();

  const [formData, setFormData] = useState({ chief_complaint: '', diagnosis: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKey) {
      toast({ variant: 'destructive', title: 'Security Error', description: 'Encryption vault is locked. Please re-login.' });
      return;
    }

    setLoading(true);

    try {
      // 1. ENCRYPT CLIENT-SIDE
      const encryptedComplaint = await encryptData(formData.chief_complaint, masterKey);
      const encryptedDiagnosis = await encryptData(formData.diagnosis, masterKey);

      // 2. SEND BLOBS TO API
      await apiFetch('/medical-records', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: patientId,
          title: 'Visit',
          doctor_id: null,
          chief_complaint: encryptedComplaint,
          diagnosis: encryptedDiagnosis,
          visit_type: 'General Checkup',
        }),
      });

      toast({ title: 'Success', description: 'Medical record encrypted and saved.' });
      setFormData({ chief_complaint: '', diagnosis: '' });

    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save secure record.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-bold text-gray-900">📝 New Secure Record</h3>
      <div className="space-y-2">
        <label className="text-sm font-medium">Chief Complaint (Encrypted)</label>
        <Input
          value={formData.chief_complaint}
          onChange={e => setFormData({ ...formData, chief_complaint: e.target.value })}
          placeholder="e.g. Severe migraine with aura..."
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Diagnosis / Notes (Encrypted)</label>
        <Textarea
          value={formData.diagnosis}
          onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
          placeholder="Clinical observations..."
          required
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Encrypting & Saving...' : 'Save Record Securely'}
      </Button>
    </form>
  );
}
