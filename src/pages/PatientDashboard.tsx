import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Calendar, MessageSquare, FileText, CreditCard, Video } from 'lucide-react';

// Inlined motion primitives and a lightweight 3D hero.
type MotionTokens = { snappy: any; luxury: any; gentle: any };

const MotionContext = React.createContext<{ reducedMotion: boolean; tokens: MotionTokens } | null>(null);

const MotionProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
	const reducedMotion = useReducedMotion();
	const tokens = React.useMemo(
		() => ({
			snappy: { type: 'spring', stiffness: 320, damping: 28 },
			luxury: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
			gentle: { duration: 0.36, ease: [0.25, 0.1, 0.25, 1] },
		}),
		[]
	);
	return <MotionContext.Provider value={{ reducedMotion, tokens }}>{children}</MotionContext.Provider>;
};

function useMotion() {
	const ctx = React.useContext(MotionContext);
	if (!ctx) return { reducedMotion: true, tokens: { snappy: {}, luxury: {}, gentle: {} } };
	return ctx;
}

const MotionCard: React.FC<React.ComponentProps<typeof motion.div> & { delay?: number }> = ({ children, className = '', delay = 0, ...props }) => {
	const { reducedMotion, tokens } = useMotion();
	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={!reducedMotion ? { ...tokens.gentle, delay } : undefined}
			whileHover={!reducedMotion ? { y: -6 } : undefined}
			className={className}
			{...props}
		>
			<div className="backdrop-blur bg-white/60 border border-white/10 shadow-md rounded-lg p-4">{children as React.ReactNode}</div>
		</motion.div>
	);
};

const MotionButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ children, className = '', ...props }, ref) => {
	const { reducedMotion, tokens } = useMotion();
	return (
		<motion.div whileTap={!reducedMotion ? { scale: 0.96 } : undefined} whileHover={!reducedMotion ? { scale: 1.02 } : undefined} transition={tokens.snappy} className="inline-block">
			<button ref={ref as any} {...props} className={`${className} px-3 py-2 rounded-md bg-white/10 hover:bg-white/20`}>{children}</button>
		</motion.div>
	);
});
MotionButton.displayName = 'MotionButton';

const Hero3D: React.FC<{ label?: string }> = ({ label = 'Good Morning' }) => {
	const ref = React.useRef<HTMLDivElement | null>(null);
	const reducedMotion = useReducedMotion();

	React.useEffect(() => {
		if (reducedMotion) return;
		const el = ref.current;
		if (!el) return;
		let raf = 0;
		const onMove = (e: MouseEvent) => {
			const rect = el.getBoundingClientRect();
			const cx = rect.left + rect.width / 2;
			const cy = rect.top + rect.height / 2;
			const dx = e.clientX - cx;
			const dy = e.clientY - cy;
			const ry = (dx / rect.width) * 8;
			const rx = -(dy / rect.height) * 6;
			if (!raf) raf = requestAnimationFrame(() => {
				if (el) el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
				raf = 0;
			});
		};
		const onLeave = () => { if (ref.current) ref.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)'; };
		el.addEventListener('mousemove', onMove);
		el.addEventListener('mouseleave', onLeave);
		return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); if (raf) cancelAnimationFrame(raf); };
	}, [reducedMotion]);

	return (
		<div ref={ref} className="relative w-full h-44 md:h-56 lg:h-64 rounded-2xl overflow-hidden">
			<div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-400 to-sky-600 opacity-30" style={{ mixBlendMode: 'overlay' }} />
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
				<svg width="220" height="220" viewBox="0 0 120 120" fill="none" className="filter drop-shadow-[0_12px_30px_rgba(2,6,23,0.12)]">
					<defs>
						<linearGradient id="g2" x1="0" x2="1"><stop offset="0" stopColor="#a7f3d0" /><stop offset="1" stopColor="#06b6d4" /></linearGradient>
					</defs>
					<g>
						<path d="M60 10 L90 40 L60 70 L30 40 Z" fill="url(#g2)" opacity="0.88" />
						<path d="M60 20 L80 40 L60 60 L40 40 Z" fill="#fff" opacity="0.06" />
					</g>
				</svg>
			</div>
			<div className="absolute inset-0 flex items-start justify-start p-6 pointer-events-none">
				<div className="backdrop-blur-md bg-white/40 rounded-xl px-4 py-3 shadow-2xl border border-white/20">
					<div className="text-sm text-muted-foreground">{label},</div>
					<div className="text-xl md:text-2xl font-semibold tracking-tight">Patient</div>
				</div>
			</div>
		</div>
	);
};

