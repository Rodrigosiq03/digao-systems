create table if not exists user_vpn_access (
    keycloak_user_id varchar(255) not null,
    provider varchar(120) not null,
    status varchar(60) not null,
    invite_link text,
    notes text,
    created_at timestamp with time zone not null default now(),
    created_by varchar(255),
    updated_at timestamp with time zone not null default now(),
    updated_by varchar(255),
    invited_at timestamp with time zone,
    activated_at timestamp with time zone,
    revoked_at timestamp with time zone,
    constraint pk_user_vpn_access primary key (keycloak_user_id, provider)
);
