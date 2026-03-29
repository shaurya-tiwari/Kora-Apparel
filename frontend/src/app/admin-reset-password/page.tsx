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

  // If no token, they shouldn't be here
  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">Invalid Link</h2>
        <p className="text-muted-foreground mb-6">This password reset link is invalid or missing the token.</p>
        <Button onClick={() => router.push('/admin-login')}>Back to Login</Button>
      </div>
    );
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return toast.error('All fields are required');
    if (password !== confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/admin/reset-password', { token, password });
      toast.success(data.message || 'Password reset successfully!');
      router.push('/admin-login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleReset} className="flex flex-col gap-6 w-full">
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">New Secure Password</label>
        <Input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="h-12 bg-background border-border/60 focus:border-primary rounded-xl"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirm Identity</label>
        <Input
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="h-12 bg-background border-border/60 focus:border-primary rounded-xl"
          required
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full h-12 uppercase tracking-[0.2em] text-[10px] font-bold mt-4 bg-foreground text-background hover:bg-primary transition-all rounded-xl"
        disabled={loading}
      >
        {loading ? 'Updating...' : 'Set New Password'}
      </Button>
    </form>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 pb-32">
      <div className="w-full max-w-md bg-card border border-border/50 rounded-2xl p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 transition-all group-hover:bg-primary/50" />

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-3xl font-serif font-bold tracking-[0.1em] uppercase text-primary">KORA</h1>
            <div className="w-px h-6 bg-border" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">Security</span>
          </div>
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-medium leading-relaxed">
            Create a new administrative credential for your console access.
          </p>
        </div>

        <Suspense fallback={<div className="text-center animate-pulse text-[10px] uppercase tracking-widest font-bold">Initializing...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
