package com.menglang.rumluos.configs;

import com.menglang.rumluos.domain.auth.entity.SystemAdmin;
import com.menglang.rumluos.domain.auth.repository.SystemAdminRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer {

    private final SystemAdminRepository systemAdminRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.r2dbc.core.DatabaseClient databaseClient;

    @EventListener(ApplicationReadyEvent.class)
    public void seedInitialData() {
        String seedCurrenciesSql = """
            INSERT INTO currencies (code, name, symbol, decimal_places, is_active)
            VALUES 
                ('USD', 'US Dollar', '$', 2, TRUE),
                ('KHR', 'Cambodian Riel', '៛', 0, TRUE),
                ('EUR', 'Euro', '€', 2, TRUE),
                ('THB', 'Thai Baht', '฿', 2, TRUE)
            ON CONFLICT (code) DO NOTHING
        """;

        databaseClient.sql(seedCurrenciesSql)
                .fetch()
                .rowsUpdated()
                .doOnSuccess(rows -> log.info("Seeded default currencies (USD, KHR, EUR, THB)"))
                .doOnError(err -> log.warn("Currency seeding failed: {}", err.getMessage()))
                .then(systemAdminRepository.count())
                .flatMap(count -> {
                    if (count == 0) {
                        log.info("No system admins found. Seeding initial System Admin...");
                        SystemAdmin admin = new SystemAdmin();
                        admin.setUsername("menglang");
                        admin.setEmail("menglang@example.com");
                        admin.setPasswordHash(passwordEncoder.encode("Menglang@dmin!"));
                        admin.setFirstName("Menglang");
                        admin.setLastName("Admin");
                        admin.setActive(true);
                        return systemAdminRepository.save(admin)
                                .doOnSuccess(saved -> log.info("Initial System Admin seeded successfully."));
                    }
                    return Mono.empty();
                })
                .subscribe();
    }
}
