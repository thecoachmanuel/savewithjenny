import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  Wallet,
  Zap,
  Lock,
  LayoutDashboard
} from 'lucide-react';
import { MobileNav } from '@/components/layout/MobileNav';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let role = 'member';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    role = profile?.role || 'member';
  }

  const { data: brandSettings } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'brand_config')
    .single();

  const brandConfig = (brandSettings?.value as any) || { site_name: 'Save with Jenny', logo_url: '' };
  const siteName = brandConfig.site_name;
  const logoUrl = brandConfig.logo_url;

  const renderBrandName = (name: string) => {
    const parts = name.split(' ');
    if (parts.length <= 1) return name;
    const lastPart = parts.pop();
    const firstPart = parts.join(' ');
    return (
      <>{firstPart} <span className="text-gradient">{lastPart}</span></>
    );
  };


  const dashboardUrl = (role === 'owner' || role === 'admin') ? '/admin' : '/dashboard';

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="glass" style={{ 
        position: 'fixed', 
        top: '1rem', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        width: '90%', 
        maxWidth: '1200px', 
        padding: '1rem 2rem', 
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
          ) : null}
          <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>{renderBrandName(siteName)}</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="desktop-nav" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <style jsx>{`
            @media (max-width: 768px) {
              .desktop-nav {
                display: none !important;
              }
            }
          `}</style>
          <Link href="#features" className="btn-ghost" style={{ fontSize: '0.875rem' }}>Features</Link>
          <Link href="#how-it-works" className="btn-ghost" style={{ fontSize: '0.875rem' }}>How it Works</Link>
          
          {user ? (
            <Link href={dashboardUrl} className="btn btn-primary" style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LayoutDashboard size={16} />
              {role === 'owner' || role === 'admin' ? 'Admin Panel' : 'My Dashboard'}
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>Sign In</Link>
              <Link href="/signup" className="btn btn-primary" style={{ fontSize: '0.875rem' }}>Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile Navigation Toggle */}
        <MobileNav 
          user={user} 
          role={role} 
          dashboardUrl={dashboardUrl} 
          siteName={siteName} 
          logoUrl={logoUrl}
          renderBrandName={renderBrandName}
        />
      </nav>

      {/* Hero Section */}
      <section className="hero-section" style={{ 
        padding: '10rem 2rem 6rem', 
        textAlign: 'center',
        background: 'radial-gradient(circle at top center, rgba(16, 185, 129, 0.08) 0%, transparent 70%)'
      }}>
        <style jsx>{`
          @media (max-width: 768px) {
            .hero-section {
              padding: 6rem 1rem 4rem !important;
            }
          }
        `}</style>
        <div className="container animate-fade-in">
          <div className="badge badge-success" style={{ marginBottom: '1.5rem' }}>
            <Zap size={14} style={{ marginRight: '0.5rem' }} />
            The Future of Digital Thrift
          </div>
          
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', marginBottom: '1.5rem' }}>
            Modern <span className="text-gradient">Thrift Savings</span><br />
            Built on Trust.
          </h1>
          
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '1.25rem', 
            maxWidth: '700px', 
            margin: '0 auto 3rem',
            lineHeight: 1.6
          }}>
            Join or create transparent cooperative groups. Automated collections, 
            rotating payouts, and secure loan access — all in one premium platform.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/signup" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}>
              Start Saving Now <ArrowRight size={20} />
            </Link>
            <Link href="#how-it-works" className="btn btn-secondary" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}>
              Learn More
            </Link>
          </div>

          <div style={{ marginTop: '5rem', display: 'flex', justifyContent: 'center', gap: '4rem', opacity: 0.6 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>500+</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ACTIVE GROUPS</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>₦10M+</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CONTRIBUTED</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>100%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PAYOUT RATE</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '6rem 2rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Everything you need to <span className="text-gradient">Grow</span></h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              Powerful tools designed for transparency, security, and financial growth.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem' 
          }}>
            <div className="card">
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--accent-primary)'
              }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ marginBottom: '1rem' }}>Secure Collections</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Integrated with Paystack for bank-grade security. Card, Bank Transfer, and USSD support for seamless contributions.
              </p>
            </div>

            <div className="card">
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--accent-primary)'
              }}>
                <Users size={24} />
              </div>
              <h3 style={{ marginBottom: '1rem' }}>Rotating Payouts</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Automated rotation schedules ensure everyone gets paid on time. No more manual tracking or treasurer headaches.
              </p>
            </div>

            <div className="card">
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--accent-primary)'
              }}>
                <Wallet size={24} />
              </div>
              <h3 style={{ marginBottom: '1rem' }}>Instant Loans</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Access low-interest loans based on your contribution history. Unlock credit when you need it most.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section style={{ padding: '6rem 2rem' }}>
        <div className="container">
          <div className="glass" style={{ padding: '4rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ 
              position: 'absolute', top: '-50%', left: '-20%', width: '300px', height: '300px', 
              background: 'var(--accent-primary)', opacity: 0.1, filter: 'blur(80px)', borderRadius: '100%'
            }}></div>
            
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Ready to start your <span className="text-gradient">Savings Journey?</span></h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
              Join thousands of people who trust Save with Jenny for their cooperative savings and growth.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
              <Link href="/signup" className="btn btn-primary" style={{ padding: '1rem 3rem' }}>
                Join a Group
              </Link>
              <Link href="/contact" className="btn-ghost">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ padding: '4rem 2rem', borderTop: '1px solid var(--glass-border)', marginTop: '4rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer' }}>
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
              ) : null}
              <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>{renderBrandName(siteName)}</span>
            </Link>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>© 2026 {siteName}. All rights reserved.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '3rem' }}>
            <div>
              <h4 style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Platform</h4>
              <ul style={{ listStyle: 'none', color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Features</li>
                <li>How it Works</li>
                <li>Pricing</li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Company</h4>
              <ul style={{ listStyle: 'none', color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>About Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
