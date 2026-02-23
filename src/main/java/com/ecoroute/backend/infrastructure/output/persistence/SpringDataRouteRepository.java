package com.ecoroute.backend.infrastructure.output.persistence;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.time.LocalDate;

@Repository
public interface SpringDataRouteRepository extends R2dbcRepository<RouteEntity, Long> {
    Flux<RouteEntity> findByDriverIdAndRouteDate(Long driverId, LocalDate routeDate);

    @Query("SELECT * FROM routes WHERE (:date IS NULL OR route_date = :date) AND (:status IS NULL OR status = :status) ORDER BY created_at DESC")
    Flux<RouteEntity> findByFilters(LocalDate date, String status);
}
