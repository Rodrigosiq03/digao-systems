package com.digao.digao_oauth_service.application.authorization;

import java.util.List;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.digao.digao_oauth_service.application.metrics.AuthServiceMetrics;
import com.digao.digao_oauth_service.domain.authorization.UserVpnAccessStateTotal;
import com.digao.digao_oauth_service.domain.authorization.repository.UserVpnAccessRepository;

@Service
public class UserVpnAccessMetricsService {

    private static final List<String> STATES = List.of("none", "invite_pending", "active", "revoked");

    private final UserVpnAccessRepository userVpnAccessRepository;
    private final AuthServiceMetrics metrics;

    public UserVpnAccessMetricsService(UserVpnAccessRepository userVpnAccessRepository, AuthServiceMetrics metrics) {
        this.userVpnAccessRepository = userVpnAccessRepository;
        this.metrics = metrics;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void refreshOnReady() {
        refreshTotals();
    }

    @Transactional(readOnly = true)
    public void refreshTotals() {
        List<UserVpnAccessStateTotal> totals = userVpnAccessRepository.summarizeTotalsByProviderAndState();
        totals.stream()
            .map(UserVpnAccessStateTotal::provider)
            .distinct()
            .forEach(provider -> STATES.forEach(state -> metrics.setUserVpnAccessTotal(provider, state, 0)));
        totals.forEach(total -> metrics.setUserVpnAccessTotal(total.provider(), total.state(), Math.toIntExact(total.total())));
    }
}
