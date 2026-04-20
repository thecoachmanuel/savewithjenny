
import { createClient } from './src/lib/supabase/server.js';

async function inspectGroup() {
  const supabase = await createClient();
  const slug = 'monthly-savings-sqaud-6ykdb';

  const { data: group } = await supabase.from('groups').select('*').eq('slug', slug).single();
  if (!group) {
    console.log('Group not found');
    return;
  }

  console.log('--- GROUP ---');
  console.log(`Name: ${group.name}`);
  console.log(`Status: ${group.status}`);
  console.log(`Current Cycle Number: ${group.current_cycle_number}`);

  const { data: cycles } = await supabase
    .from('group_cycles')
    .select('*')
    .eq('group_id', group.id)
    .order('cycle_number', { ascending: true });

  console.log('\n--- CYCLES ---');
  cycles?.forEach(c => {
    console.log(`Cycle #${c.cycle_number} | ID: ${c.id} | Status: ${c.status} | Recipient: ${c.payout_recipient}`);
  });

  const { data: members } = await supabase
    .from('group_members')
    .select('*, profiles(full_name)')
    .eq('group_id', group.id);

  console.log('\n--- MEMBERS ---');
  members?.forEach(m => {
    console.log(`Member: ${m.profiles.full_name} | Position: ${m.position}`);
  });
}

inspectGroup();
