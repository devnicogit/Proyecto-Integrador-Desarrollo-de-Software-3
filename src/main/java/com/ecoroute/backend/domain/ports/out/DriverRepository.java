package com.ecoroute.backend.domain.ports.out;

import com.ecoroute.backend.domain.model.Driver;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface DriverRepository {
    Mono<Driver> save(Driver driver);
    Flux<Driver> findAll();
    Mono<Driver> findById(Long id);
    Mono<Void> deleteById(Long id);

    /** Para mapear un user (Keycloak preferred_username / Bearer mock_<user>__DRIVER)
     *  con el Driver real. Devuelve vacío si no hay match. */
    Mono<Driver> findByExternalId(String externalId);
    Mono<Driver> findByEmail(String email);
}
