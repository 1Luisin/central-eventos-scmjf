package br.org.santacasa.centraleventos.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InscricaoCreateRequest(
        @NotNull(message = "Identificador do evento é obrigatório")
        Long eventoId,

        @NotNull(message = "Identificador da categoria é obrigatório")
        Long categoriaId,

        @Size(max = 30, message = "Contato deve ter até 30 caracteres")
        String numeroContato,

        @Size(max = 255, message = "Setor deve ter até 255 caracteres")
        String nomeSetor,

        @Size(max = 255, message = "Nome do usuário deve ter até 255 caracteres")
        String nomeUsuario,

        @Size(max = 255, message = "Matrícula deve ter até 255 caracteres")
        String matricula,

        Long idUsuarioExterno
) {
}
