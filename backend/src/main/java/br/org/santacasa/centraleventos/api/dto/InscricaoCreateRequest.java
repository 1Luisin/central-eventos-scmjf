package br.org.santacasa.centraleventos.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InscricaoCreateRequest(
        @NotNull(message = "Identificador do evento é obrigatório")
        Long eventoId,

        @NotNull(message = "Identificador da categoria é obrigatório")
        Long categoriaId,

        @NotBlank(message = "Contato é obrigatório")
        @Size(max = 30, message = "Contato deve ter até 30 caracteres")
        String numeroContato,

        @NotBlank(message = "Setor é obrigatório")
        @Size(max = 255, message = "Setor deve ter até 255 caracteres")
        String nomeSetor,

        @NotBlank(message = "Nome do usuário é obrigatório")
        @Size(max = 255, message = "Nome do usuário deve ter até 255 caracteres")
        String nomeUsuario,

        @NotBlank(message = "Matrícula é obrigatória")
        @Size(max = 255, message = "Matrícula deve ter até 255 caracteres")
        String matricula
) {
}
