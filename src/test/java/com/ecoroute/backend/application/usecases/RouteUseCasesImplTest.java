package com.ecoroute.backend.application.usecases;

import com.ecoroute.backend.domain.model.*;
import com.ecoroute.backend.domain.ports.out.OrderRepository;
import com.ecoroute.backend.domain.ports.out.RouteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RouteUseCasesImplTest {

    @Mock
    private RouteRepository routeRepository;

    @InjectMocks
    private RouteUseCasesImpl routeUseCases;

    private Route sampleRoute;

    @BeforeEach
    void setUp() {
        sampleRoute = new Route(
                1L, 1L, 1L, LocalDate.now(), RouteStatus.PLANNED,
                OffsetDateTime.now(), null, null, 0.0, OffsetDateTime.now()
        );
    }

    @Test
    void createRoute_Success() {
        when(routeRepository.save(any(Route.class))).thenReturn(Mono.just(sampleRoute));

        Mono<Route> result = routeUseCases.createRoute(sampleRoute);

        StepVerifier.create(result)
                .expectNext(sampleRoute)
                .verifyComplete();
    }

    @Test
    void updateRouteStatus_ToInProgress_SetsStartTime() {
        when(routeRepository.findById(1L)).thenReturn(Mono.just(sampleRoute));
        when(routeRepository.save(any(Route.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        Mono<Route> result = routeUseCases.updateRouteStatus(1L, RouteStatus.IN_PROGRESS);

        StepVerifier.create(result)
                .assertNext(route -> {
                    assert route.status() == RouteStatus.IN_PROGRESS;
                    assert route.actualStartTime() != null;
                })
                .verifyComplete();
    }
}
