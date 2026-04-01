package br.org.santacasa.centraleventos.api.repository;

import br.org.santacasa.centraleventos.api.entity.Inscricao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InscricaoRepository extends JpaRepository<Inscricao, Long> {

    List<Inscricao> findByEvento_IdOrderByDhRegistroDesc(Long eventoId);

    boolean existsByCategoria_IdAndMatriculaIgnoreCase(Long categoriaId, String matricula);

    boolean existsByCategoria_IdAndUsuarioExterno_Id(Long categoriaId, Long usuarioExternoId);

    long countByCategoria_Id(Long categoriaId);

    @Query("""
            select i
            from Inscricao i
            join fetch i.evento
            join fetch i.categoria
            left join fetch i.usuarioExterno
            where i.id = :inscricaoId
            """)
    Optional<Inscricao> findDetalhadaById(@Param("inscricaoId") Long inscricaoId);
}
