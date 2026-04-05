package com.ecoroute.backend.infrastructure.input.rest;

import java.math.BigDecimal;

public record PurchaseRequest(
    String description,
    String supplier,
    BigDecimal amount,
    String status,
    String category,
    String notes
) {}
