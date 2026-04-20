'use client'

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { AlertCircle } from 'lucide-react';
import { login } from '@/lib/auth-actions';

interface LoginFormProps {
  siteName: string;
  logoUrl?: string;
}

export function LoginForm({ siteName, logoUrl }: LoginFormProps) {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleSubmit() {
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
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {logoUrl ? (
                <img src={logoUrl} alt={siteName} style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
            ) : null}
            <span style={{ fontWeight: 700, fontSize: '1.5rem' }}>{renderBrandName(siteName)}</span>
          </Link>
          <h1 style={{ fontSize: '2rem' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Sign in to manage your savings groups.
          </p>
        </div>

        <Card className="glass shadow-lg">
          <form action={login} onSubmit={handleSubmit}>
            {error && (
              <div className="badge badge-danger" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', justifyContent: 'flex-start', borderRadius: '0.5rem' }}>
                <AlertCircle size={18} style={{ marginRight: '0.75rem' }} />
                {error}
              </div>
            )}

            <Input 
              label="Email Address"
              name="email"
              type="email"
              placeholder="john@example.com"
              required
              containerClassName="animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            />

            <div style={{ position: 'relative' }}>
              <Input 
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                containerClassName="animate-fade-in"
                style={{ animationDelay: '0.2s' }}
              />
              <Link 
                href="/forgot-password" 
                className="text-gradient" 
                style={{ 
                  position: 'absolute', 
                  right: 0, 
                  top: 0, 
                  fontSize: '0.75rem', 
                  fontWeight: 600 
                }}
              >
                Forgot?
              </Link>
            </div>

            <Button 
              type="submit" 
              style={{ width: '100%', marginTop: '1rem' }}
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>New to {renderBrandName(siteName)}? </span>
            <Link href="/signup" className="text-gradient" style={{ fontWeight: 600 }}>Create an account</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
