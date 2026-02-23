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
                            (r.status() == RouteStatus.PLANNED || r.status() == RouteStatus.IN_PROGRESS))
                .filter(r -> r.driverId().equals(route.driverId()) || r.vehicleId().equals(route.vehicleId()))
                .collectList()
                .flatMap(conflicts -> {
                    if (!conflicts.isEmpty()) {
                        return Mono.error(new RuntimeException("El conductor o vehículo ya tiene una ruta activa (Planeada o En curso) para esta fecha. Debe finalizar la anterior primero."));
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
                    // Calculate distance if starting route OR completing if it's 0
                    boolean shouldCalculate = (status == RouteStatus.IN_PROGRESS) || 
                                             (status == RouteStatus.COMPLETED && existingRoute.totalDistanceKm() <= 0);

                    Mono<Double> distanceMono = shouldCalculate 
                            ? calculateRouteDistance(id) 
                            : Mono.just(existingRoute.totalDistanceKm());

                    return distanceMono.flatMap(distance -> {
                        Route updatedRoute = createUpdatedRouteObject(existingRoute, status, distance);

                        // CASCADE: Update all orders to IN_TRANSIT if route starts
                        if (status == RouteStatus.IN_PROGRESS) {
                            return orderRepository.findByRouteId(id)
                                    .flatMap(order -> updateOrderStatus(order, OrderStatus.IN_TRANSIT))
                                    .then(routeRepository.save(updatedRoute));
                        }
                        
                        return routeRepository.save(updatedRoute);
                    });
                });
    }

    private Mono<Double> calculateRouteDistance(Long routeId) {
        // Warehouse location (Lima Main Square approx)
        final double START_LAT = -12.046374;
        final double START_LON = -77.042793;

        return orderRepository.findByRouteId(routeId)
                .collectList()
                .map(orders -> {
                    if (orders.isEmpty()) return 0.0;
                    
                    // Optimization: Sort orders by proximity (Nearest Neighbor)
                    java.util.List<Order> sortedOrders = new java.util.ArrayList<>();
                    java.util.List<Order> remainingOrders = new java.util.ArrayList<>(orders);
                    
                    double currentLat = START_LAT;
                    double currentLon = START_LON;
                    double totalDist = 0.0;

                    while (!remainingOrders.isEmpty()) {
                        Order nearest = null;
                        double minDistance = Double.MAX_VALUE;
                        int nearestIndex = -1;

                        for (int i = 0; i < remainingOrders.size(); i++) {
                            Order o = remainingOrders.get(i);
                            if (o.latitude() != null && o.longitude() != null) {
                                double d = haversine(currentLat, currentLon, o.latitude(), o.longitude());
                                if (d < minDistance) {
                                    minDistance = d;
                                    nearest = o;
                                    nearestIndex = i;
                                }
                            }
                        }

                        if (nearest != null) {
                            totalDist += minDistance;
                            currentLat = nearest.latitude();
                            currentLon = nearest.longitude();
                            sortedOrders.add(remainingOrders.remove(nearestIndex));
                        } else {
                            // Break if remaining orders don't have coordinates
                            break;
                        }
                    }
                    
                    // Return to warehouse
                    totalDist += haversine(currentLat, currentLon, START_LAT, START_LON);
                    
                    return Math.round(totalDist * 100.0) / 100.0;
                });
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Override
    public Mono<Void> updateRouteStatusOnly(Long id, RouteStatus status) {
        return routeRepository.findById(id)
                .flatMap(existingRoute -> routeRepository.save(createUpdatedRouteObject(existingRoute, status, existingRoute.totalDistanceKm())))
                .then();
    }

    private Route createUpdatedRouteObject(Route existing, RouteStatus newStatus, Double distance) {
        OffsetDateTime actualStartTime = existing.actualStartTime();
        OffsetDateTime actualEndTime = existing.actualEndTime();
        
        if (newStatus == RouteStatus.IN_PROGRESS && actualStartTime == null) actualStartTime = OffsetDateTime.now();
        if (newStatus == RouteStatus.COMPLETED && actualEndTime == null) actualEndTime = OffsetDateTime.now();
        
        return new Route(
                existing.id(), existing.driverId(), existing.vehicleId(),
                existing.routeDate(), newStatus, existing.estimatedStartTime(),
                actualStartTime, actualEndTime, distance,
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

    @Override
    public Flux<Route> getRoutesByFilters(java.time.LocalDate date, RouteStatus status) {
        return routeRepository.findByFilters(date, status);
    }
}
