package com.menglang.rumluos.domain.loan.service.calculator;

import com.menglang.rumluos.domain.loan.entity.LoanSchedule;
import com.menglang.rumluos.common.enums.LoanStatus;
import com.menglang.rumluos.common.cache.ReactiveCacheManager;
import com.menglang.rumluos.domain.loan.service.LoanService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.r2dbc.core.DatabaseClient;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LoanPerformanceTests {

    @Test
    void testReactiveCacheManager() {
        ReactiveCacheManager cacheManager = new ReactiveCacheManager();
        String key = "testKey";
        String val = "testVal";

        // Cache miss, should fetch from supplier
        Mono<String> valMono = cacheManager.getOrLoad(key, () -> Mono.just(val));
        StepVerifier.create(valMono)
                .expectNext(val)
                .verifyComplete();

        // Cache hit, should fetch cached val without hitting DB/error supplier
        Mono<String> cacheHitMono = cacheManager.getOrLoad(key, () -> Mono.error(new RuntimeException("DB should not be hit")));
        StepVerifier.create(cacheHitMono)
                .expectNext(val)
                .verifyComplete();

        // Evict key
        cacheManager.evict(key);

        // Cache miss again, should hit provider
        Mono<String> afterEvictMono = cacheManager.getOrLoad(key, () -> Mono.just("newValue"));
        StepVerifier.create(afterEvictMono)
                .expectNext("newValue")
                .verifyComplete();
    }

    @Test
    void testBatchInsertSqlGeneration() {
        DatabaseClient mockClient = mock(DatabaseClient.class);
        DatabaseClient.GenericExecuteSpec mockSpec = mock(DatabaseClient.GenericExecuteSpec.class);

        // Capture SQL statement passed to sql()
        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        when(mockClient.sql(sqlCaptor.capture())).thenReturn(mockSpec);

        // Mock chain binding calls
        when(mockSpec.bind(anyString(), any())).thenReturn(mockSpec);
        when(mockSpec.then()).thenReturn(Mono.empty());

        LoanService loanService = new LoanService(
                mock(com.menglang.rumluos.domain.loan.repository.LoanRepository.class),
                mock(com.menglang.rumluos.domain.loan.repository.LoanItemRepository.class),
                mock(com.menglang.rumluos.domain.loan.repository.LoanScheduleRepository.class),
                mock(com.menglang.rumluos.domain.company.repository.CustomerRepository.class),
                mock(com.menglang.rumluos.domain.product.repository.ProductRepository.class),
                mock(com.menglang.rumluos.domain.finance.repository.InvoiceRepository.class),
                mock(com.menglang.rumluos.domain.finance.service.FinanceService.class),
                mockClient,
                mock(com.menglang.rumluos.domain.loan.service.calculator.AmortizationCalculatorFactory.class)
        );

        List<LoanSchedule> schedules = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            LoanSchedule s = new LoanSchedule();
            s.setLoanId(10L);
            s.setPeriodNumber((short) (i + 1));
            s.setDueDate(LocalDate.now().plusMonths(i));
            s.setPrincipalDue(BigDecimal.valueOf(100));
            s.setInterestDue(BigDecimal.valueOf(5));
            s.setPrincipalBalance(BigDecimal.valueOf(1000));
            s.setOutstandingBalance(BigDecimal.valueOf(900));
            s.setStatus(LoanStatus.PENDING.name());
            s.setPenalty(false);
            schedules.add(s);
        }

        Mono<Void> result = loanService.saveSchedulesInBatch(schedules);

        StepVerifier.create(result)
                .verifyComplete();

        String generatedSql = sqlCaptor.getValue();
        assertNotNull(generatedSql);
        assertTrue(generatedSql.contains("INSERT INTO \"loan_schedules\""));
        assertTrue(generatedSql.contains("(:loanId0, :period0, :dueDate0, :principalDue0, :interestDue0, :principalBalance0, :outstandingBalance0, :status0, :isPenalty0, NOW(), 'SYSTEM')"));
        assertTrue(generatedSql.contains("(:loanId2, :period2, :dueDate2, :principalDue2, :interestDue2, :principalBalance2, :outstandingBalance2, :status2, :isPenalty2, NOW(), 'SYSTEM')"));


        // Verify bind was called correct number of times (3 schedules * 9 bindings = 27 times)
        verify(mockSpec, times(27)).bind(anyString(), any());
    }
}
