'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Settings, 
  LogOut, 
  TrendingUp,
  CirclePlus,
  CreditCard,
  Bell,
  Landmark,
  BadgeCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { signOut } from '@/lib/auth-actions';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Groups', href: '/dashboard/groups', icon: Users },
  { label: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
  { label: 'Loans', href: '/dashboard/loans', icon: Landmark },
  { label: 'Profile', href: '/dashboard/profile', icon: Settings },
];

const adminItems = [
  { label: 'Admin Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Member Directory', href: '/admin/members', icon: Users },
  { label: 'Verify Identity', href: '/admin/kyc', icon: BadgeCheck },
  { label: 'Manage Groups', href: '/admin/groups', icon: CirclePlus },
  { label: 'Track Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Loan Requests', href: '/admin/loans', icon: Landmark },
  { label: 'Platform Settings', href: '/admin/settings', icon: Settings },
];

export function Sidebar({ userRole, brandConfig }: { userRole?: string, brandConfig?: { site_name: string, logo_url?: string } }) {
  const pathname = usePathname();
  const role = userRole?.toLowerCase().trim() || 'member';
  const siteName = brandConfig?.site_name || 'Save with Jenny';
  const logoUrl = brandConfig?.logo_url;

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
    <aside className="glass" style={{ 
      width: '280px', 
      height: '100vh', 
      position: 'fixed', 
      left: 0, 
      top: 0, 
      display: 'flex', 
      flexDirection: 'column',
      padding: '2rem 1.5rem',
      borderRight: '1px solid var(--glass-border)',
      borderLeft: 'none',
      borderRadius: '0',
      overflowY: 'auto',
      msOverflowStyle: 'none',
      scrollbarWidth: 'none'
    }}>
      <div className="glass" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        marginBottom: '2rem', 
        padding: '1.5rem 1rem',
        position: 'sticky',
        top: '-1.5rem', // Offset for sidebar padding
        zIndex: 10,
        margin: '-1.5rem -1rem 2rem -1rem', // Negate sidebar padding to stretch background
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderRadius: '0'
      }}>
        {logoUrl ? (
            <img src={logoUrl} alt={siteName} style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
        ) : null}
        <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>{renderBrandName(siteName)}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {role === 'member' && (
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, padding: '0 0.5rem 0.5rem' }}>MENU</p>
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={clsx(
                  'btn-ghost',
                  pathname === item.href && 'bg-[var(--glass-bg)] text-[var(--accent-primary)]'
                )}
                style={{ 
                  justifyContent: 'flex-start', 
                  padding: '0.75rem 1rem', 
                  fontSize: '0.875rem',
                  color: pathname === item.href ? 'var(--accent-primary)' : 'var(--text-secondary)'
                }}
              >
                <item.icon size={18} style={{ marginRight: '0.75rem' }} />
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {(role === 'owner' || role === 'admin') && (
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, padding: '0 0.5rem 0.5rem' }}>ADMINISTRATION</p>
            {adminItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={clsx(
                  'btn-ghost',
                  pathname.startsWith(item.href) && 'bg-[var(--glass-bg)] text-[var(--accent-primary)]'
                )}
                style={{ 
                  justifyContent: 'flex-start', 
                  padding: '0.75rem 1rem', 
                  fontSize: '0.875rem',
                  color: pathname.startsWith(item.href) ? 'var(--accent-primary)' : 'var(--text-secondary)'
                }}
              >
                <item.icon size={18} style={{ marginRight: '0.75rem' }} />
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
        <button 
          onClick={() => signOut()}
          className="btn btn-ghost" 
          style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)' }}
        >
          <LogOut size={18} style={{ marginRight: '0.75rem' }} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
