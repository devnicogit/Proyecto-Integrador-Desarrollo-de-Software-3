package com.ecoroute.backend.application.usecases;

import com.ecoroute.backend.domain.exception.ResourceNotFoundException;
import com.ecoroute.backend.domain.model.Order;
import com.ecoroute.backend.domain.model.OrderStatus;
import com.ecoroute.backend.domain.model.Route;
import com.ecoroute.backend.domain.model.RouteStatus;
import com.ecoroute.backend.domain.ports.in.CreateRouteUseCase;
import com.ecoroute.backend.domain.ports.in.GetAllRoutesUseCase;
import com.ecoroute.backend.domain.ports.in.UpdateRouteStatusUseCase;
import com.ecoroute.backend.domain.ports.out.OrderRepository;
import com.ecoroute.backend.domain.ports.out.RouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class RouteUseCasesImpl implements CreateRouteUseCase, UpdateRouteStatusUseCase, GetAllRoutesUseCase {

    private final RouteRepository routeRepository;
    private final OrderRepository orderRepository;

    @Override
    public Mono<Route> createRoute(Route route) {
        return routeRepository.findAll()
                .filter(r -> r.routeDate().equals(route.routeDate()) && 
                            (r.status() != RouteStatus.COMPLETED && r.status() != RouteStatus.CANCELLED))
                .filter(r -> r.driverId().equals(route.driverId()) || r.vehicleId().equals(route.vehicleId()))
                .collectList()
                .flatMap(conflicts -> {
                    if (!conflicts.isEmpty()) {
                        return Mono.error(new RuntimeException("El conductor o vehículo ya tiene una ruta activa para esta fecha"));
                    }
                    return routeRepository.save(route);
                });
    }

    @Override
    @Transactional
    public Mono<Route> updateRouteStatus(Long id, RouteStatus status) {
        return routeRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Route not found")))
                .flatMap(existingRoute -> {
                    Route updatedRoute = createUpdatedRouteObject(existingRoute, status);

                    // CASCADE: Update all orders to IN_TRANSIT if route starts
                    if (status == RouteStatus.IN_PROGRESS) {
                        return orderRepository.findByRouteId(id)
                                .flatMap(order -> updateOrderStatus(order, OrderStatus.IN_TRANSIT))
                                .then(routeRepository.save(updatedRoute));
                    }
                    
                    return routeRepository.save(updatedRoute);
                });
    }

    @Override
    public Mono<Void> updateRouteStatusOnly(Long id, RouteStatus status) {
        return routeRepository.findById(id)
                .flatMap(existingRoute -> routeRepository.save(createUpdatedRouteObject(existingRoute, status)))
                .then();
    }

    private Route createUpdatedRouteObject(Route existing, RouteStatus newStatus) {
        OffsetDateTime actualStartTime = existing.actualStartTime();
        OffsetDateTime actualEndTime = existing.actualEndTime();
        
        if (newStatus == RouteStatus.IN_PROGRESS && actualStartTime == null) actualStartTime = OffsetDateTime.now();
        if (newStatus == RouteStatus.COMPLETED && actualEndTime == null) actualEndTime = OffsetDateTime.now();
        
        return new Route(
                existing.id(), existing.driverId(), existing.vehicleId(),
                existing.routeDate(), newStatus, existing.estimatedStartTime(),
                actualStartTime, actualEndTime, existing.totalDistanceKm(),
                existing.createdAt()
        );
    }

    private Mono<Order> updateOrderStatus(Order order, OrderStatus newStatus) {
        Order updated = new Order(
                order.id(), order.trackingNumber(), order.externalReference(),
                order.routeId(), newStatus, order.recipientName(),
                order.recipientPhone(), order.recipientEmail(),
                order.deliveryAddress(), order.deliveryCity(),
                order.deliveryDistrict(), order.latitude(), order.longitude(),
                order.priority(), order.estimatedDeliveryWindowStart(),
                order.estimatedDeliveryWindowEnd(), order.createdAt(),
                OffsetDateTime.now()
        );
        return orderRepository.save(updated);
    }

    @Override
    public Flux<Route> getAllRoutes() {
        return routeRepository.findAll();
    }
}
