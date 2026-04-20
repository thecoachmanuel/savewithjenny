import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { User, Phone, Landmark, ShieldCheck, BadgeCheck, AlertCircle } from 'lucide-react';
import { updateProfile, updateKYCURL } from '@/lib/profile-actions';
import { KYCUpload } from '@/components/profile/KYCUpload';
import { ProfileForms } from '@/components/profile/ProfileForms';
import { unstable_noStore as noStore } from 'next/cache';

export const metadata = {
  title: 'My Profile | Save with Jenny',
  description: 'Manage your personal and banking information.',
};

export default async function ProfilePage() {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Personal <span className="text-gradient">Profile</span></h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your personal information and banking details for payouts.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* KYC Section */}
          <KYCUpload 
            userId={user.id} 
            currentUrl={profile?.kyc_document_url} 
            onUploadSuccess={updateKYCURL} 
          />

          {/* Profile & Bank Forms */}
          <ProfileForms profile={profile} />
        </div>

        {/* Sidebar Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card className="glass shadow-sm">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Account Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)'
                }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>User Role</div>
                  <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{profile?.role || 'Member'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', background: profile?.kyc_verified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: profile?.kyc_verified ? 'var(--accent-primary)' : 'var(--accent-gold)'
                }}>
                  {profile?.kyc_verified ? <BadgeCheck size={20} /> : <AlertCircle size={20} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>KYC Status</div>
                  <div style={{ fontWeight: 700 }}>{profile?.kyc_verified ? 'Verified' : profile?.kyc_document_url ? 'Pending Review' : 'Incomplete'}</div>
                </div>
              </div>
            </div>

            {!profile?.kyc_verified && (
              <div style={{ 
                marginTop: '1.5rem', 
                padding: '1rem', 
                background: 'rgba(245, 158, 11, 0.05)', 
                borderRadius: '0.75rem',
                fontSize: '0.75rem',
                color: 'var(--accent-gold)',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                Please upload a valid government ID to unlock higher loan limits and verified status.
              </div>
            )}
          </Card>

          <Card className="glass shadow-sm">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>Safety & Privacy</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Your banking details are encrypted and only used for your thrift payouts. We will never share your ID documents with third parties.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
