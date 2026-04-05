package com.ecoroute.backend.infrastructure.input.rest;

import com.ecoroute.backend.application.services.DashboardService;
import com.ecoroute.backend.infrastructure.output.persistence.DriverPerformanceDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final DashboardService dashboardService;

    @GetMapping("/orders-summary")
    public Mono<Map<String, Object>> getOrdersSummary(
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        return dashboardService.getOrderStats(driverId, startDate, endDate)
                .collectList()
                .zipWith(dashboardService.getOnTimeDeliveries(driverId))
                .zipWith(dashboardService.getDelayedDeliveries(driverId))
                .map(tuple -> {
                    var statsAndOnTime = tuple.getT1();
                    var delayed = tuple.getT2();
                    return Map.<String, Object>of(
                            "ordersByStatus", statsAndOnTime.getT1(),
                            "onTimeDeliveries", statsAndOnTime.getT2(),
                            "delayedDeliveries", delayed
                    );
                });
    }

    @GetMapping("/driver-performance")
    public Flux<DriverPerformanceDTO> getDriverPerformance(
            @RequestParam(required = false) Long driverId) {
        return dashboardService.getDeliveriesByDriver(driverId);
    }

    @GetMapping("/route-efficiency")
    public Flux<Map<String, Object>> getRouteEfficiency(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return dashboardService.getOrdersByDistrict()
                .map(dto -> Map.<String, Object>of("district", dto.getName(), "orderCount", dto.getCount()));
    }
}
