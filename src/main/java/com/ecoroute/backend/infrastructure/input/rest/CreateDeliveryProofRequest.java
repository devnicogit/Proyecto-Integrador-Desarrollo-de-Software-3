package com.ecoroute.backend.infrastructure.input.rest;

import java.time.OffsetDateTime;

public record CreateDeliveryProofRequest(
    Long orderId,
    String imageUrl,
    String signatureDataUrl,
    String receiverName,
    String receiverDni,
    OffsetDateTime verifiedAt,
    Double latitude,
    Double longitude
) {}
