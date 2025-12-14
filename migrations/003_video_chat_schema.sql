-- Create the queue table for video chat
create table public.video_chat_queue (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- If matched_with is not null, it means this user was picked by someone
  matched_with text, 
  
  -- Offer/Answer SDP can be exchanged here initially or via realtime
  -- For speed/simplicity, we'll just use this table for discovery
  -- and use Supabase Realtime Broadcast for the actual SDP exchange to save DB writes
  
  unique(user_id)
);

-- Enable RLS
alter table public.video_chat_queue enable row level security;

-- Policy: Allow authenticated users to insert themselves
create policy "Allow authenticated insert"
  on public.video_chat_queue
  for insert
  with check (true); 
  -- In production: check (auth.uid()::text = user_id)

-- Policy: Allow authenticated users to select (find partners)
create policy "Allow authenticated select"
  on public.video_chat_queue
  for select
  using (true);

-- Policy: Allow authenticated users to delete (leave queue or pickup partner)
create policy "Allow authenticated delete"
  on public.video_chat_queue
  for delete
  using (true);
  -- In production: using (auth.uid()::text = user_id OR auth.uid()::text = matched_with)

-- Policy: Allow users to update (to claim a partner)
create policy "Allow authenticated update"
  on public.video_chat_queue
  for update
  using (true);

-- Enable Realtime so clients can listen for "matched_with" updates
alter publication supabase_realtime add table public.video_chat_queue;
