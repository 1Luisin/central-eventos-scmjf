package br.org.santacasa.centraleventos.api.dto;

public record UsuarioInternoResponse(
        String matricula,
        String nomeUsuario,
        String email,
        String ativo,
        String situacao,
        String codigoPapel,
        String tipoUsuario,
        Long prestador
) {
}
