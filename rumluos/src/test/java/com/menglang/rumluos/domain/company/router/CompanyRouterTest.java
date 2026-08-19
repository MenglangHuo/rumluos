package com.menglang.rumluos.domain.company.router;

import com.menglang.rumluos.common.validation.RequestValidator;
import com.menglang.rumluos.domain.company.dto.CompanyDto;
import com.menglang.rumluos.domain.company.service.CompanyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyRouterTest {

    private WebTestClient webTestClient;

    @Mock
    private CompanyService companyService;

    @Mock
    private RequestValidator requestValidator;

    @InjectMocks
    private CompanyHandler companyHandler;

    @BeforeEach
    void setUp() {
        CompanyRouter companyRouter = new CompanyRouter();
        this.webTestClient = WebTestClient
                .bindToRouterFunction(companyRouter.companyRoutes(companyHandler))
                .build();
    }

    @Test
    void createCompany_Success() {
        // Arrange
        CompanyDto.CreateCompanyRequest request = new CompanyDto.CreateCompanyRequest(
                "Acme Corp", "contact@acme.com", null, null, null, "owner", "Password123!", true);
        
        CompanyDto.CompanyResponse response = new CompanyDto.CompanyResponse(
                1L, "Acme Corp", "contact@acme.com", null, null, null, true, true, null, null);

        // WebFlux body parsing calls validate
        // Since it returns void, we don't strictly need to mock it unless it throws

        when(companyService.create(any())).thenReturn(Mono.just(response));

        // Act & Assert
        webTestClient
                .post()
                .uri("/api/v1/companies")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.id").isEqualTo(1)
                .jsonPath("$.data.name").isEqualTo("Acme Corp");
    }
}
