package com.digao.digao_oauth_service.core.domain.entities;

import java.util.Map;

public class Group {
    private String id;
    private String name;
    private String path;
    private Map<String, java.util.List<String>> attributes;

    public Group(String id, String name, String path, Map<String, java.util.List<String>> attributes) {
        this.id = id;
        this.name = name;
        this.path = path;
        this.attributes = attributes;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public Map<String, java.util.List<String>> getAttributes() {
        return attributes;
    }

    public void setAttributes(Map<String, java.util.List<String>> attributes) {
        this.attributes = attributes;
    }
}
