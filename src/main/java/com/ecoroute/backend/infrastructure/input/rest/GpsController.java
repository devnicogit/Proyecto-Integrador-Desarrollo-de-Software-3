package com.ecoroute.backend.infrastructure.input.rest;

import com.ecoroute.backend.domain.model.VehicleGpsHistory;
import com.ecoroute.backend.domain.ports.in.AddGpsLocationUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/gps")
@RequiredArgsConstructor
public class GpsController {

    private final AddGpsLocationUseCase addGpsLocationUseCase;

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
}
