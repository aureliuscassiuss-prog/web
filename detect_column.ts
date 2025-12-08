
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function probe(col: string) {
    console.log(`Probing column: ${col}`);
    const { error } = await supabase.from('resources').select(col).limit(1);
    if (error) {
        console.log(`❌ ${col}: ${error.message}`);
    } else {
        console.log(`✅ ${col}: EXISTS!`);
    }
}

async function run() {
    await probe('resource_type');
    await probe('category');
    await probe('kind');
    await probe('material_type');
    await probe('resourcetype'); // lowercase no underscore
}

run();
