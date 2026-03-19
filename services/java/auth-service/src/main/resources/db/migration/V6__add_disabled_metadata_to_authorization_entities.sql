alter table systems add column if not exists disabled_at timestamp with time zone;
alter table systems add column if not exists disabled_by varchar(255);

alter table profiles add column if not exists disabled_at timestamp with time zone;
alter table profiles add column if not exists disabled_by varchar(255);

alter table capabilities add column if not exists disabled_at timestamp with time zone;
alter table capabilities add column if not exists disabled_by varchar(255);
