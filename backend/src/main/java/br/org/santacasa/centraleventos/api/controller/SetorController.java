package br.org.santacasa.centraleventos.api.controller;

import br.org.santacasa.centraleventos.api.service.SetorService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/setores")
public class SetorController {

    private final SetorService setorService;

    public SetorController(SetorService setorService) {
        this.setorService = setorService;
    }

    @GetMapping
    public List<String> listarSetores() {
        return setorService.listarSetores();
    }
}
