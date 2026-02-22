package com.ecoroute.backend.infrastructure.input.rest;

import com.ecoroute.backend.domain.model.Order;
import com.ecoroute.backend.domain.ports.in.CreateOrderUseCase;
import com.ecoroute.backend.domain.ports.in.GetAllOrdersUseCase;
import com.ecoroute.backend.domain.ports.in.GetOrderByIdUseCase;
import com.ecoroute.backend.domain.ports.in.UpdateOrderStatusUseCase;
import com.ecoroute.backend.domain.ports.out.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final CreateOrderUseCase createOrderUseCase;
    private final GetOrderByIdUseCase getOrderByIdUseCase;
    private final GetAllOrdersUseCase getAllOrdersUseCase;
    private final UpdateOrderStatusUseCase updateOrderStatusUseCase;
    private final OrderRepository orderRepository;

    @PostMapping
    public Mono<Order> createOrder(@RequestBody CreateOrderRequest request) {
        Order order = OrderRestMapper.toDomain(request);
        return createOrderUseCase.createOrder(order);
    }

    @GetMapping("/{id}")
    public Mono<Order> getOrderById(@PathVariable Long id) {
        return getOrderByIdUseCase.getOrderById(id);
    }

    @GetMapping
    public Flux<Order> getAllOrders() {
        return getAllOrdersUseCase.getAllOrders();
    }

    @DeleteMapping("/{id}")
    public Mono<Void> deleteOrder(@PathVariable Long id) {
        return orderRepository.deleteById(id);
    }

    @PatchMapping("/{id}/status")
    public Mono<Order> updateStatus(@PathVariable Long id, @RequestBody UpdateStatusRequest request) {
        return updateOrderStatusUseCase.updateStatusManual(id, request.status(), request.reason());
    }
}
