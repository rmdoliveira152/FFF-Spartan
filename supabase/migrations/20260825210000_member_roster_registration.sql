create type public.registration_status as enum ('pending', 'approved', 'rejected');

create table public.alliance_members (
  id uuid primary key default gen_random_uuid(),
  member_name text not null unique,
  rank text not null check (rank in ('R1', 'R2', 'R3', 'R4', 'R5')),
  player_level smallint not null check (player_level between 1 and 10),
  combat_power bigint not null default 0 check (combat_power >= 0),
  kills bigint not null default 0 check (kills >= 0),
  weekly_contribution bigint not null default 0 check (weekly_contribution >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.alliance_members (member_name, rank, player_level, combat_power)
values
  ('Efferp', 'R5', 10, 1993213801),
  ('GhostMM', 'R4', 8, 1156374069),
  ('Atzgersdorf', 'R4', 10, 1425622559),
  ('MrSud', 'R4', 10, 729945142),
  ('Xubanito', 'R4', 9, 1223430562),
  ('cree', 'R4', 10, 1479625463),
  ('puccio', 'R4', 8, 1158236909),
  ('PadZy Poussin', 'R4', 8, 1239457153),
  ('• Nikolina •', 'R4', 10, 1135670233),
  ('B€TO', 'R3', 6, 1058647648),
  ('ohhhhmyyyBoB', 'R3', 8, 1197078857),
  ('Amalthea04', 'R3', 8, 1156205408),
  ('Gluckcluck', 'R3', 10, 1373385467),
  ('Lincée', 'R3', 7, 960958331),
  ('ELGaeL', 'R3', 3, 801147596),
  ('crying doc', 'R3', 5, 646110116),
  ('kochonou', 'R3', 7, 1023036571),
  ('Dertov2', 'R3', 10, 550671160),
  ('raidmano', 'R3', 8, 1286085786),
  ('suomynonA', 'R3', 4, 781132457),
  ('Mohammad x', 'R3', 5, 892030680),
  ('のshadow气', 'R3', 8, 889193070),
  ('Zizu 73', 'R3', 6, 1046167470),
  ('Nats4283', 'R3', 7, 686696553),
  ('the old Gods', 'R3', 5, 1003425513),
  ('Mandalina', 'R3', 10, 992538050),
  ('¥Carlu¥', 'R3', 8, 1133098067),
  ('Vagabundo30', 'R3', 10, 1461932982),
  ('Andrey91', 'R3', 7, 1062125999),
  ('Shady2A', 'R3', 7, 940521597),
  ('jkl5', 'R3', 7, 1046794449),
  ('DIRTINVENTO', 'R3', 6, 776161653),
  ('ClumsyHero', 'R3', 5, 1097812642),
  ('dracofoutre314', 'R3', 6, 1059384015),
  ('jerem 54', 'R3', 5, 707256128),
  ('alphonso', 'R3', 7, 1189640942),
  ('İstanbulxx', 'R3', 6, 808214803),
  ('cocoon1', 'R3', 9, 1264407291),
  ('Arågorn', 'R3', 7, 1151104701),
  ('Wippo', 'R3', 9, 1239890239),
  ('Lou Ferrigno', 'R3', 8, 1100654379),
  ('69Leo', 'R3', 6, 888405408),
  ('Angry Yeti', 'R3', 8, 1001954864),
  ('RELLY', 'R3', 7, 1070671130),
  ('SaleJaske', 'R3', 4, 728986736),
  ('mivo 1986', 'R3', 6, 1042705971),
  ('Dark-Cyrus', 'R3', 7, 921385821),
  ('RS278', 'R3', 6, 1125968246),
  ('La Vida', 'R3', 4, 1119609276),
  ('karadouc', 'R3', 8, 1244324586),
  ('Mercredii', 'R3', 6, 776919383),
  ('Pinck Licorne', 'R3', 10, 1438434540),
  ('J0k3r93', 'R3', 7, 795317257),
  ('žekje', 'R3', 6, 691481708),
  ('Dark°Romance', 'R3', 7, 1118791744),
  ('• Lelê', 'R3', 6, 1107850773),
  ('şokali', 'R3', 6, 1032565533),
  ('Wardal', 'R3', 6, 982453438),
  ('creekillertim', 'R3', 7, 958523064),
  ('Phoenix Joss', 'R3', 6, 981135109),
  ('Pegale', 'R3', 4, 848206406),
  ('Yugsi', 'R3', 5, 946341644),
  ('VARO', 'R3', 8, 1160132303),
  ('Tomcat1978', 'R3', 10, 1243900237),
  ('Dreyfus18', 'R3', 5, 994163866),
  ('petar33', 'R3', 4, 541607903),
  ('Maymbb', 'R3', 6, 1124197891),
  ('LeonardRff', 'R3', 4, 748147892),
  ('King Ragnár', 'R3', 7, 960492218),
  ('FlntstoneBob', 'R3', 7, 940336093),
  ('KΔππvş', 'R3', 10, 1143237632),
  ('Liam911424', 'R3', 9, 900758709),
  ('• ACL •', 'R3', 10, 1363342005),
  ('Lady Booti', 'R3', 8, 1151679817),
  ('AdaHell', 'R3', 7, 909197048),
  ('King033', 'R3', 8, 1062913239),
  ('philpag', 'R3', 5, 899595848),
  ('gizzzy', 'R3', 5, 792703024),
  ('cristian1704', 'R3', 5, 797030580),
  ('Lafira', 'R3', 4, 699588780),
  ('¥WonderWoman¥', 'R3', 8, 851243179),
  ('ChikoritaMaluca', 'R2', 5, 751617722),
  ('Baby BMB', 'R2', 7, 954044391),
  ('TheSmitherz', 'R2', 9, 1204872634),
  ('MarBernax', 'R2', 4, 663502655),
  ('Fury Murato', 'R2', 6, 829724806),
  ('Sud Jr', 'R2', 7, 1097657289),
  ('MrGilusX', 'R2', 7, 842481189),
  ('kaylexa87', 'R2', 4, 734223354),
  ('KeyS', 'R2', 7, 1188459763),
  ('Nyxos', 'R2', 4, 718359278),
  ('Koatchie LuCi', 'R2', 7, 788660006),
  ('GITANA', 'R1', 6, 841530271),
  ('Yode', 'R1', 7, 1177572300),
  ('иеяαzzυяяσ', 'R1', 7, 957866698),
  ('Atlas あ', 'R1', 4, 612121926);

alter table public.profiles drop constraint profiles_member_name_key;
alter table public.profiles
  add column alliance_member_id uuid references public.alliance_members(id) on delete set null,
  add column registration_status public.registration_status not null default 'pending';

update public.profiles
set member_name = 'Administrador', registration_status = 'approved'
where role = 'admin';

create unique index profiles_reserved_alliance_member_idx
on public.profiles (alliance_member_id)
where alliance_member_id is not null and registration_status in ('pending', 'approved');

alter table public.alliance_members enable row level security;

create policy "alliance_members_active_read"
on public.alliance_members for select
to anon, authenticated
using (active);

create policy "alliance_members_admin_read"
on public.alliance_members for select
to authenticated
using (public.is_admin());

create policy "alliance_members_admin_insert"
on public.alliance_members for insert
to authenticated
with check (public.is_admin());

create policy "alliance_members_admin_update"
on public.alliance_members for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "alliance_members_admin_delete"
on public.alliance_members for delete
to authenticated
using (public.is_admin());

create or replace function public.available_alliance_members()
returns table (id uuid, member_name text, rank text)
language sql
stable
security definer
set search_path = ''
as $$
  select member.id, member.member_name, member.rank
  from public.alliance_members member
  where member.active
    and not exists (
      select 1 from public.profiles profile
      where profile.alliance_member_id = member.id
        and profile.registration_status in ('pending', 'approved')
    )
  order by member.member_name;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_member_id uuid;
  selected_member_name text;
begin
  if nullif(new.raw_user_meta_data ->> 'alliance_member_id', '') is null then
    raise exception 'Alliance member selection is required';
  end if;

  selected_member_id := (new.raw_user_meta_data ->> 'alliance_member_id')::uuid;

  select member.member_name into selected_member_name
  from public.alliance_members member
  where member.id = selected_member_id and member.active
  for update;

  if selected_member_name is null or exists (
    select 1 from public.profiles profile
    where profile.alliance_member_id = selected_member_id
      and profile.registration_status in ('pending', 'approved')
  ) then
    raise exception 'Alliance member is not available';
  end if;

  insert into public.profiles (id, member_name, alliance_member_id, registration_status)
  values (new.id, selected_member_name, selected_member_id, 'pending');
  return new;
end;
$$;

create or replace function public.review_registration(requested_profile uuid, decision public.registration_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if decision = 'approved' then
    update public.profiles set registration_status = 'approved', active = true
    where id = requested_profile and registration_status = 'pending';
  elsif decision = 'rejected' then
    update public.profiles set registration_status = 'rejected', active = false, alliance_member_id = null
    where id = requested_profile and registration_status = 'pending';
  else
    raise exception 'Decision must be approved or rejected';
  end if;
end;
$$;

drop policy "verified_members_vote" on public.votes;
create policy "verified_members_vote" on public.votes for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (select 1 from public.profiles where id = auth.uid() and active and registration_status = 'approved')
  and exists (select 1 from public.polls where id = poll_id and active and (closes_at is null or closes_at > now()))
  and exists (select 1 from public.poll_options where id = option_id and poll_id = votes.poll_id)
);

drop policy "applications_insert_own" on public.r4_applications;
create policy "applications_insert_own" on public.r4_applications for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (select 1 from public.profiles where id = auth.uid() and active and registration_status = 'approved')
);

grant select, insert, update, delete on public.alliance_members to anon, authenticated;
revoke insert, update, delete on public.alliance_members from anon;
revoke all on function public.available_alliance_members() from public, anon, authenticated;
revoke all on function public.review_registration(uuid, public.registration_status) from public, anon, authenticated;
grant execute on function public.available_alliance_members() to anon, authenticated;
grant execute on function public.review_registration(uuid, public.registration_status) to authenticated;
