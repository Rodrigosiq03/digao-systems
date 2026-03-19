package com.digao.digao_oauth_service.application.vpn;

import java.util.List;

public interface VpnProviderClient {
    String provider();

    List<VpnObservedUser> listObservedUsers();
}
