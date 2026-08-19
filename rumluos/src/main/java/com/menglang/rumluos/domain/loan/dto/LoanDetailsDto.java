package com.menglang.rumluos.domain.loan.dto;

import com.menglang.rumluos.domain.company.entity.Customer;
import com.menglang.rumluos.domain.loan.entity.Loan;
import com.menglang.rumluos.domain.loan.entity.LoanItem;
import com.menglang.rumluos.domain.loan.entity.LoanSchedule;
import com.menglang.rumluos.domain.finance.entity.Invoice;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * High-performance aggregate DTO for loan details.
 * Packages the loan, borrower (customer), line items, schedule records, connected invoices, and restructuring links.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanDetailsDto {
    private Loan loan;
    private Customer customer;
    private List<LoanItem> items;
    private List<LoanSchedule> schedules;
    private List<Invoice> invoices;
    private Loan restructuredToLoan;
    private Loan parentLoan;

    public LoanDetailsDto(Loan loan, Customer customer, List<LoanItem> items, List<LoanSchedule> schedules) {
        this.loan = loan;
        this.customer = customer;
        this.items = items;
        this.schedules = schedules;
    }
}
