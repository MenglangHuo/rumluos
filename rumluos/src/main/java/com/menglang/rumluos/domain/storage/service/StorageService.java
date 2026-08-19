package com.menglang.rumluos.domain.storage.service;

import com.menglang.rumluos.domain.storage.dto.StorageDto;
import reactor.core.publisher.Mono;

public interface StorageService {
    
    /**
     * Generates a presigned URL for the client to upload a file directly to S3.
     */
    Mono<StorageDto.PresignedUrlResponse> generateUploadUrl(StorageDto.GenerateUploadUrlRequest request);

    /**
     * Generates a presigned URL for the client to securely download a file from S3.
     */
    Mono<StorageDto.DownloadUrlResponse> generateDownloadUrl(String objectKey);

    /**
     * Resolves object key to either direct public URL or presigned private URL.
     */
    Mono<String> resolveObjectUrl(String objectKey);
}
