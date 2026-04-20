import { createClient } from '@/lib/supabase/server';
import React from 'react';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: brandSettings } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'brand_config')
    .single();

  const brandConfig = brandSettings?.value || { site_name: 'Save with Jenny', logo_url: '' };

  // We can't easily pass props to children in Next.js layouts without using a context provider 
  // or cloning elements (which is not recommended for layouts).
  // However, we can just put the header branding in the layout itself or use a provider.
  
  return (
    <div className="auth-layout">
        {children}
    </div>
  );
}
