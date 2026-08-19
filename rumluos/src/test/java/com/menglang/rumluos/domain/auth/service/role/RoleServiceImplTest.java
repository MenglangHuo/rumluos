package com.menglang.rumluos.domain.auth.service.role;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.menglang.rumluos.common.utils.SecurityUtils;
import com.menglang.rumluos.domain.auth.dto.RoleDto;
import com.menglang.rumluos.domain.auth.entity.Permission;
import com.menglang.rumluos.domain.auth.entity.PermissionGrant;
import com.menglang.rumluos.domain.auth.entity.Role;
import com.menglang.rumluos.domain.auth.entity.RolePermissionGrant;
import com.menglang.rumluos.domain.auth.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoleServiceImplTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private ActionRepository actionRepository;

    @Mock
    private PermissionGrantRepository permissionGrantRepository;

    @Mock
    private RolePermissionGrantRepository rolePermissionGrantRepository;

    @Mock
    private RolePermissionGrantExclusionRepository rolePermissionGrantExclusionRepository;

    @InjectMocks
    private RoleServiceImpl roleService;

    private final Long companyId = 10L;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
    }

    @Test
    void createRole_ConvertsNameToUppercase_AndAssignsDisplayName() {
        try (MockedStatic<SecurityUtils> securityUtilsMock = Mockito.mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentCompanyId).thenReturn(Mono.just(companyId));

            RoleDto.CreateRoleRequest request = new RoleDto.CreateRoleRequest();
            request.setName("stock manager");
            request.setDescription("Handles inventory stock");

            Role savedRole = new Role();
            savedRole.setId(100L);
            savedRole.setCompanyId(companyId);
            savedRole.setName("STOCK_MANAGER");
            savedRole.setDisplayName("stock manager");
            savedRole.setDescription("Handles inventory stock");

            when(roleRepository.save(any(Role.class))).thenReturn(Mono.just(savedRole));
            when(rolePermissionGrantRepository.findByRoleId(100L)).thenReturn(Flux.empty());

            StepVerifier.create(roleService.create(request))
                    .expectNextMatches(response -> {
                        assertThat(response.getName()).isEqualTo("STOCK_MANAGER");
                        assertThat(response.getDisplayName()).isEqualTo("stock manager");
                        return true;
                    })
                    .verifyComplete();

            ArgumentCaptor<Role> roleCaptor = ArgumentCaptor.forClass(Role.class);
            verify(roleRepository).save(roleCaptor.capture());
            Role capturedRole = roleCaptor.getValue();
            assertThat(capturedRole.getName()).isEqualTo("STOCK_MANAGER");
            assertThat(capturedRole.getDisplayName()).isEqualTo("stock manager");
        }
    }

    @Test
    void createRole_WithPermissionListIDs_ResolvesGrantsCorrectly() {
        try (MockedStatic<SecurityUtils> securityUtilsMock = Mockito.mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentCompanyId).thenReturn(Mono.just(companyId));

            RoleDto.CreateRoleRequest request = new RoleDto.CreateRoleRequest();
            request.setName("Manager");
            request.setDescription("Manager role");
            request.setPermissionList(Collections.singletonList("1"));

            Role savedRole = new Role();
            savedRole.setId(101L);
            savedRole.setCompanyId(companyId);
            savedRole.setName("MANAGER");
            savedRole.setDisplayName("Manager");

            PermissionGrant grant = new PermissionGrant();
            grant.setId(1L);
            grant.setCompanyId(companyId);

            when(roleRepository.save(any(Role.class))).thenReturn(Mono.just(savedRole));
            when(permissionGrantRepository.findById(1L)).thenReturn(Mono.just(grant));
            when(rolePermissionGrantRepository.save(any(RolePermissionGrant.class)))
                    .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
            when(rolePermissionGrantRepository.findByRoleId(101L)).thenReturn(Flux.empty());

            StepVerifier.create(roleService.create(request))
                    .expectNextMatches(response -> {
                        assertThat(response.getName()).isEqualTo("MANAGER");
                        assertThat(response.getDisplayName()).isEqualTo("Manager");
                        return true;
                    })
                    .verifyComplete();

            verify(permissionGrantRepository).findById(1L);
            verify(rolePermissionGrantRepository).save(any(RolePermissionGrant.class));
        }
    }

    @Test
    void createRole_WithPermissionName_ResolvesDomainGrants() {
        try (MockedStatic<SecurityUtils> securityUtilsMock = Mockito.mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentCompanyId).thenReturn(Mono.just(companyId));

            RoleDto.CreateRoleRequest request = new RoleDto.CreateRoleRequest();
            request.setName("customer manager");
            request.setPermissionList(Collections.singletonList("customer"));

            Role savedRole = new Role();
            savedRole.setId(102L);
            savedRole.setCompanyId(companyId);
            savedRole.setName("CUSTOMER_MANAGER");
            savedRole.setDisplayName("customer manager");

            Permission perm = new Permission();
            perm.setId(5L);
            perm.setName("customer");
            perm.setCompanyId(companyId);

            PermissionGrant grant1 = new PermissionGrant();
            grant1.setId(50L);
            grant1.setPermissionId(5L);
            grant1.setCompanyId(companyId);

            when(roleRepository.save(any(Role.class))).thenReturn(Mono.just(savedRole));
            when(permissionRepository.findByNameAndCompanyId("customer", companyId)).thenReturn(Mono.just(perm));
            when(permissionGrantRepository.findAllByPermissionIdAndCompanyId(5L, companyId)).thenReturn(Flux.just(grant1));
            when(rolePermissionGrantRepository.save(any(RolePermissionGrant.class)))
                    .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
            when(rolePermissionGrantRepository.findByRoleId(102L)).thenReturn(Flux.empty());

            StepVerifier.create(roleService.create(request))
                    .expectNextMatches(response -> {
                        assertThat(response.getName()).isEqualTo("CUSTOMER_MANAGER");
                        assertThat(response.getDisplayName()).isEqualTo("customer manager");
                        return true;
                    })
                    .verifyComplete();

            verify(permissionRepository).findByNameAndCompanyId("customer", companyId);
            verify(permissionGrantRepository).findAllByPermissionIdAndCompanyId(5L, companyId);
        }
    }

    @Test
    void deserializeCreateRoleRequest_WithPermissionArrayAndStringifiedArray() throws Exception {
        String json1 = "{\"name\": \"Manager\", \"description\": \"Manager \", \"permission\": [\"1\", \"2\"]}";
        RoleDto.CreateRoleRequest req1 = objectMapper.readValue(json1, RoleDto.CreateRoleRequest.class);
        assertThat(req1.getName()).isEqualTo("Manager");
        assertThat(req1.getPermissionList()).containsExactly("1", "2");

        String json2 = "{\"name\": \"stock manager\", \"description\": \"Stock \", \"permission\": \"[\\\"1\\\", \\\"2\\\"]\"}";
        RoleDto.CreateRoleRequest req2 = objectMapper.readValue(json2, RoleDto.CreateRoleRequest.class);
        assertThat(req2.getName()).isEqualTo("stock manager");
        assertThat(req2.getPermissionList()).containsExactly("1", "2");

        String json3 = "{\"name\": \"Manager\", \"description\": \"Manager \", \"permissionIds\": [\"93\", \"91\"]}";
        RoleDto.CreateRoleRequest req3 = objectMapper.readValue(json3, RoleDto.CreateRoleRequest.class);
        assertThat(req3.getName()).isEqualTo("Manager");
        assertThat(req3.getPermissionList()).containsExactly("93", "91");
    }
}
