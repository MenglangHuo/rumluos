package com.menglang.rumluos.domain.report;

import com.menglang.rumluos.common.cache.ReactiveCacheManager;
import com.menglang.rumluos.common.page.PageResponse;
import com.menglang.rumluos.domain.report.dto.*;
import com.menglang.rumluos.domain.report.repository.ReportRepository;
import com.menglang.rumluos.domain.report.service.ReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

class ReportServiceTest {

    private ReportRepository reportRepository;
    private ReactiveCacheManager cacheManager;
    private ReportService reportService;

    @BeforeEach
    void setUp() {
        reportRepository = Mockito.mock(ReportRepository.class);
        cacheManager = new ReactiveCacheManager(); // real in-memory cache
        reportService = new ReportService(reportRepository, cacheManager);
    }

    @Test
    void testGetDashboardSummary_ReturnsDataAndCaches() {
        DashboardSummaryDto dto = DashboardSummaryDto.builder()
                .totalLoans(100)
                .activeLoans(70)
                .completedLoans(25)
                .defaultedLoans(5)
                .overdueLoans(8)
                .totalDisbursed(BigDecimal.valueOf(500000))
                .totalOutstanding(BigDecimal.valueOf(320000))
                .totalCollected(BigDecimal.valueOf(180000))
                .totalOverdueAmount(BigDecimal.valueOf(15000))
                .totalCustomers(85)
                .totalProducts(120)
                .build();

        when(reportRepository.getDashboardSummary(1L, null)).thenReturn(Mono.just(dto));

        // First call loads from repository
        StepVerifier.create(reportService.getDashboardSummary(1L, null))
                .expectNextMatches(res -> res.getTotalLoans() == 100 && res.getActiveLoans() == 70)
                .verifyComplete();

        // Second call should come from cache even if repository throws or is verified
        StepVerifier.create(reportService.getDashboardSummary(1L, null))
                .expectNextMatches(res -> res.getTotalOutstanding().compareTo(BigDecimal.valueOf(320000)) == 0)
                .verifyComplete();

        Mockito.verify(reportRepository, Mockito.times(1)).getDashboardSummary(1L, null);
    }

    @Test
    void testGetLoanPortfolio_PaginationCalculation() {
        LoanPortfolioRow row = LoanPortfolioRow.builder()
                .loanId(1L)
                .loanKey("LN-2024-001")
                .customerName("John Doe")
                .principal(BigDecimal.valueOf(5000))
                .status("ACTIVE")
                .build();

        when(reportRepository.getLoanPortfolio(eq(1L), isNull(), isNull(), eq(20), eq(0)))
                .thenReturn(Flux.just(row));
        when(reportRepository.countLoanPortfolio(eq(1L), isNull(), isNull()))
                .thenReturn(Mono.just(45L));

        StepVerifier.create(reportService.getLoanPortfolio(1L, null, null, 0, 20))
                .expectNextMatches(page -> {
                    assertEquals(45L, page.getTotalElements());
                    assertEquals(3, page.getTotalPages());
                    assertEquals(0, page.getPageNumber());
                    assertEquals(20, page.getPageSize());
                    assertTrue(page.isFirst());
                    assertFalse(page.isLast());
                    assertEquals(1, page.getContent().size());
                    assertEquals("LN-2024-001", page.getContent().get(0).getLoanKey());
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testGetCollections_DefaultDateRange() {
        CollectionSummaryRow row = CollectionSummaryRow.builder()
                .paymentId(10L)
                .paymentRef("PAY-001")
                .amountPaid(BigDecimal.valueOf(1000))
                .paymentMethod("ABA")
                .build();

        when(reportRepository.getCollections(eq(1L), isNull(), isNull(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Flux.just(row));

        StepVerifier.create(reportService.getCollections(1L, null, null, null, null))
                .expectNextMatches(r -> r.getPaymentRef().equals("PAY-001") && r.getAmountPaid().compareTo(BigDecimal.valueOf(1000)) == 0)
                .verifyComplete();
    }

    @Test
    void testGetOverdueSchedules() {
        OverdueScheduleRow row = OverdueScheduleRow.builder()
                .scheduleId(5L)
                .loanKey("LN-100")
                .customerName("Jane Doe")
                .daysOverdue(15)
                .remainingDue(BigDecimal.valueOf(250))
                .build();

        when(reportRepository.getOverdueSchedules(1L, null)).thenReturn(Flux.just(row));

        StepVerifier.create(reportService.getOverdueSchedules(1L, null))
                .expectNextMatches(r -> r.getDaysOverdue() == 15 && r.getCustomerName().equals("Jane Doe"))
                .verifyComplete();
    }

    @Test
    void testGetDisbursements() {
        DisbursementRow row = DisbursementRow.builder()
                .loanId(2L)
                .loanKey("LN-002")
                .principal(BigDecimal.valueOf(10000))
                .currency("USD")
                .build();

        when(reportRepository.getDisbursements(eq(1L), isNull(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Flux.just(row));

        StepVerifier.create(reportService.getDisbursements(1L, null, null, null))
                .expectNextMatches(r -> r.getPrincipal().compareTo(BigDecimal.valueOf(10000)) == 0)
                .verifyComplete();
    }

    @Test
    void testGetIncomeExpenseSummary() {
        IncomeExpenseSummaryRow row = IncomeExpenseSummaryRow.builder()
                .categoryId(3L)
                .categoryTitle("Interest Income")
                .entryType("INCOME")
                .totalAmount(BigDecimal.valueOf(25000))
                .transactionCount(50)
                .build();

        when(reportRepository.getIncomeExpenseSummary(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Flux.just(row));

        StepVerifier.create(reportService.getIncomeExpenseSummary(1L, null, null))
                .expectNextMatches(r -> r.getEntryType().equals("INCOME") && r.getTransactionCount() == 50)
                .verifyComplete();
    }

    @Test
    void testGetInventoryValuation() {
        InventoryValuationRow row = InventoryValuationRow.builder()
                .productId(7L)
                .productName("Honda Dream")
                .quantityAvailable(5)
                .estimatedValue(BigDecimal.valueOf(12500))
                .build();

        when(reportRepository.getInventoryValuation(1L, null)).thenReturn(Flux.just(row));

        StepVerifier.create(reportService.getInventoryValuation(1L, null))
                .expectNextMatches(r -> r.getQuantityAvailable() == 5 && r.getProductName().equals("Honda Dream"))
                .verifyComplete();
    }

    @Test
    void testGetLoanOfficerPerformance() {
        LoanOfficerPerformanceRow row = LoanOfficerPerformanceRow.builder()
                .officerId(4L)
                .officerName("Officer Alice")
                .totalLoans(20)
                .totalDisbursed(BigDecimal.valueOf(100000))
                .build();

        when(reportRepository.getLoanOfficerPerformance(1L, null)).thenReturn(Flux.just(row));

        StepVerifier.create(reportService.getLoanOfficerPerformance(1L, null))
                .expectNextMatches(r -> r.getOfficerName().equals("Officer Alice") && r.getTotalLoans() == 20)
                .verifyComplete();
    }
}
