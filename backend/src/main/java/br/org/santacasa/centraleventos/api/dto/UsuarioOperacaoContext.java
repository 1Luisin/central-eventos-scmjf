package br.org.santacasa.centraleventos.api.dto;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

public record UsuarioOperacaoContext(
        String usuarioLog,
        String nomeUsuario,
        String tipoUsuario
) {

    public static UsuarioOperacaoContext of(String usuarioLog, String nomeUsuario, String tipoUsuario) {
        return new UsuarioOperacaoContext(trimToNull(usuarioLog), trimToNull(nomeUsuario), trimToNull(tipoUsuario));
    }

    public boolean isAdministradorInterno() {
        if (tipoUsuario == null) {
            return false;
        }

        String normalizado = tipoUsuario.trim().toUpperCase(Locale.ROOT);
        return "ADMINISTRADOR".equals(normalizado) || "ADMINISTRADOR_INTERNO".equals(normalizado);
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
