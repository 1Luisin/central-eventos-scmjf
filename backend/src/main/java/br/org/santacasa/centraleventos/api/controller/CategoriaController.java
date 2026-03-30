package br.org.santacasa.centraleventos.api.controller;

import br.org.santacasa.centraleventos.api.dto.CategoriaCreateRequest;
import br.org.santacasa.centraleventos.api.dto.CategoriaResponse;
import br.org.santacasa.centraleventos.api.service.CategoriaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/categorias")
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @PostMapping
    public ResponseEntity<CategoriaResponse> criarCategoria(
            @Valid @RequestBody CategoriaCreateRequest request,
            @RequestHeader(value = "X-Usuario-Log", required = false) String usuarioLog
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaService.criarCategoria(request, usuarioLog));
    }

    @GetMapping("/evento/{eventoId}")
    public List<CategoriaResponse> listarCategoriasPorEvento(@PathVariable Long eventoId) {
        return categoriaService.listarPorEvento(eventoId);
    }
}
