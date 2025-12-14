-- Add updated_at column to video_chat_queue for heartbeat
alter table public.video_chat_queue 
add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());
