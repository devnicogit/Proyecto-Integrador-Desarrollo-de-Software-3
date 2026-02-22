package com.ecoroute.backend.application.services;

import com.ecoroute.backend.domain.model.Order;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import software.amazon.awssdk.services.sqs.SqsAsyncClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final SqsAsyncClient sqsAsyncClient;
    private final ObjectMapper objectMapper;

    @Value("${aws.sqs.queue-url}")
    private String queueUrl;

    public Mono<Void> sendDeliveryNotification(Order order) {
        return Mono.fromCallable(() -> objectMapper.writeValueAsString(order))
                .flatMap(payload -> {
                    log.info("📩 Queuing notification for order: {}", order.trackingNumber());
                    SendMessageRequest request = SendMessageRequest.builder()
                            .queueUrl(queueUrl)
                            .messageBody(payload)
                            .build();
                    
                    return Mono.fromCompletionStage(sqsAsyncClient.sendMessage(request))
                            .doOnSuccess(resp -> log.info("✅ Notification queued with ID: {}", resp.messageId()))
                            .doOnError(err -> log.error("❌ Failed to queue notification: {}", err.getMessage()))
                            .then();
                });
    }
}
