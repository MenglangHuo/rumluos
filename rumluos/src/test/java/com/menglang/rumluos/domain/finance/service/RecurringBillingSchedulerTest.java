package com.menglang.rumluos.domain.finance.service;

import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;

import static org.mockito.Mockito.*;

class RecurringBillingSchedulerTest {

    @Test
    void testExecuteDailyBillingTasks() {
        FinanceService mockFinanceService = mock(FinanceService.class);
        when(mockFinanceService.autoGenerateUpcomingInvoices(7)).thenReturn(Mono.just(2L));
        when(mockFinanceService.scanAndUpdateOverdueSchedules()).thenReturn(Mono.just(1L));

        RecurringBillingScheduler scheduler = new RecurringBillingScheduler(mockFinanceService);
        scheduler.executeDailyBillingTasks();

        verify(mockFinanceService, times(1)).autoGenerateUpcomingInvoices(7);
        verify(mockFinanceService, times(1)).scanAndUpdateOverdueSchedules();
    }
}
