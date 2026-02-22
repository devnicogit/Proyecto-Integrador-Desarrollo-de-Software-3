package com.ecoroute.backend.application.usecases;

import com.ecoroute.backend.domain.model.Order;
import com.ecoroute.backend.domain.model.OrderStatus;
import com.ecoroute.backend.domain.ports.out.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderUseCasesImplTest {

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private OrderUseCasesImpl orderUseCases;

    @Test
    void createOrder() {
        Order orderToSave = new Order(null, "tracking-123", OrderStatus.PENDING, 1L);
        Order savedOrder = new Order(1L, "tracking-123", OrderStatus.PENDING, 1L);

        when(orderRepository.save(any(Order.class))).thenReturn(Mono.just(savedOrder));

        Mono<Order> result = orderUseCases.createOrder(orderToSave);

        StepVerifier.create(result)
                .expectNext(savedOrder)
                .verifyComplete();
    }

    @Test
    void getOrderById() {
        Order order = new Order(1L, "tracking-123", OrderStatus.PENDING, 1L);

        when(orderRepository.findById(1L)).thenReturn(Mono.just(order));

        Mono<Order> result = orderUseCases.getOrderById(1L);

        StepVerifier.create(result)
                .expectNext(order)
                .verifyComplete();
    }
}
