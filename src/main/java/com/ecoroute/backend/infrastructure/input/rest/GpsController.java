package com.ecoroute.backend.infrastructure.input.rest;

import com.ecoroute.backend.domain.model.VehicleGpsHistory;
import com.ecoroute.backend.domain.ports.in.AddGpsLocationUseCase;
import com.ecoroute.backend.domain.ports.in.GetGpsHistoryByVehicleUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/gps")
@RequiredArgsConstructor
public class GpsController {

    private final AddGpsLocationUseCase addGpsLocationUseCase;
    private final GetGpsHistoryByVehicleUseCase getGpsHistoryByVehicleUseCase;

    @PostMapping("/ping")
    public Mono<VehicleGpsHistory> addLocation(@RequestBody AddGpsLocationRequest request) {
        VehicleGpsHistory history = new VehicleGpsHistory(
                null,
                request.vehicleId(),
                request.driverId(),
                request.latitude(),
                request.longitude(),
                request.speedKmh(),
                request.headingDegrees(),
                OffsetDateTime.now()
        );
        return addGpsLocationUseCase.addGpsLocation(history);
    }

    @GetMapping("/history/{vehicleId}")
    public Flux<VehicleGpsHistory> getHistory(@PathVariable Long vehicleId) {
        return getGpsHistoryByVehicleUseCase.getGpsHistory(vehicleId);
    }
}
