package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.exception.BusinessRuleException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordPolicyServiceTest {

    private final PasswordPolicyService service = new PasswordPolicyService();

    @Test
    void deveAceitarSenhaForte() {
        assertDoesNotThrow(() -> service.validateOrThrow("Senha@2026"));
    }

    @Test
    void deveRejeitarSenhaSemMaiuscula() {
        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> service.validateOrThrow("senha@2026")
        );

        assertTrue(exception.getMessage().contains("mai"));
    }

    @Test
    void deveRejeitarSenhaSemCaractereEspecial() {
        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> service.validateOrThrow("Senha2026")
        );

        assertTrue(exception.getMessage().contains("especial"));
    }

    @Test
    void deveRejeitarSenhaComEspacos() {
        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> service.validateOrThrow("Senha @2026")
        );

        assertTrue(exception.getMessage().contains("esp"));
    }
}
