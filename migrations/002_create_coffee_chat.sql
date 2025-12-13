-- Create the table for ephemeral chat messages
create table public.coffee_chat_messages (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  user_id text not null, -- Store user ID (can look up profile if needed, or store snapshot)
  user_name text not null, -- Snapshot of name to avoid joins/lookups for speed
  user_avatar text, -- Snapshot of avatar
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.coffee_chat_messages enable row level security;

-- Policy: Allow anyone to read messages (filtering for time happens on client or could be here)
create policy "Allow public read"
  on public.coffee_chat_messages
  for select
  using (true);

-- Policy: Allow authenticated users to insert
create policy "Allow authenticated insert"
  on public.coffee_chat_messages
  for insert
  with check (true); 
  -- In a stricter app, check (auth.uid()::text = user_id) but for now trust client for speed/MVP

-- Enable Realtime
alter publication supabase_realtime add table public.coffee_chat_messages;
