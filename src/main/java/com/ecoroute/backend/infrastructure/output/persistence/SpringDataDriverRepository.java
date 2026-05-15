package com.ecoroute.backend.infrastructure.output.persistence;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface SpringDataDriverRepository extends R2dbcRepository<DriverEntity, Long> {

    @Query("SELECT * FROM drivers WHERE external_id = :externalId LIMIT 1")
    Mono<DriverEntity> findByExternalId(String externalId);

    @Query("SELECT * FROM drivers WHERE LOWER(email) = LOWER(:email) LIMIT 1")
    Mono<DriverEntity> findByEmail(String email);
}
