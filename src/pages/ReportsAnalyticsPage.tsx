import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';

const ReportsAnalyticsPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-4">Reports & Analytics</h1>
        <p className="text-lg text-muted-foreground mb-8">View reports and analytics for your practice.</p>
        {/* Add charts, stats, and reports here */}
      </main>
    </div>
    <Footer />
  </div>
);

export default ReportsAnalyticsPage;
