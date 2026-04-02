package br.org.santacasa.centraleventos.api.auth;

public record AuthenticatedUser(
        String accessMode,
        String identifier,
        String displayName,
        boolean internalAdmin,
        String codigoPapel,
        String matricula,
        Long idUsuarioExterno,
        String email,
        String cpf,
        String numeroTelefone
) {
}
