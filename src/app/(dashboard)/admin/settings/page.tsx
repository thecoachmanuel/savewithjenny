import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  TrendingUp, 
  Percent, 
  AlertTriangle 
} from 'lucide-react';
import { updatePlatformSettings } from '@/lib/admin-actions';
import { BrandSettings } from '@/components/admin/BrandSettings';


export default async function AdminSettingsPage() {
  const supabase = await createClient();
  
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('*')
    .eq('key', 'loan_config')
    .single();

  const loanConfig = settings?.value || { max_loan_percent: 50, min_trust_score: 500 };

  const { data: brandSettings } = await supabase
    .from('platform_settings')
    .select('*')
    .eq('key', 'brand_config')
    .single();

  const brandConfig = brandSettings?.value || { site_name: 'Save with Jenny', logo_url: '' };

  async function handleUpdateLoanConfig(formData: FormData) {
    'use server'
    const maxPercent = parseInt(formData.get('maxPercent') as string);
    const minTrust = parseInt(formData.get('minTrust') as string);
    
    await updatePlatformSettings('loan_config', {
      max_loan_percent: maxPercent,
      min_trust_score: minTrust
    });
  }

  return (
    <div className="admin-settings-page">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Platform <span className="text-gradient">Settings</span></h1>
        <p style={{ color: 'var(--text-secondary)' }}>Configure brand identity and global financial parameters.</p>
      </header>

      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Brand Configuration */}
          <BrandSettings 
            initialName={brandConfig.site_name} 
            initialLogoUrl={brandConfig.logo_url} 
          />

          {/* Loan Configuration */}
          <Card 
            title="Loan & Credit Configuration" 
            subtitle="Control how much credit members can access relative to their savings."
            className="glass shadow-md"
          >
            <form action={handleUpdateLoanConfig}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
                <Input 
                  label="Max Loan Percentage (%)" 
                  name="maxPercent" 
                  type="number"
                  defaultValue={loanConfig.max_loan_percent}
                  helperText="Percentage of total contributions a member can request."
                  icon={<Percent size={18} />}
                />
                <Input 
                  label="Minimum Trust Score" 
                  name="minTrust" 
                  type="number"
                  defaultValue={loanConfig.min_trust_score}
                  helperText="Score required to request any loan."
                  icon={<ShieldCheck size={18} />}
                />
              </div>
              <Button type="submit" leftIcon={<SettingsIcon size={18} />}>Update Global Config</Button>
            </form>
          </Card>

          {/* Security / System Status */}
          <Card title="Governance Controls" className="glass">
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Maintenance Mode</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Disable new contributions and group joins.</div>
                  </div>
                  <div className="badge badge-success">Offline</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Automatic Penalties</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Apply late fees automatically after 48 hours.</div>
                  </div>
                  <div className="badge badge-success">Active</div>
                </div>
             </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="badge badge-warning" style={{ 
            padding: '1.5rem', 
            borderRadius: '1rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1rem',
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            color: 'var(--accent-gold)',
            textTransform: 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
              <AlertTriangle size={20} />
              Important Notice
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.5, opacity: 0.8 }}>
              Changing the **Max Loan Percentage** will immediately affect the "Maximum Eligible Amount" displayed to all members on their dashboards.
            </p>
          </div>

          <Card title="System Health" className="glass">
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
               <span style={{ fontSize: '0.875rem' }}>Database Connection: Healthy</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
               <span style={{ fontSize: '0.875rem' }}>Paystack Webhook: Active</span>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
