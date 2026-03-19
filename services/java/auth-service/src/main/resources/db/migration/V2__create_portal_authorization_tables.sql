create table if not exists systems (
    id bigserial primary key,
    "key" varchar(120) not null unique,
    name varchar(200) not null,
    description text,
    entry_url text,
    enabled boolean not null default true,
    created_at timestamp with time zone not null default now(),
    created_by varchar(255),
    updated_at timestamp with time zone not null default now(),
    updated_by varchar(255)
);

create table if not exists capabilities (
    id bigserial primary key,
    system_id bigint not null references systems(id),
    "key" varchar(120) not null,
    name varchar(200) not null,
    description text,
    enabled boolean not null default true,
    created_at timestamp with time zone not null default now(),
    created_by varchar(255),
    updated_at timestamp with time zone not null default now(),
    updated_by varchar(255),
    constraint uq_capabilities_system_key unique (system_id, "key")
);

create table if not exists profiles (
    id bigserial primary key,
    "key" varchar(120) not null unique,
    name varchar(200) not null,
    description text,
    enabled boolean not null default true,
    created_at timestamp with time zone not null default now(),
    created_by varchar(255),
    updated_at timestamp with time zone not null default now(),
    updated_by varchar(255)
);

create table if not exists profile_capabilities (
    id bigserial primary key,
    profile_id bigint not null references profiles(id),
    capability_id bigint not null references capabilities(id),
    created_at timestamp with time zone not null default now(),
    created_by varchar(255),
    revoked_at timestamp with time zone,
    revoked_by varchar(255)
);

create table if not exists user_profiles (
    id bigserial primary key,
    keycloak_user_id varchar(255) not null,
    profile_id bigint not null references profiles(id),
    created_at timestamp with time zone not null default now(),
    created_by varchar(255),
    revoked_at timestamp with time zone,
    revoked_by varchar(255)
);

create table if not exists audit_logs (
    id bigserial primary key,
    actor_user_id varchar(255),
    actor_email varchar(255),
    action varchar(120) not null,
    target_type varchar(120) not null,
    target_id varchar(255),
    before_json text,
    after_json text,
    created_at timestamp with time zone not null default now()
);
