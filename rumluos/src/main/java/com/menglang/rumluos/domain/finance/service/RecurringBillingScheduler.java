package com.menglang.rumluos.domain.finance.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled background cron job for automated recurring billing, invoice generation,
 * overdue loan tracking, and arrears calculations.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RecurringBillingScheduler {

    private final FinanceService financeService;

    /**
     * Runs daily at midnight (00:00:00).
     */
    @Scheduled(cron = "${app.billing.cron:0 0 0 * * *}")
    public void executeDailyBillingTasks() {
        log.info("Starting automated daily recurring billing & overdue scan...");

        // 1. Auto-generate invoices for loan schedules due within the next 7 days
        financeService.autoGenerateUpcomingInvoices(7)
                .doOnSuccess(count -> log.info("Automated billing completed: Generated {} invoices", count))
                .doOnError(err -> log.error("Error during automated invoice generation", err))
                .subscribe();

        // 2. Scan overdue loan schedules and update daysInArrears and Invoice status to OVERDUE
        financeService.scanAndUpdateOverdueSchedules()
                .doOnSuccess(count -> log.info("Overdue scan completed: Processed {} overdue schedules", count))
                .doOnError(err -> log.error("Error during overdue schedule scan", err))
                .subscribe();
    }
}
