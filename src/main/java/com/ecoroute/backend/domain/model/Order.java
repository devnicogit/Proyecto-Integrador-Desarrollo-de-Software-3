package com.ecoroute.backend.domain.model;

import java.time.OffsetDateTime;

public record Order(
    Long id,
    String trackingNumber,
    String externalReference,
    Long routeId,
    OrderStatus status,
    
    // Recipient Info
    String recipientName,
    String recipientPhone,
    String recipientEmail,
    
    // Delivery Address
    String deliveryAddress,
    String deliveryCity,
    String deliveryDistrict,
    Double latitude,
    Double longitude,
    
    // Constraints
    Integer priority,
    OffsetDateTime estimatedDeliveryWindowStart,
    OffsetDateTime estimatedDeliveryWindowEnd,
    
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
