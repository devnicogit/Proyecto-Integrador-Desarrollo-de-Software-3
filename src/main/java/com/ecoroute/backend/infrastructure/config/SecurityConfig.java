package com.ecoroute.backend.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .authorizeExchange(exchanges -> exchanges
                .pathMatchers("/actuator/health", "/v3/api-docs/**", "/webjars/**", "/swagger-ui.html", "/favicon.ico", "/ws/**").permitAll()
                
                // RBAC Protection
                .pathMatchers("/dashboard/**", "/api/dashboard/**").hasRole("ADMIN")
                .pathMatchers("/drivers/**", "/api/drivers/**", "/vehicles/**", "/api/vehicles/**", "/routes/**", "/api/routes/**").hasAnyRole("ADMIN", "DISPATCHER", "DRIVER")
                .pathMatchers("/gps/**", "/api/gps/**", "/delivery-proofs/**", "/api/delivery-proofs/**", "/orders/**", "/api/orders/**").hasAnyRole("ADMIN", "DRIVER", "DISPATCHER")
                .pathMatchers("/purchases/**", "/api/purchases/**").hasAnyRole("ADMIN", "DISPATCHER")
                .pathMatchers("/notifications/**", "/api/notifications/**").hasAnyRole("ADMIN", "DISPATCHER", "DRIVER")
                .pathMatchers("/reports/**", "/api/reports/**").hasRole("ADMIN")
                .pathMatchers("/users/**", "/api/users/**").hasRole("ADMIN")

                .anyExchange().authenticated()
            )
            // THE MOCK FILTER: Must run BEFORE the JWT authentication filter
            .addFilterBefore(mockAuthFilter(), SecurityWebFiltersOrder.AUTHENTICATION)
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(grantedAuthoritiesExtractor()))
            );
            
        return http.build();
    }

    private WebFilter mockAuthFilter() {
        return (ServerWebExchange exchange, WebFilterChain chain) -> {
            String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer mock_")) {
                // Formato extendido (preferido):  Bearer mock_<USERNAME>__<ROLE>
                //   Doble guion bajo como separador para no chocar con usernames
                //   tipo "mct-001" que contienen un guion.
                // Formato legacy:                Bearer mock_<ROLE>
                //   (mantenido por compatibilidad con clientes existentes; usa
                //   username = "admin" como antes).
                String payload = authHeader.substring(12);  // recortar "Bearer mock_"
                String username;
                String role;
                int sep = payload.indexOf("__");
                if (sep > 0) {
                    username = payload.substring(0, sep);
                    role     = payload.substring(sep + 2);
                } else {
                    username = "admin";
                    role     = payload;
                }
                List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
                Authentication auth = new UsernamePasswordAuthenticationToken(username, null, authorities);

                ServerWebExchange mutatedExchange = exchange.mutate()
                        .request(builder -> builder.headers(h -> h.remove("Authorization")))
                        .build();

                return chain.filter(mutatedExchange)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth));
            }
            return chain.filter(exchange);
        };
    }

    private Converter<Jwt, Mono<AbstractAuthenticationToken>> grantedAuthoritiesExtractor() {
        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(new KeycloakRoleConverter());
        return new ReactiveJwtAuthenticationConverterAdapter(jwtAuthenticationConverter);
    }

    static class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {
        @Override
        public Collection<GrantedAuthority> convert(Jwt jwt) {
            System.out.println("SECURITY: Validando Token para: " + jwt.getSubject());
            System.out.println("SECURITY: Issuer: " + jwt.getIssuer());
            
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess == null) {
                System.out.println("SECURITY: No se encontró 'realm_access' en el token");
                return Collections.emptyList();
            }
            
            List<String> roles = (List<String>) realmAccess.get("roles");
            if (roles == null) return Collections.emptyList();
            
            System.out.println("SECURITY: Roles encontrados: " + roles);
            
            return roles.stream()
                    .map(role -> "ROLE_" + role)
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
        }
    }
}
