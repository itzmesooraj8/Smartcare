import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Calendar, BarChart3, Settings } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<{ total_users?: number; doctors?: number; patients?: number; appointments?: number}>({});
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const s = await apiFetch('/api/v1/admin/stats');
      const u = await apiFetch('/api/v1/admin/users');
      setStats(s);
      setUsers(u || []);
    } catch (e) {
      console.error('Failed to load admin data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete user? This cannot be undone.')) return;
    try {
      await apiFetch(`/api/v1/admin/users/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">System overview and administrative controls.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{loading ? '…' : stats.total_users ?? 0}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">Doctors</p>
                  <p className="text-2xl font-bold text-foreground">{loading ? '…' : stats.doctors ?? 0}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">Patients</p>
                  <p className="text-2xl font-bold text-foreground">{loading ? '…' : stats.patients ?? 0}</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-card p-4 rounded-md shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Users</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.id}</TableCell>
                      <TableCell>{u.full_name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>{u.created_at}</TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(u.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
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

export default AdminDashboard;