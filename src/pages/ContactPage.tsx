import React, { useState } from "react";
import MiniNavbar from "@/components/ui/mini-navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Mail, Clock, MessageSquare, Calendar, Ambulance, Heart, Send } from "lucide-react";

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    inquiryType: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast({ title: "Missing Information", description: "Please fill required fields.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));

    toast({ title: "Message Sent!", description: "Thanks — we'll respond within 24 hours." });

    setFormData({ name: "", email: "", phone: "", subject: "", message: "", inquiryType: "" });
    setIsSubmitting(false);
  };

  const contactInfo = [
    { icon: Phone, title: "Phone", details: ["+1 (555) 123-4567"], description: "Call us 24/7" },
    { icon: Mail, title: "Email", details: ["support@smartcare.com"], description: "Email support and appointments" },
    { icon: MapPin, title: "Address", details: ["123 Health Street, Med City, CA 90210"], description: "Visit our main facility" },
    { icon: Clock, title: "Hours", details: ["Mon-Fri: 6:00 AM - 10:00 PM"], description: "Emergency services available" },
  ];

  const departments = [
    { name: "General Inquiries", icon: MessageSquare },
    { name: "Appointments", icon: Calendar },
    { name: "Emergency Services", icon: Ambulance },
    { name: "Patient Services", icon: Heart },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MiniNavbar />

      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact <span className="text-primary">SmartCare</span></h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">We're here to help — reach out for appointments, questions, or urgent support.</p>
        </div>
      </section>

      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            {contactInfo.map((info, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <info.icon className="w-5 h-5" />
                    {info.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">{info.description}</div>
                  {info.details.map((d, i) => (
                    <div key={i} className="text-base">{d}</div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="First name" />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={formData.subject} onChange={(e) => handleInputChange("subject", e.target.value)} placeholder="Last name / Subject" />
                </div>
              </div>

              <Input value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} placeholder="Email address" type="email" />
              <Input value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="Phone (optional)" />

              <div>
                <Label>Department</Label>
                <Select onValueChange={(v) => handleInputChange("inquiryType", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea value={formData.message} onChange={(e) => handleInputChange("message", e.target.value)} placeholder="How can we help you?" className="min-h-[120px]" />

              <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send Message"} <Send className="ml-2 w-4 h-4" /></Button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;