package com.menglang.rumluos.domain.company.service;

import com.menglang.rumluos.common.exception.ConflictException;
import com.menglang.rumluos.domain.auth.service.permission.PermissionService;
import com.menglang.rumluos.domain.company.dto.CompanyDto;
import com.menglang.rumluos.domain.company.entity.Company;
import com.menglang.rumluos.domain.company.mapper.CompanyMapper;
import com.menglang.rumluos.domain.company.entity.Branch;
import com.menglang.rumluos.domain.company.repository.BranchRepository;
import com.menglang.rumluos.domain.company.repository.CompanyRepository;
import com.menglang.rumluos.domain.company.service.impl.CompanyServiceImpl;
import com.menglang.rumluos.domain.auth.entity.User;
import com.menglang.rumluos.domain.auth.entity.Role;
import com.menglang.rumluos.domain.auth.entity.UserRole;
import com.menglang.rumluos.domain.auth.repository.UserRepository;
import com.menglang.rumluos.domain.auth.repository.RoleRepository;
import com.menglang.rumluos.domain.auth.repository.UserRoleRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private CompanyMapper companyMapper;

    @Mock
    private PermissionService permissionService;

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private CompanyServiceImpl companyService;

    private CompanyDto.CreateCompanyRequest createRequest;
    private Company company;
    private CompanyDto.CompanyResponse companyResponse;

    @BeforeEach
    void setUp() {
        createRequest = new CompanyDto.CreateCompanyRequest("Test Co", "test@co.com", null, null, null, "owner", "Password123!", true);
        
        company = new Company();
        company.setId(1L);
        company.setName("Test Co");
        company.setEmail("test@co.com");
        
        companyResponse = new CompanyDto.CompanyResponse(1L, "Test Co", "test@co.com", null, null, null, true, true, null, null);
    }

    @Test
    void createCompany_Success() {
        // Arrange
        Branch mockBranch = new Branch();
        mockBranch.setId(1L);
        mockBranch.setCompanyId(1L);
        mockBranch.setName("Main Branch");

        User mockUser = new User();
        mockUser.setId(1L);
        mockUser.setCompanyId(1L);
        mockUser.setUsername("owner");

        Role mockRole = new Role();
        mockRole.setId(1L);
        mockRole.setName("super_admin");

        UserRole mockUserRole = new UserRole();
        mockUserRole.setId(1L);

        when(companyRepository.existsByEmailIgnoreCase(anyString())).thenReturn(Mono.just(false));
        when(companyMapper.toEntity(any())).thenReturn(company);
        when(companyRepository.save(any(Company.class))).thenReturn(Mono.just(company));
        when(branchRepository.save(any(Branch.class))).thenReturn(Mono.just(mockBranch));
        when(userRepository.existsByUsernameOrEmail(anyString(), anyString())).thenReturn(Mono.just(false));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(Mono.just(mockUser));
        when(userRepository.findByUsername(anyString())).thenReturn(Mono.just(mockUser));
        when(roleRepository.findByNameAndCompanyId(anyString(), anyLong())).thenReturn(Mono.empty());
        when(roleRepository.save(any(Role.class))).thenReturn(Mono.just(mockRole));
        when(userRoleRepository.save(any(UserRole.class))).thenReturn(Mono.just(mockUserRole));
        when(permissionService.seedPermissionsForCompany(anyLong())).thenReturn(Mono.just(10));
        when(companyMapper.toResponse(any(Company.class))).thenReturn(companyResponse);

        // Act & Assert
        StepVerifier.create(companyService.create(createRequest))
                .expectNextMatches(response -> response.id().equals(1L) && response.name().equals("Test Co"))
                .verifyComplete();

        verify(companyRepository).existsByEmailIgnoreCase("test@co.com");
        verify(companyRepository).save(any(Company.class));
        verify(branchRepository).save(any(Branch.class));
        verify(userRepository).existsByUsernameOrEmail("owner", "test@co.com");
        verify(userRepository).save(any(User.class));
        verify(roleRepository).findByNameAndCompanyId("super_admin", 1L);
        verify(userRoleRepository).save(any(UserRole.class));
        verify(permissionService).seedPermissionsForCompany(1L);
    }

    @Test
    void createCompany_ConflictEmail() {
        // Arrange
        when(companyRepository.existsByEmailIgnoreCase(anyString())).thenReturn(Mono.just(true));

        // Act & Assert
        StepVerifier.create(companyService.create(createRequest))
                .expectErrorMatches(throwable -> throwable instanceof ConflictException &&
                        throwable.getMessage().equals("Email already exists."))
                .verify();

        verify(companyRepository).existsByEmailIgnoreCase("test@co.com");
        verify(companyRepository, never()).save(any());
        verify(permissionService, never()).seedPermissionsForCompany(anyLong());
    }
}
