package br.org.santacasa.centraleventos.api.dto;

import java.time.LocalDateTime;

public record InscricaoResponse(
        Long id,
        Long eventoId,
        Long categoriaId,
        String numeroContato,
        LocalDateTime dataHoraRegistro,
        String nomeSetor,
        String nomeUsuario,
        String matricula
) {
}
