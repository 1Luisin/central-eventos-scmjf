package br.org.santacasa.centraleventos.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CategoriaCreateRequest(
        @NotNull(message = "Identificador do evento é obrigatório")
        Long eventoId,

        @NotBlank(message = "Nome da categoria é obrigatório")
        @Size(max = 255, message = "Nome da categoria deve ter até 255 caracteres")
        String nomeCategoria,

        @NotBlank(message = "Flag de categoria externa é obrigatória")
        @Pattern(regexp = "[SNsn]", message = "SN_EXTERNO deve ser 'S' ou 'N'")
        String externo,

        @Size(max = 2000, message = "Descrição deve ter até 2000 caracteres")
        String descricao,

        @NotBlank(message = "Flag de categoria ativa é obrigatória")
        @Pattern(regexp = "[SNsn]", message = "SN_ATIVO deve ser 'S' ou 'N'")
        String ativo,

        @NotNull(message = "Limite de inscrições é obrigatório")
        @Positive(message = "Limite de inscrições deve ser maior que zero")
        Long limiteInscricoes
) {
}
