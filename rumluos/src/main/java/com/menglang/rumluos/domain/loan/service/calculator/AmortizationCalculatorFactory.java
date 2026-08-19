package com.menglang.rumluos.domain.loan.service.calculator;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Factory class to dynamically resolve the appropriate interest amortization calculation strategy.
 */
@Component
public class AmortizationCalculatorFactory {

    private final Map<String, AmortizationCalculator> calculators;

    /**
     * Autowires all beans implementing {@link AmortizationCalculator}.
     * Spring maps the bean name (e.g. "EMI_CALCULATOR") as the map key.
     */
    public AmortizationCalculatorFactory(Map<String, AmortizationCalculator> calculators) {
        this.calculators = calculators;
    }

    /**
     * Resolves the calculator strategy matching the interest method.
     *
     * @param interestMethod String matching a value of {@link com.menglang.rumluos.common.enums.InterestMethod}.
     * @return AmortizationCalculator strategy.
     * @throws IllegalArgumentException if the method is unsupported.
     */
    public AmortizationCalculator getCalculator(String interestMethod) {
        if (interestMethod == null) {
            interestMethod = "EMI";
        }
        String normalized = interestMethod.toUpperCase().trim();
        if ("DECLINING".equals(normalized) || "COMPOUND".equals(normalized)) {
            normalized = "EMI";
        }
        String key = normalized + "_CALCULATOR";
        AmortizationCalculator calculator = calculators.get(key);
        if (calculator == null) {
            calculator = calculators.get("EMI_CALCULATOR");
        }
        if (calculator == null) {
            throw new IllegalArgumentException("Unsupported amortization interest method: " + interestMethod);
        }
        return calculator;
    }
}
