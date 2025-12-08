
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function probe(col: string) {
    const { error } = await supabase.from('resources').select(col).limit(1);
    // Use a very distinctive pattern to grep
    if (error) {
        console.log(`[PROBE] ${col}: FAIL (${error.message})`);
    } else {
        console.log(`[PROBE] ${col}: SUCCESS`);
    }
}

async function run() {
    console.log('--- START PROBE ---');
    await probe('resourceType');
    await probe('type');
    await probe('category');
    await probe('metadata');
    await probe('data');
    await probe('meta');
    await probe('tags');
    console.log('--- END PROBE ---');
}

run();
