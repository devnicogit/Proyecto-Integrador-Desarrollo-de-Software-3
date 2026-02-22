package com.ecoroute.backend.application.services;

import com.ecoroute.backend.infrastructure.input.rest.OrderStatusCount;
import com.ecoroute.backend.infrastructure.output.persistence.SpringDataOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SpringDataOrderRepository springDataOrderRepository;

    public Flux<OrderStatusCount> getOrderStats() {
        return springDataOrderRepository.countOrdersByStatus();
    }
}
