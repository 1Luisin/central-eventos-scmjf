package br.org.santacasa.centraleventos.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UsuarioExternoLoginRequest(
        @NotBlank(message = "E-mail é obrigatório")
        @Email(message = "E-mail inválido")
        @Size(max = 150, message = "E-mail deve ter até 150 caracteres")
        String email,

        @NotBlank(message = "Senha é obrigatória")
        @Size(max = 120, message = "Senha deve ter até 120 caracteres")
        String senha
) {
}
