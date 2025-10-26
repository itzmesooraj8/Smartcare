import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';

const PatientsPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-4">Patients</h1>
        <p className="text-lg text-muted-foreground mb-8">View and manage your patients here.</p>
        {/* Add patient list/table here */}
      </main>
    </div>
    <Footer />
  </div>
);

export default PatientsPage;
