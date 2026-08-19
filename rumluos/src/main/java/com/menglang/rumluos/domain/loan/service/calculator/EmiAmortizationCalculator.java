package com.menglang.rumluos.domain.loan.service.calculator;

import com.menglang.rumluos.domain.loan.entity.Loan;
import com.menglang.rumluos.domain.loan.entity.LoanSchedule;
import com.menglang.rumluos.common.enums.LoanTerm;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * EMI (Equated Monthly Installment) declining balance amortization calculator.
 */
@Component("EMI_CALCULATOR")
public class EmiAmortizationCalculator implements AmortizationCalculator {

    @Override
    public List<LoanSchedule> generateSchedules(Loan loan) {
        List<LoanSchedule> schedules = new ArrayList<>();
        BigDecimal principal = loan.getPrincipal();
        int n = calculatePeriods(loan);

        double annualRate = loan.getInterestRateBps() / 10000.0;
        double r;
        LoanTerm term = LoanTerm.parseTerm(loan.getTerm());

        switch (term) {
            case DAILY:
                r = annualRate / 365.0;
                break;
            case WEEKLY:
                r = annualRate / 52.0;
                break;
            case MONTHLY:
            default:
                r = annualRate / 12.0;
                break;
        }

        BigDecimal periodicRate = BigDecimal.valueOf(r);

        // Calculate EMI
        BigDecimal emi;
        if (r == 0) {
            emi = principal.divide(BigDecimal.valueOf(n), 4, RoundingMode.HALF_UP);
        } else {
            double emiDouble = principal.doubleValue() * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            emi = BigDecimal.valueOf(emiDouble).setScale(4, RoundingMode.HALF_UP);
        }

        BigDecimal remainingPrincipal = principal;

        for (int i = 1; i <= n; i++) {
            LoanSchedule schedule = new LoanSchedule();
            schedule.setLoanId(loan.getId());
            schedule.setPeriodNumber((short) i);

            LocalDate dueDate = calculateDueDate(loan.getStartDate(), i, loan.getTerm());
            schedule.setDueDate(dueDate);

            BigDecimal interestDue = remainingPrincipal.multiply(periodicRate).setScale(4, RoundingMode.HALF_UP);
            BigDecimal principalDue;
            BigDecimal outstandingBalance;

            if (i == n) {
                // Final period adjustment to clear exactly the remaining principal due to rounding errors
                principalDue = remainingPrincipal;
                outstandingBalance = BigDecimal.ZERO;
            } else {
                principalDue = emi.subtract(interestDue).setScale(4, RoundingMode.HALF_UP);
                outstandingBalance = remainingPrincipal.subtract(principalDue).setScale(4, RoundingMode.HALF_UP);
            }

            schedule.setPrincipalBalance(remainingPrincipal);
            schedule.setPrincipalDue(principalDue);
            schedule.setInterestDue(interestDue);
            schedule.setOutstandingBalance(outstandingBalance);
            schedule.setStatus(com.menglang.rumluos.common.enums.LoanStatus.PENDING.name());
            schedule.setPenalty(false);

            schedules.add(schedule);
            remainingPrincipal = outstandingBalance;
        }

        return schedules;
    }
}
