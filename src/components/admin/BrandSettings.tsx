'use client'

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Upload, CheckCircle2, AlertCircle, Loader2, Globe, Save } from 'lucide-react';
import { updateBrandConfig } from '@/lib/admin-actions';

interface BrandSettingsProps {
  initialName: string;
  initialLogoUrl?: string;
}

export function BrandSettings({ initialName, initialLogoUrl }: BrandSettingsProps) {
  const [name, setName] = useState(initialName);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);
      setSuccess(false);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      const filePath = `brand/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('branding')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        if (uploadError.message.includes('bucket not found')) {
            throw new Error('Storage bucket "branding" not found. Please create it in Supabase dashboard and set to public.');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const result = await updateBrandConfig(name, logoUrl);
      
      if (result?.error) {
        throw new Error(result.error);
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card 
      title="Brand & Identity" 
      subtitle="Customize the site name and logo shown across the platform."
      className="glass shadow-md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 200px', gap: '2rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Input 
              label="Site Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Save with Jenny"
              icon={<Globe size={18} />}
              helperText="This name appears in the sidebar and navigation bars."
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    Logo Image
                </label>
                <div style={{ position: 'relative' }}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploading}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            opacity: 0,
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            zIndex: 2
                        }}
                    />
                    <div style={{
                        border: '2px dashed var(--glass-border)',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: uploading ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
                    }}>
                        {uploading ? (
                            <Loader2 size={24} className="animate-spin text-accent-primary" />
                        ) : (
                            <Upload size={24} color="var(--text-muted)" />
                        )}
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            {uploading ? 'Uploading...' : 'Click to upload new logo'}
                        </span>
                    </div>
                </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '1rem', 
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                {logoUrl ? (
                    <img src={logoUrl} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No Logo</span>
                    </div>
                )}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preview</span>
          </div>
        </div>

        {error && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            color: 'var(--danger)', fontSize: '0.875rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            color: 'var(--accent-primary)', fontSize: '0.875rem'
          }}>
            <CheckCircle2 size={16} />
            <span>Branding updated successfully!</span>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
            <Button 
                onClick={handleSave} 
                disabled={saving || uploading}
                leftIcon={saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            >
                {saving ? 'Saving...' : 'Save Brand Settings'}
            </Button>
        </div>
      </div>
    </Card>
  );
}
