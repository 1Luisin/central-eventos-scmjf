package br.org.santacasa.centraleventos.api.controller;

import br.org.santacasa.centraleventos.api.dto.MensagemResponse;
import br.org.santacasa.centraleventos.api.dto.UsuarioExternoRecuperacaoSenhaRedefinicaoRequest;
import br.org.santacasa.centraleventos.api.dto.UsuarioExternoRecuperacaoSenhaSolicitacaoRequest;
import br.org.santacasa.centraleventos.api.dto.UsuarioExternoRecuperacaoSenhaValidacaoRequest;
import br.org.santacasa.centraleventos.api.dto.UsuarioExternoRecuperacaoSenhaValidacaoResponse;
import br.org.santacasa.centraleventos.api.service.UsuarioExternoRecuperacaoSenhaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/usuarios-externos/recuperacao-senha")
public class UsuarioExternoRecuperacaoSenhaController {

    private final UsuarioExternoRecuperacaoSenhaService usuarioExternoRecuperacaoSenhaService;

    public UsuarioExternoRecuperacaoSenhaController(
            UsuarioExternoRecuperacaoSenhaService usuarioExternoRecuperacaoSenhaService
    ) {
        this.usuarioExternoRecuperacaoSenhaService = usuarioExternoRecuperacaoSenhaService;
    }

    @PostMapping("/solicitar")
    public ResponseEntity<MensagemResponse> solicitar(
            @Valid @RequestBody UsuarioExternoRecuperacaoSenhaSolicitacaoRequest request,
            HttpServletRequest servletRequest
    ) {
        return ResponseEntity.ok(
                usuarioExternoRecuperacaoSenhaService.solicitarRecuperacao(request, resolveIp(servletRequest))
        );
    }

    @PostMapping("/validar")
    public ResponseEntity<UsuarioExternoRecuperacaoSenhaValidacaoResponse> validar(
            @Valid @RequestBody UsuarioExternoRecuperacaoSenhaValidacaoRequest request
    ) {
        return ResponseEntity.ok(usuarioExternoRecuperacaoSenhaService.validarToken(request));
    }

    @PostMapping("/redefinir")
    public ResponseEntity<MensagemResponse> redefinir(
            @Valid @RequestBody UsuarioExternoRecuperacaoSenhaRedefinicaoRequest request,
            HttpServletRequest servletRequest
    ) {
        return ResponseEntity.ok(
                usuarioExternoRecuperacaoSenhaService.redefinirSenha(request, resolveIp(servletRequest))
        );
    }

    private String resolveIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }
}
