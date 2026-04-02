package br.org.santacasa.centraleventos.api.controller;

import br.org.santacasa.centraleventos.api.auth.AuthenticatedRequest;
import br.org.santacasa.centraleventos.api.dto.InscricaoCreateRequest;
import br.org.santacasa.centraleventos.api.dto.InscricaoResponse;
import br.org.santacasa.centraleventos.api.dto.UsuarioOperacaoContext;
import br.org.santacasa.centraleventos.api.service.InscricaoService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/inscricoes")
public class InscricaoController {

    private final InscricaoService inscricaoService;

    public InscricaoController(InscricaoService inscricaoService) {
        this.inscricaoService = inscricaoService;
    }

    @PostMapping
    public ResponseEntity<InscricaoResponse> criarInscricao(
            @Valid @RequestBody InscricaoCreateRequest request,
            HttpServletRequest servletRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                inscricaoService.criarInscricao(request, resolveUsuario(servletRequest))
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelarInscricao(
            @PathVariable Long id,
            HttpServletRequest servletRequest
    ) {
        inscricaoService.cancelarInscricao(id, resolveUsuario(servletRequest));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/evento/{eventoId}")
    public List<InscricaoResponse> listarInscricoesPorEvento(
            @PathVariable Long eventoId,
            HttpServletRequest servletRequest
    ) {
        return inscricaoService.listarPorEvento(eventoId, resolveUsuario(servletRequest));
    }

    @GetMapping("/minhas")
    public List<InscricaoResponse> listarMinhasInscricoes(HttpServletRequest servletRequest) {
        return inscricaoService.listarMinhasInscricoes(resolveUsuario(servletRequest));
    }

    private UsuarioOperacaoContext resolveUsuario(HttpServletRequest servletRequest) {
        return UsuarioOperacaoContext.fromAuthenticatedUser(AuthenticatedRequest.require(servletRequest));
    }
}
