
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log('Error: Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('--- START SCHEMA INSPECTION ---');
    // Try to insert a row? No, risk of error.
    // select * limit 1
    const { data, error } = await supabase.from('resources').select('*').limit(1);

    if (error) {
        console.error('Select Error:', error);
        // If table is empty, we can't see keys via select *.
        // We can try to infer from error message?
        // Let's try to insert a dummy row with a weird key and see the error?
        // No, Supabase/Postgrest errors might be "column x does not exist".
        // Let's try to RPC?
    } else {
        if (data && data.length > 0) {
            console.log('Found Row Keys:', Object.keys(data[0]));
        } else {
            console.log('Table is empty. Cannot determine schema from rows.');
            console.log('Attempting to create a dummy resource to provoke column error...');

            const dummy = {
                title: "Test",
                branch: "CSE",
                subject: "Test",
                driveLink: "http://test.com",
                // Try standard candidates
                resourceType: "notes",
                type: "notes",
                category: "notes",
                kind: "notes"
            };

            const { error: insertErr } = await supabase.from('resources').insert(dummy);
            console.log('Insert Error:', insertErr);
        }
    }
    console.log('--- END SCHEMA INSPECTION ---');
}

inspect();
