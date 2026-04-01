package br.org.santacasa.centraleventos.api.controller;

import br.org.santacasa.centraleventos.api.dto.EventoCreateRequest;
import br.org.santacasa.centraleventos.api.dto.EventoResponse;
import br.org.santacasa.centraleventos.api.dto.UsuarioOperacaoContext;
import br.org.santacasa.centraleventos.api.service.EventoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/eventos")
public class EventoController {

    private final EventoService eventoService;

    public EventoController(EventoService eventoService) {
        this.eventoService = eventoService;
    }

    @PostMapping
    public ResponseEntity<EventoResponse> criarEvento(
            @Valid @RequestBody EventoCreateRequest request,
            @RequestHeader(value = "X-Usuario-Log", required = false) String usuarioLog,
            @RequestHeader(value = "X-Usuario-Nome", required = false) String usuarioNome,
            @RequestHeader(value = "X-Usuario-Tipo", required = false) String tipoUsuario
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                eventoService.criarEvento(request, UsuarioOperacaoContext.of(usuarioLog, usuarioNome, tipoUsuario))
        );
    }

    @GetMapping
    public List<EventoResponse> listarEventos() {
        return eventoService.listarEventos();
    }

    @GetMapping("/meus")
    public List<EventoResponse> listarMeusEventos(
            @RequestHeader(value = "X-Usuario-Log", required = false) String usuarioLog,
            @RequestHeader(value = "X-Usuario-Nome", required = false) String usuarioNome,
            @RequestHeader(value = "X-Usuario-Tipo", required = false) String tipoUsuario
    ) {
        return eventoService.listarMeusEventos(UsuarioOperacaoContext.of(usuarioLog, usuarioNome, tipoUsuario));
    }

    @GetMapping("/{id}")
    public EventoResponse buscarEventoPorId(@PathVariable Long id) {
        return eventoService.buscarEventoPorId(id);
    }

    @PutMapping("/{id}")
    public EventoResponse atualizarEvento(
            @PathVariable Long id,
            @Valid @RequestBody EventoCreateRequest request,
            @RequestHeader(value = "X-Usuario-Log", required = false) String usuarioLog,
            @RequestHeader(value = "X-Usuario-Nome", required = false) String usuarioNome,
            @RequestHeader(value = "X-Usuario-Tipo", required = false) String tipoUsuario
    ) {
        return eventoService.atualizarEvento(id, request, UsuarioOperacaoContext.of(usuarioLog, usuarioNome, tipoUsuario));
    }
}
