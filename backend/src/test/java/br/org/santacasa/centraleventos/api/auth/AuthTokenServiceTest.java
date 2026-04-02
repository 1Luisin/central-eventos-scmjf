package br.org.santacasa.centraleventos.api.auth;

import br.org.santacasa.centraleventos.api.exception.AuthenticationFailedException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthTokenServiceTest {

    @Test
    void deveEmitirEValidarTokenAssinado() {
        AuthTokenService service = new AuthTokenService(new ObjectMapper(), "segredo-de-teste", 600);
        AuthenticatedUser expectedUser = new AuthenticatedUser(
                "INTERNO",
                "F19033",
                "Luis Guilherme",
                true,
                "653",
                "F19033",
                null,
                "luis@santacasajf.org.br",
                null,
                null
        );

        String token = service.issueToken(expectedUser);
        AuthenticatedUser validatedUser = service.validateToken(token);

        assertFalse(token.isBlank());
        assertEquals(expectedUser.identifier(), validatedUser.identifier());
        assertEquals(expectedUser.displayName(), validatedUser.displayName());
        assertEquals(expectedUser.codigoPapel(), validatedUser.codigoPapel());
        assertTrue(validatedUser.internalAdmin());
    }

    @Test
    void deveRejeitarTokenAlterado() {
        AuthTokenService service = new AuthTokenService(new ObjectMapper(), "segredo-de-teste", 600);
        String token = service.issueToken(new AuthenticatedUser(
                "EXTERNO",
                "maria@email.com",
                "Maria Eduarda",
                false,
                null,
                null,
                12L,
                "maria@email.com",
                "12345678901",
                "32999999999"
        ));

        String tokenAlterado = token.substring(0, token.length() - 1) + "x";

        assertThrows(AuthenticationFailedException.class, () -> service.validateToken(tokenAlterado));
    }

    @Test
    void deveRejeitarTokenExpirado() {
        AuthTokenService service = new AuthTokenService(new ObjectMapper(), "segredo-de-teste", -1);
        String token = service.issueToken(new AuthenticatedUser(
                "INTERNO",
                "F19033",
                "Luis Guilherme",
                true,
                "653",
                "F19033",
                null,
                "luis@santacasajf.org.br",
                null,
                null
        ));

        assertThrows(AuthenticationFailedException.class, () -> service.validateToken(token));
    }
}
