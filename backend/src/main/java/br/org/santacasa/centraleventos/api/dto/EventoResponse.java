package br.org.santacasa.centraleventos.api.dto;

import java.time.LocalDateTime;

public record EventoResponse(
        Long id,
        String nomeEvento,
        LocalDateTime dataHoraInicio,
        LocalDateTime dataHoraFim,
        String nomeResponsavel,
        String nomeSetor,
        String numeroContato,
        String ativo,
        String descricao
) {
}
