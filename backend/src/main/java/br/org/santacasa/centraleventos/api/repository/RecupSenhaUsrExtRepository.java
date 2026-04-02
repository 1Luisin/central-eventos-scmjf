package br.org.santacasa.centraleventos.api.repository;

import br.org.santacasa.centraleventos.api.entity.RecupSenhaUsrExt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecupSenhaUsrExtRepository extends JpaRepository<RecupSenhaUsrExt, Long> {

    List<RecupSenhaUsrExt> findByUsuarioExterno_IdAndFlAtivo(Long usuarioExternoId, String flAtivo);

    Optional<RecupSenhaUsrExt> findTopByDsTokenHashAndFlAtivoOrderByDtSolicitacaoDesc(String dsTokenHash, String flAtivo);
}
