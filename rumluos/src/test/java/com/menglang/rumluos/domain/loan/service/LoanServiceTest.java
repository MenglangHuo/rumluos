package com.menglang.rumluos.domain.loan.service;

import com.menglang.rumluos.domain.company.repository.CustomerRepository;
import com.menglang.rumluos.domain.loan.dto.LoanDto;
import com.menglang.rumluos.domain.loan.entity.Loan;
import com.menglang.rumluos.domain.loan.repository.LoanItemRepository;
import com.menglang.rumluos.domain.loan.repository.LoanRepository;
import com.menglang.rumluos.domain.loan.repository.LoanScheduleRepository;
import com.menglang.rumluos.domain.loan.service.calculator.*;
import com.menglang.rumluos.domain.product.repository.ProductRepository;
import com.menglang.rumluos.domain.finance.repository.InvoiceRepository;
import com.menglang.rumluos.domain.finance.service.FinanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.r2dbc.core.DatabaseClient;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class LoanServiceTest {

    private LoanRepository loanRepository;
    private LoanItemRepository loanItemRepository;
    private LoanScheduleRepository loanScheduleRepository;
    private CustomerRepository customerRepository;
    private ProductRepository productRepository;
    private DatabaseClient databaseClient;
    private LoanService loanService;

    @BeforeEach
    void setUp() {
        loanRepository = Mockito.mock(LoanRepository.class);
        loanItemRepository = Mockito.mock(LoanItemRepository.class);
        loanScheduleRepository = Mockito.mock(LoanScheduleRepository.class);
        customerRepository = Mockito.mock(CustomerRepository.class);
        productRepository = Mockito.mock(ProductRepository.class);
        databaseClient = Mockito.mock(DatabaseClient.class);

        InvoiceRepository invoiceRepository = Mockito.mock(InvoiceRepository.class);
        FinanceService financeService = Mockito.mock(FinanceService.class);
        com.menglang.rumluos.domain.inventory.service.InventoryService inventoryService = Mockito.mock(com.menglang.rumluos.domain.inventory.service.InventoryService.class);

        Map<String, AmortizationCalculator> calculators = new HashMap<>();
        calculators.put("EMI_CALCULATOR", new EmiAmortizationCalculator());
        calculators.put("FLAT_CALCULATOR", new FlatAmortizationCalculator());
        calculators.put("EQUAL_PRINCIPAL_CALCULATOR", new EqualPrincipalAmortizationCalculator());

        AmortizationCalculatorFactory factory = new AmortizationCalculatorFactory(calculators);
        loanService = new LoanService(loanRepository, loanItemRepository, loanScheduleRepository, customerRepository, productRepository, invoiceRepository, financeService, databaseClient, factory, inventoryService);
    }

    @Test
    void testCreateLoanWithUserPayload() {
        LoanDto.CreateRequest req = new LoanDto.CreateRequest();
        req.setLoanKey("LN-659320");
        req.setCustomerId(7L);
        req.setCurrency("USD");
        req.setAssetPrice(BigDecimal.valueOf(35000));
        req.setDeposit(BigDecimal.valueOf(15000));
        req.setPrincipal(BigDecimal.valueOf(20000));
        req.setTotalInterest(BigDecimal.valueOf(2149.56));
        req.setInterestRateBps((short) 1000);
        req.setInterestMethod("EMI");
        req.setTerm("24 MONTHLY");
        req.setNumberOfPeriods(24);
        req.setDescription("Asset Loan for product item");
        req.setNotes("Auto-originated via 1-Click Studio Wizard");

        Loan loanEntity = LoanDto.toEntity(req);
        assertNotNull(loanEntity.getTotalInterest());
        assertEquals(BigDecimal.valueOf(2149.56), loanEntity.getTotalInterest());

        when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> {
            Loan saved = invocation.getArgument(0);
            saved.setId(100L);
            return Mono.just(saved);
        });

        Loan result = loanService.createWithItems(1L, loanEntity, null).block();

        assertNotNull(result);
        assertNotNull(result.getTotalInterest(), "totalInterest must never be null when saving loan");
        assertEquals(BigDecimal.valueOf(2149.56), result.getTotalInterest());
        assertEquals("PENDING", result.getStatus());
        assertEquals("24 MONTHLY", result.getTerm());
    }

    @Test
    void testCreateLoanWithoutTotalInterestCalculatesFallback() {
        LoanDto.CreateRequest req = new LoanDto.CreateRequest();
        req.setLoanKey("LN-659321");
        req.setCustomerId(7L);
        req.setCurrency("USD");
        req.setPrincipal(BigDecimal.valueOf(20000));
        req.setInterestRateBps((short) 1000);
        req.setInterestMethod("DECLINING"); // alias for EMI
        req.setTerm("24 MONTHLY");
        req.setNumberOfPeriods(24);

        Loan loanEntity = LoanDto.toEntity(req);
        when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> {
            Loan saved = invocation.getArgument(0);
            saved.setId(101L);
            return Mono.just(saved);
        });

        Loan result = loanService.createWithItems(1L, loanEntity, null).block();

        assertNotNull(result);
        assertNotNull(result.getTotalInterest(), "totalInterest must be calculated when null");
        assertTrue(result.getTotalInterest().compareTo(BigDecimal.ZERO) > 0);
    }
}
