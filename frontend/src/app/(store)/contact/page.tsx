'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact', formData);
      toast.success('Message sent successfully. We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-48 container mx-auto px-6 max-w-4xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4 text-foreground">Contact Us</h1>
        <p className="text-muted-foreground font-light text-sm md:text-base leading-relaxed max-w-2xl mx-auto mb-10">
          Have a question regarding your order, our collections, or just want to say hello? Drop us a line below and our concierge team will get back to you within 24 hours.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center max-w-3xl mx-auto">
          <div className="flex items-center gap-4 bg-muted/10 p-5 rounded-xl border border-border">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</p>
              <p className="text-xs font-medium text-foreground">{settings?.contactEmail || 'support@koraapparel.com'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-muted/10 p-5 rounded-xl border border-border">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone</p>
              <p className="text-xs font-medium text-foreground">{settings?.contactPhone || '+91 00000 00000'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-muted/10 p-5 rounded-xl border border-border">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Location</p>
              <p className="text-xs font-medium text-foreground">{settings?.contactAddress || 'New Delhi, India'}</p>
            </div>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-card border border-border p-8 rounded-2xl shadow-xl shadow-black/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Full Name</label>
            <Input 
              placeholder="Jane Doe" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required 
              className="h-14 bg-background border-border" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Email Address</label>
            <Input 
              type="email" 
              placeholder="jane@example.com" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
              className="h-14 bg-background border-border" 
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Subject (Optional)</label>
          <Input 
            placeholder="Order Inquiry / Returns / General" 
            value={formData.subject} 
            onChange={e => setFormData({...formData, subject: e.target.value})} 
            className="h-14 bg-background border-border" 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Message</label>
          <textarea 
            placeholder="How can we help you?" 
            value={formData.message} 
            onChange={e => setFormData({...formData, message: e.target.value})} 
            required 
            className="min-h-[160px] p-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary w-full text-sm resize-y"
          />
        </div>
        <Button size="lg" disabled={loading} className="w-full h-14 uppercase tracking-widest text-xs font-bold mt-4 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
          {loading ? 'Sending Message...' : 'Send Message'}
        </Button>
      </form>
    </div>
  );
}
