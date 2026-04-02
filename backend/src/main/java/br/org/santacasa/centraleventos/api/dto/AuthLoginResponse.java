package br.org.santacasa.centraleventos.api.dto;

public record AuthLoginResponse<T>(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        T usuario
) {
}
