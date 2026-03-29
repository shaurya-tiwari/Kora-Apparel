'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="text-center p-8 bg-card border border-border rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold mb-4">Invalid Reset Path</h2>
        <p className="text-muted-foreground mb-6">This password reset link is invalid or has expired.</p>
        <Button onClick={() => router.push('/account')}>Back to Identity Center</Button>
      </div>
    );
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return toast.error('All fields are required');
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password });
      toast.success(data.message || 'Security credentials updated!');
      router.push('/account?tab=login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-card border border-border p-8 rounded-2xl shadow-xl">
       <div className="text-center mb-10">
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-2">Reset Password</h1>
          <p className="text-muted-foreground text-sm font-medium">Establish your new security credentials</p>
       </div>

       <form onSubmit={handleReset} className="space-y-6">
          <div className="space-y-1">
             <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">New Password</label>
             <Input 
               type="password" 
               placeholder="••••••••" 
               value={password} 
               onChange={e => setPassword(e.target.value)} 
               className="h-12 rounded-xl bg-muted/20"
               required
             />
          </div>
          <div className="space-y-1">
             <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Confirm Password</label>
             <Input 
               type="password" 
               placeholder="••••••••" 
               value={confirmPassword} 
               onChange={e => setConfirmPassword(e.target.value)} 
               className="h-12 rounded-xl bg-muted/20"
               required
             />
          </div>
          <Button disabled={loading} className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs">
             {loading ? 'Transmitting...' : 'Update Password'}
          </Button>
       </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen pt-40 pb-20 flex items-center justify-center px-6">
      <Suspense fallback={<div className="animate-pulse text-xs font-bold uppercase tracking-widest text-muted-foreground">Initializing Terminal...</div>}>
         <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
