package com.ecoroute.backend.application.usecases;

import com.ecoroute.backend.domain.model.VehicleGpsHistory;
import com.ecoroute.backend.domain.ports.in.AddGpsLocationUseCase;
import com.ecoroute.backend.domain.ports.out.VehicleGpsHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class GpsUseCasesImpl implements AddGpsLocationUseCase {

    private final VehicleGpsHistoryRepository gpsHistoryRepository;

    @Override
    public Mono<VehicleGpsHistory> addGpsLocation(VehicleGpsHistory history) {
        return gpsHistoryRepository.save(history);
    }
}
