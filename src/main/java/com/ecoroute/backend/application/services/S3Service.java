package com.ecoroute.backend.application.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import software.amazon.awssdk.core.async.AsyncRequestBody;
import software.amazon.awssdk.core.async.AsyncResponseTransformer;
import software.amazon.awssdk.services.s3.S3AsyncClient;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class S3Service {

    private final S3AsyncClient s3AsyncClient;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    /**
     * Uploads a base64 encoded image or signature to S3.
     * Returns the S3 URI of the uploaded object.
     */
    public Mono<String> uploadBase64(String prefix, String base64Content) {
        if (base64Content == null || base64Content.isBlank()) {
            return Mono.empty();
        }

        String key = String.format("%s/%s.png", prefix, UUID.randomUUID());
        byte[] content = base64Content.contains(",") 
                ? Base64.getDecoder().decode(base64Content.split(",")[1]) 
                : Base64.getDecoder().decode(base64Content);

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType("image/png")
                .build();

        log.info("📤 Uploading object to S3: {}/{}", bucketName, key);

        return Mono.fromCompletionStage(s3AsyncClient.putObject(putRequest, AsyncRequestBody.fromBytes(content)))
                .map(resp -> String.format("s3://%s/%s", bucketName, key))
                .doOnSuccess(uri -> log.info("✅ Uploaded successfully to: {}", uri))
                .doOnError(err -> log.error("❌ S3 upload failed: {}", err.getMessage()));
    }

    /**
     * Descarga un objeto desde S3 dado su URI (formato: s3://bucket/key).
     * Devuelve el contenido como byte[]. Si el objeto no existe o falla, devuelve null
     * (el caller decide qué hacer; típicamente saltar el embed de imagen).
     */
    public byte[] downloadAsBytes(String s3Uri) {
        if (s3Uri == null || s3Uri.isBlank() || !s3Uri.startsWith("s3://")) {
            return null;
        }
        // s3://bucket/key  →  bucket, key
        String stripped = s3Uri.substring(5);
        int slash = stripped.indexOf('/');
        if (slash < 0) return null;
        String bucket = stripped.substring(0, slash);
        String key    = stripped.substring(slash + 1);
        try {
            GetObjectRequest req = GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();
            return s3AsyncClient.getObject(req, AsyncResponseTransformer.toBytes())
                    .join()
                    .asByteArray();
        } catch (NoSuchKeyException e) {
            log.warn("S3 key no existe: {}", s3Uri);
            return null;
        } catch (Exception e) {
            log.warn("Falló descarga S3 {}: {}", s3Uri, e.getMessage());
            return null;
        }
    }
}
