package br.org.santacasa.centraleventos.api.dto;

import java.time.LocalDateTime;

public record CategoriaResponse(
        Long id,
        Long eventoId,
        String nomeCategoria,
        String externo,
        String descricao,
        String ativo,
        Long limiteInscricoes,
        LocalDateTime dataHoraFimInscricao,
        long inscricoesRealizadas,
        long vagasDisponiveis
) {
}
