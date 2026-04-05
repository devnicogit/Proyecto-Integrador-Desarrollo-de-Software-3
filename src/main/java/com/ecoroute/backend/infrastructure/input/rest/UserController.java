package com.ecoroute.backend.infrastructure.input.rest;

import com.ecoroute.backend.infrastructure.output.persistence.SpringDataUserRoleRepository;
import com.ecoroute.backend.infrastructure.output.persistence.UserRoleEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final SpringDataUserRoleRepository userRoleRepository;

    @GetMapping
    public Flux<UserRoleEntity> getAllUsers() {
        return userRoleRepository.findAll();
    }

    @PostMapping
    public Mono<UserRoleEntity> assignRole(@RequestBody UserRoleRequest request) {
        UserRoleEntity entity = new UserRoleEntity();
        entity.setUserExternalId(request.userExternalId());
        entity.setRoleId(request.roleId());
        return userRoleRepository.save(entity);
    }

    @DeleteMapping("/{id}")
    public Mono<Void> removeRole(@PathVariable Long id) {
        return userRoleRepository.deleteById(id);
    }
}
