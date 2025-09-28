import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { 
  Search, 
  MapPin, 
  Clock, 
  Star,
  Calendar,
  ArrowRight,
  Stethoscope,
  Award,
  Users,
  Phone
} from 'lucide-react';

const DoctorsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const doctors = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      specialty: 'Cardiology',
      subSpecialty: 'Interventional Cardiology',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face',
      rating: 4.9,
      reviewCount: 127,
      experience: '15+ years',
      location: 'Downtown Medical Center',
      nextAvailable: 'Tomorrow, 2:00 PM',
      languages: ['English', 'Spanish'],
      education: 'Harvard Medical School',
      specializations: ['Heart Surgery', 'Cardiac Catheterization', 'Preventive Cardiology'],
      about: 'Dr. Johnson is a board-certified cardiologist with over 15 years of experience in treating complex cardiovascular conditions.'
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialty: 'Emergency Medicine',
      subSpecialty: 'Trauma Care',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face',
      rating: 4.8,
      reviewCount: 89,
      experience: '12+ years',
      location: 'Emergency Department',
      nextAvailable: 'Available Now',
      languages: ['English', 'Mandarin'],
      education: 'Stanford University School of Medicine',
      specializations: ['Emergency Care', 'Trauma Surgery', 'Critical Care'],
      about: 'Dr. Chen specializes in emergency medicine and has extensive experience in trauma care and critical patient management.'
    },
    {
      id: '3',
      name: 'Dr. Emily Rodriguez',
      specialty: 'Pediatrics',
      subSpecialty: 'Developmental Pediatrics',
      image: 'https://images.unsplash.com/photo-1594824020332-8845734abf10?w=300&h=300&fit=crop&crop=face',
      rating: 4.9,
      reviewCount: 156,
      experience: '10+ years',
      location: 'Children\'s Health Center',
      nextAvailable: 'Friday, 10:00 AM',
      languages: ['English', 'Spanish', 'Portuguese'],
      education: 'Johns Hopkins School of Medicine',
      specializations: ['Child Development', 'Behavioral Pediatrics', 'ADHD Treatment'],
      about: 'Dr. Rodriguez is passionate about pediatric care and specializes in developmental and behavioral issues in children.'
    },
    {
      id: '4',
      name: 'Dr. James Wilson',
      specialty: 'Orthopedics',
      subSpecialty: 'Sports Medicine',
      image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&h=300&fit=crop&crop=face',
      rating: 4.7,
      reviewCount: 98,
      experience: '18+ years',
      location: 'Sports Medicine Clinic',
      nextAvailable: 'Monday, 9:00 AM',
      languages: ['English'],
      education: 'Mayo Clinic College of Medicine',
      specializations: ['Joint Replacement', 'Sports Injuries', 'Arthroscopic Surgery'],
      about: 'Dr. Wilson is an orthopedic surgeon specializing in sports medicine and minimally invasive joint procedures.'
    },
    {
      id: '5',
      name: 'Dr. Lisa Park',
      specialty: 'Dermatology',
      subSpecialty: 'Cosmetic Dermatology',
      image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=300&h=300&fit=crop&crop=face',
      rating: 4.8,
      reviewCount: 143,
      experience: '8+ years',
      location: 'Dermatology Center',
      nextAvailable: 'Thursday, 3:30 PM',
      languages: ['English', 'Korean'],
      education: 'University of California, San Francisco',
      specializations: ['Skin Cancer Screening', 'Cosmetic Procedures', 'Acne Treatment'],
      about: 'Dr. Park combines medical dermatology expertise with aesthetic treatments to help patients achieve healthy, beautiful skin.'
    },
    {
      id: '6',
      name: 'Dr. Robert Thompson',
      specialty: 'Neurology',
      subSpecialty: 'Stroke & Cerebrovascular Disease',
      image: 'https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=300&h=300&fit=crop&crop=face',
      rating: 4.9,
      reviewCount: 76,
      experience: '20+ years',
      location: 'Neuroscience Institute',
      nextAvailable: 'Next Week',
      languages: ['English', 'French'],
      education: 'Yale School of Medicine',
      specializations: ['Stroke Treatment', 'Epilepsy', 'Movement Disorders'],
      about: 'Dr. Thompson is a leading neurologist with expertise in stroke care and complex neurological conditions.'
    }
  ];

  const specialties = [
    'Cardiology',
    'Emergency Medicine',
    'Pediatrics',
    'Orthopedics',
    'Dermatology',
    'Neurology',
    'Internal Medicine',
    'Psychiatry',
    'Ophthalmology'
  ];

  const locations = [
    'Downtown Medical Center',
    'Emergency Department',
    'Children\'s Health Center',
    'Sports Medicine Clinic',
    'Dermatology Center',
    'Neuroscience Institute'
  ];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'all' || doctor.specialty === selectedSpecialty;
    const matchesLocation = selectedLocation === 'all' || doctor.location === selectedLocation;
    
    return matchesSearch && matchesSpecialty && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Find Your Perfect <span className="text-primary">Doctor</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Connect with board-certified physicians and healthcare specialists 
              who are dedicated to providing exceptional medical care.
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by doctor name or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {specialties.map(specialty => (
                  <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Available Doctors ({filteredDoctors.length})
            </h2>
            <p className="text-muted-foreground">
              Book appointments with qualified healthcare professionals
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredDoctors.map((doctor) => (
              <Card key={doctor.id} className="group shadow-card hover:shadow-hover transition-smooth">
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <img
                      src={doctor.image}
                      alt={doctor.name}
                      className="w-20 h-20 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl group-hover:text-primary transition-smooth">
                            {doctor.name}
                          </CardTitle>
                          <CardDescription className="text-base">
                            <div className="font-semibold text-primary">{doctor.specialty}</div>
                            <div className="text-muted-foreground">{doctor.subSpecialty}</div>
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{doctor.rating}</span>
                          <span className="text-muted-foreground">({doctor.reviewCount})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">{doctor.experience} experience</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">{doctor.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">{doctor.nextAvailable}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">{doctor.languages.join(', ')}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground text-sm mb-2">Specializations:</h4>
                    <div className="flex flex-wrap gap-1">
                      {doctor.specializations.map((spec, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {doctor.about}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button className="flex-1" asChild>
                      <Link to={`/doctors/${doctor.id}`}>
                        View Profile
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="flex-1" asChild>
                      <Link to="/book-appointment">
                        <Calendar className="mr-2 h-4 w-4" />
                        Book Appointment
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDoctors.length === 0 && (
            <div className="text-center py-12">
              <Stethoscope className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No doctors found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters
              </p>
              <Button onClick={() => {
                setSearchTerm('');
                setSelectedSpecialty('all');
                setSelectedLocation('all');
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Our Doctors */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Why Choose Our Medical Team?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our doctors are carefully selected based on their expertise, experience, 
              and commitment to patient care.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full medical-gradient flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Board Certified</h3>
              <p className="text-muted-foreground">
                All our physicians are board-certified in their specialties with ongoing 
                medical education and training.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full medical-gradient flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Patient-Centered</h3>
              <p className="text-muted-foreground">
                Our doctors prioritize patient communication, shared decision-making, 
                and personalized treatment plans.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full medical-gradient flex items-center justify-center">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Latest Technology</h3>
              <p className="text-muted-foreground">
                Access to cutting-edge medical technology and evidence-based treatment 
                approaches for optimal outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 medical-gradient text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Schedule Your Appointment?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Take the first step towards better health. Connect with our expert medical team 
            and experience personalized healthcare.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Create Account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white hover:text-primary">
              <Link to="/contact">
                <Phone className="mr-2 h-5 w-5" />
                Call Us
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DoctorsPage;