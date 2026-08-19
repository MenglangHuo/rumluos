package com.menglang.rumluos.domain.storage.service;

import com.menglang.rumluos.common.utils.SecurityUtils;
import com.menglang.rumluos.domain.storage.dto.StorageDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3StorageServiceImpl implements StorageService {

    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.s3.public-bucket-name:}")
    private String publicBucketName;

    @Value("${aws.s3.region:us-east-1}")
    private String region;

    @Value("${aws.s3.presigned-url-expiration-minutes:15}")
    private long presignedUrlExpirationMinutes;

    @jakarta.annotation.PostConstruct
    public void sanitizeBucketName() {
        if (bucketName != null && bucketName.startsWith("arn:aws:s3:::")) {
            bucketName = bucketName.substring("arn:aws:s3:::".length());
        }
        if (publicBucketName != null && publicBucketName.startsWith("arn:aws:s3:::")) {
            publicBucketName = publicBucketName.substring("arn:aws:s3:::".length());
        }
        log.info("Sanitized S3 Bucket Config -> Private Bucket: {}, Public Bucket: {}", bucketName, getEffectivePublicBucket());
    }

    private String getEffectivePublicBucket() {
        return (publicBucketName != null && !publicBucketName.isBlank()) ? publicBucketName : bucketName;
    }

    private Duration getExpirationDuration() {
        return Duration.ofMinutes(presignedUrlExpirationMinutes > 0 ? presignedUrlExpirationMinutes : 15);
    }

    @Override
    public Mono<StorageDto.PresignedUrlResponse> generateUploadUrl(StorageDto.GenerateUploadUrlRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> SecurityUtils.getCurrentUserId()
                        .map(userId -> {
                            boolean isPublic = Boolean.TRUE.equals(request.getIsPublic());
                            String folder = request.getFolder() != null ? request.getFolder().trim() : "";
                            
                            if (folder.startsWith("public")) {
                                isPublic = true;
                            }

                            String extension = "";
                            if (request.getFileName() != null && request.getFileName().contains(".")) {
                                extension = request.getFileName().substring(request.getFileName().lastIndexOf("."));
                            }

                            String targetBucket = isPublic ? getEffectivePublicBucket() : bucketName;
                            String prefix = isPublic ? "public/" : "private/";
                            String fileKey = prefix + companyId + "/" + userId + "/" + UUID.randomUUID() + extension;

                            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                                    .bucket(targetBucket)
                                    .key(fileKey)
                                    .contentType(request.getContentType())
                                    .build();

                            Duration expirationDuration = getExpirationDuration();
                            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                                    .signatureDuration(expirationDuration)
                                    .putObjectRequest(putObjectRequest)
                                    .build();

                            PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);

                            StorageDto.PresignedUrlResponse response = new StorageDto.PresignedUrlResponse();
                            response.setUploadUrl(presignedRequest.url().toString());
                            response.setFileKey(fileKey);
                            response.setPublic(isPublic);
                            response.setExpirationTimeMillis(Instant.now().plus(expirationDuration).toEpochMilli());

                            log.info("Generated presigned upload URL (bucket={}, public={}) for key: {}", targetBucket, isPublic, fileKey);
                            return response;
                        })
                );
    }

    @Override
    public Mono<StorageDto.DownloadUrlResponse> generateDownloadUrl(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return Mono.error(new IllegalArgumentException("Object key cannot be blank"));
        }

        boolean isPublic = objectKey.startsWith("public/") || objectKey.startsWith("public");
        String targetBucket = isPublic ? getEffectivePublicBucket() : bucketName;

        if (isPublic) {
            StorageDto.DownloadUrlResponse response = new StorageDto.DownloadUrlResponse();
            response.setPublic(true);
            String directPublicUrl = String.format("https://%s.s3.%s.amazonaws.com/%s", targetBucket, region, objectKey);
            response.setDownloadUrl(directPublicUrl);
            response.setExpirationTimeMillis(0);
            log.info("Resolved public S3 URL (bucket={}) for key: {}", targetBucket, objectKey);
            return Mono.just(response);
        }

        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    // Check tenant isolation for private objects
                    boolean isAuthorized = objectKey.startsWith("private/" + companyId + "/") 
                            || objectKey.startsWith(companyId + "/");

                    if (!isAuthorized) {
                        return Mono.error(new SecurityException("Access denied: You can only access files within your company scope."));
                    }

                    StorageDto.DownloadUrlResponse response = new StorageDto.DownloadUrlResponse();
                    response.setPublic(false);

                    // Private object requires dynamic presigned URL with expiration signature
                    GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                            .bucket(targetBucket)
                            .key(objectKey)
                            .build();

                    Duration expirationDuration = getExpirationDuration();
                    GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                            .signatureDuration(expirationDuration)
                            .getObjectRequest(getObjectRequest)
                            .build();

                    PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);

                    response.setDownloadUrl(presignedRequest.url().toString());
                    response.setExpirationTimeMillis(Instant.now().plus(expirationDuration).toEpochMilli());

                    log.info("Generated presigned download URL (bucket={}) for private key: {}", targetBucket, objectKey);
                    return Mono.just(response);
                });
    }

    @Override
    public Mono<String> resolveObjectUrl(String objectKey) {
        return generateDownloadUrl(objectKey)
                .map(StorageDto.DownloadUrlResponse::getDownloadUrl);
    }
}
