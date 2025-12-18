import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!);

async function test() {
    console.log("Fetching Users columns...");
    const { data: userRow, error: uError } = await supabase.from('users').select('*').limit(1);
    if (uError) console.error("Error fetching users:", uError);
    else console.log("Users columns:", Object.keys(userRow[0] || {}));

    console.log("Fetching Events columns...");
    const { data: ev, error: evError } = await supabase.from('events').select('*').limit(1);
    if (evError) console.error("Error fetching events:", evError);
    else console.log("Events columns:", Object.keys(ev[0] || {}));
}

test();
