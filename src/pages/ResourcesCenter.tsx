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
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </Link>
          </Button>
        </div>
        <h1 className="text-4xl font-bold mb-8 text-center">Resource Center</h1>
        <div className="space-y-12">
          {/* Cancer Care Center */}
          <section className="bg-white rounded-xl shadow p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><span className="text-yellow-500 text-3xl">🟡</span> Cancer Care Center</h2>
            <h3 className="text-lg font-semibold mb-2">AI Is Revolutionizing Cancer Care — What Patients Should Know</h3>
            <p className="mb-2 text-gray-700">In recent years, artificial intelligence (AI) has begun to transform how cancers are detected, diagnosed, and treated. AI tools help doctors analyze medical images more precisely, optimize radiation doses, and even suggest personalized therapy options.</p>
            <p className="mb-2 text-gray-700">For example, AI models now analyze genomic data to identify which drugs a tumor may be most responsive to.</p>
            <ul className="list-disc pl-6 mb-2 text-gray-700">
              <li>Faster and more accurate diagnosis</li>
              <li>More tailored treatment plans</li>
              <li>Potential to reduce side effects by avoiding ineffective therapies</li>
            </ul>
            <div className="mb-2 text-gray-700 font-medium">What to ask your oncologist:</div>
            <ul className="list-disc pl-6 mb-2 text-gray-700">
              <li>Do we use AI / machine learning support for treatment planning?</li>
              <li>Are there genomic or molecular profiling tests for my tumor?</li>
            </ul>
            <p className="mb-2 text-gray-700">For more reading, check out <a href="https://www.cancerresearch.org/blog" target="_blank" className="text-blue-600 underline">Cancer Research Institute blog</a> with AI & cancer articles.</p>
            <div className="mb-2 text-gray-700">External blogs to reference:</div>
            <ul className="list-disc pl-6 mb-2 text-gray-700">
              <li><a href="https://www.mdanderson.org/cancerwise.html" target="_blank" className="text-blue-600 underline">Cancerwise by MD Anderson</a></li>
              <li><a href="https://www.cancer.gov/news-events/cancer-currents-blog" target="_blank" className="text-blue-600 underline">Cancer Currents (NCI)</a></li>
              <li><a href="https://cancerblog.mayoclinic.org/" target="_blank" className="text-blue-600 underline">Mayo Clinic Cancer Blog</a></li>
            </ul>
            <p className="italic text-gray-500">Remember: AI is a tool to support doctors, not replace them. Always discuss new tech with your care team.</p>
          </section>
          {/* Women's Health */}
          <section className="bg-white rounded-xl shadow p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><span className="text-pink-500 text-3xl">👩</span> Women’s Health</h2>
            <h3 className="text-lg font-semibold mb-2">Navigating Diabetes in Women: Unique Challenges & Tips</h3>
            <p className="mb-2 text-gray-700">Diabetes doesn’t affect everyone the same—particularly women. Hormonal fluctuations, menopause, pregnancy, and PCOS (polycystic ovary syndrome) can all influence blood sugar control.</p>
            <ul className="list-disc pl-6 mb-2 text-gray-700">
              <li>During the menstrual cycle, insulin sensitivity can vary.</li>
              <li>After menopause, changes in fat distribution and lower estrogen can worsen insulin resistance.</li>
              <li>Women with diabetes have higher risk for heart disease and kidney disease than men with diabetes.</li>
            </ul>
            <div className="mb-2 text-gray-700 font-medium">Tips for managing diabetes as a woman:</div>
            <ul className="list-disc pl-6 mb-2 text-gray-700">
              <li>Monitor blood sugar more frequently during hormonal transitions (e.g. puberty, pregnancy, menopause).</li>
              <li>Work with endocrinologists and gynecologists together—your care needs to be integrated.</li>
              <li>Adopt a balanced diet, moderate exercise, stress management, and proper sleep.</li>
            </ul>
            <p className="mb-2 text-gray-700">For more in-depth info, see this article: <a href="https://diabetesonthenet.com/journal-diabetes-primary-care/sex-matters-unravelling-the-unique-impact-of-diabetes-on-women" target="_blank" className="text-blue-600 underline">Sex matters: Unravelling the unique impact of diabetes on women</a></p>
            <div className="mb-2 text-gray-700">External sources:</div>
            <ul className="list-disc pl-6 mb-2 text-gray-700">
              <li><a href="https://www.herkare.com/blog/diabetes-in-women/" target="_blank" className="text-blue-600 underline">Herkare: Diabetes in Women</a></li>
              <li><a href="https://diabetes.org/diabetes/diabetes-in-women" target="_blank" className="text-blue-600 underline">American Diabetes Association — Women’s Health resources</a></li>
            </ul>
          </section>
          {/* Diabetes Care */}
          <section className="bg-white rounded-xl shadow p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><span className="text-purple-500 text-3xl">💜</span> Diabetes Care</h2>
            <h3 className="text-lg font-semibold mb-2">Five Lifestyle Habits That Help Control Diabetes</h3>
            <ul className="list-disc pl-6 mb-2 text-gray-700">
              <li>Eat Balanced Meals, Timing Matters</li>
              <li>Move Often, Especially Post-Meals</li>
              <li>Mind Portion Sizes & Carbohydrate Quality</li>
              <li>Manage Stress & Sleep</li>
              <li>Stay Consistent & Monitor Trends</li>
            </ul>
            <p className="mb-2 text-gray-700">For more guidance, check this helpful post: <a href="https://www.health.harvard.edu/blog/healthy-lifestyle-can-prevent-diabetes-and-even-reverse-it-2020031819196" target="_blank" className="text-blue-600 underline">Healthy lifestyle can prevent diabetes (Harvard Health Blog)</a></p>
            <div className="mb-2 text-gray-700">External sources:</div>
            <ul className="list-disc pl-6 mb-2 text-gray-700">
              <li><a href="https://www.health.harvard.edu/blog" target="_blank" className="text-blue-600 underline">Harvard Health Blog (Diabetes prevention & lifestyle)</a></li>
              <li><a href="https://www.centracare.com/blog/2022/june/better-health-through-diabetes-prevention/" target="_blank" className="text-blue-600 underline">CentraCare article — better health through diabetes prevention</a></li>
            </ul>
          </section>
          {/* Rehabilitation Services */}
          <section className="bg-white rounded-xl shadow p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><span className="text-green-500 text-3xl">🏃</span> Rehabilitation Services</h2>
            <h3 className="text-lg font-semibold mb-2">Why Rehabilitation Matters After a Major Illness or Injury</h3>
            <ul className="list-disc pl-6 mb-2 text-gray-700">
              <li>Strengthens muscle and joint function</li>
              <li>Improves mobility, balance, coordination</li>
              <li>Re-teaches daily skills (dressing, eating, walking)</li>
              <li>Speech therapy helps with communication/swallowing after strokes or injuries</li>
            </ul>
            <div className="mb-2 text-gray-700 font-medium">Tips for patients & families:</div>
            <ul className="list-disc pl-6 mb-2 text-gray-700">
              <li>Set realistic, measurable goals (e.g. walk 100 m in 4 weeks)</li>
              <li>Stay consistent — progress takes time</li>
              <li>Use home exercises and assistive devices as guided</li>
              <li>Track improvements (distance walked, tasks done)</li>
            </ul>
            <p className="mb-2 text-gray-700">Consider linking to case stories or videos to show impact.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResourceCenter;