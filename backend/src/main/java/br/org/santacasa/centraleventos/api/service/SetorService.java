package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.repository.SetorRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SetorService {

    private final SetorRepository setorRepository;

    public SetorService(SetorRepository setorRepository) {
        this.setorRepository = setorRepository;
    }

    public List<String> listarSetores() {
        return setorRepository.listarNomesSetores();
    }
}
