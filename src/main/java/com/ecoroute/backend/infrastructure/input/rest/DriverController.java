package com.ecoroute.backend.infrastructure.input.rest;

import com.ecoroute.backend.domain.model.Driver;
import com.ecoroute.backend.domain.ports.in.*;
import com.ecoroute.backend.domain.ports.out.DriverRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final CreateDriverUseCase createDriverUseCase;
    private final GetDriverByIdUseCase getDriverByIdUseCase;
    private final GetAllDriversUseCase getAllDriversUseCase;
    private final UpdateDriverUseCase updateDriverUseCase;
    private final DeleteDriverUseCase deleteDriverUseCase;
    private final DriverRepository driverRepository;

    @PostMapping
    public Mono<Driver> createDriver(@Valid @RequestBody DriverRequest request) {
        Driver driver = new Driver(
                null,
                UUID.randomUUID().toString(),
                request.firstName(),
                request.lastName(),
                request.licenseNumber(),
                request.phoneNumber(),
                request.email(),
                request.isActive(),
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );
        return createDriverUseCase.createDriver(driver);
    }

    @GetMapping("/{id}")
    public Mono<Driver> getDriverById(@PathVariable Long id) {
        return getDriverByIdUseCase.getDriverById(id);
    }

    @GetMapping
    public Flux<Driver> getAllDrivers() {
        return getAllDriversUseCase.getAllDrivers();
    }

    /**
     * Devuelve el Driver vinculado al usuario autenticado.
     *
     * Estrategia de matching (en orden de preferencia):
     *   1. username del Authentication (Keycloak preferred_username o Bearer
     *      mock_&lt;user&gt;__DRIVER) ==  drivers.external_id
     *   2. claim email del JWT == drivers.email (case-insensitive)
     *   3. claim preferred_username == drivers.email (algunos usuarios usan
     *      el email como username Keycloak)
     *
     * Devuelve 404 si no hay match — el cliente debería redirigir a login.
     */
    @GetMapping("/me")
    public Mono<ResponseEntity<Driver>> getDriverForCurrentUser() {
        return ReactiveSecurityContextHolder.getContext()
            .map(ctx -> ctx.getAuthentication())
            .flatMap(this::resolveDriverFromAuth)
            .map(driver -> ResponseEntity.ok(driver))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    private Mono<Driver> resolveDriverFromAuth(Authentication auth) {
        if (auth == null) return Mono.empty();
        String username = auth.getName();              // mock o JWT real
        String emailClaim = null;
        if (auth.getPrincipal() instanceof Jwt jwt) {
            emailClaim = jwt.getClaimAsString("email");
            // Si Keycloak emitió preferred_username distinto, preferirlo
            String preferred = jwt.getClaimAsString("preferred_username");
            if (preferred != null && !preferred.isBlank()) {
                username = preferred;
            }
        }
        final String finalUser = username == null ? "" : username.trim();
        final String finalEmail = emailClaim == null ? "" : emailClaim.trim();

        return driverRepository.findByExternalId(finalUser)
            .switchIfEmpty(Mono.defer(() ->
                finalEmail.isEmpty() ? Mono.empty() : driverRepository.findByEmail(finalEmail)))
            .switchIfEmpty(Mono.defer(() ->
                finalUser.isEmpty() ? Mono.empty() : driverRepository.findByEmail(finalUser)));
    }

    @PutMapping("/{id}")
    public Mono<Driver> updateDriver(@PathVariable Long id, @Valid @RequestBody DriverRequest request) {
        Driver driver = new Driver(
                id,
                null,
                request.firstName(),
                request.lastName(),
                request.licenseNumber(),
                request.phoneNumber(),
                request.email(),
                request.isActive(),
                null,
                OffsetDateTime.now()
        );
        return updateDriverUseCase.updateDriver(id, driver);
    }

    @DeleteMapping("/{id}")
    public Mono<Void> deleteDriver(@PathVariable Long id) {
        return deleteDriverUseCase.deleteDriver(id);
    }
}
