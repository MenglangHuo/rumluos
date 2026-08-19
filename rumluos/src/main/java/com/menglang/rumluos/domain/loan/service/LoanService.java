package com.menglang.rumluos.domain.loan.service;

import com.menglang.rumluos.common.enums.LoanStatus;
import com.menglang.rumluos.common.enums.ProductStatus;
import com.menglang.rumluos.common.exception.ConflictException;
import com.menglang.rumluos.domain.inventory.service.InventoryService;
import com.menglang.rumluos.domain.loan.entity.Loan;
import com.menglang.rumluos.domain.loan.entity.LoanSchedule;
import com.menglang.rumluos.domain.loan.dto.LoanDetailsDto;
import com.menglang.rumluos.domain.company.repository.CustomerRepository;
import com.menglang.rumluos.domain.loan.repository.LoanItemRepository;
import com.menglang.rumluos.domain.loan.repository.LoanRepository;
import com.menglang.rumluos.domain.loan.repository.LoanScheduleRepository;
import com.menglang.rumluos.domain.loan.entity.LoanItem;
import com.menglang.rumluos.domain.loan.dto.LoanDto;
import com.menglang.rumluos.domain.product.repository.ProductRepository;
import com.menglang.rumluos.domain.loan.service.calculator.AmortizationCalculatorFactory;
import com.menglang.rumluos.domain.finance.entity.Invoice;
import com.menglang.rumluos.domain.finance.repository.InvoiceRepository;
import com.menglang.rumluos.domain.finance.service.FinanceService;
import com.menglang.rumluos.domain.company.entity.Customer;
import lombok.RequiredArgsConstructor;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final LoanItemRepository loanItemRepository;
    private final LoanScheduleRepository loanScheduleRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final InvoiceRepository invoiceRepository;
    private final FinanceService financeService;
    private final DatabaseClient databaseClient;
    private final AmortizationCalculatorFactory calculatorFactory;
    private final InventoryService inventoryService;

    // ── Reads ─────────────────────────────────────────────────────

    /**
     * Fetch a comprehensive Loan aggregate DTO.
     *
     * <p>Uses {@code Mono.zip} to fire the customer, items, and schedules queries
     * concurrently, minimising total latency.
     *
     * @param companyId tenant boundary — only loans belonging to this company are accessible.
     * @param loanId    the loan's primary key.
     */
    public Mono<LoanDetailsDto> getLoanDetails(Long companyId, Long loanId) {
        return loanRepository.findByIdAndCompanyId(loanId, companyId)
                .flatMap(loan -> {
                    var customerMono = customerRepository.findByIdAndCompanyId(loan.getCustomerId(), companyId).defaultIfEmpty(new Customer());
                    var itemsMono = loanItemRepository.findByLoanId(loanId).collectList();
                    var schedulesMono = loanScheduleRepository.findByLoanId(loanId).collectList();
                    var invoicesMono = invoiceRepository.findByLoanIdAndCompanyId(loanId, companyId).collectList();

                    var childLoanMono = loanRepository.findAllByCompanyId(companyId)
                            .filter(l -> loanId.equals(l.getParentLoanId()))
                            .next()
                            .defaultIfEmpty(new Loan());

                    var parentLoanMono = loan.getParentLoanId() != null
                            ? loanRepository.findByIdAndCompanyId(loan.getParentLoanId(), companyId).defaultIfEmpty(new Loan())
                            : Mono.just(new Loan());

                    return Mono.zip(customerMono, itemsMono, schedulesMono, invoicesMono)
                            .zipWith(Mono.zip(childLoanMono, parentLoanMono))
                            .map(tuple -> {
                                Customer customer = tuple.getT1().getT1().getId() != null ? tuple.getT1().getT1() : null;
                                List<LoanItem> items = tuple.getT1().getT2();
                                List<LoanSchedule> schedules = tuple.getT1().getT3();
                                List<Invoice> invoices = tuple.getT1().getT4();
                                Loan childLoan = tuple.getT2().getT1().getId() != null ? tuple.getT2().getT1() : null;
                                Loan parentLoan = tuple.getT2().getT2().getId() != null ? tuple.getT2().getT2() : null;

                                return new LoanDetailsDto(loan, customer, items, schedules, invoices, childLoan, parentLoan);
                            });
                });
    }

    /**
     * Find all loans for a specific customer within the tenant.
     */
    public Flux<Loan> findByCustomerId(Long companyId, Long customerId) {
        return loanRepository.findByCustomerIdAndCompanyId(customerId, companyId);
    }

    /**
     * Find all loans in a given status within the tenant.
     */
    public Flux<Loan> findByStatus(Long companyId, String status) {
        return loanRepository.findByStatusAndCompanyId(status, companyId);
    }

    /**
     * Find all loans for a customer filtered by status within the tenant.
     */
    public Flux<Loan> findByCustomerIdAndStatus(Long companyId, Long customerId, String status) {
        return loanRepository.findByCustomerIdAndStatusAndCompanyId(customerId, status, companyId);
    }

    /**
     * Look up a single loan by its human-readable key within the tenant.
     */
    public Mono<Loan> findByLoanKey(Long companyId, String loanKey) {
        return loanRepository.findByLoanKeyAndCompanyId(loanKey, companyId);
    }

    /**
     * Count active + pending loans for a customer (used for credit-limit / eligibility checks).
     */
    public Mono<Long> countActiveLoans(Long companyId, Long customerId) {
        return loanRepository.countActiveByCustomerIdAndCompanyId(customerId, companyId);
    }

    // ── Writes ────────────────────────────────────────────────────

    /**
     * Create a new loan record, binding it to the tenant's company.
     */
    @Transactional
    public Mono<Loan> create(Long companyId, Loan loan) {
        return createWithItems(companyId, loan, null);
    }

    /**
     * Search loans by query, customerId, or status.
     */
    public Flux<Loan> search(Long companyId, String query, Long customerId, String status) {
        if (query != null && !query.isBlank()) {
            return loanRepository.searchByQuery(companyId, query.trim());
        }
        if (customerId != null && status != null && !status.isBlank()) {
            return loanRepository.findByCustomerIdAndStatusAndCompanyId(customerId, status.trim(), companyId);
        }
        if (customerId != null) {
            return loanRepository.findByCustomerIdAndCompanyId(customerId, companyId);
        }
        if (status != null && !status.isBlank()) {
            return loanRepository.findByStatusAndCompanyId(status.trim(), companyId);
        }
        return loanRepository.findAllByCompanyId(companyId);
    }

    /**
     * Auto-generate a sequential loanKey using database sequence loan_seq with prefix LN-YYMMDD-xxxx.
     */
    public Mono<String> generateLoanKey() {
        String dateStr = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyMMdd"));
        return databaseClient.sql("SELECT nextval('loan_seq')")
                .map((row, metadata) -> {
                    Long seq = row.get(0, Long.class);
                    long num = (seq != null) ? (seq % 10000) : 1;
                    return String.format("LN-%s-%04d", dateStr, num);
                })
                .one()
                .onErrorReturn(String.format("LN-%s-%04d", dateStr, (System.currentTimeMillis() % 9000) + 1000));
    }

    /**
     * Create a new loan record along with product line items, snapshotting product info.
     */
    @Transactional
    public Mono<Loan> createWithItems(Long companyId, Loan loan, List<LoanDto.LoanItemRequest> itemRequests) {
        loan.setCompanyId(companyId);
        loan.setStatus(LoanStatus.PENDING.name());
        loan.setCreatedAt(Instant.now());
//        loan.setCreatedBy("SYSTEM");

        if (loan.getEndDate() == null && loan.getStartDate() != null && loan.getNumberOfPeriods() != null) {
            loan.setEndDate(calculateEndDate(loan.getStartDate(), loan.getNumberOfPeriods(), loan.getTerm()));
        }

        if (loan.getTotalInterest() == null || java.math.BigDecimal.ZERO.compareTo(loan.getTotalInterest()) == 0) {
            java.math.BigDecimal calculated = calculateTotalInterest(loan);
            loan.setTotalInterest(calculated != null ? calculated : java.math.BigDecimal.ZERO);
        }
        if (loan.getTotalInterest() == null) {
            loan.setTotalInterest(java.math.BigDecimal.ZERO);
        }

        Mono<String> keyMono = (loan.getLoanKey() == null || loan.getLoanKey().isBlank())
                ? generateLoanKey()
                : Mono.just(loan.getLoanKey());

        return keyMono.flatMap(key -> {
            loan.setLoanKey(key);
            return loanRepository.save(loan);
        }).flatMap(savedLoan -> {
                    if (itemRequests == null || itemRequests.isEmpty()) {
                        return Mono.just(savedLoan);
                    }

                    return Flux.fromIterable(itemRequests)
                            .flatMap(req -> {
                                LoanItem item = LoanDto.toItemEntity(req, savedLoan.getCurrency());
                                item.setLoanId(savedLoan.getId());
                                item.setCreatedAt(Instant.now());
                                item.setCreatedBy("SYSTEM");

                                if (req.getProductId() != null) {
                                    return productRepository.findByIdAndCompanyId(req.getProductId(), companyId)
                                            .flatMap(p -> {
                                                // ── Guard: only ACTIVE products can be loaned ──
                                                if (!ProductStatus.ACTIVE.name().equals(p.getStatus())) {
                                                    return Mono.error(new ConflictException(
                                                            "Product '" + p.getName() + "' (ID: " + p.getId()
                                                            + ") is not available for loan. Current status: " + p.getStatus()));
                                                }

                                                // Snapshot product data into the loan item
                                                if (item.getProductName() == null) item.setProductName(p.getName());
                                                if (item.getProductModel() == null) item.setProductModel(p.getModel());
                                                if (item.getSerialNumber() == null) item.setSerialNumber(p.getSerialNumber());
                                                if (item.getCondition() == null) item.setCondition(p.getCondition());
                                                if (item.getUnitPriceSnapshot() == null) item.setUnitPriceSnapshot(p.getSellPrice());
                                                if (item.getAttributesSnapshot() == null) item.setAttributesSnapshot(p.getAttributes());

                                                // ── Lock product: set status to ON_LOAN ──
                                                p.setStatus(ProductStatus.ON_LOAN.name());
                                                p.setUpdatedAt(Instant.now());
                                                p.setUpdatedBy("SYSTEM");
                                                return productRepository.save(p).thenReturn(item);
                                            })
                                            .defaultIfEmpty(item);
                                }
                                return Mono.just(item);
                            })
                            .collectList()
                            .flatMap(items -> loanItemRepository.saveAll(items).then(Mono.just(savedLoan)));
                });
    }

    /**
     * Soft-delete a loan, validating tenant ownership first.
     */
    @Transactional
    public Mono<Void> delete(Long companyId, Long id) {
        return loanRepository.findByIdAndCompanyId(id, companyId)
                .flatMap(existing -> {
                    existing.setDeletedAt(Instant.now());
                    existing.setDeletedBy("SYSTEM");
                    return loanRepository.save(existing).then();
                });
    }

    /**
     * Activate a loan: validates tenant, transitions status to ACTIVE,
     * generates the amortization schedule via Strategy pattern,
     * and persists all schedule rows in a single bulk INSERT.
     *
     * @param companyId tenant boundary
     * @param loanId    ID of the loan to activate
     */
    @Transactional
    public Mono<Loan> activateLoan(Long companyId, Long loanId) {
        return loanRepository.findByIdAndCompanyId(loanId, companyId)
                .flatMap(loan -> {
                    loan.setStatus(LoanStatus.ACTIVE.name());
                    loan.setUpdatedAt(Instant.now());
                    loan.setUpdatedBy("SYSTEM");

                    List<LoanSchedule> schedules = generateSchedules(loan);

                    return loanRepository.save(loan)
                            .flatMap(savedLoan -> {
                                schedules.forEach(s -> s.setLoanId(savedLoan.getId()));

                                // ── Deduct inventory for each loan item ──
                                Mono<Void> deductInventoryMono = loanItemRepository.findByLoanId(savedLoan.getId())
                                        .flatMap(loanItem -> {
                                            if (loanItem.getProductId() == null) return Mono.empty();
                                            return inventoryService.deductStock(new InventoryService.DeductStockRequest(
                                                    companyId,
                                                    loan.getBranchId(),
                                                    loanItem.getProductId(),
                                                    loanItem.getQuantity(),
                                                    "LOAN",
                                                    savedLoan.getId(),
                                                    "SYSTEM"
                                            )).then();
                                        })
                                        .onErrorResume(e -> {
                                            // Log but don't fail — inventory may not be tracked for all products
                                            return Mono.empty();
                                        })
                                        .then();

                                return saveSchedulesInBatch(schedules)
                                        .then(deductInventoryMono)
                                        .then(loanScheduleRepository.findByLoanId(savedLoan.getId()).collectList())
                                        .flatMap(savedSchedules -> {
                                            if (savedSchedules != null && !savedSchedules.isEmpty()) {
                                                LoanSchedule firstSched = savedSchedules.get(0);
                                                return financeService.generateInvoiceForSchedule(companyId, savedLoan.getId(), firstSched.getId(), "SYSTEM")
                                                        .onErrorResume(e -> Mono.empty())
                                                        .thenReturn(savedLoan);
                                            }
                                            return Mono.just(savedLoan);
                                        });
                            });
                });
    }

    /**
     * Approve a loan (PENDING → APPROVED), recording who approved it.
     */
    @Transactional
    public Mono<Loan> approveLoan(Long companyId, Long loanId, String approvedBy) {
        return loanRepository.findByIdAndCompanyId(loanId, companyId)
                .flatMap(loan -> {
                    loan.setStatus(LoanStatus.APPROVED.name());
                    loan.setApprovedBy(approvedBy);
                    loan.setApprovedAt(Instant.now());
                    loan.setUpdatedAt(Instant.now());
                    loan.setUpdatedBy(approvedBy);
                    return loanRepository.save(loan);
                });
    }

    /**
     * Close a loan (transition to COMPLETED or CLOSED).
     */
    @Transactional
    public Mono<Loan> closeLoan(Long companyId, Long loanId) {
        return loanRepository.findByIdAndCompanyId(loanId, companyId)
                .flatMap(loan -> {
                    loan.setStatus(LoanStatus.COMPLETED.name());
                    loan.setClosedAt(Instant.now());
                    loan.setUpdatedAt(Instant.now());
                    loan.setUpdatedBy("SYSTEM");

                    // ── Mark all loan products as SOLD ──
                    Mono<Void> updateProductsMono = loanItemRepository.findByLoanId(loanId)
                            .filter(item -> item.getProductId() != null)
                            .flatMap(item -> productRepository.findByIdAndCompanyId(item.getProductId(), companyId)
                                    .flatMap(product -> {
                                        product.setStatus(ProductStatus.SOLD.name());
                                        product.setUpdatedAt(Instant.now());
                                        product.setUpdatedBy("SYSTEM");
                                        return productRepository.save(product);
                                    })
                            )
                            .then();

                    return loanRepository.save(loan)
                            .flatMap(savedLoan -> updateProductsMono.thenReturn(savedLoan));
                });
    }

    /**
     * Default a loan (transition to DEFAULTED) and repossess products.
     * Products are returned to ACTIVE status so they can be re-loaned.
     */
    @Transactional
    public Mono<Loan> defaultLoan(Long companyId, Long loanId) {
        return loanRepository.findByIdAndCompanyId(loanId, companyId)
                .flatMap(loan -> {
                    loan.setStatus(LoanStatus.DEFAULTED.name());
                    loan.setClosedAt(Instant.now());
                    loan.setUpdatedAt(Instant.now());
                    loan.setUpdatedBy("SYSTEM");

                    // ── Repossess: return products to ACTIVE status ──
                    Mono<Void> repossessProductsMono = loanItemRepository.findByLoanId(loanId)
                            .filter(item -> item.getProductId() != null)
                            .flatMap(item -> productRepository.findByIdAndCompanyId(item.getProductId(), companyId)
                                    .flatMap(product -> {
                                        if (ProductStatus.ON_LOAN.name().equals(product.getStatus())) {
                                            product.setStatus(ProductStatus.ACTIVE.name());
                                            product.setUpdatedAt(Instant.now());
                                            product.setUpdatedBy("SYSTEM");
                                            return productRepository.save(product);
                                        }
                                        return Mono.just(product);
                                    })
                            )
                            .then();

                    // ── Return stock to inventory ──
                    Mono<Void> returnStockMono = loanItemRepository.findByLoanId(loanId)
                            .filter(item -> item.getProductId() != null)
                            .flatMap(item -> inventoryService.addStock(new InventoryService.AddStockRequest(
                                    companyId,
                                    loan.getBranchId(),
                                    item.getProductId(),
                                    item.getQuantity(),
                                    item.getTotalCostSnapshot() != null
                                            ? item.getTotalCostSnapshot().divide(java.math.BigDecimal.valueOf(item.getQuantity()), java.math.RoundingMode.HALF_UP)
                                            : item.getUnitPriceSnapshot(),
                                    "REPOSSESSION",
                                    "LOAN_DEFAULT",
                                    loanId,
                                    "SYSTEM"
                            )))
                            .onErrorResume(e -> Mono.empty())
                            .then();

                    return loanRepository.save(loan)
                            .flatMap(savedLoan -> repossessProductsMono
                                    .then(returnStockMono)
                                    .thenReturn(savedLoan));
                });
    }

    /**
     * Restructure (Refinance) an existing active loan into a new one.
     */
    @Transactional
    public Mono<Loan> restructureLoan(Long companyId, Long oldLoanId, int newNumberOfPeriods, String newInterestMethod, java.math.BigDecimal outstandingPrincipal, String restructuredBy) {
        return loanRepository.findByIdAndCompanyId(oldLoanId, companyId)
                .flatMap(oldLoan -> {
                    oldLoan.setStatus("RESTRUCTURED");
                    oldLoan.setClosedAt(Instant.now());
                    oldLoan.setUpdatedAt(Instant.now());
                    oldLoan.setUpdatedBy(restructuredBy);

                    Mono<Void> cancelSchedulesMono = loanScheduleRepository.findByLoanId(oldLoanId)
                            .filter(s -> !LoanStatus.COMPLETED.name().equals(s.getStatus()) && !"PAID".equals(s.getStatus()))
                            .flatMap(s -> {
                                s.setStatus("CANCELLED");
                                s.setUpdatedAt(Instant.now());
                                s.setUpdatedBy(restructuredBy);
                                return loanScheduleRepository.save(s);
                            })
                            .then();

                    Loan newLoan = new Loan();
                    newLoan.setCompanyId(companyId);
                    newLoan.setCustomerId(oldLoan.getCustomerId());
                    newLoan.setCurrency(oldLoan.getCurrency());
                    newLoan.setAssetPrice(oldLoan.getAssetPrice());
                    newLoan.setDeposit(java.math.BigDecimal.ZERO);
                    newLoan.setPrincipal(outstandingPrincipal);
                    newLoan.setNumberOfPeriods(newNumberOfPeriods);
                    newLoan.setInterestMethod(newInterestMethod);
                    newLoan.setInterestRateBps(oldLoan.getInterestRateBps());
                    newLoan.setTerm(oldLoan.getTerm());
                    newLoan.setParentLoanId(oldLoanId);
                    newLoan.setStartDate(java.time.LocalDate.now());
                    newLoan.setEndDate(calculateEndDate(java.time.LocalDate.now(), newNumberOfPeriods, oldLoan.getTerm()));
                    newLoan.setStatus(LoanStatus.PENDING.name());
                    newLoan.setCreatedAt(Instant.now());
                    newLoan.setCreatedBy(restructuredBy);
                    newLoan.setLoanKey(oldLoan.getLoanKey() + "-R");
                    newLoan.setTotalInterest(calculateTotalInterest(newLoan));

                    return cancelSchedulesMono
                            .then(loanRepository.save(oldLoan))
                            .then(loanRepository.save(newLoan));
                });
    }

    // ── Schedule helpers ─────────────────────────────────────────

    /**
     * Delegate schedule generation to the configured amortization strategy.
     */
    public List<LoanSchedule> generateSchedules(Loan loan) {
        var calculator = calculatorFactory.getCalculator(loan.getInterestMethod());
        return calculator.generateSchedules(loan);
    }

    /**
     * Pre-computes total interest across all periods of the loan schedule.
     */
    public java.math.BigDecimal calculateTotalInterest(Loan loan) {
        if (loan.getInterestMethod() == null) {
            loan.setInterestMethod(com.menglang.rumluos.common.enums.InterestMethod.EMI.name());
        }
        List<LoanSchedule> schedules = generateSchedules(loan);
        if (schedules == null || schedules.isEmpty()) {
            return java.math.BigDecimal.ZERO;
        }
        return schedules.stream()
                .map(LoanSchedule::getInterestDue)
                .filter(java.util.Objects::nonNull)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
    }

    /**
     * High-performance batch INSERT for amortization schedule rows.
     *
     * <p>Spring Data R2DBC's {@code saveAll()} executes one INSERT per row,
     * causing N network round-trips. This method builds a single multi-row
     * {@code INSERT … VALUES (…), (…), …} statement and binds all parameters
     * in one database call, dramatically reducing latency for long-term loans.
     *
     * @param schedules list of schedule rows (all must share the same loanId)
     */
    @Transactional
    public Mono<Void> saveSchedulesInBatch(List<LoanSchedule> schedules) {
        if (schedules == null || schedules.isEmpty()) {
            return Mono.empty();
        }

        StringBuilder sql = new StringBuilder(
                "INSERT INTO \"loan_schedules\" (" +
                "\"loan_id\", \"period_number\", \"due_date\", \"principal_due\", \"interest_due\", " +
                "\"principal_balance\", \"outstanding_balance\", \"status\", \"is_penalty\", \"created_at\", \"created_by\"" +
                ") VALUES "
        );


        for (int i = 0; i < schedules.size(); i++) {
            if (i > 0) sql.append(", ");
            sql.append(String.format(
                    "(:loanId%1$d, :period%1$d, :dueDate%1$d, :principalDue%1$d, " +
                    ":interestDue%1$d, :principalBalance%1$d, :outstandingBalance%1$d, " +
                    ":status%1$d, :isPenalty%1$d, NOW(), 'SYSTEM')",
                    i
            ));
        }

        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sql.toString());

        for (int i = 0; i < schedules.size(); i++) {
            LoanSchedule s = schedules.get(i);
            spec = spec
                    .bind("loanId"            + i, s.getLoanId())
                    .bind("period"            + i, s.getPeriodNumber())
                    .bind("dueDate"           + i, s.getDueDate())
                    .bind("principalDue"      + i, s.getPrincipalDue())
                    .bind("interestDue"       + i, s.getInterestDue())
                    .bind("principalBalance"  + i, s.getPrincipalBalance())
                    .bind("outstandingBalance"+ i, s.getOutstandingBalance())
                    .bind("status"            + i, s.getStatus())
                    .bind("isPenalty"         + i, s.isPenalty());
        }

        return spec.then();
    }

    private java.time.LocalDate calculateEndDate(java.time.LocalDate start, int periods, String termStr) {
        com.menglang.rumluos.common.enums.LoanTerm term = com.menglang.rumluos.common.enums.LoanTerm.parseTerm(termStr);
        switch (term) {
            case DAILY: return start.plusDays(periods);
            case WEEKLY: return start.plusWeeks(periods);
            case MONTHLY:
            default: return start.plusMonths(periods);
        }
    }
}
