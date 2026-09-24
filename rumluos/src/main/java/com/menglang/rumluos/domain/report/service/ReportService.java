package com.menglang.rumluos.domain.report.service;

import com.menglang.rumluos.common.cache.ReactiveCacheManager;
import com.menglang.rumluos.common.page.PageResponse;
import com.menglang.rumluos.domain.report.dto.*;
import com.menglang.rumluos.domain.report.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final ReactiveCacheManager cacheManager;

    /**
     * Dashboard Summary KPI with high-performance reactive caching.
     */
    public Mono<DashboardSummaryDto> getDashboardSummary(Long companyId, Long branchId) {
        String cacheKey = "report:dashboard:" + companyId + ":" + (branchId != null ? branchId : "all");
        return cacheManager.getOrLoad(cacheKey, () -> reportRepository.getDashboardSummary(companyId, branchId));
    }

    /**
     * Paginated loan portfolio report.
     */
    public Mono<PageResponse<LoanPortfolioRow>> getLoanPortfolio(Long companyId, Long branchId, String status, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = (size <= 0 || size > 100) ? 20 : size;
        int offset = safePage * safeSize;

        Mono<List<LoanPortfolioRow>> contentMono = reportRepository
                .getLoanPortfolio(companyId, branchId, status, safeSize, offset)
                .collectList();

        Mono<Long> totalMono = reportRepository.countLoanPortfolio(companyId, branchId, status);

        return Mono.zip(contentMono, totalMono)
                .map(tuple -> {
                    List<LoanPortfolioRow> content = tuple.getT1();
                    long totalElements = tuple.getT2();
                    int totalPages = (int) Math.ceil((double) totalElements / safeSize);

                    return PageResponse.<LoanPortfolioRow>builder()
                            .content(content)
                            .pageNumber(safePage)
                            .pageSize(safeSize)
                            .totalElements(totalElements)
                            .totalPages(totalPages)
                            .first(safePage == 0)
                            .last(safePage >= totalPages - 1)
                            .empty(content.isEmpty())
                            .build();
                });
    }

    /**
     * Collections report by date range.
     */
    public Flux<CollectionSummaryRow> getCollections(Long companyId, Long branchId, String paymentMethod, LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        return reportRepository.getCollections(companyId, branchId, paymentMethod, start, end);
    }

    /**
     * Overdue schedules / arrears report.
     */
    public Flux<OverdueScheduleRow> getOverdueSchedules(Long companyId, Long branchId) {
        return reportRepository.getOverdueSchedules(companyId, branchId);
    }

    /**
     * Loan disbursement report by date range.
     */
    public Flux<DisbursementRow> getDisbursements(Long companyId, Long branchId, LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        return reportRepository.getDisbursements(companyId, branchId, start, end);
    }

    /**
     * Income vs Expense financial category summary by date range.
     */
    public Flux<IncomeExpenseSummaryRow> getIncomeExpenseSummary(Long companyId, LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        return reportRepository.getIncomeExpenseSummary(companyId, start, end);
    }

    /**
     * Product inventory valuation report.
     */
    public Flux<InventoryValuationRow> getInventoryValuation(Long companyId, Long branchId) {
        return reportRepository.getInventoryValuation(companyId, branchId);
    }

    /**
     * Loan officer performance metrics.
     */
    public Flux<LoanOfficerPerformanceRow> getLoanOfficerPerformance(Long companyId, Long branchId) {
        return reportRepository.getLoanOfficerPerformance(companyId, branchId);
    }
}
