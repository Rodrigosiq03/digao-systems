alter table user_vpn_access add column if not exists state varchar(60);

update user_vpn_access
set state = status
where state is null;

alter table user_vpn_access alter column state set not null;

alter table user_vpn_access add column if not exists provider_role varchar(60);
alter table user_vpn_access add column if not exists provider_last_seen_at timestamp with time zone;
alter table user_vpn_access add column if not exists provider_observed_at timestamp with time zone;

alter table user_vpn_access drop column if exists status;
