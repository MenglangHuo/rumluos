package com.menglang.rumluos.domain.auth.dto;

import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class RoleDto {

    @Data
    public static class ActionPermissionRequest {
        @NotBlank
        private String name;
        private boolean enabled;
    }

    @Getter
    @Setter
    public static class CreateRoleRequest {
        @NotBlank
        private String name;
        private String description;
        private String displayName;
        private Integer priority;

        // Map of Permission name (e.g. PRODUCT) -> List of Actions
        private Map<String, List<ActionPermissionRequest>> permissions;

        // List of Permission IDs, Grant IDs, or Permission Names passed via 'permission', 'permissions', or 'permissionIds'
        private List<String> permissionList;

        @JsonSetter("permission")
        public void setPermission(Object value) {
            parsePermissionsValue(value);
        }

        @JsonSetter("permissions")
        public void setPermissions(Object value) {
            parsePermissionsValue(value);
        }

        @JsonSetter("permissionIds")
        public void setPermissionIds(Object value) {
            parsePermissionsValue(value);
        }

        private void parsePermissionsValue(Object value) {
            if (value == null) {
                return;
            }
            if (value instanceof List<?> list) {
                if (this.permissionList == null) {
                    this.permissionList = new ArrayList<>();
                }
                for (Object item : list) {
                    if (item != null) {
                        this.permissionList.add(String.valueOf(item));
                    }
                }
            } else if (value instanceof String text) {
                String trimmed = text.trim();
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                    try {
                        ObjectMapper mapper = new ObjectMapper();
                        List<?> list = mapper.readValue(trimmed, List.class);
                        if (this.permissionList == null) {
                            this.permissionList = new ArrayList<>();
                        }
                        for (Object item : list) {
                            if (item != null) {
                                this.permissionList.add(String.valueOf(item));
                            }
                        }
                    } catch (Exception ignored) {
                        if (this.permissionList == null) {
                            this.permissionList = new ArrayList<>();
                        }
                        this.permissionList.add(trimmed);
                    }
                } else if (!trimmed.isBlank()) {
                    if (this.permissionList == null) {
                        this.permissionList = new ArrayList<>();
                    }
                    this.permissionList.add(trimmed);
                }
            } else if (value instanceof Map<?, ?> map) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    this.permissions = mapper.convertValue(map, new TypeReference<Map<String, List<ActionPermissionRequest>>>() {});
                } catch (Exception ignored) {}
            }
        }
    }

    @Getter
    @Setter
    public static class UpdateRoleRequest extends CreateRoleRequest {
    }

    @Data
    public static class RoleResponse {
        private Long id;
        private String name;
        private String description;
        private String displayName;
        private Integer priority;
        private Instant createdAt;
        private Map<String, List<ActionPermissionRequest>> permissions;
    }

    @Data
    public static class ExcludePermissionsRequest {
        // Map of Permission name (e.g. CATEGORY) -> List of Action names (e.g. ["write"])
        private Map<String, List<String>> exclusions;
    }
}

