package com.ecoroute.backend.infrastructure.output.persistence;

import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpringDataDeliveryProofRepository extends R2dbcRepository<DeliveryProofEntity, Long> {
}
