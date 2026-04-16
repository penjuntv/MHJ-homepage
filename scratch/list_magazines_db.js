const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findDummyMagazines() {
  console.log('Finding dummy magazines...');
  const { data: magazines, error } = await supabase
    .from('magazines')
    .select('id, title, published, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching magazines:', error);
  } else {
    console.log(`Total magazines: ${magazines.length}`);
    magazines.forEach(m => {
      console.log(`- [${m.created_at}] ID: ${m.id}, Title: ${m.title}, Published: ${m.published}`);
    });
  }
}

findDummyMagazines();
