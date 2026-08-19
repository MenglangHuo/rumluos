package com.menglang.rumluos.domain.finance.dto;

import com.menglang.rumluos.domain.company.entity.Customer;
import com.menglang.rumluos.domain.finance.entity.Invoice;
import com.menglang.rumluos.domain.finance.entity.Payment;
import com.menglang.rumluos.domain.loan.entity.Loan;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Aggregate DTO for invoice details.
 * Contains invoice entity, connected loan entity, borrower customer, and payment history.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceDetailsDto {
    private Invoice invoice;
    private Loan loan;
    private Customer customer;
    private List<Payment> payments;
}
