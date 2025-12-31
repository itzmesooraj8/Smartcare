import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import apiFetch from '@/lib/api';

const PatientsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === 'doctor' || user?.role === 'admin') {
      apiFetch({ url: '/patients' })
        .then((data: any) => setPatients(data || []))
        .catch(console.error);
    }
  }, [user]);

  if (!user || (user.role !== 'doctor' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h1 className="text-2xl font-semibold">Access Denied</h1>
            <p className="text-muted-foreground">You do not have permission to view this page.</p>
            <div className="mt-4">
              <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">My Patients</h1>
            <p className="text-lg text-muted-foreground mb-6">Manage your patient list and view records.</p>

            <div className="bg-card rounded-md shadow-sm border p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Blood Group</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No patients found</TableCell>
                    </TableRow>
                  ) : (
                    patients.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {p.avatar && <img src={p.avatar} className="w-8 h-8 rounded-full" />}
                            {p.name}
                          </div>
                        </TableCell>
                        <TableCell>{p.email}</TableCell>
                        <TableCell>{p.date_of_birth || '-'}</TableCell>
                        <TableCell>{p.gender || '-'}</TableCell>
                        <TableCell>{p.blood_group || '-'}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/medical-records?patient=${p.user_id}`)}>View Records</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default PatientsPage;
