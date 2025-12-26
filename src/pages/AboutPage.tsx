import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MiniNavbar from "@/components/ui/mini-navbar";
import Footer from "@/components/layout/Footer";
import {
  Heart,
  Award,
  Shield,
  Globe,
  Target,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const AboutPage: React.FC = () => {
  const values = [
    {
      icon: Heart,
      title: "Compassionate Care",
      description:
        "We treat every patient with empathy, respect, and understanding, ensuring they feel heard and valued throughout their healthcare journey.",
    },
    {
      icon: Award,
      title: "Excellence in Medicine",
      description:
        "Our commitment to medical excellence drives us to continuously improve our services and stay at the forefront of healthcare innovation.",
    },
    {
      icon: Shield,
      title: "Patient Safety",
      description:
        "Safety is our top priority. We maintain the highest standards of care and implement rigorous safety protocols to protect our patients.",
    },
    {
      icon: Globe,
      title: "Accessibility",
      description:
        "Healthcare should be accessible to everyone. We strive to break down barriers and make quality care available to all communities.",
    },
  ];

  const stats = [
    { number: "15+", label: "Years of Service" },
    { number: "50+", label: "Medical Specialists" },
    { number: "10,000+", label: "Patients Served" },
    { number: "24/7", label: "Emergency Support" },
  ];

  const team = [
    {
      name: "Dr. Sarah Johnson",
      role: "Chief Medical Officer",
      specialization: "Cardiology",
      image:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face",
      description:
        "Leading cardiovascular specialist with over 20 years of experience in heart surgery and cardiac care.",
    },
    {
      name: "Dr. Michael Chen",
      role: "Head of Emergency Medicine",
      specialization: "Emergency Care",
      image:
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face",
      description:
        "Expert in emergency medicine with extensive experience in trauma care and critical patient management.",
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Director of Pediatrics",
      specialization: "Pediatrics",
      image:
        "https://images.unsplash.com/photo-1594824020332-8845734abf10?w=300&h=300&fit=crop&crop=face",
      description:
        "Dedicated pediatric specialist focused on providing comprehensive care for children and adolescents.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MiniNavbar />

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              About <span className="text-primary">SmartCare</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Dedicated to providing exceptional healthcare services with compassion,
              innovation, and unwavering commitment to patient wellbeing.
            </p>
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white">
              <Link to="/contact">
                Get in Touch
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Our Mission & Vision</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Mission</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      To provide exceptional, compassionate healthcare services that improve the quality of life for our patients and communities.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Vision</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      To be the leading healthcare provider, recognized for our innovative approach to medicine and outstanding patient care.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:order-first">
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=400&fit=crop"
                alt="Medical team consultation"
                className="rounded-lg shadow-card w-full h-[400px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Our Core Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These fundamental principles guide every decision we make and every service we provide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="shadow-card hover:shadow-hover transition-smooth">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 medical-gradient rounded-lg flex items-center justify-center">
                      <value.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">{value.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">SmartCare by the Numbers</h2>
            <p className="text-lg text-muted-foreground">Our commitment to excellence is reflected in these achievements</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Meet Our Leadership Team</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Our experienced medical professionals are dedicated to providing the highest quality of care.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center shadow-card hover:shadow-hover transition-smooth">
                <CardHeader>
                  <img src={member.image} alt={member.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <CardDescription className="text-base">
                    <div className="font-semibold text-primary">{member.role}</div>
                    <div className="text-muted-foreground">{member.specialization}</div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Accreditations */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Accreditations & Certifications</h2>
            <p className="text-lg text-muted-foreground">We maintain the highest standards through recognized certifications</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Joint Commission Accredited", description: "Gold Seal of Approval for quality and safety", icon: Award },
              { title: "ISO 27001 Certified", description: "Information security management excellence", icon: Shield },
              { title: "HIMSS Stage 7", description: "Highest level of electronic medical record adoption", icon: CheckCircle },
            ].map((cert, index) => (
              <Card key={index} className="text-center shadow-card">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full medical-gradient flex items-center justify-center">
                    <cert.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">{cert.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{cert.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 medical-gradient text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Experience the SmartCare Difference</h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">Join thousands of patients who trust us with their healthcare needs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white">
              <Link to="/register">Get Started Today</Link>
            </Button>
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500">
              <Link to="/services">Our Services</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;