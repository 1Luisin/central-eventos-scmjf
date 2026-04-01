package br.org.santacasa.centraleventos.api.controller;

import br.org.santacasa.centraleventos.api.dto.UsuarioInternoLoginRequest;
import br.org.santacasa.centraleventos.api.dto.UsuarioInternoResponse;
import br.org.santacasa.centraleventos.api.service.UsuarioInternoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/usuarios-internos")
public class UsuarioInternoController {

    private final UsuarioInternoService usuarioInternoService;

    public UsuarioInternoController(UsuarioInternoService usuarioInternoService) {
        this.usuarioInternoService = usuarioInternoService;
    }

    @PostMapping("/login")
    public ResponseEntity<UsuarioInternoResponse> login(@Valid @RequestBody UsuarioInternoLoginRequest request) {
        return ResponseEntity.ok(usuarioInternoService.autenticar(request));
    }
}
