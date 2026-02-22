package com.ecoroute.backend.application.usecases;

import com.ecoroute.backend.domain.exception.ResourceNotFoundException;
import com.ecoroute.backend.domain.model.Order;
import com.ecoroute.backend.domain.model.OrderStatus;
import com.ecoroute.backend.domain.model.RouteStatus;
import com.ecoroute.backend.domain.ports.in.CreateOrderUseCase;
import com.ecoroute.backend.domain.ports.in.GetAllOrdersUseCase;
import com.ecoroute.backend.domain.ports.in.GetOrderByIdUseCase;
import com.ecoroute.backend.domain.ports.in.UpdateOrderStatusUseCase;
import com.ecoroute.backend.domain.ports.in.UpdateRouteStatusUseCase;
import com.ecoroute.backend.domain.ports.out.OrderRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;

@Service
public class OrderUseCasesImpl implements CreateOrderUseCase, GetOrderByIdUseCase, GetAllOrdersUseCase, UpdateOrderStatusUseCase {

    private final OrderRepository orderRepository;
    private final UpdateRouteStatusUseCase routeService;

    public OrderUseCasesImpl(OrderRepository orderRepository, @Lazy UpdateRouteStatusUseCase routeService) {
        this.orderRepository = orderRepository;
        this.routeService = routeService;
    }

    @Override
    public Mono<Order> createOrder(Order order) {
        OrderStatus initialStatus = (order.routeId() != null) ? OrderStatus.ASSIGNED : OrderStatus.PENDING;
        Order orderToSave = new Order(
                null, order.trackingNumber(), order.externalReference(),
                order.routeId(), initialStatus, order.recipientName(),
                order.recipientPhone(), order.recipientEmail(),
                order.deliveryAddress(), order.deliveryCity(),
                order.deliveryDistrict(), order.latitude(), order.longitude(),
                order.priority(), order.estimatedDeliveryWindowStart(),
                order.estimatedDeliveryWindowEnd(), OffsetDateTime.now(),
                OffsetDateTime.now()
        );
        return orderRepository.save(orderToSave);
    }

    @Override
    public Mono<Order> getOrderById(Long id) {
        return orderRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Order not found with id: " + id)));
    }

    @Override
    public Flux<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    @Transactional
    public Mono<Order> updateStatusManual(Long id, OrderStatus status, String reason) {
        return orderRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Order not found")))
                .flatMap(order -> {
                    // Create the updated order with the EXACT status requested from UI
                    Order updatedOrder = new Order(
                            order.id(), order.trackingNumber(), order.externalReference(),
                            order.routeId(), status, order.recipientName(),
                            order.recipientPhone(), order.recipientEmail(),
                            order.deliveryAddress(), order.deliveryCity(),
                            order.deliveryDistrict(), order.latitude(), order.longitude(),
                            order.priority(), order.estimatedDeliveryWindowStart(),
                            order.estimatedDeliveryWindowEnd(), order.createdAt(),
                            OffsetDateTime.now()
                    );
                    
                    return orderRepository.save(updatedOrder)
                            .flatMap(savedOrder -> {
                                if (savedOrder.routeId() != null) {
                                    // Check if this was the last order to finish the route
                                    return checkAndCompleteRoute(savedOrder.routeId()).thenReturn(savedOrder);
                                }
                                return Mono.just(savedOrder);
                            });
                });
    }

    private Mono<Void> checkAndCompleteRoute(Long routeId) {
        return orderRepository.findByRouteId(routeId)
                .collectList()
                .flatMap(orders -> {
                    // A route is finished if all orders are in a final state
                    boolean allFinished = orders.stream().allMatch(o -> 
                        o.status() == OrderStatus.DELIVERED || 
                        o.status() == OrderStatus.FAILED || 
                        o.status() == OrderStatus.RETURNED);
                    
                    if (allFinished && !orders.isEmpty()) {
                        // Mark route as completed, but DON'T touch the orders anymore
                        return routeService.updateRouteStatusOnly(routeId, RouteStatus.COMPLETED);
                    }
                    return Mono.empty();
                });
    }
}
