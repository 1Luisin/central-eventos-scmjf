package br.org.santacasa.centraleventos.api.repository;

import br.org.santacasa.centraleventos.api.entity.LogEvento;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LogEventoRepository extends JpaRepository<LogEvento, Long> {
}
