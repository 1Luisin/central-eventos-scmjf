package br.org.santacasa.centraleventos.api.auth;

import br.org.santacasa.centraleventos.api.exception.AuthenticationFailedException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class ApiAuthenticationInterceptor implements HandlerInterceptor {

    private final AuthTokenService authTokenService;

    public ApiAuthenticationInterceptor(AuthTokenService authTokenService) {
        this.authTokenService = authTokenService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || authorization.isBlank() || !authorization.startsWith("Bearer ")) {
            throw new AuthenticationFailedException("Sessão inválida. Faça login novamente para continuar.");
        }

        String token = authorization.substring("Bearer ".length()).trim();
        if (token.isBlank()) {
            throw new AuthenticationFailedException("Sessão inválida. Faça login novamente para continuar.");
        }

        request.setAttribute(AuthenticatedRequest.ATTRIBUTE_NAME, authTokenService.validateToken(token));
        return true;
    }
}
