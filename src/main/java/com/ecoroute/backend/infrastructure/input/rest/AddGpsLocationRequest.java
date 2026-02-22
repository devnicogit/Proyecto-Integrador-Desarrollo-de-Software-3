package com.ecoroute.backend.infrastructure.input.rest;

public record AddGpsLocationRequest(
    Long vehicleId,
    Long driverId,
    Double latitude,
    Double longitude,
    Double speedKmh,
    Integer headingDegrees
) {}
