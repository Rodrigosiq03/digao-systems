package com.digao.notification.infra.adapters;

import java.time.Duration;

import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import com.digao.notification.core.ports.TraceRepository;

import lombok.RequiredArgsConstructor;
@Component
@Primary
@RequiredArgsConstructor
public class RedisTraceRepository implements TraceRepository {
    private final RedisTemplate<String, String> redisTemplate;

    private static final String KEY_PREFIX = "email:trace:";
    private static final Duration TTL = Duration.ofHours(24);

    @Override
    public boolean save(String traceId) {
        String key = KEY_PREFIX + traceId;
        Boolean success = redisTemplate.opsForValue().setIfAbsent(key, "sent", TTL);
        return Boolean.TRUE.equals(success);
    }
}
