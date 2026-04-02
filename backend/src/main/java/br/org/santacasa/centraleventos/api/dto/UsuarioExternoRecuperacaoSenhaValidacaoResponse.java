package br.org.santacasa.centraleventos.api.dto;

import java.time.LocalDateTime;

public record UsuarioExternoRecuperacaoSenhaValidacaoResponse(
        boolean valido,
        String emailMascarado,
        LocalDateTime expiracaoEm,
        String mensagem
) {
}
