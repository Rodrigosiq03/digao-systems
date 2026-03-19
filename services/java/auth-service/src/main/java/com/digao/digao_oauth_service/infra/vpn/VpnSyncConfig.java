package com.digao.digao_oauth_service.infra.vpn;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@EnableConfigurationProperties(VpnSyncProperties.class)
public class VpnSyncConfig {
}
