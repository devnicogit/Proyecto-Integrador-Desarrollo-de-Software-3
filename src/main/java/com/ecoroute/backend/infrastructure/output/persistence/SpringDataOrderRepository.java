package com.ecoroute.backend.infrastructure.output.persistence;

import com.ecoroute.backend.infrastructure.input.rest.OrderStatusCount;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface SpringDataOrderRepository extends R2dbcRepository<OrderEntity, Long> {
    Mono<OrderEntity> findByTrackingNumber(String trackingNumber);
    Flux<OrderEntity> findByRouteId(Long routeId);

    @Query("SELECT status, COUNT(*) as count FROM orders GROUP BY status")
    Flux<OrderStatusCount> countOrdersByStatus();
}