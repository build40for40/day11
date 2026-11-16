-- Day 11 parent setup. Columns match docs/architecture.md section 6.4.
-- sessions is created before safety_flags so the foreign key can be applied.
-- No audio and no transcript columns.

create table households (
  id                  text primary key,
  setup_token_hash    text unique,
  setup_expires_at    text,
  parent_token        text not null unique,
  parent_email        text,
  email_verified_at   text,
  verify_token_hash   text,
  answers_approved_at text,
  stream_consent_at   text,
  grownup_label       text not null default 'your grown-up',
  holiday_mode        text not null default 'christmas',
  created_at          text not null
);

create table kids (
  id            text primary key,
  household_id  text not null references households(id) on delete cascade,
  first_name    text,
  age           integer,
  status        text not null default 'pending',
  uid_hash      text unique,
  paired_at     text,
  list_status   text not null default 'empty',
  finish_note   text,
  finished_at   text,
  created_at    text not null
);

create table pairings (
  id          text primary key,
  device_id   text not null,
  kid_id      text not null references kids(id) on delete cascade,
  expires_at  text not null,
  used_at     text
);

create table wishlist_items (
  id           text primary key,
  kid_id       text not null references kids(id) on delete cascade,
  item         text not null,
  item_norm    text not null,
  reason       text,
  source       text not null,
  created_at   text not null,
  removed_at   text,
  removed_by   text
);

create unique index wishlist_one_per_item on wishlist_items(kid_id, item_norm) where removed_at is null;

create table cards (
  uid_hash  text primary key,
  kind      text not null,
  label     text
);

create table sessions (
  id          text primary key,
  kid_id      text not null references kids(id) on delete cascade,
  started_at  text not null,
  ended_at    text,
  end_reason  text,
  continued   integer not null default 0,
  finish_note text,
  items_added integer not null default 0,
  flags       text,
  emailed_at  text
);

create table safety_flags (
  id          text primary key,
  kid_id      text not null references kids(id) on delete cascade,
  session_id  text references sessions(id) on delete set null,
  source      text not null,
  created_at  text not null,
  emailed_at  text
);
