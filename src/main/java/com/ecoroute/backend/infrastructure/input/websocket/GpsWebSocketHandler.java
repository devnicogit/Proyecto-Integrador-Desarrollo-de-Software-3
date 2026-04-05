package com.ecoroute.backend.infrastructure.input.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class GpsWebSocketHandler implements WebSocketHandler {

    private final Map<String, Sinks.Many<String>> vehicleSinks = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        // Client sends vehicleId as first message to subscribe
        Flux<WebSocketMessage> output = session.receive()
                .map(WebSocketMessage::getPayloadAsText)
                .flatMap(vehicleId -> {
                    Sinks.Many<String> sink = vehicleSinks.computeIfAbsent(
                            vehicleId, k -> Sinks.many().multicast().onBackpressureBuffer());
                    return sink.asFlux().map(session::textMessage);
                });

        return session.send(output);
    }

    public void broadcastLocation(Long vehicleId, double latitude, double longitude, double speedKmh) {
        String key = vehicleId.toString();
        Sinks.Many<String> sink = vehicleSinks.get(key);
        if (sink != null) {
            try {
                String json = objectMapper.writeValueAsString(Map.of(
                        "vehicleId", vehicleId,
                        "latitude", latitude,
                        "longitude", longitude,
                        "speedKmh", speedKmh,
                        "timestamp", System.currentTimeMillis()
                ));
                sink.tryEmitNext(json);
            } catch (Exception e) {
                // ignore serialization errors
            }
        }
    }
}
