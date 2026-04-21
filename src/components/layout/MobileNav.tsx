'use client'

import React from 'react';
import Link from 'next/link';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MobileNavProps {
  user: any;
  role: string;
  dashboardUrl: string;
  siteName: string;
  logoUrl?: string;
  renderBrandName: (name: string) => React.ReactNode;
}

export function MobileNav({ user, role, dashboardUrl, siteName, logoUrl, renderBrandName }: MobileNavProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="mobile-nav-container" style={{ display: 'none' }}>
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-nav-container {
            display: block !important;
          }
        }
      `}</style>

      <button 
        onClick={toggleMenu} 
        className="btn-ghost" 
        style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="glass animate-fade-in" style={{
          position: 'fixed',
          top: '5rem',
          left: '5%',
          width: '90%',
          padding: '2rem',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          borderRadius: '1.5rem'
        }}>
          <Link href="/" onClick={toggleMenu} style={{ fontSize: '1.125rem', fontWeight: 600 }}>Home</Link>
          <Link href="#features" onClick={toggleMenu} style={{ fontSize: '1.125rem', fontWeight: 600 }}>Features</Link>
          <Link href="#how-it-works" onClick={toggleMenu} style={{ fontSize: '1.125rem', fontWeight: 600 }}>How it Works</Link>
          
          <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.5rem 0' }}></div>

          {user ? (
            <Link href={dashboardUrl} onClick={toggleMenu}>
              <Button style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}>
                <LayoutDashboard size={18} />
                {role === 'owner' || role === 'admin' ? 'Admin Panel' : 'My Dashboard'}
              </Button>
            </Link>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Link href="/login" onClick={toggleMenu}>
                <Button variant="secondary" style={{ width: '100%' }}>Sign In</Button>
              </Link>
              <Link href="/signup" onClick={toggleMenu}>
                <Button style={{ width: '100%' }}>Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
