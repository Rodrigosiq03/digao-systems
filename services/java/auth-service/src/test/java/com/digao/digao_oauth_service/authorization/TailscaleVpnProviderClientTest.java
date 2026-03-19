package com.digao.digao_oauth_service.authorization;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.time.OffsetDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import com.digao.digao_oauth_service.application.vpn.VpnObservedUser;
import com.digao.digao_oauth_service.infra.vpn.TailscaleVpnProviderClient;
import com.digao.digao_oauth_service.infra.vpn.VpnSyncProperties;

class TailscaleVpnProviderClientTest {

    @Test
    void fetchesObservedUsersFromTailnetUsersEndpoint() {
        VpnSyncProperties properties = new VpnSyncProperties(
            true,
            "0 */15 * * * *",
            "tailscale",
            "https://api.tailscale.com",
            "tailnet.example.ts.net",
            "token-123",
            100
        );
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        TailscaleVpnProviderClient client = new TailscaleVpnProviderClient(builder, properties);

        server.expect(requestTo("https://api.tailscale.com/api/v2/tailnet/tailnet.example.ts.net/users"))
            .andExpect(method(HttpMethod.GET))
            .andExpect(header("Authorization", "Bearer token-123"))
            .andRespond(withSuccess("""
                [
                  {
                    "loginName": "owner@example.com",
                    "role": "owner",
                    "status": "active",
                    "lastSeen": "2026-03-18T22:50:00Z"
                  },
                  {
                    "email": "pending@example.com",
                    "role": "member",
                    "status": "pending"
                  }
                ]
                """, MediaType.APPLICATION_JSON));

        List<VpnObservedUser> users = client.listObservedUsers();

        assertEquals(2, users.size());
        assertEquals("owner@example.com", users.get(0).email());
        assertEquals("owner", users.get(0).role());
        assertEquals(OffsetDateTime.parse("2026-03-18T22:50:00Z"), users.get(0).lastSeenAt());
        assertEquals(true, users.get(0).active());
        assertEquals("pending@example.com", users.get(1).email());
        assertEquals("member", users.get(1).role());
        assertNull(users.get(1).lastSeenAt());
        assertEquals(false, users.get(1).active());
        server.verify();
    }
}
