import { Sidebar } from '@/components/layout/Sidebar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Bell, Search, User as UserIcon } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  const role = profile?.role?.toLowerCase() || 'member';
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || ''; 
  
  console.log(`[AUTH DEBUG] User: ${user.email} | Role: ${role} | Path: ${pathname}`);

  // Hard Redirect: If an admin/owner reaches the member dashboard side
  if ((role === 'owner' || role === 'admin') && !pathname.includes('/admin')) {
    console.log(`[AUTH DEBUG] Admin detected on member side. Forcing redirect to /admin`);
    redirect('/admin');
  }

  // Security Redirect: If a member reaches the admin side
  if (pathname.includes('/admin') && role === 'member') {
     redirect('/dashboard');
  }

  const { data: brandSettings } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'brand_config')
    .single();

  const brandConfig = brandSettings?.value || { site_name: 'Save with Jenny', logo_url: '' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar userRole={profile?.role} brandConfig={brandConfig} />
      
      <main style={{ 
        flex: 1, 
        marginLeft: '280px', 
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        position: 'relative'
      }}>
        {/* Topbar */}
        <header className="glass" style={{
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          borderBottom: '1px solid var(--glass-border)',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          borderRadius: '0',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            background: 'var(--bg-tertiary)',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            width: '300px'
          }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search groups, members..." 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                outline: 'none', 
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                width: '100%'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button className="btn-ghost" style={{ position: 'relative', padding: '0.5rem' }}>
              <Bell size={20} />
              <span style={{ 
                position: 'absolute', 
                top: '0.25rem', 
                right: '0.25rem', 
                width: '8px', 
                height: '8px', 
                background: 'var(--accent-primary)', 
                borderRadius: '50%',
                border: '2px solid var(--bg-primary)'
              }}></span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.5rem', borderLeft: '1px solid var(--glass-border)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{profile?.full_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{profile?.role}</div>
              </div>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--glass-border)',
                overflow: 'hidden'
              }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UserIcon size={20} color="var(--text-secondary)" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ padding: '2rem' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
