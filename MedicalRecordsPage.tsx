import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, Eye, Plus, Calendar } from 'lucide-react';

const MedicalRecordsPage = () => {
  const { user } = useAuth();

  const records = [
    {
      id: 1,
      title: 'Annual Physical Examination',
      date: '2024-03-15',
      doctor: 'Dr. Sarah Smith',
      type: 'Physical Exam',
      status: 'Complete'
    },
    {
      id: 2,
      title: 'Blood Test Results',
      date: '2024-03-10',
      doctor: 'Dr. Michael Johnson',
      type: 'Lab Results',
      status: 'Complete'
    },
    {
      id: 3,
      title: 'X-Ray - Chest',
      date: '2024-02-28',
      doctor: 'Dr. Emily Davis',
      type: 'Imaging',
      status: 'Complete'
    },
    {
      id: 4,
      title: 'Cardiology Consultation',
      date: '2024-02-20',
      doctor: 'Dr. Sarah Smith',
      type: 'Consultation',
      status: 'Complete'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Medical Records
              </h1>
              <p className="text-lg text-muted-foreground">
                Access and manage your complete medical history and documents.
              </p>
            </div>

            <div className="mb-6">
              <Button asChild>
                <a href="#" className="inline-flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Request Records
                </a>
              </Button>
            </div>

            <div className="grid gap-6">
              {records.map((record) => (
                <Card key={record.id} className="shadow-card hover:shadow-hover transition-smooth">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-lg medical-gradient flex items-center justify-center">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{record.title}</CardTitle>
                          <CardDescription className="text-base">
                            {record.doctor} • {record.type}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-muted-foreground mb-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(record.date).toLocaleDateString()}
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {record.status}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3">
                      <Button size="sm" variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default MedicalRecordsPage;