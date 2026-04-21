import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { DashboardShell } from '@/components/layout/DashboardShell';

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
    <DashboardShell profile={profile} brandConfig={brandConfig}>
      {children}
    </DashboardShell>
  );
}
