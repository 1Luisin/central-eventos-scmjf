package br.org.santacasa.centraleventos.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UsuarioExternoRecuperacaoSenhaValidacaoRequest(
        @NotBlank(message = "Token é obrigatório")
        @Size(max = 255, message = "Token inválido")
        String token
) {
}
