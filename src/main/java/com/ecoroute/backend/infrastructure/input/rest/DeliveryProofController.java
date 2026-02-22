package com.ecoroute.backend.infrastructure.input.rest;

import com.ecoroute.backend.domain.model.DeliveryProof;
import com.ecoroute.backend.domain.ports.in.CreateDeliveryProofUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/delivery-proofs")
@RequiredArgsConstructor
public class DeliveryProofController {

    private final CreateDeliveryProofUseCase createDeliveryProofUseCase;

    @PostMapping
    public Mono<DeliveryProof> createDeliveryProof(@RequestBody CreateDeliveryProofRequest request) {
        DeliveryProof domain = new DeliveryProof(
                null,
                request.orderId(),
                request.imageUrl(),
                request.signatureDataUrl(),
                request.receiverName(),
                request.receiverDni(),
                request.verifiedAt() != null ? request.verifiedAt() : OffsetDateTime.now(),
                request.latitude(),
                request.longitude()
        );
        return createDeliveryProofUseCase.createDeliveryProof(domain);
    }
}
