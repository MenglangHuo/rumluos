package com.menglang.rumluos.domain.loan.service.calculator;

import com.menglang.rumluos.domain.loan.entity.Loan;
import com.menglang.rumluos.domain.loan.entity.LoanSchedule;
import com.menglang.rumluos.common.enums.InterestMethod;
import com.menglang.rumluos.common.enums.LoanTerm;
import com.menglang.rumluos.domain.loan.service.calculator.EmiAmortizationCalculator;
import com.menglang.rumluos.domain.loan.service.calculator.EqualPrincipalAmortizationCalculator;
import com.menglang.rumluos.domain.loan.service.calculator.FlatAmortizationCalculator;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AmortizationStrategyTests {

    @Test
    void testEmiDecliningAmortization() {
        EmiAmortizationCalculator calculator = new EmiAmortizationCalculator();

        Loan loan = new Loan();
        loan.setId(1L);
        loan.setPrincipal(BigDecimal.valueOf(1200.00));
        loan.setInterestRateBps((short) 1200); // 12.00% annual
        loan.setTerm(LoanTerm.MONTHLY.name());
        loan.setStartDate(LocalDate.of(2026, 6, 1));
        loan.setEndDate(LocalDate.of(2027, 6, 1)); // 12 months

        List<LoanSchedule> schedules = calculator.generateSchedules(loan);

        assertEquals(12, schedules.size());

        BigDecimal principalSum = BigDecimal.ZERO;
        for (int i = 0; i < schedules.size(); i++) {
            LoanSchedule s = schedules.get(i);
            assertEquals(1L, s.getLoanId());
            assertEquals((short) (i + 1), s.getPeriodNumber());
            principalSum = principalSum.add(s.getPrincipalDue());

            // Outstanding balance should end at 0 on final period
            if (i == 11) {
                assertEquals(0, s.getOutstandingBalance().compareTo(BigDecimal.ZERO));
            }
        }

        // Sum of principals should match exactly 1200.00 (verifies rounding fix)
        assertEquals(BigDecimal.valueOf(1200.00).setScale(4, RoundingMode.HALF_UP), principalSum.setScale(4, RoundingMode.HALF_UP));

        // Verifies declining interest: first interest should be greater than the last interest
        assertTrue(schedules.get(0).getInterestDue().compareTo(schedules.get(11).getInterestDue()) > 0);
    }

    @Test
    void testFlatAmortization() {
        FlatAmortizationCalculator calculator = new FlatAmortizationCalculator();

        Loan loan = new Loan();
        loan.setId(2L);
        loan.setPrincipal(BigDecimal.valueOf(1200.00));
        loan.setInterestRateBps((short) 1200); // 12.00% annual
        loan.setTerm(LoanTerm.MONTHLY.name());
        loan.setStartDate(LocalDate.of(2026, 6, 1));
        loan.setEndDate(LocalDate.of(2027, 6, 1)); // 12 months

        List<LoanSchedule> schedules = calculator.generateSchedules(loan);

        assertEquals(12, schedules.size());

        BigDecimal principalSum = BigDecimal.ZERO;
        BigDecimal expectedInterest = BigDecimal.valueOf(12.00).setScale(4); // 1% of 1200 = 12

        for (int i = 0; i < schedules.size(); i++) {
            LoanSchedule s = schedules.get(i);
            principalSum = principalSum.add(s.getPrincipalDue());

            // Interest remains flat
            assertEquals(expectedInterest, s.getInterestDue().setScale(4));

            if (i == 11) {
                assertEquals(0, s.getOutstandingBalance().compareTo(BigDecimal.ZERO));
            }
        }

        assertEquals(BigDecimal.valueOf(1200.00).setScale(4), principalSum.setScale(4));
    }

    @Test
    void testEqualPrincipalAmortization() {
        EqualPrincipalAmortizationCalculator calculator = new EqualPrincipalAmortizationCalculator();

        Loan loan = new Loan();
        loan.setId(3L);
        loan.setPrincipal(BigDecimal.valueOf(1200.00));
        loan.setInterestRateBps((short) 1200); // 12.00% annual = 1% monthly
        loan.setTerm(LoanTerm.MONTHLY.name());
        loan.setStartDate(LocalDate.of(2026, 6, 1));
        loan.setEndDate(LocalDate.of(2027, 6, 1)); // 12 months

        List<LoanSchedule> schedules = calculator.generateSchedules(loan);

        assertEquals(12, schedules.size());

        BigDecimal principalSum = BigDecimal.ZERO;
        BigDecimal expectedPrincipal = BigDecimal.valueOf(100.00).setScale(4); // 1200 / 12 = 100

        for (int i = 0; i < schedules.size(); i++) {
            LoanSchedule s = schedules.get(i);
            principalSum = principalSum.add(s.getPrincipalDue());

            // Principal due is constant 100.00
            assertEquals(expectedPrincipal, s.getPrincipalDue().setScale(4));

            // Interest is 1% of remaining balance
            // Period 1: 1% of 1200 = 12.00
            if (i == 0) {
                assertEquals(BigDecimal.valueOf(12.00).setScale(4), s.getInterestDue().setScale(4));
            }
            // Period 2: 1% of 1100 = 11.00
            if (i == 1) {
                assertEquals(BigDecimal.valueOf(11.00).setScale(4), s.getInterestDue().setScale(4));
            }
            // Period 12: 1% of 100 = 1.00
            if (i == 11) {
                assertEquals(BigDecimal.valueOf(1.00).setScale(4), s.getInterestDue().setScale(4));
                assertEquals(0, s.getOutstandingBalance().compareTo(BigDecimal.ZERO));
            }
        }

        assertEquals(BigDecimal.valueOf(1200.00).setScale(4), principalSum.setScale(4));
    }
}
