package br.org.santacasa.centraleventos.api.controller;

import br.org.santacasa.centraleventos.api.dto.UsuarioExternoCreateRequest;
import br.org.santacasa.centraleventos.api.dto.UsuarioExternoLoginRequest;
import br.org.santacasa.centraleventos.api.dto.UsuarioExternoResponse;
import br.org.santacasa.centraleventos.api.service.UsuarioExternoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/usuarios-externos")
public class UsuarioExternoController {

    private final UsuarioExternoService usuarioExternoService;

    public UsuarioExternoController(UsuarioExternoService usuarioExternoService) {
        this.usuarioExternoService = usuarioExternoService;
    }

    @PostMapping
    public ResponseEntity<UsuarioExternoResponse> cadastrar(
            @Valid @RequestBody UsuarioExternoCreateRequest request,
            @RequestHeader(value = "X-Usuario-Log", required = false) String usuarioLog
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioExternoService.cadastrar(request, usuarioLog));
    }

    @PostMapping("/login")
    public ResponseEntity<UsuarioExternoResponse> login(@Valid @RequestBody UsuarioExternoLoginRequest request) {
        return ResponseEntity.ok(usuarioExternoService.autenticar(request));
    }
}
