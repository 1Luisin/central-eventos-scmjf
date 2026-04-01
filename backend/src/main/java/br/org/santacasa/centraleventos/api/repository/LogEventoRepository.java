package br.org.santacasa.centraleventos.api.repository;

import br.org.santacasa.centraleventos.api.entity.LogEvento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LogEventoRepository extends JpaRepository<LogEvento, Long> {

    @Query(
            value = """
                    select cd_usuario
                    from (
                        select cd_usuario
                        from cn_eventos.log_eventos
                        where nm_acao like 'Criou o evento ' || :eventoId || ' -%'
                        order by dh_log asc
                    )
                    where rownum = 1
                    """,
            nativeQuery = true
    )
    Optional<String> findCriadorDoEvento(@Param("eventoId") Long eventoId);

    @Query(
            value = """
                    select distinct to_number(regexp_substr(nm_acao, '[0-9]+', 1, 1)) as evento_id
                    from cn_eventos.log_eventos
                    where nm_acao like 'Criou o evento % -%'
                      and upper(trim(cd_usuario)) = upper(trim(:usuario))
                    order by 1
                    """,
            nativeQuery = true
    )
    List<Number> findIdsEventosCriadosPorUsuario(@Param("usuario") String usuario);
}
