import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

const PatientsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const patients = useMemo(() => [
    { id: 'p1', name: 'John Doe', age: 30, gender: 'Male', lastVisit: '2024-01-01' },
    { id: 'p2', name: 'Jane Smith', age: 28, gender: 'Female', lastVisit: '2024-02-12' },
    { id: 'p3', name: 'Sam Brown', age: 45, gender: 'Male', lastVisit: '2024-03-03' },
  ], []);

  if (!user || user.role !== 'doctor') {
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
          <h1 className="text-3xl font-bold mb-4">My Patients</h1>
          <p className="text-lg text-muted-foreground mb-6">Manage your patient list and view records.</p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.age}</TableCell>
                  <TableCell>{p.gender}</TableCell>
                  <TableCell>{p.lastVisit}</TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => alert(`View records for ${p.name} (mock)`)}>View Records</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default PatientsPage;
