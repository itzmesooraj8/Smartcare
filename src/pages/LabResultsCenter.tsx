import React from 'react';
import { FileText, Download, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const LabResultsCenter: React.FC = () => {
  const labResults = [
    { id: '1', test: 'Complete Blood Count', date: '2024-01-10', status: 'ready', result: 'Normal' },
    { id: '2', test: 'Lipid Panel', date: '2024-01-08', status: 'ready', result: 'High Cholesterol' },
    { id: '3', test: 'HbA1c', date: '2024-01-05', status: 'ready', result: '6.8%' },
    { id: '4', test: 'Thyroid Function', date: '2024-01-15', status: 'pending', result: '-' }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Back Arrow */}
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Your Lab Results</CardTitle>
            <CardDescription>View and download your test results</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.test}</TableCell>
                    <TableCell>{result.date}</TableCell>
                    <TableCell>{result.result}</TableCell>
                    <TableCell>
                      <Badge variant={result.status === 'ready' ? 'default' : 'secondary'}>
                        {result.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" disabled={result.status === 'pending'}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default LabResultsCenter;