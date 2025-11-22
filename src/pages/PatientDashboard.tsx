import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import {
	Calendar,
	MessageSquare,
	FileText,
	CreditCard,
	Stethoscope,
	Video,
	Activity,
	Pill,
	ShieldCheck,
	ArrowRight,
} from 'lucide-react';

type Appointment = {
	id: string;
	doctor: string;
	specialty: string;
	mode: 'In-person' | 'Teleconsultation';
	datetime: string; // ISO
	location?: string;
	status: 'Confirmed' | 'Pending' | 'Completed';
};

type RecordItem = {
	id: string;
	type: 'Prescription' | 'Visit Summary' | 'Lab Result';
	title: string;
	date: string; // ISO
};

type MessagePreview = {
	id: string;
	from: string;
	subject: string;
	time: string; // human readable
	unread?: boolean;
};

const PatientDashboard: React.FC = () => {
	const { user } = useAuth();

	// Mock data for a polished dashboard experience
	const upcomingAppointments: Appointment[] = [
		{
			id: 'a1',
			doctor: 'Dr. Sarah Smith',
			specialty: 'Cardiology',
			mode: 'Teleconsultation',
			datetime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
			status: 'Confirmed',
		},
		{
			id: 'a2',
			doctor: 'Dr. Kevin Lee',
			specialty: 'Dermatology',
			mode: 'In-person',
			datetime: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
			location: 'Building A, Room 204',
			status: 'Pending',
		},
	];

	const recentRecords: RecordItem[] = [
		{ id: 'r1', type: 'Visit Summary', title: 'Annual Physical Exam', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() },
		{ id: 'r2', type: 'Lab Result', title: 'CBC Panel', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
		{ id: 'r3', type: 'Prescription', title: 'Atorvastatin 10mg', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString() },
	];

	const messages: MessagePreview[] = [
		{ id: 'm1', from: 'Dr. Sarah Smith', subject: 'Follow-up recommendation', time: '2h ago', unread: true },
		{ id: 'm2', from: 'Reception', subject: 'Appointment confirmation', time: '1d ago' },
	];

	const medications = [
		{ name: 'Atorvastatin', dose: '10 mg', schedule: 'Once nightly' },
		{ name: 'Metformin', dose: '500 mg', schedule: 'Twice daily' },
	];

	const goals = [
		{ name: 'Daily Steps', progress: 70 },
		{ name: 'Sleep (7h target)', progress: 60 },
		{ name: 'Water Intake', progress: 80 },
	];

	const formatDate = (iso: string) => new Date(iso).toLocaleString(undefined, {
		weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
	});

	return (
		<div className="min-h-screen bg-background">
			<Header />

			<div className="flex">
				<Sidebar />

				<main className="flex-1 p-6 md:p-8">
					<div className="max-w-7xl mx-auto space-y-6">
						{/* Greeting */}
						<div>
							<h1 className="text-3xl font-bold">Welcome back, {user?.name || 'Patient'} 👋</h1>
							<p className="text-muted-foreground">Here’s a snapshot of your health and upcoming activities.</p>
						</div>

						{/* Top stats */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							<Card>
								<CardContent className="p-6 flex items-center justify-between">
									<div>
										<p className="text-sm text-muted-foreground">Upcoming</p>
										<p className="text-2xl font-bold">{upcomingAppointments.length}</p>
									</div>
									<div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
										<Calendar className="h-5 w-5 text-primary" />
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-6 flex items-center justify-between">
									<div>
										<p className="text-sm text-muted-foreground">Unread messages</p>
										<p className="text-2xl font-bold">{messages.filter(m => m.unread).length}</p>
									</div>
									<div className="h-10 w-10 rounded-md bg-secondary/10 flex items-center justify-center">
										<MessageSquare className="h-5 w-5 text-secondary" />
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-6 flex items-center justify-between">
									<div>
										<p className="text-sm text-muted-foreground">Recent records</p>
										<p className="text-2xl font-bold">{recentRecords.length}</p>
									</div>
									<div className="h-10 w-10 rounded-md bg-emerald-500/10 flex items-center justify-center">
										<FileText className="h-5 w-5 text-emerald-600" />
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-6 flex items-center justify-between">
									<div>
										<p className="text-sm text-muted-foreground">Bills due</p>
										<p className="text-2xl font-bold">$120</p>
									</div>
									<div className="h-10 w-10 rounded-md bg-amber-500/10 flex items-center justify-center">
										<CreditCard className="h-5 w-5 text-amber-600" />
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{/* Left column */}
							<div className="lg:col-span-2 space-y-6">
								{/* Upcoming appointments */}
								<Card className="shadow-card">
									<CardHeader className="flex-row items-center justify-between">
										<div>
											<CardTitle className="text-xl">Upcoming appointments</CardTitle>
											<CardDescription>Manage your visit plans and join teleconsultations on time.</CardDescription>
										</div>
										<Button asChild variant="outline" size="sm">
											<Link to="/appointments">View all</Link>
										</Button>
									</CardHeader>
									<CardContent>
										{upcomingAppointments.length === 0 ? (
											<div className="text-sm text-muted-foreground">No upcoming appointments. Book one now.</div>
										) : (
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Doctor</TableHead>
														<TableHead>Type</TableHead>
														<TableHead>Date & Time</TableHead>
														<TableHead>Status</TableHead>
														<TableHead className="text-right">Action</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{upcomingAppointments.map((a) => (
														<TableRow key={a.id}>
															<TableCell>
																<div className="flex items-center gap-3">
																	<Avatar className="h-8 w-8">
																		<AvatarImage src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop&crop=face" />
																		<AvatarFallback>{a.doctor.charAt(0)}</AvatarFallback>
																	</Avatar>
																	<div>
																		<div className="font-medium">{a.doctor}</div>
																		<div className="text-xs text-muted-foreground">{a.specialty}</div>
																	</div>
																</div>
															</TableCell>
															<TableCell>
																<div className="flex items-center gap-2">
																	{a.mode === 'Teleconsultation' ? (
																		<>
																			<Video className="h-4 w-4 text-primary" />
																			<span>Teleconsultation</span>
																		</>
																	) : (
																		<>
																			<Stethoscope className="h-4 w-4 text-primary" />
																			<span>In-person</span>
																		</>
																	)}
																</div>
															</TableCell>
															<TableCell>
																<div>
																	<div>{formatDate(a.datetime)}</div>
																	{a.location && (
																		<div className="text-xs text-muted-foreground">{a.location}</div>
																	)}
																</div>
															</TableCell>
															<TableCell>
																<Badge variant={a.status === 'Confirmed' ? 'default' : a.status === 'Pending' ? 'secondary' : 'outline'}>
																	{a.status}
																</Badge>
															</TableCell>
															<TableCell className="text-right">
																{a.mode === 'Teleconsultation' ? (
																	<Button asChild size="sm">
																		<Link to="/video-call">Join call</Link>
																	</Button>
																) : (
																	<Button asChild variant="outline" size="sm">
																		<Link to="/appointments">Details</Link>
																	</Button>
																)}
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										)}
									</CardContent>
								</Card>

								{/* Recent records */}
								<Card>
									<CardHeader className="flex-row items-center justify-between">
										<div>
											<CardTitle className="text-xl">Recent medical records</CardTitle>
											<CardDescription>Your latest lab results, prescriptions, and visit summaries.</CardDescription>
										</div>
										<Button asChild variant="outline" size="sm">
											<Link to="/medical-records">View all</Link>
										</Button>
									</CardHeader>
									<CardContent className="space-y-4">
										{recentRecords.map((r) => (
											<div key={r.id} className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
														{r.type === 'Lab Result' ? (
															<Activity className="h-4 w-4" />
														) : r.type === 'Prescription' ? (
															<Pill className="h-4 w-4" />
														) : (
															<FileText className="h-4 w-4" />
														)}
													</div>
													<div>
														<div className="font-medium">{r.title}</div>
														<div className="text-xs text-muted-foreground">{r.type} • {new Date(r.date).toLocaleDateString()}</div>
													</div>
												</div>
												<Button asChild variant="ghost" size="sm" className="text-primary">
													<Link to="/medical-records" className="inline-flex items-center gap-1">Open <ArrowRight className="h-4 w-4" /></Link>
												</Button>
											</div>
										))}
									</CardContent>
								</Card>
							</div>

							{/* Right column */}
							<div className="space-y-6">
								{/* Quick actions */}
								<Card>
									<CardHeader>
										<CardTitle className="text-xl">Quick actions</CardTitle>
									</CardHeader>
									<CardContent className="grid grid-cols-2 gap-3">
										<Button asChild className="justify-start" variant="secondary">
											<Link to="/appointments" className="flex items-center gap-2">
												<Calendar className="h-4 w-4" /> Book appointment
											</Link>
										</Button>
										<Button asChild className="justify-start" variant="secondary">
											<Link to="/video-call" className="flex items-center gap-2">
												<Video className="h-4 w-4" /> Start teleconsult
											</Link>
										</Button>
										<Button asChild className="justify-start" variant="secondary">
											<Link to="/messages" className="flex items-center gap-2">
												<MessageSquare className="h-4 w-4" /> Message doctor
											</Link>
										</Button>
										<Button asChild className="justify-start" variant="secondary">
											<Link to="/medical-records" className="flex items-center gap-2">
												<FileText className="h-4 w-4" /> Upload record
											</Link>
										</Button>
									</CardContent>
								</Card>

								{/* Messages preview */}
								<Card>
									<CardHeader className="flex-row items-center justify-between">
										<CardTitle className="text-xl">Messages</CardTitle>
										<Button asChild variant="outline" size="sm">
											<Link to="/messages">Open Inbox</Link>
										</Button>
									</CardHeader>
									<CardContent className="space-y-4">
										{messages.map((m) => (
											<div key={m.id} className="flex items-start justify-between">
												<div>
													<div className="font-medium flex items-center gap-2">
														{m.from} {m.unread && <Badge>New</Badge>}
													</div>
													<div className="text-sm text-muted-foreground">{m.subject}</div>
												</div>
												<div className="text-xs text-muted-foreground whitespace-nowrap">{m.time}</div>
											</div>
										))}
									</CardContent>
								</Card>

								{/* Billing & Insurance */}
								<Card>
									<CardHeader>
										<CardTitle className="text-xl">Billing & insurance</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="flex items-center justify-between">
											<div className="text-sm text-muted-foreground">Outstanding balance</div>
											<div className="font-semibold">$120.00</div>
										</div>
										<div className="flex items-center justify-between">
											<div className="text-sm text-muted-foreground">Next invoice due</div>
											<div className="font-semibold">Nov 10, 2025</div>
										</div>
										<div className="flex items-center justify-between">
											<div className="text-sm text-muted-foreground">Insurance</div>
											<div className="flex items-center gap-2">
												<ShieldCheck className="h-4 w-4 text-primary" />
												<span className="font-medium">Aetna • Policy #SC-93721</span>
											</div>
										</div>
									</CardContent>
									<CardFooter className="justify-end">
										<Button asChild size="sm">
											<Link to="/financial-hub">Manage billing</Link>
										</Button>
									</CardFooter>
								</Card>

								{/* Health goals */}
								<Card>
									<CardHeader>
										<CardTitle className="text-xl">Health goals</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										{goals.map((g) => (
											<div key={g.name}>
												<div className="mb-1 flex items-center justify-between">
													<span className="text-sm">{g.name}</span>
													<span className="text-xs text-muted-foreground">{g.progress}%</span>
												</div>
												<Progress value={g.progress} />
											</div>
										))}
									</CardContent>
								</Card>

								{/* Medications */}
								<Card>
									<CardHeader>
										<CardTitle className="text-xl">Current medications</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										{medications.map((m) => (
											<div key={m.name} className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
														<Pill className="h-4 w-4 text-primary" />
													</div>
													<div>
														<div className="font-medium">{m.name}</div>
														<div className="text-xs text-muted-foreground">{m.dose} • {m.schedule}</div>
													</div>
												</div>
												<Button variant="outline" size="sm">Refill</Button>
											</div>
										))}
									</CardContent>
								</Card>
							</div>
						</div>
					</div>
				</main>
			</div>

			<Footer />
		</div>
	);
};

export default PatientDashboard;
