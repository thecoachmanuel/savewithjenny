'use client'

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Upload, CheckCircle2, AlertCircle, Loader2, FileText } from 'lucide-react';

interface KYCUploadProps {
  userId: string;
  currentUrl?: string;
  onUploadSuccess: (url: string) => void;
}

export function KYCUpload({ userId, currentUrl, onUploadSuccess }: KYCUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);
      setSuccess(false);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      const filePath = `kyc-documents/${fileName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. Clear Public URL logic (it won't work for private buckets)
      // Instead, we pass the relative storage path (userId/filename)
      onUploadSuccess(fileName);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="glass shadow-md" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)'
          }}>
            <FileText size={24} />
          </div>
          <div>
            <h3 style={{ fontWeight: 700 }}>Identification Document</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Upload a valid Gov ID (Passport, NIN, Driver's License)</p>
          </div>
        </div>

        {currentUrl && !success && (
          <div style={{ 
            padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Document already uploaded</span>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)' }}>Submitted</div>
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <input
            type="file"
            id="kyc-upload"
            accept="image/*,.pdf"
            onChange={handleUpload}
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
            borderRadius: '1rem',
            padding: '2.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            transition: 'all 0.3s ease',
            background: uploading ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
          }}>
            {uploading ? (
              <Loader2 size={32} className="animate-spin text-accent-primary" />
            ) : success ? (
              <CheckCircle2 size={32} color="var(--accent-primary)" />
            ) : (
              <Upload size={32} color="var(--text-muted)" />
            )}
            
            <div>
              <div style={{ fontWeight: 600 }}>
                {uploading ? 'Processing upload...' : success ? 'Upload Complete!' : 'Click or drop file to upload'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                PNG, JPG or PDF up to 5MB
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            color: 'var(--danger)', fontSize: '0.875rem', padding: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            color: 'var(--accent-primary)', fontSize: '0.875rem', padding: '0.5rem'
          }}>
            <CheckCircle2 size={16} />
            <span>Your ID has been submitted for verification.</span>
          </div>
        )}
      </div>
    </Card>
  );
}
