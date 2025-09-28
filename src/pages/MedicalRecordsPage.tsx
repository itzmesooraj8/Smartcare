import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, Eye, Plus, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';

const MedicalRecordsPage = () => {
  // Handler to download a single record as PDF
  const downloadRecordPDF = (record) => {
    const doc = new jsPDF();
    let yPos = 20;
    doc.setFontSize(16);
    doc.text('Medical Prescription', 20, yPos);
    yPos += 20;
    doc.setFontSize(12);
    doc.text(`Title: ${record.title}`, 20, yPos);
    yPos += 10;
    doc.text(`Date: ${record.date}`, 20, yPos);
    yPos += 10;
    doc.text(`Doctor: ${record.doctor}`, 20, yPos);
    yPos += 10;
    doc.text(`Type: ${record.type}`, 20, yPos);
    yPos += 10;
    doc.text(`Status: ${record.status}`, 20, yPos);
    yPos += 20;
    doc.save(`${record.title.replace(/\s+/g, '_').toLowerCase()}_prescription.pdf`);
  };
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
            {/* Back Arrow */}
            <div className="mb-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Back
                </Link>
              </Button>
            </div>
            {/* ...existing code... */}

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
                      <Button size="sm" variant="outline" onClick={() => downloadRecordPDF(record)}>
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