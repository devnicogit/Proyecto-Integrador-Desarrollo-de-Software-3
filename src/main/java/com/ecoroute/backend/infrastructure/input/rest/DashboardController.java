package com.ecoroute.backend.infrastructure.input.rest;

import com.ecoroute.backend.application.services.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/orders-by-status")
    public Flux<OrderStatusCount> getOrderStats(
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return dashboardService.getOrderStats(driverId, startDate, endDate);
    }

    @GetMapping("/delivery-performance")
    public Mono<DeliveryPerformanceStats> getDeliveryPerformance(@RequestParam(required = false) Long driverId) {
        return Mono.zip(
                dashboardService.getOnTimeDeliveries(driverId).defaultIfEmpty(0L),
                dashboardService.getDelayedDeliveries(driverId).defaultIfEmpty(0L)
        ).map(tuple -> new DeliveryPerformanceStats(tuple.getT1(), tuple.getT2()));
    }

    @GetMapping("/deliveries-by-driver")
    public Flux<com.ecoroute.backend.infrastructure.output.persistence.DriverPerformanceDTO> getDeliveriesByDriver(@RequestParam(required = false) Long driverId) {
        return dashboardService.getDeliveriesByDriver(driverId);
    }

    @GetMapping("/orders-by-district")
    public Flux<com.ecoroute.backend.infrastructure.output.persistence.DriverPerformanceDTO> getOrdersByDistrict() {
        return dashboardService.getOrdersByDistrict();
    }

    public record DeliveryPerformanceStats(Long onTime, Long delayed) {}
}
