import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MiniNavbar } from '@/components/ui/mini-navbar';
import Footer from '@/components/layout/Footer';
import { 
  Heart, 
  Brain, 
  Bone, 
  Eye, 
  Stethoscope,
  Baby,
  Ambulance,
  Pill,
  ArrowRight,
  Clock,
  Users,
  Award
} from 'lucide-react';

const ServicesPage = () => {
  const services = [
    {
      icon: Ambulance,
      name: 'Emergency Care',
      description: '24/7 emergency medical services with rapid response times and advanced life support.',
      features: ['24/7 Availability', 'Trauma Care', 'Life Support', 'Rapid Response'],
      color: 'text-red-600'
    },
    {
      icon: Heart,
      name: 'Cardiology',
      description: 'Comprehensive heart and cardiovascular care with state-of-the-art diagnostic equipment.',
      features: ['Heart Surgery', 'Cardiac Catheterization', 'ECG/EKG', 'Preventive Care'],
      color: 'text-red-500'
    },
    {
      icon: Brain,
      name: 'Neurology',
      description: 'Expert care for neurological conditions and disorders of the nervous system.',
      features: ['Brain Surgery', 'Stroke Care', 'Epilepsy Treatment', 'Memory Disorders'],
      color: 'text-purple-600'
    },
    {
      icon: Bone,
      name: 'Orthopedics',
      description: 'Specialized treatment for musculoskeletal conditions and injuries.',
      features: ['Joint Replacement', 'Sports Medicine', 'Fracture Care', 'Arthritis Treatment'],
      color: 'text-blue-600'
    },
    {
      icon: Baby,
      name: 'Pediatrics',
      description: 'Comprehensive healthcare services specially designed for infants, children, and adolescents.',
      features: ['Well-Child Visits', 'Vaccinations', 'Growth Monitoring', 'Developmental Care'],
      color: 'text-green-600'
    },
    {
      icon: Eye,
      name: 'Ophthalmology',
      description: 'Complete eye care services from routine exams to complex surgical procedures.',
      features: ['Eye Exams', 'Cataract Surgery', 'Glaucoma Treatment', 'Retinal Care'],
      color: 'text-indigo-600'
    },
    {
      icon: Stethoscope,
      name: 'Internal Medicine',
      description: 'Primary care and comprehensive management of adult medical conditions.',
      features: ['Preventive Care', 'Chronic Disease Management', 'Health Screenings', 'Wellness Programs'],
      color: 'text-teal-600'
    },
    {
      icon: Brain,
      name: 'Mental Health',
      description: 'Comprehensive mental health services including therapy and psychiatric care.',
      features: ['Counseling', 'Psychiatric Care', 'Therapy Sessions', 'Crisis Intervention'],
      color: 'text-pink-600'
    },
    {
      icon: Pill,
      name: 'Pharmacy Services',
      description: 'Full-service pharmacy with prescription management and medication counseling.',
      features: ['Prescription Filling', 'Medication Reviews', 'Drug Interactions', 'Health Consultations'],
      color: 'text-orange-600'
    }
  ];

  const specialtyPrograms = [
    {
      title: 'Cancer Care Center',
      description: 'Comprehensive oncology services with multidisciplinary approach to cancer treatment.',
      icon: '🎗️'
    },
    {
      title: 'Women\'s Health',
      description: 'Specialized care for women including obstetrics, gynecology, and reproductive health.',
      icon: '👩‍⚕️'
    },
    {
      title: 'Diabetes Care',
      description: 'Complete diabetes management program with education and support services.',
      icon: '🩺'
    },
    {
      title: 'Rehabilitation Services',
      description: 'Physical, occupational, and speech therapy to help patients recover and thrive.',
      icon: '🏃‍♂️'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <MiniNavbar />
      
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Our Medical <span className="text-primary">Services</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Comprehensive healthcare services delivered by experienced medical professionals 
              using the latest technology and evidence-based practices.
            </p>
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white">
              <Link to="/register">
                Book an Appointment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Services */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Comprehensive Medical Care
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From emergency care to specialized treatments, we provide a full range of medical services 
              to meet all your healthcare needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="group shadow-card hover:shadow-hover transition-smooth cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 medical-gradient rounded-lg flex items-center justify-center">
                      <service.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="group-hover:text-primary transition-smooth">
                      {service.name}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-base leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground text-sm">Key Services:</h4>
                    <ul className="space-y-1">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-center">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Specialty Programs */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Specialty Programs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Advanced specialized care programs designed to address specific health conditions 
              and provide comprehensive treatment solutions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {specialtyPrograms.map((program, index) => (
              <Card key={index} className="shadow-card hover:shadow-hover transition-smooth">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{program.icon}</div>
                    <div>
                      <CardTitle className="text-xl">{program.title}</CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        {program.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Why Choose SmartCare?
            </h2>
            <p className="text-lg text-muted-foreground">
              Experience the difference that quality care makes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full medical-gradient flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Expert Medical Team</h3>
              <p className="text-muted-foreground">
                Board-certified physicians and healthcare professionals with years of experience 
                in their respective specialties.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full medical-gradient flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Advanced Technology</h3>
              <p className="text-muted-foreground">
                State-of-the-art medical equipment and technology to ensure accurate diagnosis 
                and effective treatment.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full medical-gradient flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Convenient Care</h3>
              <p className="text-muted-foreground">
                Flexible scheduling, online appointments, and extended hours to fit your busy lifestyle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Insurance */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Insurance & Payment Options
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We accept most major insurance plans and offer flexible payment options 
              to make healthcare accessible and affordable.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-xl">Accepted Insurance</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {[
                    'Blue Cross Blue Shield',
                    'Aetna',
                    'Cigna',
                    'United Healthcare',
                    'Medicare',
                    'Medicaid',
                    'Kaiser Permanente',
                    'And many more'
                  ].map((insurance, index) => (
                    <li key={index} className="flex items-center text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0" />
                      {insurance}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">Payment Options <span style={{fontWeight:600, fontSize:'1.3em'}}>₹</span></CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {[
                    'Cash and Credit Cards',
                    'Payment Plans Available',
                    'Financial Assistance Programs',
                    'HSA/FSA Accepted',
                    'Online Payment Portal',
                    'Automated Payment Options',
                    'Insurance Pre-authorization',
                    'Transparent Pricing'
                  ].map((option, index) => (
                    <li key={index} className="flex items-center text-muted-foreground">
                      <div className="w-2 h-2 bg-secondary rounded-full mr-3 flex-shrink-0" />
                      <span style={{fontWeight:500, fontSize:'1.1em', marginRight:'0.3em'}}>₹</span>{option}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 medical-gradient text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Experience Quality Healthcare?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Schedule your appointment today and discover the SmartCare difference. 
            Our team is ready to provide you with exceptional medical care.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white">
              <Link to="/register">Book Appointment</Link>
            </Button>
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServicesPage;