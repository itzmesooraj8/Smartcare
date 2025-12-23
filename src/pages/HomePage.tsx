import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/ui/mini-navbar';
import Footer from '@/components/layout/Footer';
import { 
  Heart, 
  Calendar, 
  Users, 
  Award, 
  Clock, 
  Shield, 
  Star,
  ArrowRight,
  CheckCircle,
  Stethoscope
} from 'lucide-react';

const HomePage = () => {
  const features = [
    {
      icon: Calendar,
      title: 'Easy Appointments',
      description: 'Book appointments with your preferred doctors instantly, 24/7 online booking system.'
    },
    {
      icon: Users,
      title: 'Expert Doctors',
      description: 'Access to qualified healthcare professionals across multiple specializations.'
    },
    {
      icon: Heart,
      title: 'Quality Care',
      description: 'Comprehensive healthcare services with patient-centered approach and modern facilities.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your medical information is protected with enterprise-grade security measures.'
    }
  ];

  const services = [
    {
      name: 'Emergency Care',
      description: '24/7 emergency medical services',
      icon: '🚨'
    },
    {
      name: 'Cardiology',
      description: 'Heart and cardiovascular care',
      icon: '❤️'
    },
    {
      name: 'Pediatrics',
      description: 'Specialized care for children',
      icon: '👶'
    },
    {
      name: 'Orthopedics',
      description: 'Bone and joint treatments',
      icon: '🦴'
    },
    {
      name: 'Dermatology',
      description: 'Skin and beauty treatments',
      icon: '✨'
    },
    {
      name: 'Mental Health',
      description: 'Psychological wellbeing support',
      icon: '🧠'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Patient',
      content: 'SmartCare has revolutionized my healthcare experience. The online booking system is so convenient!',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Patient',
      content: 'Excellent doctors and staff. The digital health records make everything so much easier to track.',
      rating: 5
    },
    {
      name: 'Emily Davis',
      role: 'Patient',
      content: 'Professional service and caring staff. I highly recommend SmartCare to anyone looking for quality healthcare.',
      rating: 5
    }
  ];

  return (
    <div className="pt-32 min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="hero-gradient absolute inset-0" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Your Health, Our
              <span className="block text-secondary"> Priority</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed">
              Experience exceptional healthcare with SmartCare. Book appointments, 
              consult with expert doctors, and manage your health journey all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white shadow-hover font-semibold px-8">
                <Link to="/register">
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500 font-semibold px-8">
                <Link to="/doctors">Find a Doctor</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Why Choose SmartCare?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We combine cutting-edge technology with compassionate care to deliver 
              the best healthcare experience for you and your family.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center shadow-card hover:shadow-hover transition-smooth">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full medical-gradient flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Our Medical Services
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive healthcare services across multiple specializations 
              with experienced medical professionals.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="group hover:shadow-hover transition-smooth cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{service.icon}</div>
                    <div>
                      <CardTitle className="group-hover:text-primary transition-smooth">
                        {service.name}
                      </CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white">
              <Link to="/services">
                View All Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '10,000+', label: 'Happy Patients' },
              { number: '50+', label: 'Expert Doctors' },
              { number: '15+', label: 'Specializations' },
              { number: '24/7', label: 'Emergency Support' }
            ].map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-primary">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              What Our Patients Say
            </h2>
            <p className="text-lg text-muted-foreground">
              Real stories from real patients who trust SmartCare with their health.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="font-semibold text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Ready to Take Control CTA Section */}
      <section className="py-20 medical-gradient text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
            Join thousands of patients who trust SmartCare for their healthcare needs. 
            Start your journey to better health today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8">
              <Link to="/register">Create Account</Link>
            </Button>
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500 font-semibold px-8">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Experience Quality Healthcare CTA */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground leading-tight">
            Ready to Experience Quality Healthcare?
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Schedule your appointment today and discover the SmartCare difference.
            Our team is ready to provide you with exceptional medical care.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8">
              <Link to="/book-appointment">
                Book Appointment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8">
              <Link to="/services">View Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Schedule Your Appointment CTA */}
      <section className="py-20 medical-gradient text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white leading-tight">
            Ready to Schedule Your Appointment?
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
            Take the first step towards better health. Connect with our expert medical
            team and experience personalized healthcare.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8">
              <Link to="/register">Create Account</Link>
            </Button>
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500 font-semibold px-8">
              <Link to="/doctors">Find a Doctor</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Experience the SmartCare Difference CTA */}
      <section className="py-20 bg-gradient-to-r from-secondary/5 to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground leading-tight">
            Experience the SmartCare Difference
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Join thousands of patients who trust us with their healthcare needs.
            Discover compassionate, innovative care tailored to your unique needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8">
              <Link to="/register">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8">
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;