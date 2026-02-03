package com.digao.digao_oauth_service.infra.security;

import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

public class KeycloakJwtAuthConverter implements Converter<Jwt, JwtAuthenticationToken> {
    private final JwtGrantedAuthoritiesConverter defaultConverter = new JwtGrantedAuthoritiesConverter();

    @Override
    public JwtAuthenticationToken convert(Jwt jwt) {
        Set<GrantedAuthority> authorities = new HashSet<>();
        Collection<GrantedAuthority> defaults = defaultConverter.convert(jwt);
        if (defaults != null) {
            authorities.addAll(defaults);
        }
        authorities.addAll(extractRealmRoles(jwt));
        return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
    }

    private Collection<GrantedAuthority> extractRealmRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null) {
            return Set.of();
        }
        Object rolesObj = realmAccess.get("roles");
        if (!(rolesObj instanceof Collection<?> roles)) {
            return Set.of();
        }
        Set<GrantedAuthority> result = new HashSet<>();
        for (Object role : roles) {
            if (role == null) {
                continue;
            }
            String roleName = role.toString();
            if (!roleName.isBlank()) {
                result.add(new SimpleGrantedAuthority("ROLE_" + roleName));
            }
        }
        return result;
    }
}
