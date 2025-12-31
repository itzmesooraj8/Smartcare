import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import apiFetch from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import LoadingSpinner from '@/components/LoadingSpinner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ReportsAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    apiFetch.get('/admin/stats')
      .then((res: any) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load analytics", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner />;

  // Transform data for charts
  const userRoleData = [
    { name: 'Doctors', value: stats?.doctors || 0 },
    { name: 'Patients', value: stats?.patients || 0 },
  ];

  const overviewData = [
    { name: 'Total Users', count: stats?.total_users || 0 },
    { name: 'Appointments', count: stats?.appointments || 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Real-time insights into your practice performance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card className="shadow-lg border-t-4 border-t-blue-500">
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userRoleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label
                    >
                      {userRoleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-t-green-500">
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overviewData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" barSize={50} radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Mock Trend Chart since historical API is missing */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Monthly Appointment Trends (Projected)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Jan', appointments: 40 },
                  { name: 'Feb', appointments: 30 },
                  { name: 'Mar', appointments: 20 },
                  { name: 'Apr', appointments: 27 },
                  { name: 'May', appointments: 18 },
                  { name: 'Jun', appointments: 23 },
                  { name: 'Jul', appointments: 34 },
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="appointments" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </main>
      </div>
      <Footer />
    </div>
  );
};
