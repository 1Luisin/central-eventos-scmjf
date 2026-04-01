package br.org.santacasa.centraleventos.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UsuarioInternoLoginRequest(
        @NotBlank(message = "Matrícula é obrigatória")
        @Size(max = 30, message = "Matrícula deve ter até 30 caracteres")
        String matricula,

        @NotBlank(message = "Senha é obrigatória")
        @Size(max = 120, message = "Senha deve ter até 120 caracteres")
        String senha
) {
}
