package br.org.santacasa.centraleventos.api.repository;

import br.org.santacasa.centraleventos.api.entity.Evento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventoRepository extends JpaRepository<Evento, Long> {

    List<Evento> findByNmResponsavelIgnoreCaseOrderByDhInicioAsc(String nmResponsavel);
}
