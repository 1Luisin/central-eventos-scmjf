package br.org.santacasa.centraleventos.api.dto;

import br.org.santacasa.centraleventos.api.auth.AuthenticatedUser;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

public record UsuarioOperacaoContext(
        String usuarioLog,
        String nomeUsuario,
        String accessMode,
        boolean administradorInterno,
        Long idUsuarioExterno
) {

    public static UsuarioOperacaoContext fromAuthenticatedUser(AuthenticatedUser authenticatedUser) {
        return new UsuarioOperacaoContext(
                trimToNull(authenticatedUser.identifier()),
                trimToNull(authenticatedUser.displayName()),
                trimToNull(authenticatedUser.accessMode()),
                authenticatedUser.internalAdmin(),
                authenticatedUser.idUsuarioExterno()
        );
    }

    public boolean isAdministradorInterno() {
        return administradorInterno;
    }

    public boolean isInterno() {
        return "INTERNO".equalsIgnoreCase(accessMode);
    }

    public boolean isExterno() {
        return "EXTERNO".equalsIgnoreCase(accessMode);
    }

    public String usuarioParaAuditoria(String fallback) {
        if (usuarioLog != null && !usuarioLog.isBlank()) {
            return usuarioLog;
        }
        if (nomeUsuario != null && !nomeUsuario.isBlank()) {
            return nomeUsuario;
        }
        return fallback;
    }

    public boolean correspondeAoCriador(String identificadorCriador) {
        if (identificadorCriador == null || identificadorCriador.isBlank()) {
            return false;
        }

        return identificadoresRelacionados().contains(normalizarComparacao(identificadorCriador));
    }

    public Set<String> identificadoresRelacionados() {
        Set<String> identificadores = new LinkedHashSet<>();
        adicionarIdentificador(identificadores, usuarioLog);
        adicionarIdentificador(identificadores, nomeUsuario);
        return identificadores;
    }

    private void adicionarIdentificador(Set<String> identificadores, String valor) {
        String normalizado = normalizarComparacao(valor);
        if (normalizado != null) {
            identificadores.add(normalizado);
        }
    }

    private static String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String normalizarComparacao(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }
}
