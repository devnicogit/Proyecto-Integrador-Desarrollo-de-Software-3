package com.ecoroute.backend.infrastructure.input.rest;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CreateRouteRequest(
    Long driverId,
    Long vehicleId,
    LocalDate routeDate,
    OffsetDateTime estimatedStartTime
) {}
