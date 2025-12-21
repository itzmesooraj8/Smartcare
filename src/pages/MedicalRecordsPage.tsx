import React, { useCallback, useEffect, useRef, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, Image as ImageIcon, Share2, Trash, X, Eye, Activity, User, Clock, Tag, ZoomIn, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Lightweight toast
function toast(message: { title: string; description?: string; variant?: 'default' | 'destructive' }) {
  try {
    const node = document.createElement('div');
    node.className = `fixed bottom-6 right-6 z-50 max-w-xs p-3 rounded-lg shadow-lg ${
      message.variant === 'destructive' ? 'bg-red-600 text-white' : 'bg-white text-black'
    }`;
    node.innerHTML = `<div class="font-semibold">${message.title}</div>${
      message.description ? `<div class="text-sm mt-1">${message.description}</div>` : ''
    }`;
    document.body.appendChild(node);
    setTimeout(() => {
      const anim = node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
      anim.onfinish = () => node.remove();
    }, 2200);
  } catch (e) {
    // fallback
    // eslint-disable-next-line no-console
    console.log('toast', message.title, message.description);
  }
}

type DocType = 'image' | 'pdf' | 'other';

type DocumentItem = {
  id: string;
  url: string;
  type: DocType;
  title: string;
  date: string;
  doctor?: string;
  description?: string;
  tags?: string[];
};

const gridVariants = {
  container: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } },
  },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } },
};

function useId(prefix = '') {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}

function formatDate(d = new Date()) {
  return new Date(d).toLocaleDateString();
}

