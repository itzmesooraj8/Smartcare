import React, { useCallback, useMemo, useRef, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, Eye, Plus, Image as ImageIcon, Search, Microscope, Pill, Stethoscope, MoreVertical, Trash, ZoomIn, Share2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';

// Small DOM toast fallback for environments without a global toast provider
const useToast = () => {
	const notify = ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
		const node = document.createElement('div');
		node.className = `fixed bottom-6 right-6 z-50 max-w-xs p-3 rounded-lg shadow-lg ${variant === 'destructive' ? 'bg-red-600 text-white' : 'bg-white text-black'}`;
		node.innerHTML = `<div class="font-semibold">${title}</div><div class="text-sm mt-1">${description || ''}</div>`;
		document.body.appendChild(node);
		setTimeout(() => node.remove(), 3800);
	};
	return { toast: notify };
};

// Polished RecordCard with iconography, subtle depth and focus outlines
type RecordCardProps = {
	rec: RecordItem;
	idx: number;
	onPreview?: () => void;
	onDelete?: () => void;
	privacyBlur?: boolean;
	canEdit?: boolean;
};

const TypeIcon = ({ type }: { type: string }) => {
	if (type === 'Lab Result') return <Microscope className="text-teal-300" />;
	if (type === 'Prescription') return <Pill className="text-amber-300" />;
	if (type === 'Imaging') return <ImageIcon className="text-violet-300" />;
	if (type === 'Consultation') return <Stethoscope className="text-sky-300" />;
	return <FileText className="text-slate-300" />;
};

const RecordCard = React.forwardRef<HTMLDivElement, RecordCardProps>(({ rec, idx, onPreview, onDelete, privacyBlur, canEdit }, ref) => {
	return (
		<article
			ref={ref as any}
			tabIndex={0}
			className="mb-4 break-inside-avoid rounded-2xl p-4 bg-white border border-gray-200 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
			aria-labelledby={`rec-${rec.id}-title`}
		>
			<div className="flex items-start gap-3">
				<div className="w-12 h-12 rounded-xl bg-white/6 flex items-center justify-center ring-1 ring-white/6">
					<TypeIcon type={rec.type} />
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between gap-3">
						<div className="min-w-0">
							  <div className="text-xs text-slate-500">{rec.type} • <span className="text-slate-400">{rec.date}</span></div>
							  <h4 id={`rec-${rec.id}-title`} className="mt-1 font-semibold text-slate-800 truncate">{rec.title}</h4>
							  <div className="text-sm text-slate-500 truncate">{rec.doctor}</div>
						</div>
						<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
							<button onClick={onPreview} aria-label="Preview" className="p-2 rounded-md bg-white/5 hover:bg-white/8"><Eye /></button>
							{canEdit && <button onClick={onDelete} aria-label="Delete" className="p-2 rounded-md bg-red-600 text-black hover:brightness-90"><Trash /></button>}
						</div>
					</div>

						{rec.privateToDoctor && !canEdit ? (
							<div className="mt-3 text-sm text-slate-500 italic">This record is restricted to providers.</div>
						) : (
							rec.attachments && rec.attachments.length > 0 && (
								<div className="mt-3">
									<div className="text-xs text-slate-500">{rec.attachments[0].name}</div>
									{rec.attachments[0].mime?.startsWith('image') ? (
											<div className={`mt-2 w-full h-36 sm:h-44 rounded-lg overflow-hidden bg-gray-100 ${privacyBlur ? 'filter blur-sm' : ''}`}>
												<img src={rec.attachments[0].url} alt={rec.attachments[0].name} className="w-full h-full object-cover" />
											</div>
									) : (
										<div className="mt-2 flex items-center gap-3 text-slate-600">
											<FileText /> <div className="truncate">{rec.attachments[0].name}</div>
										</div>
									)}
								</div>
							)
						)}
				</div>
			</div>
		</article>
	);
});
RecordCard.displayName = 'RecordCard';

const recordSchema = z.object({
	title: z.string().min(2, 'Title is required'),
	type: z.enum(['Lab Result', 'Prescription', 'Imaging', 'Consultation', 'Other']),
	description: z.string().optional(),
	privateToDoctor: z.boolean().optional(),
});

