package com.menglang.rumluos.domain.finance.service;

import com.menglang.rumluos.common.enums.InvoiceStatus;
import com.menglang.rumluos.common.enums.LoanStatus;
import com.menglang.rumluos.common.enums.PaymentStatus;
import com.menglang.rumluos.common.enums.ProductStatus;
import com.menglang.rumluos.domain.finance.dto.LoanPaymentRequestDto;
import com.menglang.rumluos.domain.finance.entity.Invoice;
import com.menglang.rumluos.domain.finance.entity.Payment;
import com.menglang.rumluos.domain.finance.repository.InvoiceRepository;
import com.menglang.rumluos.domain.finance.repository.PaymentRepository;
import com.menglang.rumluos.domain.loan.entity.Loan;
import com.menglang.rumluos.domain.loan.entity.LoanSchedule;
import com.menglang.rumluos.domain.loan.repository.LoanItemRepository;
import com.menglang.rumluos.domain.loan.repository.LoanRepository;
import com.menglang.rumluos.domain.loan.repository.LoanScheduleRepository;
import com.menglang.rumluos.domain.product.repository.ProductRepository;
import com.menglang.rumluos.domain.company.entity.Customer;
import com.menglang.rumluos.domain.company.repository.CustomerRepository;
import com.menglang.rumluos.domain.finance.dto.InvoiceDetailsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import org.springframework.r2dbc.core.DatabaseClient;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FinanceService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final LoanRepository loanRepository;
    private final LoanScheduleRepository loanScheduleRepository;
    private final LoanItemRepository loanItemRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final DatabaseClient databaseClient;

    public Mono<String> generateInvoiceNo() {
        String dateStr = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyMMdd"));
        return databaseClient.sql("SELECT nextval('invoice_seq')")
                .map((row, metadata) -> {
                    Long seq = row.get(0, Long.class);
                    long num = (seq != null) ? (seq % 10000) : 1;
                    return String.format("INV-%s-%04d", dateStr, num);
                })
                .one()
                .onErrorReturn(String.format("INV-%s-%04d", dateStr, (System.currentTimeMillis() % 9000) + 1000));
    }

    public Mono<String> generatePaymentRef() {
        String dateStr = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyMMdd"));
        return databaseClient.sql("SELECT nextval('payment_seq')")
                .map((row, metadata) -> {
                    Long seq = row.get(0, Long.class);
                    long num = (seq != null) ? (seq % 10000) : 1;
                    return String.format("PAY-%s-%04d", dateStr, num);
                })
                .one()
                .onErrorReturn(String.format("PAY-%s-%04d", dateStr, (System.currentTimeMillis() % 9000) + 1000));
    }

    /**
     * Generates a billing Invoice for a specific loan schedule period.
     */
    @Transactional
    public Mono<Invoice> generateInvoiceForSchedule(Long companyId, Long loanId, Long scheduleId, String generatedBy) {
        return loanRepository.findByIdAndCompanyId(loanId, companyId)
                .zipWith(loanScheduleRepository.findById(scheduleId))
                .zipWith(generateInvoiceNo())
                .flatMap(tuple -> {
                    Loan loan = tuple.getT1().getT1();
                    LoanSchedule schedule = tuple.getT1().getT2();
                    String invoiceNo = tuple.getT2();

                    if (!schedule.getLoanId().equals(loan.getId())) {
                        return Mono.error(new IllegalArgumentException("Schedule does not belong to the loan"));
                    }

                    Invoice invoice = new Invoice();
                    invoice.setCompanyId(companyId);
                    invoice.setInvoiceNo(invoiceNo);
                    invoice.setCustomerId(loan.getCustomerId());
                    invoice.setLoanId(loan.getId());
                    invoice.setLoanScheduleId(schedule.getId());
                    
                    BigDecimal subtotal = schedule.getTotalDue();
                    invoice.setSubtotal(subtotal);
                    invoice.setTotalAmount(subtotal);
                    invoice.setCurrency(loan.getCurrency());
                    invoice.setStatus(InvoiceStatus.SENT.name());
                    invoice.setDueDate(schedule.getDueDate());
                    invoice.setDescription("Billing for Loan Period " + schedule.getPeriodNumber());
                    
                    invoice.setIssuedAt(Instant.now());
                    invoice.setCreatedAt(Instant.now());
                    invoice.setCreatedBy(generatedBy);

                    return invoiceRepository.save(invoice);
                });
    }

    /**
     * Processes a payment (full or partial) against a loan schedule and its invoice.
     */
    @Transactional
    public Mono<Payment> processLoanPayment(Long companyId, LoanPaymentRequestDto request, String processedBy) {
        if (request.getAmountPaid() == null || request.getAmountPaid().compareTo(BigDecimal.ZERO) <= 0) {
            return Mono.error(new IllegalArgumentException("Payment amount must be greater than zero"));
        }

        return loanScheduleRepository.findById(request.getLoanScheduleId())
                .flatMap(schedule -> {
                    BigDecimal totalDue = schedule.getTotalDue();
                    BigDecimal alreadyPaid = schedule.getPaidAmount() != null ? schedule.getPaidAmount() : BigDecimal.ZERO;

                    if (PaymentStatus.COMPLETED.name().equals(schedule.getStatus()) || "PAID".equals(schedule.getStatus()) || alreadyPaid.compareTo(totalDue) >= 0) {
                        return Mono.error(new IllegalStateException("Schedule period is already fully paid"));
                    }

                    BigDecimal newCumulativePaid = alreadyPaid.add(request.getAmountPaid());
                    boolean isFullyPaid = newCumulativePaid.compareTo(totalDue) >= 0;

                    return loanRepository.findByIdAndCompanyId(schedule.getLoanId(), companyId)
                            .zipWith(invoiceRepository.findByLoanScheduleIdAndCompanyId(schedule.getId(), companyId)
                                    .defaultIfEmpty(new Invoice())) // if no invoice was generated prior
                            .flatMap(tuple -> {
                                Loan loan = tuple.getT1();
                                Invoice invoice = tuple.getT2();

                                // 1. Update Schedule
                                schedule.setPaidAmount(newCumulativePaid);
                                schedule.setPaidAt(Instant.now());
                                schedule.setStatus(isFullyPaid ? "PAID" : "PARTIALLY_PAID");
                                schedule.setUpdatedAt(Instant.now());
                                schedule.setUpdatedBy(processedBy);

                                // 2. Update Invoice if it exists
                                final Mono<Invoice> finalInvoiceMono;
                                if (invoice.getId() != null) {
                                    invoice.setStatus(isFullyPaid ? InvoiceStatus.PAID.name() : InvoiceStatus.PARTIALLY_PAID.name());
                                    if (isFullyPaid) {
                                        invoice.setPaidAt(Instant.now());
                                    }
                                    invoice.setUpdatedAt(Instant.now());
                                    invoice.setUpdatedBy(processedBy);
                                    finalInvoiceMono = invoiceRepository.save(invoice);
                                } else {
                                    finalInvoiceMono = Mono.empty();
                                }

                                return generatePaymentRef().flatMap(paymentRef -> {
                                    // 3. Create Payment
                                    Payment payment = new Payment();
                                    payment.setCompanyId(companyId);
                                    payment.setPaymentRef(paymentRef);
                                    payment.setInvoiceId(invoice.getId());
                                    payment.setLoanScheduleId(schedule.getId());
                                    payment.setPaymentCurrency(request.getPaymentCurrency() != null ? request.getPaymentCurrency() : loan.getCurrency());
                                    payment.setAmountPaid(request.getAmountPaid());
                                    payment.setAmountInBaseCurrency(request.getAmountPaid()); // Assume 1:1 for now
                                    payment.setPaymentMethod(request.getPaymentMethod());
                                    payment.setPaymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : java.time.LocalDate.now());
                                    payment.setStatus(PaymentStatus.COMPLETED.name());
                                    payment.setCustomerId(loan.getCustomerId());
                                    payment.setNotes(request.getNotes() != null ? request.getNotes() : (isFullyPaid ? "Full payment completed" : "Partial payment recorded"));
                                    payment.setReceiptUrl(request.getReceiptUrl());
                                    payment.setCreatedAt(Instant.now());
                                    payment.setCreatedBy(processedBy);

                                    // 4. Check if Loan should be COMPLETED
                                    // ── Auto-complete loan if all schedules are paid ──
                                    Mono<Void> checkLoanCompletion = loanScheduleRepository.findByLoanId(loan.getId())
                                            .filter(s -> !"PAID".equals(s.getStatus()) && !LoanStatus.COMPLETED.name().equals(s.getStatus()) && !s.getId().equals(schedule.getId()))
                                            .count()
                                            .flatMap(unpaidCount -> {
                                                if (isFullyPaid && unpaidCount == 0) {
                                                    loan.setStatus(LoanStatus.COMPLETED.name());
                                                    loan.setClosedAt(Instant.now());
                                                    loan.setUpdatedAt(Instant.now());
                                                    loan.setUpdatedBy(processedBy);

                                                    // ── Mark all loan products as SOLD ──
                                                    Mono<Void> markProductsSold = loanItemRepository.findByLoanId(loan.getId())
                                                            .filter(item -> item.getProductId() != null)
                                                            .flatMap(item -> productRepository.findByIdAndCompanyId(item.getProductId(), loan.getCompanyId())
                                                                    .flatMap(product -> {
                                                                        product.setStatus(ProductStatus.SOLD.name());
                                                                        product.setUpdatedAt(Instant.now());
                                                                        product.setUpdatedBy(processedBy);
                                                                        return productRepository.save(product);
                                                                    })
                                                            )
                                                            .then();

                                                    return loanRepository.save(loan)
                                                            .then(markProductsSold);
                                                }
                                                return Mono.empty();
                                            });

                                    return loanScheduleRepository.save(schedule)
                                            .then(finalInvoiceMono)
                                            .then(paymentRepository.save(payment))
                                            .flatMap(savedPayment -> checkLoanCompletion.thenReturn(savedPayment));
                                });
                            });
                });
    }

    /**
     * Auto-generates billing Invoices for upcoming active loan schedule periods due within daysInAdvance days.
     */
    @Transactional
    public Mono<Long> autoGenerateUpcomingInvoices(int daysInAdvance) {
        java.time.LocalDate cutoffDate = java.time.LocalDate.now().plusDays(daysInAdvance);
        return loanScheduleRepository.findUpcomingSchedulesWithoutInvoice(cutoffDate)
                .flatMap(schedule -> loanRepository.findById(schedule.getLoanId())
                        .flatMap(loan -> {
                            BigDecimal alreadyPaid = schedule.getPaidAmount() != null ? schedule.getPaidAmount() : BigDecimal.ZERO;
                            BigDecimal remainingDue = schedule.getTotalDue().subtract(alreadyPaid);

                            Invoice invoice = new Invoice();
                            invoice.setCompanyId(loan.getCompanyId());
                            invoice.setInvoiceNo("INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                            invoice.setCustomerId(loan.getCustomerId());
                            invoice.setLoanId(loan.getId());
                            invoice.setLoanScheduleId(schedule.getId());
                            invoice.setSubtotal(remainingDue);
                            invoice.setTotalAmount(remainingDue);
                            invoice.setCurrency(loan.getCurrency());
                            invoice.setStatus(InvoiceStatus.SENT.name());
                            invoice.setDueDate(schedule.getDueDate());
                            invoice.setDescription("Automated Billing for Loan Period " + schedule.getPeriodNumber());
                            invoice.setIssuedAt(Instant.now());
                            invoice.setCreatedAt(Instant.now());
                            invoice.setCreatedBy("CRON_SYSTEM");

                            return invoiceRepository.save(invoice);
                        })
                )
                .count();
    }

    /**
     * Scans for unpaid schedules past their due date, updating loan daysInArrears and setting invoice status to OVERDUE.
     */
    @Transactional
    public Mono<Long> scanAndUpdateOverdueSchedules() {
        java.time.LocalDate today = java.time.LocalDate.now();
        return loanScheduleRepository.findUnpaidSchedulesPastDueDate(today)
                .flatMap(schedule -> loanRepository.findById(schedule.getLoanId())
                        .flatMap(loan -> {
                            long overdueDays = java.time.temporal.ChronoUnit.DAYS.between(schedule.getDueDate(), today);
                            if (overdueDays > 0 && (loan.getDaysInArrears() == null || loan.getDaysInArrears() < overdueDays)) {
                                loan.setDaysInArrears((int) overdueDays);
                                loan.setUpdatedAt(Instant.now());
                                loan.setUpdatedBy("CRON_SYSTEM");
                            }

                            Mono<Invoice> invoiceMono = invoiceRepository.findByLoanScheduleId(schedule.getId())
                                    .flatMap(inv -> {
                                        if (!InvoiceStatus.OVERDUE.name().equals(inv.getStatus()) && !InvoiceStatus.PAID.name().equals(inv.getStatus())) {
                                            inv.setStatus(InvoiceStatus.OVERDUE.name());
                                            inv.setUpdatedAt(Instant.now());
                                            inv.setUpdatedBy("CRON_SYSTEM");
                                            return invoiceRepository.save(inv);
                                        }
                                        return Mono.just(inv);
                                    });

                            return loanRepository.save(loan).then(invoiceMono);
                        })
                )
                .count();
    }

    public Flux<Invoice> searchInvoices(Long companyId, String query, Long customerId, String status) {
        if (query != null && !query.isBlank()) {
            return invoiceRepository.searchByQuery(companyId, query.trim());
        }
        if (customerId != null) {
            return invoiceRepository.findByCustomerIdAndCompanyId(customerId, companyId);
        }
        if (status != null && !status.isBlank()) {
            return invoiceRepository.findByStatusAndCompanyId(status.trim(), companyId);
        }
        return invoiceRepository.findAllByCompanyId(companyId);
    }

    public Flux<Payment> searchPayments(Long companyId, String query, Long customerId) {
        if (query != null && !query.isBlank()) {
            return paymentRepository.searchByQuery(companyId, query.trim());
        }
        if (customerId != null) {
            return paymentRepository.findByCustomerIdAndCompanyId(customerId, companyId);
        }
        return paymentRepository.findAllByCompanyId(companyId);
    }

    public Mono<InvoiceDetailsDto> getInvoiceDetails(Long companyId, Long invoiceId) {
        return invoiceRepository.findByIdAndCompanyId(invoiceId, companyId)
                .flatMap(invoice -> {
                    var loanMono = invoice.getLoanId() != null
                            ? loanRepository.findByIdAndCompanyId(invoice.getLoanId(), companyId).defaultIfEmpty(new Loan())
                            : Mono.just(new Loan());
                    var customerMono = invoice.getCustomerId() != null
                            ? customerRepository.findByIdAndCompanyId(invoice.getCustomerId(), companyId).defaultIfEmpty(new Customer())
                            : Mono.just(new Customer());
                    var paymentsMono = paymentRepository.findByInvoiceIdAndCompanyId(invoice.getId(), companyId).collectList();

                    return Mono.zip(loanMono, customerMono, paymentsMono)
                            .map(tuple -> new InvoiceDetailsDto(invoice, tuple.getT1(), tuple.getT2(), tuple.getT3()));
                });
    }
}