function Gauge({ label, value }: { label: string; value: number }) {
	const radius = 28;
	const circumference = 2 * Math.PI * radius;
	const dash = (1 - Math.max(0, Math.min(1, value / 100))) * circumference;
	return (
		<div className="flex items-center gap-3">
			<svg width="72" height="72" viewBox="0 0 80 80">
				<g transform="translate(40,40)">
					<circle r={radius} fill="rgba(255,255,255,0.03)" />
					<circle r={radius} fill="transparent" stroke="#06b6d4" strokeWidth={6} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dash} style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
					<text x="0" y="6" textAnchor="middle" style={{ fontSize: 12, fill: '#0f172a' }}>{Math.round(value)}%</text>
				</g>
			</svg>
			<div>
				<div className="text-sm text-muted-foreground">{label}</div>
				<div className="font-medium">{Math.round((value / 100) * 200)} units</div>
			</div>
		</div>
	);
}

export default function PatientDashboard(): JSX.Element {
	const { user } = useAuth();
	const [expanded, setExpanded] = React.useState<null | string>(null);
	const vitals = [
		{ id: 'v1', label: 'Heart Rate', value: 72 },
		{ id: 'v2', label: 'Hydration', value: 80 },
		{ id: 'v3', label: 'Sleep', value: 65 },
	];

	return (
		<MotionProvider>
			<div className="min-h-screen bg-background">
				<Header />
				<div className="flex">
					<div className="hidden lg:block">
						<Sidebar />
					</div>
					<main className="flex-1 p-6 pb-20">
						<div className="max-w-7xl mx-auto">
							<Hero3D label={`Good Morning, ${user?.name || 'Patient'}`} />

							<div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
								<div className="lg:col-span-4">
									<MotionCard className="mb-4">
										<div className="flex items-center justify-between">
											<div>
												<h3 className="text-lg font-semibold">Vitals</h3>
												<p className="text-sm text-muted-foreground">Real-time snapshot</p>
											</div>
										</div>
										<div className="mt-4 grid grid-cols-1 gap-3">
											{vitals.map((v) => (
												<div key={v.id} className="flex items-center justify-between">
													<Gauge label={v.label} value={v.value} />
												</div>
											))}
										</div>
									</MotionCard>

									<MotionCard>
										<h4 className="text-md font-medium">Recent records</h4>
										<div className="mt-3">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">R</div>
													<div>
														<div className="font-medium">Annual Physical Exam</div>
														<div className="text-xs text-muted-foreground">Visit summary • 12/2/2025</div>
													</div>
												</div>
												<Link to="/medical-records" className="text-sm text-primary">Open</Link>
											</div>
										</div>
									</MotionCard>
								</div>

								<div className="lg:col-span-5">
									<MotionCard>
										<div className="flex items-start justify-between">
											<div>
												<h3 className="text-xl font-semibold">Next appointment</h3>
												<p className="text-sm text-muted-foreground">Keep track and join on time</p>
											</div>
										</div>
										<div className="mt-4">
											<div className="bg-white/6 rounded-lg p-4 border border-white/8 shadow-sm">
												<div className="flex items-center justify-between">
													<div>
														<div className="font-medium">Dr. Sarah Smith</div>
														<div className="text-xs text-muted-foreground">Cardiology • Teleconsultation</div>
													</div>
													<div className="text-right">
														<div className="font-medium">Dec 10, 2025</div>
														<div className="text-xs text-muted-foreground">12:30 AM</div>
													</div>
												</div>
												<div className="mt-4 flex items-center gap-3">
													<MotionButton onClick={() => setExpanded('appointment')} className="px-4 py-2">Book Appointment</MotionButton>
													<MotionButton className="px-3 py-2"><Link to="/video-call">Join</Link></MotionButton>
												</div>
											</div>
										</div>
									</MotionCard>
								</div>

								<div className="lg:col-span-3">
									<MotionCard>
										<h4 className="text-lg font-semibold">Quick actions</h4>
										<p className="text-sm text-muted-foreground">Common tasks</p>
										<div className="mt-4 grid grid-cols-2 gap-3">
											<MotionButton className="w-full py-3"><Link to="/appointments">Book</Link></MotionButton>
											<MotionButton className="w-full py-3"><Link to="/video-call">Call</Link></MotionButton>
											<MotionButton className="w-full py-3"><Link to="/messages">Message</Link></MotionButton>
											<MotionButton className="w-full py-3"><Link to="/medical-records">Upload</Link></MotionButton>
										</div>
									</MotionCard>
								</div>
							</div>

							<AnimatePresence>
								{expanded === 'appointment' && (
									<motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6">
										<motion.div layoutId="appointment-card" className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6">
											<div className="flex items-center justify-between">
												<div>
													<h3 className="text-2xl font-semibold">Book appointment</h3>
													<p className="text-sm text-muted-foreground">Quickly schedule with your care team</p>
												</div>
												<button onClick={() => setExpanded(null)} aria-label="Close" className="text-muted-foreground">Close</button>
											</div>
											<div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="text-sm text-muted-foreground">Reason</label>
													<input className="w-full mt-2 p-3 rounded-md border" placeholder="Brief reason for visit" />
												</div>
												<div>
													<label className="text-sm text-muted-foreground">When</label>
													<input type="datetime-local" className="w-full mt-2 p-3 rounded-md border" />
												</div>
											</div>
											<div className="mt-6 flex justify-end">
												<MotionButton onClick={() => setExpanded(null)} className="px-4 py-2">Confirm</MotionButton>
											</div>
										</motion.div>
									</motion.div>
								)}
							</AnimatePresence>

						</div>
					</main>
				</div>
				{/* Mobile bottom nav (visible on small screens) */}
				<nav className="fixed left-0 right-0 bottom-0 z-50 lg:hidden">
					<div className="mx-4 mb-4 bg-white/70 backdrop-blur border border-white/10 rounded-xl shadow-lg p-2 flex justify-around items-center">
						<Link to="/dashboard" className="flex flex-col items-center text-xs text-muted-foreground">
							<svg className="h-5 w-5 mb-1" viewBox="0 0 24 24" fill="none" aria-hidden>
								<path d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3v6h8V3h-8zM3 21h8v-6H3v6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
							Dashboard
						</Link>
						<Link to="/appointments" className="flex flex-col items-center text-xs text-muted-foreground">
							<Calendar className="h-5 w-5 mb-1" />
							Appts
						</Link>
						<Link to="/messages" className="flex flex-col items-center text-xs text-muted-foreground">
							<MessageSquare className="h-5 w-5 mb-1" />
							Msgs
						</Link>
						<Link to="/video-call" className="flex flex-col items-center text-xs text-muted-foreground">
							<Video className="h-5 w-5 mb-1" />
							Call
						</Link>
						<Link to="/profile" className="flex flex-col items-center text-xs text-muted-foreground">
							<svg className="h-5 w-5 mb-1" viewBox="0 0 24 24" fill="none" aria-hidden>
								<path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 5v1h18v-1c0-2.5-4-5-9-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
							Profile
						</Link>
					</div>
				</nav>

				<Footer />
			</div>
		</MotionProvider>
	);
}
