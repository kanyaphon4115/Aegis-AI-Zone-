-- วางทั้งหมดใน Supabase > SQL Editor > New query > Run
create table if not exists users (
  phone text primary key,
  pass_hash text not null,
  plan text,
  expires timestamptz,
  quota_left int not null default 3,
  scans int not null default 0,
  via text,
  invite text,
  created_at timestamptz not null default now(),
  last_login timestamptz
);
create table if not exists payments (
  id text primary key,
  phone text not null references users(phone) on delete cascade,
  plan_id text not null,
  amount int not null,
  slip_path text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists payments_status_idx on payments(status, created_at desc);
create table if not exists scans (
  id bigserial primary key,
  phone text not null,
  symbol text, timeframe text, bias text, confidence int,
  result jsonb,
  created_at timestamptz not null default now()
);
create table if not exists login_attempts (
  phone text primary key,
  count int not null default 0,
  locked_until timestamptz
);
create table if not exists otp (
  phone text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  sent_count int not null default 0,
  window_start timestamptz,
  last_sent timestamptz,
  verified boolean not null default false,
  verified_at timestamptz,
  purpose text not null default 'register'
);
create table if not exists cache (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);
-- ปิดการเข้าถึงตรงจากหน้าเว็บ (เซิร์ฟเวอร์ใช้ service key จึงไม่ติด)
alter table users enable row level security;
alter table payments enable row level security;
alter table scans enable row level security;
alter table login_attempts enable row level security;
alter table otp enable row level security;
alter table cache enable row level security;
-- ที่เก็บสลิป (private)
insert into storage.buckets (id, name, public) values ('slips', 'slips', false) on conflict (id) do nothing;
