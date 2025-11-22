import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">SmartCare</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Providing exceptional healthcare services with compassion, innovation, and excellence. 
              Your health and wellbeing are our top priorities.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { name: 'Home', href: '/' },
                { name: 'Services', href: '/services' },
                { name: 'Doctors', href: '/doctors' },
                { name: 'About Us', href: '/about' },
                { name: 'Contact', href: '/contact' },
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-muted-foreground hover:text-primary transition-smooth text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Our Services</h3>
            <ul className="space-y-2">
              {[
                'Emergency Care',
                'Cardiology',
                'Dermatology',
                'Orthopedics',
                'Pediatrics',
                'Mental Health',
              ].map((service) => (
                <li key={service}>
                  <Link 
                    to="/services" 
                    className="text-muted-foreground hover:text-primary transition-smooth text-sm"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <p className="text-muted-foreground text-sm">
                  123 Healthcare Avenue<br />
                  Medical District<br />
                  City, State 12345
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <p className="text-muted-foreground text-sm">+1 (555) 123-4567</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <p className="text-muted-foreground text-sm">info@smartcare.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-muted-foreground text-sm">
              © 2024 SmartCare. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                Terms of Service
              </Link>
              <Link to="/sitemap" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;