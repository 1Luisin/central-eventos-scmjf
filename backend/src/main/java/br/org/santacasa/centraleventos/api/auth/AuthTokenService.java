package br.org.santacasa.centraleventos.api.auth;

import br.org.santacasa.centraleventos.api.exception.AuthenticationFailedException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AuthTokenService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();

    private final ObjectMapper objectMapper;
    private final byte[] signingKey;
    private final long expirationSeconds;

    public AuthTokenService(
            ObjectMapper objectMapper,
            @Value("${app.auth.token.secret:}") String tokenSecret,
            @Value("${app.auth.token.expiration-seconds:28800}") long expirationSeconds
    ) {
        this.objectMapper = objectMapper;
        this.signingKey = resolveSigningKey(tokenSecret);
        this.expirationSeconds = expirationSeconds;
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }

    public String issueToken(AuthenticatedUser user) {
        try {
            Instant now = Instant.now();

            Map<String, Object> header = Map.of(
                    "alg", "HS256",
                    "typ", "CET"
            );

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", user.identifier());
            payload.put("am", user.accessMode());
            payload.put("dn", user.displayName());
            payload.put("adm", user.internalAdmin());
            payload.put("pap", user.codigoPapel());
            payload.put("mat", user.matricula());
            payload.put("uid", user.idUsuarioExterno());
            payload.put("em", user.email());
            payload.put("cpf", user.cpf());
            payload.put("ph", user.numeroTelefone());
            payload.put("iat", now.getEpochSecond());
            payload.put("exp", now.plusSeconds(expirationSeconds).getEpochSecond());

            String encodedHeader = encodeSegment(objectMapper.writeValueAsBytes(header));
            String encodedPayload = encodeSegment(objectMapper.writeValueAsBytes(payload));
            String signature = sign(encodedHeader + "." + encodedPayload);

            return encodedHeader + "." + encodedPayload + "." + signature;
        } catch (Exception exception) {
            throw new IllegalStateException("Não foi possível gerar o token de autenticação.", exception);
        }
    }

    public AuthenticatedUser validateToken(String token) {
        try {
            String[] segments = token.split("\\.");
            if (segments.length != 3) {
                throw invalidToken();
            }

            String content = segments[0] + "." + segments[1];
            String expectedSignature = sign(content);

            if (!MessageDigest.isEqual(
                    expectedSignature.getBytes(StandardCharsets.UTF_8),
                    segments[2].getBytes(StandardCharsets.UTF_8)
            )) {
                throw invalidToken();
            }

            Map<String, Object> payload = objectMapper.readValue(
                    URL_DECODER.decode(segments[1]),
                    new TypeReference<>() {
                    }
            );

            long expiration = readLong(payload.get("exp"));
            if (Instant.now().getEpochSecond() >= expiration) {
                throw new AuthenticationFailedException("Sessão expirada. Faça login novamente para continuar.");
            }

            return new AuthenticatedUser(
                    readString(payload.get("am")),
                    readString(payload.get("sub")),
                    readString(payload.get("dn")),
                    Boolean.TRUE.equals(payload.get("adm")),
                    readString(payload.get("pap")),
                    readString(payload.get("mat")),
                    readLongObject(payload.get("uid")),
                    readString(payload.get("em")),
                    readString(payload.get("cpf")),
                    readString(payload.get("ph"))
            );
        } catch (AuthenticationFailedException exception) {
            throw exception;
        } catch (Exception exception) {
            throw invalidToken();
        }
    }

    private byte[] resolveSigningKey(String tokenSecret) {
        if (tokenSecret == null || tokenSecret.isBlank()) {
            throw new IllegalStateException(
                    "A propriedade app.auth.token.secret deve estar configurada para habilitar a autenticação da API."
            );
        }

        return tokenSecret.trim().getBytes(StandardCharsets.UTF_8);
    }

    private String encodeSegment(byte[] bytes) {
        return URL_ENCODER.encodeToString(bytes);
    }

    private String sign(String content) throws Exception {
        Mac mac = Mac.getInstance(HMAC_ALGORITHM);
        mac.init(new SecretKeySpec(signingKey, HMAC_ALGORITHM));
        return URL_ENCODER.encodeToString(mac.doFinal(content.getBytes(StandardCharsets.UTF_8)));
    }

    private String readString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private long readLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value != null) {
            return Long.parseLong(String.valueOf(value));
        }
        throw invalidToken();
    }

    private Long readLongObject(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }

    private AuthenticationFailedException invalidToken() {
        return new AuthenticationFailedException("Sessão inválida. Faça login novamente para continuar.");
    }
}
