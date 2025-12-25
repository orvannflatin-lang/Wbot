
-- 7. USER SETTINGS (Global Prefixes & Features)
create table if not exists user_settings (
  user_id uuid references auth.users on delete cascade not null primary key,
  view_once_prefix text default '1',
  status_save_prefix text default '*',
  downloader_prefix text default 'dl',
  anti_delete boolean default true,
  anti_view_once boolean default true,
  ghost_mode_global boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table user_settings enable row level security;
drop policy if exists "Users can view own settings" on user_settings;
create policy "Users can view own settings" on user_settings for select using (auth.uid() = user_id);
drop policy if exists "Users can update own settings" on user_settings;
create policy "Users can update own settings" on user_settings for update using (auth.uid() = user_id);
drop policy if exists "Users can insert own settings" on user_settings;
create policy "Users can insert own settings" on user_settings for insert with check (auth.uid() = user_id);

-- Update handle_new_user to also init user_settings
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  -- Create Profile (skip if exists)
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  
  -- Initialize Stats to 0 (skip if exists)
  insert into public.user_stats (user_id, messages_processed, deleted_messages_captured, statuses_saved, ai_replies_sent)
  values (new.id, 0, 0, 0, 0)
  on conflict (user_id) do nothing;

  -- Initialize Settings (skip if exists)
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  
  return new;
end;
$$ language plpgsql security definer;