type RecordItem = {
	id: string;
	title: string;
	date: string;
	doctor: string;
	type: 'Lab Result' | 'Prescription' | 'Imaging' | 'Consultation' | 'Other';
	description?: string;
	attachments?: Array<{ id: string; name: string; url: string; mime?: string }>;
	privateToDoctor?: boolean;
};

export default function MedicalRecordsPage() {
	const { user } = useAuth();
	const { register, handleSubmit, reset, formState } = useForm({
		resolver: zodResolver(recordSchema),
		defaultValues: { title: '', type: 'Other', description: '', privateToDoctor: false },
	});
	const [records, setRecords] = useState<RecordItem[]>([]);
	const [filter, setFilter] = useState<string>('All');
	const filterOptions = ['All', 'Lab Result', 'Prescription', 'Imaging', 'Consultation', 'Other'];
	const selectedIndex = filterOptions.indexOf(filter);
	const [query, setQuery] = useState<string>('');
	const [dragging, setDragging] = useState(false);
	const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
	const [uploads, setUploads] = useState<Array<{ id: string; name: string; progress: number; url: string; mime: string }>>([]);
	const [preview, setPreview] = useState<{ url: string; mime?: string; name?: string } | null>(null);
	const [privacyBlur, setPrivacyBlur] = useState(true);
	const [panelOpen, setPanelOpen] = useState(false);
	const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);
	const [recordActionOpen, setRecordActionOpen] = useState<string | null>(null);
	const [deleteModal, setDeleteModal] = useState<{ open: boolean; recordId?: string }>({ open: false });
	const isEditor = user?.role === 'doctor' || user?.role === 'admin';
	const fileRef = useRef<HTMLInputElement | null>(null);

	const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
	const maxBytes = 5 * 1024 * 1024;

	const onDrop = useCallback((files: FileList | null) => {
		if (!files) return;
		Array.from(files).forEach(handleFile);
	}, []);

	const handleFile = (file: File) => {
		if (!allowed.includes(file.type)) {
			toast({ title: 'Invalid file type', description: 'Only PDF, PNG, JPG allowed', variant: 'destructive' });
			pulseUploadZone();
			return;
		}
		if (file.size > maxBytes) {
			toast({ title: 'File too large', description: 'Max file size is 5MB', variant: 'destructive' });
			pulseUploadZone();
			return;
		}

		const id = `upl-${Date.now()}`;
		const url = URL.createObjectURL(file);
		setUploads((u) => [{ id, name: file.name, progress: 2, url, mime: file.type }, ...u]);

		const t = window.setInterval(() => {
			setUploads((u) => u.map((it) => (it.id === id ? { ...it, progress: Math.min(98, it.progress + Math.round(Math.random() * 18)) } : it)));
		}, 350);

		setTimeout(() => {
			clearInterval(t);
			setUploads((u) => u.filter((it) => it.id !== id));
			const newRec: RecordItem = { id: `rec-${Date.now()}`, title: `Uploaded • ${file.name}`, date: new Date().toISOString().slice(0, 10), doctor: user?.name || 'System', type: 'Other', description: '', attachments: [{ id, name: file.name, url, mime: file.type }] };
			setRecords((r) => [newRec, ...r]);
			toast({ title: 'Upload complete', description: file.name });
		}, 1200 + Math.random() * 1800);
	};

	const deleteRecord = (id: string) => {
		setRecords((r) => r.filter((x) => x.id !== id));
		toast({ title: 'Record deleted', description: '' });
		setDeleteModal({ open: false });
	};

	const pulseUploadZone = () => {
		const el = document.getElementById('upload-zone');
		if (!el) return;
		el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 400 });
	};

	const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onDrop(e.target.files);
		e.currentTarget.value = '';
	};

	const handlePreview = (att?: { url?: string; mime?: string; name?: string }) => {
		if (!att) return toast({ title: 'No preview', description: 'No attachment available' });
		setPreview({ url: att.url || '', mime: att.mime, name: att.name });
	};

	const addRecord = (data: any) => {
		const rec: RecordItem = { id: `rec-${Date.now()}`, title: data.title, type: data.type, description: data.description, date: new Date().toISOString().slice(0, 10), doctor: user?.name || 'Unknown', attachments: [], privateToDoctor: !!data.privateToDoctor };
		setRecords((r) => [rec, ...r]);
		toast({ title: 'Record Saved', description: data.title });
		reset();
		setPanelOpen(false);
	};

	const filtered = records.filter((r) => (filter === 'All' ? true : r.type === filter)).filter((r) => r.title.toLowerCase().includes(query.toLowerCase()) || (r.description || '').toLowerCase().includes(query.toLowerCase()));

	const counts = useMemo(() => {
		const map: Record<string, number> = { All: records.length } as any;
		for (const t of filterOptions) map[t] = 0;
		for (const r of records) map[r.type] = (map[r.type] || 0) + 1;
		map['All'] = records.length;
		return map;
	}, [records]);

	const vaultVariants = {
		container: { transition: { staggerChildren: 0.05 } },
		item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } },
	};
	// refs for keyboard navigation
	const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
	const gridRef = useRef<HTMLDivElement | null>(null);

	// keyboard navigation: arrow keys navigate cards
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const active = document.activeElement as HTMLElement | null;
			if (!active || !gridRef.current) return;
			if (!gridRef.current.contains(active)) return;
			const idx = cardRefs.current.findIndex((c) => c === active);
			if (idx === -1) return;
			if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
				const next = cardRefs.current[idx + 1] || cardRefs.current[0];
				next?.focus();
				e.preventDefault();
			}
			if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
				const prev = cardRefs.current[idx - 1] || cardRefs.current[cardRefs.current.length - 1];
				prev?.focus();
				e.preventDefault();
			}
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, []);

  function FilterIcon({ t }: { t: string }): React.ReactNode {
    if (t === 'Lab Result') return <Microscope className="text-teal-300" />;
    if (t === 'Prescription') return <Pill className="text-amber-300" />;
    if (t === 'Imaging') return <ImageIcon className="text-violet-300" />;
    if (t === 'Consultation') return <Stethoscope className="text-sky-300" />;
    // covers "All" and "Other" and any fallback
    return <FileText className="text-slate-300" />;
  }

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<div className="flex">
				<div className="hidden md:block"><Sidebar /></div>
				<main className="flex-1 p-4 sm:p-8">
					<div className="max-w-7xl mx-auto">
						{/* Floating control bar (Cockpit) */}
						<div className="relative mb-6">
							<motion.div initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45 }} className="sticky top-6 z-20 bg-white border border-gray-200 rounded-3xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shadow-sm">
								<div className="flex-1">
									<div className="relative">
										<div className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-300"><Search /></div>
										<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the Vault" className="w-full pl-12 pr-4 py-3 rounded-full bg-gray-50 placeholder:text-slate-400 outline-none border border-gray-200 focus:ring-2 focus:ring-teal-200 text-slate-800" />
									</div>
								</div>

								{/* Sliding segmented control (redesigned) */}
								<div className="relative px-2 py-2 rounded-2xl bg-gradient-to-b from-white to-gray-50 border border-gray-100 w-full max-w-3xl" role="tablist" aria-label="Record type filter">
									<div className="relative overflow-hidden rounded-2xl">
										<motion.div
											className="absolute inset-y-1 rounded-full bg-teal-50"
											transition={{ type: 'spring', stiffness: 420, damping: 28 }}
											style={{
												left: `${(selectedIndex * 100) / filterOptions.length}%`,
												width: `${100 / filterOptions.length}%`,
											}}
										/>
										<div className="relative flex overflow-x-auto no-scrollbar touch-pan-x gap-1">
											{filterOptions.map((t, i) => (
												<button
													key={t}
													role="tab"
													aria-selected={filter === t}
													onClick={() => setFilter(t)}
													onKeyDown={(e) => {
														if (e.key === 'ArrowRight') setFilter(filterOptions[(i + 1) % filterOptions.length]);
														if (e.key === 'ArrowLeft') setFilter(filterOptions[(i - 1 + filterOptions.length) % filterOptions.length]);
													}}
													className={`min-w-[88px] flex-shrink-0 relative z-10 px-3 py-2 text-sm flex items-center gap-2 justify-center ${filter === t ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>
													<div className="flex items-center gap-2">
														{FilterIcon({ t })}
														<span className="truncate">{t}</span>
														<span className="ml-2 text-xs text-slate-400 hidden sm:inline">{counts[t]}</span>
													</div>
												</button>
											))}
										</div>
									</div>
								</div>

								<div className="flex items-center gap-2 mt-2 sm:mt-0">
									{isEditor ? (
										<button onClick={() => setPanelOpen(true)} aria-label="Add record" className="inline-flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-full shadow hover:scale-105 transform transition">
											<Plus /> Add Record
										</button>
									) : (
										<button disabled title="Only providers can add records" className="inline-flex items-center gap-2 bg-gray-100 text-slate-400 px-4 py-2 rounded-full shadow-sm cursor-not-allowed">+ Add Record</button>
									)}
									<button onClick={() => setUploadDrawerOpen(true)} aria-label="Open upload drawer" className="px-4 py-2 rounded-full border border-gray-200 bg-white">Upload</button>
									{/* privacyBlur is enabled by default; reveal toggle removed per design */}
								</div>
							</motion.div>
						</div>

						{/* Upload Drawer (Interaction) */}
						<AnimatePresence>
								{uploadDrawerOpen && (
									<motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }} transition={{ type: 'spring' }} className="fixed z-40 sm:right-6 sm:bottom-6 right-4 left-4 bottom-6 w-full sm:w-[480px] bg-white sm:rounded-2xl rounded-t-xl p-4 border border-gray-200 shadow-lg">
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center gap-3">
												<div className="text-lg font-semibold text-slate-800">Secure Upload</div>
												<div className="text-xs text-slate-500">AES-256 in transit</div>
											</div>
											<div className="flex items-center gap-2">
												<button onClick={() => setUploadDrawerOpen(false)} className="text-slate-500">Close</button>
											</div>
										</div>
										<div id="upload-drawer" onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); onDrop(e.dataTransfer.files); }} className={`rounded-xl p-6 transition-all border-2 ${dragging ? 'border-teal-400 bg-teal-50 shadow-inner' : 'border-dashed border-gray-200 bg-white'}`}>
											<div className="flex flex-col items-center justify-center py-6">
												<div className="text-sm mb-2 text-center text-slate-600">Drag & drop sensitive files here — they are encrypted in transit and stored securely.</div>
												<div className="flex items-center gap-3 mt-3">
													<input ref={fileRef} type="file" className="hidden" onChange={onFileChange} />
													<button onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded bg-teal-500 text-white">Choose file</button>
													<div className="text-sm text-slate-500">Max 5MB — PDF / PNG / JPG</div>
												</div>
											</div>

											<div className="mt-4">
												{uploads.length === 0 && <div className="text-xs text-slate-400">No active uploads</div>}
												{uploads.map((u) => (
													<motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 mb-3 bg-gray-50 rounded p-2">
														<div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center"><ImageIcon className="text-slate-500"/></div>
														<div className="flex-1">
															<div className="flex items-center justify-between"><div className="font-medium truncate text-slate-800">{u.name}</div><div className="text-sm text-slate-500">{Math.round(u.progress)}%</div></div>
															<div className="w-full bg-gray-200 h-2 rounded mt-2 overflow-hidden"><div style={{ width: `${u.progress}%` }} className="h-2 bg-teal-500 transition-all" /></div>
														</div>
														<div className="flex flex-col items-end gap-2">
															<button onClick={() => { setUploads((s) => s.filter((x) => x.id !== u.id)); }} className="text-xs text-slate-500">Cancel</button>
														</div>
													</motion.div>
												))}
											</div>
										</div>
									</motion.div>
								)}
						</AnimatePresence>

						{/* Vault Bento Grid */}
						<div ref={gridRef} className="vault-bento mt-6" aria-label="Medical records grid">
							{filtered.length === 0 ? (
								<div className="py-20 text-center text-slate-500">
									<div className="text-2xl font-semibold mb-2">No records yet</div>
									<div className="max-w-xl mx-auto">No records match your search or filters. Use <strong>Add Record</strong> or <strong>Upload</strong> to add medical files.</div>
								</div>
							) : (
								<motion.div layout variants={vaultVariants.container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[120px] sm:auto-rows-[160px]">
									{filtered.map((rec, idx) => {
											const spanClass = idx % 7 === 2 ? 'row-span-2' : idx % 5 === 0 ? 'row-span-3' : 'row-span-1';
										return (
											<motion.div layout variants={vaultVariants.item} key={rec.id} className={`${spanClass} transform-gpu`}> 
												<div className="h-full flex">
													<RecordCard
														rec={rec}
														idx={idx}
														ref={(el) => (cardRefs.current[idx] = el)}
														onPreview={() => handlePreview(rec.attachments?.[0])}
														onDelete={() => setDeleteModal({ open: true, recordId: rec.id })}
														privacyBlur={privacyBlur}
														canEdit={isEditor}
													/>
												</div>
											</motion.div>
										);
									})}
								</motion.div>
							)}
						</div>
					</div>
				</main>
			</div>
			<Footer />

			{/* Add record sheet */}
			{panelOpen && (
				<div className="fixed inset-0 z-50 flex">
					<div className="flex-1 bg-black/20" onClick={() => setPanelOpen(false)} />
					<aside className="w-full md:w-96 bg-white p-6 shadow-lg overflow-auto border-l border-gray-200">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-semibold text-slate-800">New Record</h2>
							<button onClick={() => setPanelOpen(false)} className="text-slate-500">Close</button>
						</div>
						<form onSubmit={handleSubmit(addRecord)} className="space-y-4">
							<div>
								<label className="text-sm font-medium text-slate-700">Title</label>
								<input {...register('title')} className="w-full mt-2 p-2 rounded bg-gray-50 border border-gray-200 text-slate-800" />
								{formState.errors.title && <div className="text-red-600 text-sm mt-1">{(formState.errors.title as any)?.message}</div>}
							</div>
							<div>
								<label className="text-sm font-medium text-slate-700">Type</label>
								<select {...register('type')} className="w-full mt-2 p-2 rounded bg-gray-50 border border-gray-200 text-slate-800">
									<option value="Lab Result">Lab Result</option>
									<option value="Prescription">Prescription</option>
									<option value="Imaging">Imaging</option>
									<option value="Consultation">Consultation</option>
									<option value="Other">Other</option>
								</select>
							</div>
							<div>
								<label className="text-sm font-medium text-slate-700">Notes</label>
								<textarea {...register('description')} className="w-full mt-2 p-2 rounded h-24 bg-gray-50 border border-gray-200 text-slate-800" />
							</div>
							{isEditor && (
								<div className="flex items-center gap-3">
									<input type="checkbox" {...register('privateToDoctor')} id="privateToDoctor" />
									<label htmlFor="privateToDoctor" className="text-sm text-slate-700">Private (visible to providers only)</label>
								</div>
							)}
							{isEditor && (
								<div className="flex items-center gap-3">
									<button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded">Save Record</button>
									<button type="button" onClick={() => { reset(); setPanelOpen(false); }} className="px-4 py-2 border rounded text-slate-600">Cancel</button>
								</div>
							)}
							{!isEditor && <div className="text-sm text-slate-500">Only providers can create records. Contact your clinic.</div>}
						</form>
					</aside>
				</div>
			)}

			{/* Delete confirmation modal with hold-to-delete */}
			{deleteModal.open && (
				<div className="fixed inset-0 z-60 flex items-center justify-center">
					<div className="absolute inset-0 bg-black/30" />
					<div className="relative bg-white p-6 rounded-lg border border-gray-200 shadow-lg">
						<h3 className="text-lg font-semibold mb-2 text-slate-800">Confirm delete</h3>
						<p className="text-sm text-slate-600 mb-4">This action cannot be undone. Hold the button below to permanently delete the record.</p>
						<HoldToConfirm onConfirm={() => deleteRecord(deleteModal.recordId!)} />
						<div className="mt-4 text-right"><button className="text-slate-600" onClick={() => setDeleteModal({ open: false })}>Cancel</button></div>
					</div>
				</div>
			)}

			{/* Preview modal (secure viewer) */}
						{preview && (
				<div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setPreview(null)}>
					<div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-lg max-w-6xl w-full sm:p-4 p-2 sm:rounded-lg h-auto sm:h-auto" onClick={(e) => e.stopPropagation()}>
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-3">
								<div className="text-lg font-semibold">{preview.name}</div>
								<div className="text-xs text-slate-400">{preview.mime}</div>
							</div>
							<div className="flex items-center gap-3">
								<a href={preview.url} download={preview.name} className="px-3 py-1 border rounded flex items-center gap-2"><Download /> Download</a>
								<button className="px-3 py-1 border rounded" onClick={() => { navigator.clipboard?.writeText(preview.url || ''); toast({ title: 'Link copied' }); }}><Share2 /></button>
								<button className="px-3 py-1 border rounded" onClick={() => setPreview(null)}>Close</button>
							</div>
						</div>
						<div className="h-[50vh] sm:h-[72vh] flex items-center justify-center bg-black/50 rounded">
							{preview.mime === 'application/pdf' ? (
								<iframe src={preview.url} className="w-full h-full rounded" />
							) : (
								<motion.img src={preview.url} alt={preview.name} className={`w-full h-full object-contain rounded ${privacyBlur ? 'filter blur-sm' : ''}`} initial={{ scale: 0.985 }} animate={{ scale: 1 }} />
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

// Hold-to-confirm component
function HoldToConfirm({ onConfirm }: { onConfirm: () => void }) {
	const [holding, setHolding] = useState(false);
	const [progress, setProgress] = useState(0);
	const timerRef = useRef<number | null>(null);

	const start = () => {
		setHolding(true);
		let startTs = Date.now();
		timerRef.current = window.setInterval(() => {
			const elapsed = Date.now() - startTs;
			const p = Math.min(100, (elapsed / 1200) * 100);
			setProgress(p);
			if (p >= 100) {
				if (timerRef.current) clearInterval(timerRef.current);
				onConfirm();
			}
		}, 50) as unknown as number;
	};
	const stop = () => {
		setHolding(false);
		setProgress(0);
		if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
	};

	return (
		<div>
			<div className="w-64 bg-white/6 rounded overflow-hidden h-3 mb-3 shadow-inner">
				<div style={{ width: `${progress}%` }} className="h-3 bg-red-600 transition-all" />
			</div>
			<div className="flex items-center gap-3">
				<button onMouseDown={start} onMouseUp={stop} onMouseLeave={stop} className="px-4 py-2 bg-red-600 text-black rounded shadow">Hold to delete</button>
				<div className="text-sm text-slate-400">Hold for 1.2s to confirm</div>
			</div>
		</div>
	);
}
function useEffect(effect: () => (() => void) | void, deps: any[]) {
  // Lightweight shim that supports the common "run once" pattern used in this file.
  // If deps is an empty array, run the effect once (after render tick) and register
  // any returned cleanup on window unload. For other deps, run immediately and also
  // attach returned cleanup to unload as a best-effort fallback.
  try {
	const runOnceKey = '__simple_use_effect_run_once__';
	const runEffect = () => {
	  const cleanup = effect();
	  if (typeof cleanup === 'function') {
		window.addEventListener('unload', cleanup);
	  }
	};

	if (Array.isArray(deps) && deps.length === 0) {
	  if ((window as any)[runOnceKey]) return;
	  (window as any)[runOnceKey] = true;
	  // defer to next tick to emulate React's after-paint timing
	  window.setTimeout(runEffect, 0);
	} else {
	  runEffect();
	}
  } catch {
	// swallow errors to avoid breaking the page in environments where window may be undefined
  }
}
function toast(opts: { title: string; description?: string; variant?: string }) {
  try {
    if (typeof document === 'undefined') {
      // server/no-DOM fallback
      // eslint-disable-next-line no-console
      console.log('toast:', opts.title, opts.description);
      return;
    }

    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const node = document.createElement('div');
    node.className = `fixed bottom-6 right-6 z-50 max-w-xs p-3 rounded-lg shadow-lg ${opts.variant === 'destructive' ? 'bg-red-600 text-white' : 'bg-white text-black'}`;
    node.setAttribute('role', 'status');
    node.innerHTML = `<div class="font-semibold">${escapeHtml(opts.title)}</div>${opts.description ? `<div class="text-sm mt-1">${escapeHtml(opts.description)}</div>` : ''}`;

    document.body.appendChild(node);
    window.setTimeout(() => {
      node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).onfinish = () => node.remove();
    }, 3800);
  } catch (e) {
    // best-effort fallback
    // eslint-disable-next-line no-console
    console.log('toast fallback:', opts.title, opts.description);
  }
}

