package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.exception.TooManyRequestsException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthenticationAttemptService {

    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();
    private final int maxAttempts;
    private final long lockMinutes;

    public AuthenticationAttemptService(
            @Value("${app.security.auth.max-attempts:5}") int maxAttempts,
            @Value("${app.security.auth.lock-minutes:15}") long lockMinutes
    ) {
        this.maxAttempts = maxAttempts;
        this.lockMinutes = lockMinutes;
    }

    public void assertCanAttempt(String scope, String identifier) {
        String key = buildKey(scope, identifier);
        if (key == null) {
            return;
        }

        AttemptState state = attempts.get(key);
        if (state == null) {
            return;
        }

        if (state.blockedUntil() == null) {
            return;
        }

        if (state.blockedUntil().isAfter(LocalDateTime.now())) {
            throw new TooManyRequestsException("Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.");
        }

        attempts.remove(key);
    }

    public void registerFailure(String scope, String identifier) {
        String key = buildKey(scope, identifier);
        if (key == null) {
            return;
        }

        attempts.compute(key, (ignored, current) -> {
            LocalDateTime now = LocalDateTime.now();
            int failures = current == null ? 1 : current.failures() + 1;
            LocalDateTime blockedUntil = failures >= maxAttempts ? now.plusMinutes(lockMinutes) : null;
            return new AttemptState(failures, blockedUntil);
        });
    }

    public void registerSuccess(String scope, String identifier) {
        String key = buildKey(scope, identifier);
        if (key != null) {
            attempts.remove(key);
        }
    }

    private String buildKey(String scope, String identifier) {
        if (scope == null || scope.isBlank() || identifier == null || identifier.isBlank()) {
            return null;
        }

        return scope.trim().toUpperCase(Locale.ROOT) + ":" + identifier.trim().toUpperCase(Locale.ROOT);
    }

    private record AttemptState(int failures, LocalDateTime blockedUntil) {
    }
}
