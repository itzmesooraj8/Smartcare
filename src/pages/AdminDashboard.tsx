import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Calendar, BarChart3, Settings, Trash2 } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<{ total_users?: number; doctors?: number; patients?: number; appointments?: number }>({});
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const s = await apiFetch.get('/admin/stats');
      const uResp = await apiFetch.get('/admin/users');
      setStats(s.data as any || {});
      setUsers((uResp.data as any[]) || []);
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
      await apiFetch.delete(`/admin/users/${id}`);
      await fetchData();
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">System overview and administrative controls.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="shadow-lg border-l-4 border-l-blue-500 hover:shadow-xl transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold text-foreground">{stats.total_users ?? 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500 opacity-50" />
                </CardContent>
              </Card>
              <Card className="shadow-lg border-l-4 border-l-purple-500 hover:shadow-xl transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Doctors</p>
                    <p className="text-3xl font-bold text-foreground">{stats.doctors ?? 0}</p>
                  </div>
                  <StethoscopeIcon className="w-8 h-8 text-purple-500 opacity-50" />
                </CardContent>
              </Card>
              <Card className="shadow-lg border-l-4 border-l-green-500 hover:shadow-xl transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Patients</p>
                    <p className="text-3xl font-bold text-foreground">{stats.patients ?? 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-500 opacity-50" />
                </CardContent>
              </Card>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-lg border">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Users className="mr-2 w-5 h-5 text-primary" />
                User Management
              </h2>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>No.</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u, i) => (
                      <TableRow key={u.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-mono text-xs max-w-[100px] truncate">{u.id}</TableCell>
                        <TableCell className="font-medium">{u.full_name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            u.role === 'doctor' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                            {u.role.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(u.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

function StethoscopeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  )
}

export default AdminDashboard;