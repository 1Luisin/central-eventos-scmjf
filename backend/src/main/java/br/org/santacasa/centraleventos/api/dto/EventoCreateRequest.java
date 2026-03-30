package br.org.santacasa.centraleventos.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record EventoCreateRequest(
        @NotBlank(message = "Nome do evento é obrigatório")
        @Size(max = 255, message = "Nome do evento deve ter até 255 caracteres")
        String nomeEvento,

        @NotNull(message = "Data/hora de início é obrigatória")
        LocalDateTime dataHoraInicio,

        @NotNull(message = "Data/hora de fim é obrigatória")
        LocalDateTime dataHoraFim,

        @NotBlank(message = "Nome do responsável é obrigatório")
        @Size(max = 255, message = "Nome do responsável deve ter até 255 caracteres")
        String nomeResponsavel,

        @NotBlank(message = "Setor é obrigatório")
        @Size(max = 255, message = "Setor deve ter até 255 caracteres")
        String nomeSetor,

        @NotBlank(message = "Contato é obrigatório")
        @Size(max = 30, message = "Contato deve ter até 30 caracteres")
        String numeroContato,

        @NotBlank(message = "Flag de ativo é obrigatória")
        @Pattern(regexp = "[SNsn]", message = "SN_ATIVO deve ser 'S' ou 'N'")
        String ativo,

        @Size(max = 2000, message = "Descrição deve ter até 2000 caracteres")
        String descricao
) {
}
