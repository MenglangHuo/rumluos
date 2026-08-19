package com.menglang.rumluos.domain.loan.service.calculator;

import com.menglang.rumluos.domain.loan.entity.Loan;
import com.menglang.rumluos.domain.loan.entity.LoanSchedule;
import com.menglang.rumluos.common.enums.LoanTerm;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Strategy interface for loan amortization schedule calculations.
 */
public interface AmortizationCalculator {

    /**
     * Generate the list of amortization period schedule rows for a given Loan.
     *
     * @param loan The loan configuration.
     * @return List of LoanSchedules.
     */
    List<LoanSchedule> generateSchedules(Loan loan);

    /**
     * Helper to compute the number of payment periods.
     */
    default int calculatePeriods(Loan loan) {
        if (loan.getNumberOfPeriods() != null && loan.getNumberOfPeriods() > 0) {
            return loan.getNumberOfPeriods();
        }
        LocalDate start = loan.getStartDate();
        LocalDate end = loan.getEndDate();
        String termStr = loan.getTerm();
        
        if (start == null || end == null || !start.isBefore(end)) {
            return 1;
        }
        LoanTerm term = LoanTerm.parseTerm(termStr);

        long periods;
        switch (term) {
            case DAILY:
                periods = ChronoUnit.DAYS.between(start, end);
                break;
            case WEEKLY:
                periods = ChronoUnit.WEEKS.between(start, end);
                break;
            case MONTHLY:
            default:
                periods = ChronoUnit.MONTHS.between(start, end);
                break;
        }
        return periods <= 0 ? 1 : (int) periods;
    }

    /**
     * Helper to calculate the due date for a specific period number.
     */
    default LocalDate calculateDueDate(LocalDate start, int periodNumber, String termStr) {
        LoanTerm term = LoanTerm.parseTerm(termStr);

        switch (term) {
            case DAILY:
                return start.plusDays(periodNumber);
            case WEEKLY:
                return start.plusWeeks(periodNumber);
            case MONTHLY:
            default:
                return start.plusMonths(periodNumber);
        }
    }
}
