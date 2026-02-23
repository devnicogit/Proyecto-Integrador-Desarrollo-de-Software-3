package com.ecoroute.backend.infrastructure.input.rest;

import com.ecoroute.backend.application.services.PdfService;
import com.lowagie.text.pdf.PdfWriter;
import com.ecoroute.backend.domain.model.DeliveryProof;
import com.ecoroute.backend.domain.ports.in.CreateDeliveryProofUseCase;
import com.ecoroute.backend.domain.ports.out.DeliveryProofRepository;
import com.ecoroute.backend.domain.ports.out.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/delivery-proofs")
@RequiredArgsConstructor
public class DeliveryProofController {

    private final CreateDeliveryProofUseCase createDeliveryProofUseCase;
    private final OrderRepository orderRepository;
    private final DeliveryProofRepository deliveryProofRepository;
    private final PdfService pdfService;

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

    @GetMapping("/{orderId}/pdf")
    public Mono<ResponseEntity<byte[]>> downloadPdf(@PathVariable Long orderId) {
        return orderRepository.findById(orderId)
                .flatMap(order -> deliveryProofRepository.findByOrderId(orderId)
                        .map(proof -> {
                            byte[] pdfContent = pdfService.generateDeliveryReceipt(order, proof);
                            return ResponseEntity.ok()
                                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=receipt_" + order.trackingNumber() + ".pdf")
                                    .contentType(MediaType.APPLICATION_PDF)
                                    .body(pdfContent);
                        }));
    }
}
