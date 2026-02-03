package com.digao.digao_oauth_service.application.dto.groups;

import java.util.List;
import java.util.Map;

public record GroupResponse(
    String id,
    String name,
    String path,
    Map<String, List<String>> attributes
) {
}
