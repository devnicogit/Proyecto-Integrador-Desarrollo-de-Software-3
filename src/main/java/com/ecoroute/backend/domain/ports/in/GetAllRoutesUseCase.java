package com.ecoroute.backend.domain.ports.in;

import com.ecoroute.backend.domain.model.Route;
import reactor.core.publisher.Flux;

public interface GetAllRoutesUseCase {
    Flux<Route> getAllRoutes();
}
