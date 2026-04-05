package com.ecoroute.backend.infrastructure.input.rest;

import com.ecoroute.backend.domain.model.Order;
import com.ecoroute.backend.domain.ports.in.CreateOrderUseCase;
import com.ecoroute.backend.domain.ports.in.GetAllOrdersUseCase;
import com.ecoroute.backend.domain.ports.in.GetOrderByIdUseCase;
import com.ecoroute.backend.domain.ports.in.UpdateOrderStatusUseCase;
import com.ecoroute.backend.domain.ports.out.OrderRepository;
import jakarta.validation.Valid;
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
    public Mono<Order> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        Order order = OrderRestMapper.toDomain(request);
        return createOrderUseCase.createOrder(order);
    }

    @GetMapping("/{id}")
    public Mono<Order> getOrderById(@PathVariable Long id) {
        return getOrderByIdUseCase.getOrderById(id);
    }

    @GetMapping
    public Flux<Order> getAllOrders(
            @RequestParam(required = false) Long routeId) {
        if (routeId != null) {
            return orderRepository.findByRouteId(routeId);
        }
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

    @PostMapping("/bulk-csv")
    public Flux<Order> bulkImportCsv(@RequestBody String csvContent) {
        return Flux.fromIterable(parseCsv(csvContent))
                .flatMap(createOrderUseCase::createOrder);
    }

    private java.util.List<Order> parseCsv(String csvContent) {
        java.util.List<Order> orders = new java.util.ArrayList<>();
        String[] lines = csvContent.split("\n");
        // Skip header row
        for (int i = 1; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) continue;
            String[] cols = line.split(",");
            if (cols.length < 5) continue;
            orders.add(new Order(
                    null,
                    cols[0].trim(), // trackingNumber
                    cols.length > 5 ? cols[5].trim() : null, // externalReference
                    cols.length > 6 && !cols[6].trim().isEmpty() ? Long.parseLong(cols[6].trim()) : null, // routeId
                    com.ecoroute.backend.domain.model.OrderStatus.PENDING,
                    cols[1].trim(), // recipientName
                    cols.length > 7 ? cols[7].trim() : null, // recipientPhone
                    cols.length > 8 ? cols[8].trim() : null, // recipientEmail
                    cols[2].trim(), // deliveryAddress
                    cols.length > 9 ? cols[9].trim() : null, // deliveryCity
                    cols.length > 10 ? cols[10].trim() : null, // deliveryDistrict
                    cols.length > 3 && !cols[3].trim().isEmpty() ? Double.parseDouble(cols[3].trim()) : null, // latitude
                    cols.length > 4 && !cols[4].trim().isEmpty() ? Double.parseDouble(cols[4].trim()) : null, // longitude
                    0, // priority
                    null, null, // delivery windows
                    java.time.OffsetDateTime.now(),
                    java.time.OffsetDateTime.now()
            ));
        }
        return orders;
    }
}
