import React from 'react';
import { BookOpen, Video, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const ResourceCenter: React.FC = () => {
  const resources = [
    { title: 'Managing Diabetes: A Complete Guide', type: 'article', category: 'Diabetes', views: 1234 },
    { title: 'Heart Health: Prevention Tips', type: 'video', category: 'Cardiology', views: 892 },
    { title: 'Nutrition for Chronic Conditions', type: 'guide', category: 'Nutrition', views: 567 },
    { title: 'Latest Research on Hypertension', type: 'research', category: 'Research', views: 234 }
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
        <h1 className="text-4xl font-bold mb-8">Resource Center</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <Card key={index} className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <Badge variant="outline">{resource.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  {resource.type === 'video' ? <Video className="w-4 h-4" /> : 
                   resource.type === 'guide' ? <BookOpen className="w-4 h-4" /> : 
                   <FileText className="w-4 h-4" />}
                  <span>{resource.type}</span>
                  <span>•</span>
                  <span>{resource.views} views</span>
                </div>
                <Button className="w-full" variant="outline">
                  {resource.type === 'video' ? 'Watch' : 'Read'} Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResourceCenter;