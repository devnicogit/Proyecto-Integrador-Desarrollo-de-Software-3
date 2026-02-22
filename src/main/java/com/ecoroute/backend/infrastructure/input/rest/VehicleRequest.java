package com.ecoroute.backend.infrastructure.input.rest;

public record VehicleRequest(
    String plateNumber,
    String model,
    String brand,
    Double capacityKg,
    Double capacityM3,
    Boolean isActive
) {}
