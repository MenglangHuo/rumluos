package com.menglang.rumluos.domain.company.service.impl;

import com.menglang.rumluos.common.exception.ConflictException;
import com.menglang.rumluos.common.exception.NotFoundException;
import com.menglang.rumluos.common.page.PageResponse;
import com.menglang.rumluos.common.page.PageUtils;
import com.menglang.rumluos.common.page.RequestPage;
import com.menglang.rumluos.domain.auth.service.permission.PermissionService;
import com.menglang.rumluos.domain.company.dto.CompanyDto;
import com.menglang.rumluos.domain.company.dto.CompanySortField;
import com.menglang.rumluos.domain.company.entity.Company;
import com.menglang.rumluos.domain.company.mapper.CompanyMapper;
import com.menglang.rumluos.domain.company.repository.CompanyRepository;
import com.menglang.rumluos.domain.company.entity.Branch;
import com.menglang.rumluos.domain.company.repository.BranchRepository;
import com.menglang.rumluos.domain.company.service.CompanyService;
import com.menglang.rumluos.domain.auth.entity.User;
import com.menglang.rumluos.domain.auth.entity.Role;
import com.menglang.rumluos.domain.auth.entity.UserRole;
import com.menglang.rumluos.domain.auth.repository.UserRepository;
import com.menglang.rumluos.domain.auth.repository.RoleRepository;
import com.menglang.rumluos.domain.auth.repository.UserRoleRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyMapper companyMapper;
    private final PermissionService permissionService;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    // ── Create ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public Mono<CompanyDto.CompanyResponse> create(CompanyDto.CreateCompanyRequest request) {
        return companyRepository.existsByEmailIgnoreCase(request.email())
                .flatMap(exist -> {
                    if (exist) return Mono.error(new ConflictException("Email already exists."));
                    Company company = companyMapper.toEntity(request);
                    if (request.enableBranch() != null) {
                        company.setEnableBranch(request.enableBranch());
                    }
                    return companyRepository.save(company);
                })
                .flatMap(saved -> {
                    // Create default 'Main Branch'
                    Branch defaultBranch = Branch.builder()
                            .name("Main Branch")
                            .phone(request.phone())
                            .address(request.address())
                            .isActive(true)
                            .build();
                    defaultBranch.setCompanyId(saved.getId());
                    return branchRepository.save(defaultBranch).thenReturn(saved);
                })
                // Create the super_admin user for this company
                .flatMap(saved -> userRepository.existsByUsernameOrEmail(request.ownerUsername(), request.email())
                        .flatMap(exists -> {
                            if (exists) return Mono.error(new ConflictException("Username or email already exists for owner."));
                            
                            User user = new User();
                            user.setCompanyId(saved.getId());
                            user.setUsername(request.ownerUsername());
                            user.setEmail(request.email());
                            user.setPasswordHash(passwordEncoder.encode(request.ownerPassword()));
                            user.setFirstName("Super"); // Default first name, can be updated later
                            user.setLastName("Admin");
                            user.setContact(request.phone());
                            user.setActive(true);
                            user.setStatus(User.Status.ACTIVE);
                            user.setTokenVersion(0);
                            user.setLoginAttempt((short) 0);
                            
                            return userRepository.save(user).thenReturn(saved);
                        })
                )
                // Assign super_admin role to the created user
                .flatMap(saved -> userRepository.findByUsername(request.ownerUsername())
                        .flatMap(user -> roleRepository.findByNameAndCompanyId("super_admin", user.getCompanyId())
                                .switchIfEmpty(Mono.defer(() -> {
                                    Role newRole = new Role();
                                    newRole.setCompanyId(user.getCompanyId());
                                    newRole.setName("super_admin");
                                    newRole.setDisplayName("Super Admin");
                                    newRole.setDescription("Company Owner");
                                    newRole.setPriority(1);
                                    return roleRepository.save(newRole);
                                }))
                                .flatMap(role -> {
                                    UserRole userRole = new UserRole();
                                    userRole.setUserId(user.getId());
                                    userRole.setRoleId(role.getId());
                                    return userRoleRepository.save(userRole).thenReturn(saved);
                                })
                        )
                )
                // After saving, seed permissions in background — don't fail company creation if seeding fails
                .flatMap(saved -> permissionService.seedPermissionsForCompany(saved.getId())
                        .doOnNext(count -> log.info("Seeded {} permission grants for company {}", count, saved.getId()))
                        .doOnError(ex -> log.warn("Permission seed failed for company {}: {}", saved.getId(), ex.getMessage()))
                        .onErrorResume(ex -> Mono.empty())
                        .thenReturn(saved))
                .map(companyMapper::toResponse);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    public Mono<CompanyDto.CompanyResponse> getById(Long id) {
        return findActiveOrThrow(id).map(companyMapper::toResponse);
    }

    public Mono<PageResponse<CompanyDto.CompanyResponse>> getAll(RequestPage page) {
        var pageable = page.toPageable(CompanySortField.class);
        String query = page.getQuery();

        if (query == null || query.isBlank()) {
            return PageUtils.createPageResponse(
                    companyRepository.findAllByDeletedAtIsNull(pageable).map(companyMapper::toResponse),
                    companyRepository.countAllByDeletedAtIsNull(),
                    pageable);
        }

        String likeQuery = "%" + query.trim().toLowerCase() + "%";
        return PageUtils.createPageResponse(
                companyRepository.searchAll(likeQuery, pageable).map(companyMapper::toResponse),
                companyRepository.countSearch(likeQuery),
                pageable);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public Mono<CompanyDto.CompanyResponse> update(Long id, CompanyDto.UpdateCompanyRequest request) {
        return findActiveOrThrow(id)
                .flatMap(company -> {
                    // Bug fix: was incorrectly calling checkNameUnique for the email field
                    Mono<Void> emailCheck = request.email() != null
                            ? checkEmailUnique(request.email(), id)
                            : Mono.empty();
                    Mono<Void> nameCheck = request.name() != null
                            ? checkNameUnique(request.name(), id)
                            : Mono.empty();
                    return emailCheck.then(nameCheck).thenReturn(company);
                })
                .flatMap(company -> {
                    companyMapper.updateEntity(request, company);
                    return companyRepository.save(company);
                })
                .map(companyMapper::toResponse);
    }

    // ── Delete / Restore ──────────────────────────────────────────────────────

    public Mono<Void> delete(Long id) {
        return findActiveOrThrow(id)
                .flatMap(company -> {
                    company.softDelete("system");
                    return companyRepository.save(company);
                })
                .then();
    }

    public Mono<CompanyDto.CompanyResponse> restore(Long id) {
        return companyRepository.findByIdIncludingDeleted(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Company not found.")))
                .flatMap(company -> {
                    if (!company.isDeleted()) {
                        return Mono.error(new ConflictException("Company is not deleted and cannot be restored."));
                    }
                    company.restore();
                    return companyRepository.save(company);
                })
                .map(companyMapper::toResponse);
    }

    // ── Toggle active ─────────────────────────────────────────────────────────

    public Mono<CompanyDto.CompanyResponse> toggleActive(Long id) {
        return findActiveOrThrow(id)
                .flatMap(company -> {
                    company.setActive(!company.isActive());
                    return companyRepository.save(company);
                })
                .map(companyMapper::toResponse);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /** Find a non-deleted company or throw 404. */
    private Mono<Company> findActiveOrThrow(Long id) {
        return companyRepository.findByIdAndNotDeleted(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Company not found.")));
    }

    private Mono<Void> checkEmailUnique(String email, Long excludeId) {
        Mono<Boolean> check = (excludeId == null)
                ? companyRepository.existsByEmailAndDeletedAtIsNull(email)
                : companyRepository.existsByEmailAndIdNotAndDeletedAtIsNull(email, excludeId);
        return check.flatMap(exists -> exists
                ? Mono.error(new ConflictException("Email already exists: " + email))
                : Mono.empty());
    }

    private Mono<Void> checkNameUnique(String name, Long excludeId) {
        Mono<Boolean> check = (excludeId == null)
                ? companyRepository.existsByNameAndDeletedAtIsNull(name)
                : companyRepository.existsByNameAndIdNotAndDeletedAtIsNull(name, excludeId);
        return check.flatMap(exists -> exists
                ? Mono.error(new ConflictException("Company name already exists: " + name))
                : Mono.empty());
    }
}
