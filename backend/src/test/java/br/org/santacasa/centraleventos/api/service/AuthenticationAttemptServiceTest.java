package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.exception.TooManyRequestsException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AuthenticationAttemptServiceTest {

    @Test
    void deveBloquearNovasTentativasAposAtingirOLimite() {
        AuthenticationAttemptService service = new AuthenticationAttemptService(2, 15);

        service.registerFailure("LOGIN_INTERNO", "F19033");
        assertDoesNotThrow(() -> service.assertCanAttempt("LOGIN_INTERNO", "F19033"));

        service.registerFailure("LOGIN_INTERNO", "F19033");

        assertThrows(
                TooManyRequestsException.class,
                () -> service.assertCanAttempt("LOGIN_INTERNO", "F19033")
        );
    }

    @Test
    void deveLiberarNovasTentativasAposSucesso() {
        AuthenticationAttemptService service = new AuthenticationAttemptService(3, 15);

        service.registerFailure("LOGIN_EXTERNO", "maria@email.com");
        service.registerSuccess("LOGIN_EXTERNO", "maria@email.com");

        assertDoesNotThrow(() -> service.assertCanAttempt("LOGIN_EXTERNO", "maria@email.com"));
    }
}
