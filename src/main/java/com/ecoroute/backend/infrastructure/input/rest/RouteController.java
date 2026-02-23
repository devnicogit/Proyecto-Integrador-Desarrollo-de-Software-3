package com.ecoroute.backend.infrastructure.input.rest;

import com.ecoroute.backend.domain.model.Route;
import com.ecoroute.backend.domain.model.RouteStatus;
import com.ecoroute.backend.domain.ports.in.CreateRouteUseCase;
import com.ecoroute.backend.domain.ports.in.GetAllRoutesUseCase;
import com.ecoroute.backend.domain.ports.in.UpdateRouteStatusUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/routes")
@RequiredArgsConstructor
public class RouteController {

    private final CreateRouteUseCase createRouteUseCase;
    private final UpdateRouteStatusUseCase updateRouteStatusUseCase;
    private final GetAllRoutesUseCase getAllRoutesUseCase;

    @PostMapping
    public Mono<Route> createRoute(@RequestBody CreateRouteRequest request) {
        Route route = new Route(
                null,
                request.driverId(),
                request.vehicleId(),
                request.routeDate(),
                RouteStatus.PLANNED,
                request.estimatedStartTime(),
                null,
                null,
                0.0,
                OffsetDateTime.now()
        );
        return createRouteUseCase.createRoute(route);
    }

    @PatchMapping("/{id}/status")
    public Mono<Route> updateStatus(@PathVariable Long id, @RequestParam RouteStatus status) {
        return updateRouteStatusUseCase.updateRouteStatus(id, status);
    }

    @GetMapping
    public Flux<Route> getAllRoutes(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date,
            @RequestParam(required = false) RouteStatus status) {
        if (date != null || status != null) {
            return getAllRoutesUseCase.getRoutesByFilters(date, status);
        }
        return getAllRoutesUseCase.getAllRoutes();
    }
}
