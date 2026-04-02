package br.org.santacasa.centraleventos.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UsuarioExternoRecuperacaoSenhaSolicitacaoRequest(
        @NotBlank(message = "E-mail é obrigatório")
        @Email(message = "E-mail inválido")
        @Size(max = 150, message = "E-mail deve ter até 150 caracteres")
        String email,

        @NotBlank(message = "CPF é obrigatório")
        @Pattern(regexp = "[0-9.\\-]{11,14}", message = "CPF deve conter 11 dígitos")
        String cpf
) {
}
