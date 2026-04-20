'use client'

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { signup } from '@/lib/auth-actions';

interface SignUpFormProps {
  siteName: string;
  logoUrl?: string;
}

export function SignUpForm({ siteName, logoUrl }: SignUpFormProps) {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    setIsLoading(true);
  }

  const renderBrandName = (name: string) => {
    const parts = name.split(' ');
    if (parts.length <= 1) return name;
    const lastPart = parts.pop();
    const firstPart = parts.join(' ');
    return (
      <>{firstPart} <span className="text-gradient">{lastPart}</span></>
    );
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {logoUrl ? (
                <img src={logoUrl} alt={siteName} style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
            ) : null}
            <span style={{ fontWeight: 700, fontSize: '1.5rem' }}>{renderBrandName(siteName)}</span>
          </Link>
          <h1 style={{ fontSize: '2rem' }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Start your journey to financial growth today.
          </p>
        </div>

        <Card className="glass shadow-lg">
          <form action={signup} onSubmit={handleSubmit}>
            {error && (
              <div className="badge badge-danger" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', justifyContent: 'flex-start', borderRadius: '0.5rem' }}>
                <AlertCircle size={18} style={{ marginRight: '0.75rem' }} />
                {error}
              </div>
            )}

            {message && (
              <div className="badge badge-success" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', justifyContent: 'flex-start', borderRadius: '0.5rem' }}>
                <CheckCircle2 size={18} style={{ marginRight: '0.75rem' }} />
                {message}
              </div>
            )}

            <Input 
              label="Full Name"
              name="fullName"
              placeholder="John Doe"
              required
              containerClassName="animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            />

            <Input 
              label="Email Address"
              name="email"
              type="email"
              placeholder="john@example.com"
              required
              containerClassName="animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            />

            <Input 
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              containerClassName="animate-fade-in"
              style={{ animationDelay: '0.3s' }}
            />

            <Button 
              type="submit" 
              style={{ width: '100%', marginTop: '1rem' }}
              isLoading={isLoading}
            >
              Sign Up
            </Button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
            <Link href="/login" className="text-gradient" style={{ fontWeight: 600 }}>Sign In</Link>
          </div>
        </Card>

        <p style={{ 
          marginTop: '2rem', 
          textAlign: 'center', 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)',
          lineHeight: 1.6
        }}>
          By creating an account, you agree to our <br />
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span> and <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
