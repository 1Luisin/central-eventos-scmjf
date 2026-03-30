package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.entity.LogEvento;
import br.org.santacasa.centraleventos.api.repository.LogEventoRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class LogEventoService {

    private final LogEventoRepository logEventoRepository;

    public LogEventoService(LogEventoRepository logEventoRepository) {
        this.logEventoRepository = logEventoRepository;
    }

    public void registrarAcao(String acao, String codigoUsuario) {
        LogEvento logEvento = new LogEvento();
        logEvento.setNmAcao(acao);
        logEvento.setCdUsuario(normalizarUsuarioLog(codigoUsuario, "SISTEMA"));
        logEvento.setDhLog(LocalDateTime.now());

        logEventoRepository.save(logEvento);
    }

    public String normalizarUsuarioLog(String usuarioLog, String fallback) {
        if (usuarioLog != null && !usuarioLog.isBlank()) {
            return usuarioLog.trim();
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback.trim();
        }
        return "SISTEMA";
    }
}
