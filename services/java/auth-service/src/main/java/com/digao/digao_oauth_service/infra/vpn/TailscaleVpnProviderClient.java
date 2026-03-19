package com.digao.digao_oauth_service.infra.vpn;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.digao.digao_oauth_service.application.vpn.VpnObservedUser;
import com.digao.digao_oauth_service.application.vpn.VpnProviderClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;

@Component
public class TailscaleVpnProviderClient implements VpnProviderClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final VpnSyncProperties properties;

    public TailscaleVpnProviderClient(RestClient.Builder restClientBuilder, VpnSyncProperties properties) {
        this.restClient = restClientBuilder.build();
        this.objectMapper = JsonMapper.builder().findAndAddModules().build();
        this.properties = properties;
    }

    @Override
    public String provider() {
        return "tailscale";
    }

    @Override
    public List<VpnObservedUser> listObservedUsers() {
        if (properties.apiToken() == null || properties.apiToken().isBlank()) {
            throw new IllegalStateException("VPN sync API token is required when digao.vpn-sync.enabled=true");
        }
        if (properties.tailnet() == null || properties.tailnet().isBlank()) {
            throw new IllegalStateException("VPN sync tailnet is required when digao.vpn-sync.enabled=true");
        }

        String payload = restClient.get()
            .uri(properties.apiBaseUrl() + "/api/v2/tailnet/{tailnet}/users", properties.tailnet())
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.apiToken())
            .retrieve()
            .body(String.class);

        return parseObservedUsers(payload);
    }

    List<VpnObservedUser> parseObservedUsers(String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            JsonNode usersNode = root.isArray() ? root : root.path("users");
            if (!usersNode.isArray()) {
                return List.of();
            }

            List<VpnObservedUser> observedUsers = new ArrayList<>();
            Iterator<JsonNode> iterator = usersNode.elements();
            while (iterator.hasNext()) {
                JsonNode userNode = iterator.next();
                String email = firstText(userNode, "loginName", "email", "login", "LoginName", "Email");
                if (email == null || email.isBlank()) {
                    continue;
                }

                String role = normalizeRole(firstText(userNode, "role", "Role"));
                String status = normalizeText(firstText(userNode, "status", "state", "Status", "State"));
                OffsetDateTime lastSeenAt = parseTimestamp(firstText(userNode, "lastSeen", "lastSeenAt", "LastSeen", "LastSeenAt"));
                OffsetDateTime observedAt = OffsetDateTime.now();
                boolean active = resolveActive(userNode, status, role);

                observedUsers.add(new VpnObservedUser(email.trim().toLowerCase(Locale.ROOT), role, lastSeenAt, observedAt, active));
            }
            return observedUsers;
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to parse VPN provider users payload", exception);
        }
    }

    private boolean resolveActive(JsonNode userNode, String status, String role) {
        if (userNode.path("suspended").asBoolean(false) || userNode.path("deleted").asBoolean(false)) {
            return false;
        }
        if ("active".equals(status) || "approved".equals(status)) {
            return true;
        }
        if ("pending".equals(status) || "inactive".equals(status) || "deleted".equals(status) || "suspended".equals(status)) {
            return false;
        }
        return "owner".equals(role) || "admin".equals(role) || "member".equals(role);
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "unknown";
        }
        String normalized = role.trim().toLowerCase(Locale.ROOT);
        if ("owner".equals(normalized) || "admin".equals(normalized) || "member".equals(normalized)) {
            return normalized;
        }
        return "unknown";
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }

    private OffsetDateTime parseTimestamp(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return OffsetDateTime.parse(value);
    }

    private String firstText(JsonNode node, String... fieldNames) {
        for (String fieldName : fieldNames) {
            JsonNode child = node.get(fieldName);
            if (child != null && !child.isNull()) {
                String text = child.asText(null);
                if (text != null && !text.isBlank()) {
                    return text;
                }
            }
        }
        return null;
    }
}
