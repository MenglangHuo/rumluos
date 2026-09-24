package com.menglang.rumluos.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3AsyncClient;
import software.amazon.awssdk.services.s3.S3AsyncClientBuilder;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import org.springframework.util.StringUtils;

import java.net.URI;

@Configuration
public class S3Config {

    @Value("${aws.s3.region:${aws.region:ap-southeast-1}}")
    private String region;

    @Value("${aws.s3.endpoint:#{null}}")
    private String endpoint;

    @Value("${aws.s3.path-style-access-enabled:false}")
    private boolean pathStyleAccessEnabled;

    @Bean
    public S3AsyncClient s3AsyncClient() {
        S3AsyncClientBuilder builder = S3AsyncClient.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create());

        if (StringUtils.hasText(endpoint)) {
            builder.endpointOverride(URI.create(endpoint));
        }

        if (pathStyleAccessEnabled) {
            builder.serviceConfiguration(S3Configuration.builder()
                    .pathStyleAccessEnabled(true)
                    .build());
        }

        return builder.build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        S3Presigner.Builder builder = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create());

        if (StringUtils.hasText(endpoint)) {
            builder.endpointOverride(URI.create(endpoint));
        }

        if (pathStyleAccessEnabled) {
            builder.serviceConfiguration(S3Configuration.builder()
                    .pathStyleAccessEnabled(true)
                    .build());
        }

        return builder.build();
    }
}
