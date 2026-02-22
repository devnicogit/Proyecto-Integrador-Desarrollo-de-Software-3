package com.ecoroute.backend.infrastructure.input.rest;

import com.ecoroute.backend.application.services.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/orders-by-status")
    public Flux<OrderStatusCount> getOrderStats() {
        return dashboardService.getOrderStats();
    }
}
