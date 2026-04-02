package br.org.santacasa.centraleventos.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UsuarioExternoRecuperacaoSenhaRedefinicaoRequest(
        @NotBlank(message = "Token é obrigatório")
        @Size(max = 255, message = "Token inválido")
        String token,

        @NotBlank(message = "Código de verificação é obrigatório")
        @Size(min = 6, max = 6, message = "Código deve conter 6 dígitos")
        String codigo,

        @NotBlank(message = "Nova senha é obrigatória")
        @Size(min = 8, max = 120, message = "A nova senha deve ter entre 8 e 120 caracteres")
        String novaSenha,

        @NotBlank(message = "A confirmação da nova senha é obrigatória")
        @Size(min = 8, max = 120, message = "A confirmação da nova senha deve ter entre 8 e 120 caracteres")
        String confirmacaoNovaSenha
) {
}
