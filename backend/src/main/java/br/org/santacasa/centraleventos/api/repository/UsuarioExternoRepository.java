package br.org.santacasa.centraleventos.api.repository;

import br.org.santacasa.centraleventos.api.entity.UsuarioExterno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioExternoRepository extends JpaRepository<UsuarioExterno, Long> {

    boolean existsByNrCpf(String nrCpf);

    boolean existsByDsEmailIgnoreCase(String dsEmail);

    Optional<UsuarioExterno> findByDsEmailIgnoreCase(String dsEmail);
}
