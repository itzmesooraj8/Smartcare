import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { IndianRupee, FileText, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
import Footer from '@/components/layout/Footer';

const FinancialHub: React.FC = () => {
  // Sample monthly revenue data
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    datasets: [
      {
        label: 'Monthly Revenue (₹)',
        data: [20000, 23500, 26500, 22000, 28000, 30000, 32000, 34000, 35000],
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
        borderRadius: 6,
      },
    ],
  };
  const revenueOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Monthly Revenue Trend', font: { size: 18 } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { color: '#2563eb', font: { weight: 'bold' as const } } },
      x: { ticks: { color: '#2563eb', font: { weight: 'bold' as const } } },
    },
  };
  // Get user role from AuthContext
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Financial Analytics Dashboard</h1>
        {isAdmin ? (
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <IndianRupee className="w-7 h-7 text-blue-600" /> Revenue Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-700">₹2,50,000</div>
                    <div className="text-sm text-gray-600">Total Revenue (Year)</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-700">₹35,000</div>
                    <div className="text-sm text-gray-600">Revenue (This Month)</div>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Revenue Sources</h3>
                  <ul className="list-disc pl-6 text-gray-700">
                    <li>Consultations: <span className="font-bold">₹1,00,000</span></li>
                    <li>Appointments: <span className="font-bold">₹80,000</span></li>
                    <li>Medical Records: <span className="font-bold">₹40,000</span></li>
                    <li>Other Services: <span className="font-bold">₹30,000</span></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Monthly Revenue Trend</h3>
                  <div className="bg-white rounded-lg p-4 shadow">
                    <Bar data={revenueData} options={revenueOptions} />
                  </div>
                  <div className="mt-4 text-blue-700 text-sm font-medium">
                    <span>Analysis: </span>
                    Revenue has shown a steady increase over the past months, with the highest in September. Consultations and appointments are the major contributors. Consider promoting medical records and other services for further growth.
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Detailed Revenue Table</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="p-2 font-semibold">Month</th>
                      <th className="p-2 font-semibold">Consultations</th>
                      <th className="p-2 font-semibold">Appointments</th>
                      <th className="p-2 font-semibold">Records</th>
                      <th className="p-2 font-semibold">Other</th>
                      <th className="p-2 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2">Jan</td>
                      <td className="p-2">₹8,000</td>
                      <td className="p-2">₹7,000</td>
                      <td className="p-2">₹3,000</td>
                      <td className="p-2">₹2,000</td>
                      <td className="p-2 font-bold">₹20,000</td>
                    </tr>
                    <tr>
                      <td className="p-2">Feb</td>
                      <td className="p-2">₹9,000</td>
                      <td className="p-2">₹8,000</td>
                      <td className="p-2">₹4,000</td>
                      <td className="p-2">₹2,500</td>
                      <td className="p-2 font-bold">₹23,500</td>
                    </tr>
                    <tr>
                      <td className="p-2">Mar</td>
                      <td className="p-2">₹10,000</td>
                      <td className="p-2">₹9,000</td>
                      <td className="p-2">₹4,500</td>
                      <td className="p-2">₹3,000</td>
                      <td className="p-2 font-bold">₹26,500</td>
                    </tr>
                    {/* Add more months as needed */}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
};

export default FinancialHub;