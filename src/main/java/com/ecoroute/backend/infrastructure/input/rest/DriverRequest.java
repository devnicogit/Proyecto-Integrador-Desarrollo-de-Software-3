package com.ecoroute.backend.infrastructure.input.rest;

public record DriverRequest(
    String firstName,
    String lastName,
    String licenseNumber,
    String phoneNumber,
    String email,
    Boolean isActive
) {}
