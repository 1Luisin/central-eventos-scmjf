package br.org.santacasa.centraleventos.api.dto;

public record CategoriaResponse(
        Long id,
        Long eventoId,
        String nomeCategoria,
        String externo,
        String descricao,
        String ativo,
        Long limiteInscricoes,
        long inscricoesRealizadas,
        long vagasDisponiveis
) {
}
