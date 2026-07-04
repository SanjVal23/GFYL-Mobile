-- GFYL Mobile — full schema for a fresh Supabase project
-- Run this entire file once in the Supabase Dashboard: SQL Editor > New Query > paste > Run
-- Safe to re-run: every statement is guarded with "if not exists" / drop-if-exists.

-- ─────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  language text default 'English',
  notifications boolean default true,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table profiles add column if not exists avatar_url text;

alter table profiles enable row level security;

drop policy if exists "select own profile" on profiles;
create policy "select own profile" on profiles for select using (auth.uid() = id);

drop policy if exists "insert own profile" on profiles;
create policy "insert own profile" on profiles for insert with check (auth.uid() = id);

drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles for update using (auth.uid() = id);

-- Read-only view exposing only the non-sensitive columns (name, avatar) so the
-- community forum can show any author's profile picture without granting
-- select access to the full profiles row (email, notifications, etc. stay
-- private — "select own profile" above still restricts the base table to the
-- owner). Views run with the definer's privileges by default, so this
-- deliberately bypasses profiles' row-level security for just these columns.
drop view if exists public_profiles;
create view public_profiles as
  select id, name, avatar_url from profiles;

grant select on public_profiles to authenticated;

-- ─────────────────────────────────────────────
-- saved_items (bookmarks: verses, courses, videos, meditations, lessons)
-- ─────────────────────────────────────────────
create table if not exists saved_items (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null,
  icon text,
  created_at timestamptz not null default now()
);

alter table saved_items enable row level security;

drop policy if exists "select own saved items" on saved_items;
create policy "select own saved items" on saved_items for select using (auth.uid() = user_id);

drop policy if exists "insert own saved items" on saved_items;
create policy "insert own saved items" on saved_items for insert with check (auth.uid() = user_id);

drop policy if exists "delete own saved items" on saved_items;
create policy "delete own saved items" on saved_items for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- chat_messages (AI Buddy legacy-restore backing store)
-- ─────────────────────────────────────────────
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  text text not null,
  created_at timestamptz not null default now()
);

alter table chat_messages enable row level security;

drop policy if exists "select own chat messages" on chat_messages;
create policy "select own chat messages" on chat_messages for select using (auth.uid() = user_id);

drop policy if exists "insert own chat messages" on chat_messages;
create policy "insert own chat messages" on chat_messages for insert with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- community forum
-- ─────────────────────────────────────────────
create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author text not null,
  title text not null,
  content text not null,
  likes integer not null default 0,
  comments integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author text not null,
  text text not null,
  likes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists community_replies (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references community_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author text not null,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists community_post_likes (
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists community_comment_likes (
  comment_id uuid not null references community_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table community_posts enable row level security;
alter table community_comments enable row level security;
alter table community_replies enable row level security;
alter table community_post_likes enable row level security;
alter table community_comment_likes enable row level security;

-- Posts: everyone signed in can read the shared feed; only the author can create/update/delete
-- their own. Likes/comments counters are NOT writable by clients at all — they're maintained
-- automatically by the triggers below whenever rows are inserted/deleted in
-- community_post_likes / community_comment_likes / community_comments, so a signed-in user can
-- never rewrite someone else's post/comment or forge counts by hand.
drop policy if exists "select all posts" on community_posts;
create policy "select all posts" on community_posts for select using (auth.role() = 'authenticated');

drop policy if exists "insert own posts" on community_posts;
create policy "insert own posts" on community_posts for insert with check (auth.uid() = user_id);

drop policy if exists "update posts counters" on community_posts;
drop policy if exists "update own posts" on community_posts;
create policy "update own posts" on community_posts for update using (auth.uid() = user_id);

drop policy if exists "delete own posts" on community_posts;
create policy "delete own posts" on community_posts for delete using (auth.uid() = user_id);

drop policy if exists "select all comments" on community_comments;
create policy "select all comments" on community_comments for select using (auth.role() = 'authenticated');

drop policy if exists "insert own comments" on community_comments;
create policy "insert own comments" on community_comments for insert with check (auth.uid() = user_id);

drop policy if exists "update comments counters" on community_comments;
drop policy if exists "update own comments" on community_comments;
create policy "update own comments" on community_comments for update using (auth.uid() = user_id);

drop policy if exists "delete own comments" on community_comments;
create policy "delete own comments" on community_comments for delete using (auth.uid() = user_id);

drop policy if exists "select all replies" on community_replies;
create policy "select all replies" on community_replies for select using (auth.role() = 'authenticated');

drop policy if exists "insert own replies" on community_replies;
create policy "insert own replies" on community_replies for insert with check (auth.uid() = user_id);

drop policy if exists "delete own replies" on community_replies;
create policy "delete own replies" on community_replies for delete using (auth.uid() = user_id);

drop policy if exists "select own post likes" on community_post_likes;
create policy "select own post likes" on community_post_likes for select using (auth.uid() = user_id);

drop policy if exists "insert own post likes" on community_post_likes;
create policy "insert own post likes" on community_post_likes for insert with check (auth.uid() = user_id);

drop policy if exists "delete own post likes" on community_post_likes;
create policy "delete own post likes" on community_post_likes for delete using (auth.uid() = user_id);

drop policy if exists "select own comment likes" on community_comment_likes;
create policy "select own comment likes" on community_comment_likes for select using (auth.uid() = user_id);

drop policy if exists "insert own comment likes" on community_comment_likes;
create policy "insert own comment likes" on community_comment_likes for insert with check (auth.uid() = user_id);

drop policy if exists "delete own comment likes" on community_comment_likes;
create policy "delete own comment likes" on community_comment_likes for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- community forum: counters kept in sync by triggers (security definer so
-- they can update a post/comment even though the acting user only owns the
-- like/comment row, not the post/comment being counted)
-- ─────────────────────────────────────────────
create or replace function community_post_likes_count_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update community_posts set likes = likes + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update community_posts set likes = greatest(likes - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_community_post_likes_count on community_post_likes;
create trigger trg_community_post_likes_count
after insert or delete on community_post_likes
for each row execute function community_post_likes_count_fn();

create or replace function community_comment_likes_count_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update community_comments set likes = likes + 1 where id = new.comment_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update community_comments set likes = greatest(likes - 1, 0) where id = old.comment_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_community_comment_likes_count on community_comment_likes;
create trigger trg_community_comment_likes_count
after insert or delete on community_comment_likes
for each row execute function community_comment_likes_count_fn();

create or replace function community_post_comments_count_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update community_posts set comments = comments + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update community_posts set comments = greatest(comments - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_community_post_comments_count on community_comments;
create trigger trg_community_post_comments_count
after insert or delete on community_comments
for each row execute function community_post_comments_count_fn();
