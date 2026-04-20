import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function LoginPage() {
  const supabase = await createClient();
  
  const { data: brandSettings } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'brand_config')
    .single();

  const brandConfig = brandSettings?.value || { site_name: 'Save with Jenny', logo_url: '' };

  return (
    <LoginForm 
      siteName={brandConfig.site_name} 
      logoUrl={brandConfig.logo_url} 
    />
  );
}
