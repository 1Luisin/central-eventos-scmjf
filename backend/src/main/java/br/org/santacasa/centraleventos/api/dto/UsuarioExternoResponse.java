package br.org.santacasa.centraleventos.api.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record UsuarioExternoResponse(
        Long idUsuarioExterno,
        String nomeCompleto,
        String cpf,
        String email,
        String numeroTelefone,
        LocalDate dataNascimento,
        String ativo,
        String aceiteLgpd,
        LocalDateTime dataCadastro,
        LocalDateTime dataUltimaAtualizacao,
        LocalDateTime dataUltimoAcesso
) {
}
