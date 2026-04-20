import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { EditGroupForm } from './EditGroupForm';

export default async function EditGroupPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!group) {
    notFound();
  }

  return <EditGroupForm group={group} />;
}