function DocumentCard({ doc, onView }: { doc: DocumentItem; onView: (d: DocumentItem) => void }) {
  return (
    <motion.div layoutId={doc.id} variants={gridVariants.item} initial="hidden" animate="show" whileHover={{ scale: 1.02 }} className="rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="relative" style={{ aspectRatio: '4/3' }}>
        {doc.type === 'image' ? (
          <img src={doc.url} alt={doc.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sky-600 to-indigo-600">
            <div className="w-20 h-20 bg-white/10 rounded-lg flex items-center justify-center">
              <FileText className="text-white" />
            </div>
          </div>
        )}

        <div className="absolute left-3 right-3 bottom-3 p-2 rounded-md bg-white/60 backdrop-blur-sm border border-white/30 flex items-center justify-between">
          <div className="flex-1 mr-3 overflow-hidden">
            <div className="text-xs font-semibold truncate">{doc.title}</div>
            <div className="text-[11px] text-zinc-700">{doc.date}</div>
          </div>
          <button onClick={() => onView(doc)} className="ml-2 inline-flex items-center gap-2 px-2 py-1 bg-white/80 border rounded text-sm text-zinc-900 hover:bg-white">
            <Eye className="w-4 h-4" /> View
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function DocumentPreviewModal({ doc, onClose, onDelete, onDownload, onShare }: {
  doc: DocumentItem | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDownload: (d: DocumentItem) => void;
  onShare: (d: DocumentItem) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!doc) return;
    prevFocus.current = document.activeElement as HTMLElement;
    const el = ref.current;
    el?.focus();

    const focusable = el
      ? Array.from(el.querySelectorAll<HTMLElement>('button,a,textarea,input,select,[tabindex]:not([tabindex="-1"])')).filter((n) => !n.hasAttribute('disabled'))
      : [];

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && focusable.length) {
        const idx = focusable.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey) {
          if (idx === 0) { focusable[focusable.length - 1].focus(); e.preventDefault(); }
        } else {
          if (idx === focusable.length - 1) { focusable[0].focus(); e.preventDefault(); }
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); prevFocus.current?.focus(); };
  }, [doc, onClose]);

  if (!doc) return null;

  const tagClass = (t: string) => {
    const k = t.toLowerCase();
    if (k === 'urgent') return 'bg-red-50 border-red-200 text-red-700';
    if (k === 'report') return 'bg-sky-50 border-sky-200 text-sky-700';
    if (k.includes('xray')) return 'bg-rose-50 border-rose-200 text-rose-700';
    return 'bg-slate-50 border-slate-200 text-slate-800';
  };

  const contentVariants = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.22 } } };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          layoutId={doc.id}
          ref={ref}
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          className="relative z-10 w-[95vw] h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_400px]"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          {/* Viewer (left) */}
          <div className="flex-1 bg-zinc-950/95 p-6 flex items-center justify-center">
            <motion.div variants={contentVariants} initial="hidden" animate="show" className="w-full h-full flex items-center justify-center relative">
              {/* viewer controls removed for cleaner experience */}

              <div className="w-full h-full flex items-center justify-center">
                {doc.type === 'pdf' ? (
                  <iframe src={doc.url} title={doc.title} className="w-full h-full object-contain bg-white rounded" />
                ) : (
                  <img src={doc.url} alt={doc.title} className="max-w-full max-h-full object-contain rounded shadow-inner" />
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar: Medical Intelligence Hub (right) */}
          <aside className="relative w-[400px] min-w-[320px] bg-white flex flex-col border-l border-gray-100">
            {/* Sticky header */}
            <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold leading-tight text-slate-900 truncate">{doc.title}</h3>
                  <div className="mt-1 text-sm text-muted-foreground">Uploaded by <span className="font-medium text-slate-800">{doc.doctor || 'Unknown'}</span> on <span className="font-medium text-slate-800">{doc.date}</span></div>
                </div>
              </div>
            </header>

            {/* Scrollable body */}
            <div className="px-6 py-4 overflow-y-auto divide-y divide-gray-100" style={{ maxHeight: 'calc(90vh - 170px)' }}>
              <motion.div variants={contentVariants} initial="hidden" animate="show" className="space-y-4">
                {/* Key details grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pb-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">File size</div>
                    <div className="text-sm font-medium text-gray-900">1.2 MB</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">Type</div>
                    <div className="text-sm font-medium text-gray-900">{doc.type}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">Dimensions</div>
                    <div className="text-sm font-medium text-gray-900">—</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">Pages</div>
                    <div className="text-sm font-medium text-gray-900">—</div>
                  </div>
                </div>

                {/* AI Insights Card */}
                <div className="p-[1px] rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-sm">
                  <div className="bg-white rounded-md p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">AI Insights</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">Medical intelligence</div>
                      </div>
                      <div className="text-indigo-600">
                        <Activity className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-slate-700 leading-relaxed">
                      <strong className="font-medium">Summary:</strong> Mock AI analysis — no acute abnormalities detected. The document appears to be a structured report with embedded images.
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Confidence</div>
                      <div className="font-medium text-slate-900">92%</div>
                      <div>Findings</div>
                      <div className="font-medium text-slate-900">No acute findings</div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="pt-4">
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Description</div>
                  <div className="text-sm text-slate-800 leading-relaxed">{doc.description || 'No description provided.'}</div>
                </div>

                {/* Tags */}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="pt-4">
                    <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {doc.tags.map((t) => (
                        <span key={t} className={`${tagClass(t)} px-2 py-1 rounded-full text-xs font-medium border`}>#{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sticky footer / Action Dock */}
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button onClick={() => onShare(doc)} aria-label="Share" className="p-2 w-10 h-10 rounded-md border text-slate-700 hover:bg-gray-50">
                  <Share2 className="w-4 h-4" />
                </button>
                <button onClick={() => { onDelete(doc.id); onClose(); }} aria-label="Delete" className="p-2 w-10 h-10 rounded-md border text-rose-600 hover:bg-rose-50">
                  <Trash className="w-4 h-4" />
                </button>
              </div>

              <div className="ml-auto w-full">
                <button onClick={() => onDownload(doc)} className="w-full bg-sky-900 text-white py-2 px-4 rounded-md text-sm font-medium">Download</button>
              </div>
            </div>
          </aside>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function MedicalRecordsPage() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState<Array<{ id: string; name: string; progress: number }>>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [
      { id: 'demo-1', url: '/anatomy/demo-image-1.jpg', type: 'image', title: 'Demo Image', date: today, doctor: 'Demo Doctor', description: 'Demo preview image', tags: ['example'] },
    ];
  });
  const [selected, setSelected] = useState<DocumentItem | null>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    const session = Date.now();

    const placeholders = arr.map((f, i) => ({ id: `upl-${session}-${i}`, name: f.name, progress: 2 }));
    setUploading((s) => [...s, ...placeholders]);

    const created: DocumentItem[] = [];
    arr.forEach((file, i) => {
      const uplId = `upl-${session}-${i}`;
      const url = URL.createObjectURL(file);
      const type: DocType = file.type.startsWith('image') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'other';

      const t = window.setInterval(() => {
        setUploading((s) => s.map((u) => (u.id === uplId ? { ...u, progress: Math.min(98, u.progress + Math.round(Math.random() * 18)) } : u)));
      }, 300);

      setTimeout(() => {
        clearInterval(t);
        setUploading((s) => s.filter((x) => x.id !== uplId));

        created.push({ id: `doc-${session}-${i}`, url, type, title: file.name, date: new Date().toISOString().slice(0, 10), doctor: user?.name || 'You' });

        if (created.length === arr.length) {
          // preserve selection order for the batch and insert batch as a group at the top
          setDocuments((prev) => [...created.reverse(), ...prev]);
          toast({ title: 'Upload complete', description: `${created.length} file(s) added` });
        }
      }, 700 + Math.random() * 900);
    });
  }, [user]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { handleFiles(e.target.files); e.currentTarget.value = ''; };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); };

  const deleteDoc = (id: string) => { setDocuments((s) => s.filter((d) => d.id !== id)); toast({ title: 'Deleted' }); };

  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);

  function handleDownload(d: DocumentItem) {
    if (!d.url) return;
    const a = document.createElement('a');
    a.href = d.url;
    a.download = d.title;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function handleShare(d: DocumentItem) {
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: d.title, url: d.url });
      } else {
        await navigator.clipboard.writeText(d.url);
        toast({ title: 'Link copied' });
      }
    } catch (err) {
      console.warn('share failed', err);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div
              className={`rounded-2xl p-6 mb-6 ${
                dragActive ? 'border-2 border-teal-400 bg-teal-50' : 'border-dashed border-gray-200 bg-white'
              }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              role="region"
              aria-label="Upload drop zone"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">Quick Drop — Add Documents</div>
                  <div className="text-sm text-slate-500 mt-1">Drop files here or click to choose. Supported: PDF, PNG, JPG.</div>
                </div>
                <div className="flex items-center gap-3">
                  <input ref={fileRef} type="file" multiple className="hidden" onChange={onFileInput} />
                  <button onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded bg-teal-500 text-white">
                    Choose files
                  </button>
                </div>
              </div>

              {uploading.length > 0 && (
                <div className="mt-4 grid gap-2">
                  {uploading.map((u) => (
                    <div key={u.id} className="bg-white rounded p-3 border">
                      <div className="flex items-center justify-between">
                        <div className="text-sm truncate">{u.name}</div>
                        <div className="text-xs text-slate-500">{Math.round(u.progress)}%</div>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded mt-2 overflow-hidden">
                        <div style={{ width: `${u.progress}%` }} className="h-2 bg-teal-500 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <motion.div variants={gridVariants.container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {documents.map((doc) => (
                <motion.div key={doc.id} variants={gridVariants.item}>
                  <DocumentCard doc={doc} onView={(d) => setSelected(d)} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </main>
      </div>

      <Footer />

      <AnimatePresence>
        {selected && (
          <DocumentPreviewModal doc={selected} onClose={() => setSelected(null)} onDelete={deleteDoc} onDownload={handleDownload} onShare={handleShare} />
        )}
      </AnimatePresence>
    </div>
  );
}
