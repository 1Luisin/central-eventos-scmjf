package br.org.santacasa.centraleventos.api.repository;

import br.org.santacasa.centraleventos.api.entity.Categoria;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    List<Categoria> findByEvento_IdOrderByIdAsc(Long eventoId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Categoria c join fetch c.evento where c.id = :categoriaId")
    Optional<Categoria> findByIdForUpdate(@Param("categoriaId") Long categoriaId);
}
