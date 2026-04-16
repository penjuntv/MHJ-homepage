const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupMagazines() {
  const dummyIds = [
    '2026-02-02-02',
    '2026-02-02',
    'test-magazine',
    '1',
    '2',
    'mhj-journal-copy',
    'mhj-journal-vol3-copy'
  ];

  console.log('Cleaning up dummy magazines:', dummyIds);
  
  const { data, error } = await supabase
    .from('magazines')
    .delete()
    .in('id', dummyIds);

  if (error) {
    console.error('Error deleting magazines:', error);
  } else {
    console.log('Successfully deleted dummy magazines.');
  }
}

cleanupMagazines();
