package com.ecoroute.backend.application.usecases;

import com.ecoroute.backend.application.services.NotificationService;
import com.ecoroute.backend.application.services.S3Service;
import com.ecoroute.backend.domain.exception.ResourceNotFoundException;
import com.ecoroute.backend.domain.model.DeliveryProof;
import com.ecoroute.backend.domain.model.Order;
import com.ecoroute.backend.domain.model.OrderStatus;
import com.ecoroute.backend.domain.model.RouteStatus;
import com.ecoroute.backend.domain.ports.in.CreateDeliveryProofUseCase;
import com.ecoroute.backend.domain.ports.in.UpdateRouteStatusUseCase;
import com.ecoroute.backend.domain.ports.out.DeliveryProofRepository;
import com.ecoroute.backend.domain.ports.out.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class CreateDeliveryProofUseCaseImpl implements CreateDeliveryProofUseCase {

    private final DeliveryProofRepository deliveryProofRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;
    private final S3Service s3Service;
    private final UpdateRouteStatusUseCase updateRouteStatusUseCase;

    @Override
    @Transactional
    public Mono<DeliveryProof> createDeliveryProof(DeliveryProof deliveryProof) {
        return orderRepository.findById(deliveryProof.orderId())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Order not found with id: " + deliveryProof.orderId())))
                .flatMap(order -> {
                    log.info("Creating delivery proof for order: {}", order.trackingNumber());
                    
                    // 1. Upload files to S3
                    Mono<String> imageUpload = s3Service.uploadBase64("photos", deliveryProof.imageUrl());
                    Mono<String> signatureUpload = s3Service.uploadBase64("signatures", deliveryProof.signatureDataUrl());

                    return Mono.zip(imageUpload.defaultIfEmpty(""), signatureUpload.defaultIfEmpty(""))
                            .flatMap(tuple -> {
                                String s3ImageUrl = tuple.getT1();
                                String s3SignatureUrl = tuple.getT2();

                                // 2. Create updated delivery proof with S3 URIs
                                DeliveryProof proofWithS3 = new DeliveryProof(
                                        null,
                                        deliveryProof.orderId(),
                                        s3ImageUrl,
                                        s3SignatureUrl,
                                        deliveryProof.receiverName(),
                                        deliveryProof.receiverDni(),
                                        deliveryProof.verifiedAt(),
                                        deliveryProof.latitude(),
                                        deliveryProof.longitude()
                                );

                                // 3. Update order status to DELIVERED
                                var updatedOrder = new Order(
                                        order.id(),
                                        order.trackingNumber(),
                                        order.externalReference(),
                                        order.routeId(),
                                        OrderStatus.DELIVERED,
                                        order.recipientName(),
                                        order.recipientPhone(),
                                        order.recipientEmail(),
                                        order.deliveryAddress(),
                                        order.deliveryCity(),
                                        order.deliveryDistrict(),
                                        order.latitude(),
                                        order.longitude(),
                                        order.priority(),
                                        order.estimatedDeliveryWindowStart(),
                                        order.estimatedDeliveryWindowEnd(),
                                        order.createdAt(),
                                        OffsetDateTime.now()
                                );

                                return orderRepository.save(updatedOrder)
                                        .then(deliveryProofRepository.save(proofWithS3))
                                        .flatMap(savedProof ->
                                                notificationService.sendDeliveryNotification(updatedOrder)
                                                        .then(checkAndCompleteRoute(updatedOrder.routeId()))
                                                        .thenReturn(savedProof)
                                        );
                            });
                });
    }

    private Mono<Void> checkAndCompleteRoute(Long routeId) {
        if (routeId == null) return Mono.empty();

        return orderRepository.findByRouteId(routeId)
                .collectList()
                .flatMap(orders -> {
                    boolean allDelivered = orders.stream()
                            .allMatch(o -> o.status() == OrderStatus.DELIVERED || o.status() == OrderStatus.FAILED);
                    
                    if (allDelivered && !orders.isEmpty()) {
                        log.info("🏁 All orders delivered for route {}. Completing route.", routeId);
                        return updateRouteStatusUseCase.updateRouteStatusOnly(routeId, RouteStatus.COMPLETED);
                    }
                    return Mono.empty();
                });
    }
}
