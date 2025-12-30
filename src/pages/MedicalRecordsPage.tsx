import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEncryption } from "@/hooks/useEncryption";
import apiFetch from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, FileText, Calendar, AlertTriangle, ShieldCheck } from "lucide-react";
import CreateMedicalRecord from "@/components/CreateMedicalRecord"; 

interface EncryptedBlob {
  cipher_text: string;
  iv: string;
}

interface MedicalRecord {
  id: string;
  visit_type: string;
  created_at: string;
  chief_complaint: EncryptedBlob; 
  diagnosis: EncryptedBlob;
  notes?: EncryptedBlob;
}

export default function MedicalRecordsPage() {
  const auth = useAuth();
  const { masterKey } = auth;
  const token = (auth as any).token;
  const { decryptData } = useEncryption();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // 1. Fetch encrypted blobs from Backend
  useEffect(() => {
    if (!token) return;
    
    Promise.resolve(
      apiFetch({
        url: "/medical-records",
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
    )
      .then((res) => setRecords((res as any).data ?? res))
      .catch((err) => console.error("Fetch error:", err))
      .finally(() => setLoading(false));
  }, [token]);

  // 2. Decrypt Client-Side using the Master Key
  useEffect(() => {
    if (!masterKey || records.length === 0) return;

    const decryptAll = async () => {
      const newCache: Record<string, any> = {};
      
      for (const record of records) {
        try {
          const complaint = await decryptData(
            { cipher_text: record.chief_complaint.cipher_text, iv: record.chief_complaint.iv },
            masterKey
          );

          const diagnosis = await decryptData(
            { cipher_text: record.diagnosis.cipher_text, iv: record.diagnosis.iv },
            masterKey
          );

          let notes = "";
          if (record.notes?.cipher_text) {
             notes = await decryptData({ cipher_text: record.notes.cipher_text, iv: record.notes.iv }, masterKey);
          }

          newCache[record.id] = { complaint, diagnosis, notes };
        } catch (e) {
          console.error(`Failed to decrypt record ${record.id}`, e);
          newCache[record.id] = { complaint: "⚠️ Decryption Error", diagnosis: "Key mismatch" };
        }
      }
      setDecryptedCache(newCache);
    };

    decryptAll();
  }, [records, masterKey, decryptData]);

  if (!masterKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-red-500 space-y-4">
        <div className="p-4 bg-red-50 rounded-full">
            <Lock className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Vault Locked</h2>
        <p className="text-slate-600">Your secure session has expired. Please logout and login again to unlock your encryption key.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Medical History</h1>
            <p className="text-slate-500 mt-1">Zero-Knowledge Encrypted Clinical Notes</p>
        </div>
        <Badge variant="outline" className="border-green-600 text-green-700 bg-green-50 px-3 py-1 w-fit">
          <ShieldCheck className="w-3 h-3 mr-2" /> HIPAA Compliant Encryption
        </Badge>
      </div>

      {/* Write Component (Encrypts before sending) */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
        <CreateMedicalRecord patientId={""} />
      </div>

      {/* Read List (Decrypts after fetching) */}
      <h2 className="text-xl font-semibold text-slate-800 mt-8">Recent Records</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : records.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">No secure records found.</p>
          </div>
        ) : (
          records.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-all duration-200 border-slate-200 flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 rounded-t-xl border-b border-slate-100">
                <CardTitle className="text-md font-semibold flex items-center gap-2 text-slate-800">
                  <FileText className="w-4 h-4 text-blue-600" />
                  {record.visit_type}
                </CardTitle>
                <div className="text-xs text-slate-500 flex items-center gap-1 bg-white px-2 py-1 rounded-md border">
                  <Calendar className="w-3 h-3" />
                  {new Date(record.created_at).toLocaleDateString()}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 flex-1">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chief Complaint</label>
                  <p className="text-slate-800 font-medium mt-1">
                    {decryptedCache[record.id]?.complaint || <span className="flex items-center gap-1 text-slate-400"><Loader2 className="w-3 h-3 animate-spin"/> Decrypting...</span>}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnosis</label>
                  <div className="mt-1 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-100 min-h-[3rem]">
                    {decryptedCache[record.id]?.diagnosis || "..."}
                  </div>
                </div>
                {decryptedCache[record.id]?.notes && (
                   <div className="text-xs text-slate-500 italic border-t pt-2 mt-2">
                      Notes: {decryptedCache[record.id].notes}
                   </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}