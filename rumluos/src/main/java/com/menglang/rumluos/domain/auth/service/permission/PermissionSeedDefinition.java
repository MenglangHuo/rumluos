package com.menglang.rumluos.domain.auth.service.permission;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Defines which actions are available for each domain.
 * Supports default actions (CRUD) with overrides (include/exclude).
 */
public final class PermissionSeedDefinition {

    private PermissionSeedDefinition() {}

    public static final List<DomainPermission> DEFINITIONS = List.of(

            DomainPermission.withDefaults("customer", "Manage customer accounts")
                    .include(Action.EXPORT, Action.RESTORE),

            DomainPermission.withDefaults("loan", "Manage loan products and applications")
                    .exclude(Action.DELETE)
                    .include(Action.EXPORT),

            DomainPermission.withDefaults("role", "Manage roles and permissions")
                    .include(Action.RESTORE),

            DomainPermission.withDefaults("user", "Manage users and their assignments")
                    .include(Action.EXPORT, Action.RESTORE),

            DomainPermission.withDefaults("currency", "Manage currencies")
                    .include(Action.EXPORT, Action.RESTORE),

            DomainPermission.withDefaults("invoice", "Manage invoices")
                    .include(Action.EXPORT, Action.RESTORE),

            DomainPermission.withDefaults("payment", "Manage payments")
                    .exclude(Action.UPDATE, Action.DELETE)
                    .include(Action.EXPORT),

            DomainPermission.withDefaults("income", "Manage income records")
                    .exclude(Action.DELETE)
                    .include(Action.EXPORT),

            DomainPermission.withDefaults("expense", "Manage expense records")
                    .exclude(Action.DELETE)
                    .include(Action.EXPORT),
            
            DomainPermission.withDefaults("dashboard", "View dashboard metrics")
                    .exclude(Action.CREATE, Action.UPDATE, Action.DELETE) // Read only
    );

    public static final class Action {
        public static final String READ   = "read";
        public static final String CREATE = "create";
        public static final String UPDATE = "update";
        public static final String DELETE = "delete";
        public static final String EXPORT = "export";
        public static final String RESTORE = "restore";
        private Action() {}
    }

    public static class DomainPermission {
        private final String domain;
        private final String description;
        private final Set<String> actions;

        private DomainPermission(String domain, String description, Set<String> initialActions) {
            this.domain = domain;
            this.description = description;
            this.actions = new HashSet<>(initialActions);
        }

        public static DomainPermission withDefaults(String domain, String description) {
            return new DomainPermission(domain, description, Set.of(Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE));
        }

        public DomainPermission include(String... additionalActions) {
            this.actions.addAll(Arrays.asList(additionalActions));
            return this;
        }

        public DomainPermission exclude(String... excludedActions) {
            Arrays.asList(excludedActions).forEach(this.actions::remove);
            return this;
        }

        public String getDomain() { return domain; }
        public String getDescription() { return description; }
        public Set<String> getActions() { return actions; }
    }
}

