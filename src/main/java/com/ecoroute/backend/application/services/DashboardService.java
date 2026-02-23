package com.ecoroute.backend.application.services;

import com.ecoroute.backend.infrastructure.input.rest.OrderStatusCount;
import com.ecoroute.backend.infrastructure.output.persistence.SpringDataOrderRepository;
import com.ecoroute.backend.infrastructure.output.persistence.DriverPerformanceDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SpringDataOrderRepository springDataOrderRepository;

    public Flux<OrderStatusCount> getOrderStats(Long driverId, LocalDate startDate, LocalDate endDate) {
        OffsetDateTime start = startDate != null ? startDate.atStartOfDay().atOffset(ZoneOffset.UTC) : null;
        OffsetDateTime end = endDate != null ? endDate.atTime(LocalTime.MAX).atOffset(ZoneOffset.UTC) : null;
        return springDataOrderRepository.countOrdersByStatusFiltered(driverId, start, end);
    }

    public Mono<Long> getOnTimeDeliveries(Long driverId) {
        return springDataOrderRepository.countOnTimeDeliveriesFiltered(driverId);
    }

    public Mono<Long> getDelayedDeliveries(Long driverId) {
        return springDataOrderRepository.countDelayedDeliveriesFiltered(driverId);
    }

    public Flux<DriverPerformanceDTO> getDeliveriesByDriver(Long driverId) {
        return springDataOrderRepository.countDeliveriesByDriverFiltered(driverId);
    }

    public Flux<DriverPerformanceDTO> getOrdersByDistrict() {
        return springDataOrderRepository.countOrdersByDistrict();
    }
}
