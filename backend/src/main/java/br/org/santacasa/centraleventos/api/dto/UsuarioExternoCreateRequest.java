package br.org.santacasa.centraleventos.api.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UsuarioExternoCreateRequest(
        @NotBlank(message = "Nome completo é obrigatório")
        @Size(max = 150, message = "Nome completo deve ter até 150 caracteres")
        String nomeCompleto,

        @NotBlank(message = "CPF é obrigatório")
        @Pattern(regexp = "[0-9.\\-]{11,14}", message = "CPF deve conter 11 dígitos")
        String cpf,

        @NotBlank(message = "E-mail é obrigatório")
        @Email(message = "E-mail inválido")
        @Size(max = 150, message = "E-mail deve ter até 150 caracteres")
        String email,

        @NotBlank(message = "Senha é obrigatória")
        @Size(min = 8, max = 120, message = "Senha deve ter entre 8 e 120 caracteres")
        String senha,

        @Size(max = 20, message = "Telefone deve ter até 20 caracteres")
        String numeroTelefone,

        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate dataNascimento,

        @NotNull(message = "Aceite LGPD é obrigatório")
        Boolean aceiteLgpd
) {
}
