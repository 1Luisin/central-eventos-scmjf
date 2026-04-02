package br.org.santacasa.centraleventos.api.auth;

import br.org.santacasa.centraleventos.api.exception.AuthenticationFailedException;
import jakarta.servlet.http.HttpServletRequest;

public final class AuthenticatedRequest {

    public static final String ATTRIBUTE_NAME = AuthenticatedUser.class.getName();

    private AuthenticatedRequest() {
    }

    public static AuthenticatedUser require(HttpServletRequest request) {
        Object attribute = request.getAttribute(ATTRIBUTE_NAME);

        if (attribute instanceof AuthenticatedUser authenticatedUser) {
            return authenticatedUser;
        }

        throw new AuthenticationFailedException("Sessão inválida. Faça login novamente para continuar.");
    }
}
