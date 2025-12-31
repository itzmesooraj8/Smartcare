import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEncryption } from "@/hooks/useEncryption";
import apiFetch from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Lock, FileText, Calendar, ShieldCheck, Key, Shield, Unlock } from "lucide-react";
import CreateMedicalRecord from "@/components/CreateMedicalRecord";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

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
  const { user, masterKey, updateMasterKey } = useAuth();
  // We need the token actually, which useAuth doesn't expose directly but apiFetch uses internally.
  // However, for manual fetch requests we might rely on apiFetch handling headers.

  const { decryptData, generateMasterKey, wrapMasterKey } = useEncryption();
  const { toast } = useToast();

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Setup state
  const [showSetup, setShowSetup] = useState(false);
  const [password, setPassword] = useState("");
  const [isSettingUp, setIsSettingUp] = useState(false);

  // 1. Fetch encrypted blobs from Backend
  useEffect(() => {
    // If no master key, we can still fetch records (they are just blobs)
    // But usually we don't even show this page properly if locked.
    // However, if we ALLOW legacy users, they can fetch 0 records.

    setLoading(true);
    apiFetch({ url: "/medical-records", method: "GET" })
      .then((res) => setRecords((res as any).data ?? res ?? []))
      .catch((err) => {
        // console.error("Fetch error:", err);
        // If 403 or similar, it might be auth.
      })
      .finally(() => setLoading(false));
  }, []);

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
      setDecryptedCache(prev => ({ ...prev, ...newCache }));
    };

    decryptAll();
  }, [records, masterKey, decryptData]);

  const handleSetupVault = async () => {
    if (!password) {
      toast({ title: "Password Required", description: "Please enter your login password to secure your vault.", variant: "destructive" });
      return;
    }

    setIsSettingUp(true);
    try {
      // 1. Generate Key
      const newKey = await generateMasterKey();

      // 2. Wrap with Password
      const wrapped = await wrapMasterKey(newKey, password);

      // 3. Send to Backend
      await apiFetch({
        url: "/vault/key",
        method: "POST",
        data: wrapped
      });

      // 4. Update Context
      updateMasterKey(newKey);

      toast({ title: "Vault Initialized", description: "Your secure medical vault is now active." });
      setShowSetup(false);
    } catch (error: any) {
      console.error("Vault setup failed", error);
      toast({
        title: "Setup Failed",
        description: error.response?.data?.detail || "Could not initialize vault. Verify your password.",
        variant: "destructive"
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  // --- Locked View (Legacy or Session Expired) ---
  if (!masterKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-2xl">
            {/* Header Gradient */}
            <div className="h-32 bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
              <Shield className="w-16 h-16 text-white/90 drop-shadow-xl" strokeWidth={1.5} />
            </div>

            <div className="p-8 text-center space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Vault Not Initialized</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  Your account is active, but your encrypted medical vault has not been set up yet.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/40 text-left flex gap-3">
                <Key className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  We will generate a military-grade encryption key for you. Only you will hold this key.
                </p>
              </div>

              <Button
                size="lg"
                onClick={() => setShowSetup(true)}
                className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25"
              >
                Setup Secure Vault
              </Button>
            </div>
          </div>
        </motion.div>

        <Dialog open={showSetup} onOpenChange={setShowSetup}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Secure Vault Setup</DialogTitle>
              <DialogDescription>
                Enter your current password to encrypt your new master key. We do not store your password.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSetup(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleSetupVault} disabled={isSettingUp} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                {isSettingUp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
                Initialize Vault
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // --- Main Vault View ---
  return (
    <div className="container mx-auto p-6 lg:p-10 space-y-8 max-w-[1600px] min-h-screen bg-[#fafafa] dark:bg-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight"
          >
            Medical Vault
          </motion.h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Zero-Knowledge Encrypted Clinical Records</p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="h-10 px-4 rounded-full border-emerald-600/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 gap-2">
            <ShieldCheck className="w-4 h-4" /> HIPAA Compliant
          </Badge>
        </div>
      </div>

      {/* Write Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl p-6 rounded-3xl border border-white/20 dark:border-white/5 shadow-sm"
      >
        <CreateMedicalRecord patientId={""} />
      </motion.div>

      {/* Read List */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">History</h2>
          <div className="h-px bg-slate-200 dark:bg-white/10 flex-1 ml-4" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 rounded-3xl bg-slate-100 dark:bg-zinc-800/50 animate-pulse" />
              ))
            ) : records.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white/40 dark:bg-white/5 rounded-3xl border border-dashed border-slate-300 dark:border-white/10">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No secure records found.</p>
              </div>
            ) : (
              records.map((record, i) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 border-white/20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-3xl overflow-hidden h-full flex flex-col group">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 bg-gradient-to-r from-slate-50 to-white dark:from-white/5 dark:to-transparent border-b border-slate-100 dark:border-white/5">
                      <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        {record.visit_type}
                      </CardTitle>
                      <Badge variant="secondary" className="font-normal bg-white dark:bg-black/40">
                        {new Date(record.created_at).toLocaleDateString()}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-5 flex-1 relative">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Chief Complaint</label>
                        <p className="text-slate-900 dark:text-white font-medium text-lg leading-snug">
                          {decryptedCache[record.id]?.complaint || <span className="flex items-center gap-2 text-indigo-500 animate-pulse"><Unlock className="w-3 h-3" /> Decrypting...</span>}
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Diagnosis</label>
                        <div className="p-3 bg-slate-50 dark:bg-black/20 rounded-xl text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-white/5 min-h-[3rem]">
                          {decryptedCache[record.id]?.diagnosis || "..."}
                        </div>
                      </div>
                      {decryptedCache[record.id]?.notes && (
                        <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                          <p className="text-xs text-slate-500 italic">
                            "{decryptedCache[record.id].notes}"
                          </p>
                        </div>
                      )}

                      {/* Decorative glow */}
                      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}