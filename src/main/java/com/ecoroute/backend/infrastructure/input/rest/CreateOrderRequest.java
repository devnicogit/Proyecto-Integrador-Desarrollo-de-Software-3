package com.ecoroute.backend.infrastructure.input.rest;

import com.ecoroute.backend.domain.model.OrderStatus;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.OffsetDateTime;

public record CreateOrderRequest(
    String trackingNumber,
    String externalReference,
    Long routeId,
    OrderStatus status,
    String recipientName,
    String recipientPhone,
    String recipientEmail,
    String deliveryAddress,
    String deliveryCity,
    String deliveryDistrict,
    Double latitude,
    Double longitude,
    Integer priority,
    OffsetDateTime estimatedDeliveryWindowStart,
    OffsetDateTime estimatedDeliveryWindowEnd
) {
    @JsonCreator
    public CreateOrderRequest(
        @JsonProperty("trackingNumber") String trackingNumber,
        @JsonProperty("externalReference") String externalReference,
        @JsonProperty("routeId") Long routeId,
        @JsonProperty("status") OrderStatus status,
        @JsonProperty("recipientName") String recipientName,
        @JsonProperty("recipientPhone") String recipientPhone,
        @JsonProperty("recipientEmail") String recipientEmail,
        @JsonProperty("deliveryAddress") String deliveryAddress,
        @JsonProperty("deliveryCity") String deliveryCity,
        @JsonProperty("deliveryDistrict") String deliveryDistrict,
        @JsonProperty("latitude") Double latitude,
        @JsonProperty("longitude") Double longitude,
        @JsonProperty("priority") Integer priority,
        @JsonProperty("estimatedDeliveryWindowStart") OffsetDateTime estimatedDeliveryWindowStart,
        @JsonProperty("estimatedDeliveryWindowEnd") OffsetDateTime estimatedDeliveryWindowEnd
    ) {
        this.trackingNumber = trackingNumber;
        this.externalReference = externalReference;
        this.routeId = routeId;
        this.status = status;
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.recipientEmail = recipientEmail;
        this.deliveryAddress = deliveryAddress;
        this.deliveryCity = deliveryCity;
        this.deliveryDistrict = deliveryDistrict;
        this.latitude = latitude;
        this.longitude = longitude;
        this.priority = priority;
        this.estimatedDeliveryWindowStart = estimatedDeliveryWindowStart;
        this.estimatedDeliveryWindowEnd = estimatedDeliveryWindowEnd;
    }
}
