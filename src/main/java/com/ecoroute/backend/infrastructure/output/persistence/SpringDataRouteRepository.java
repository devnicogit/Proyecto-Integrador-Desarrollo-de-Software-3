package com.ecoroute.backend.infrastructure.output.persistence;

import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.time.LocalDate;

@Repository
public interface SpringDataRouteRepository extends R2dbcRepository<RouteEntity, Long> {
    Flux<RouteEntity> findByDriverIdAndRouteDate(Long driverId, LocalDate routeDate);
}
