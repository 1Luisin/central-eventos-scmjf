package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.dto.UsuarioOperacaoContext;
import br.org.santacasa.centraleventos.api.entity.Evento;
import br.org.santacasa.centraleventos.api.exception.AccessDeniedException;
import br.org.santacasa.centraleventos.api.repository.LogEventoRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class EventoOwnershipService {

    private final LogEventoRepository logEventoRepository;

    public EventoOwnershipService(LogEventoRepository logEventoRepository) {
        this.logEventoRepository = logEventoRepository;
    }

    public void validarAdministradorInterno(UsuarioOperacaoContext usuario) {
        if (usuario == null || !usuario.isAdministradorInterno()) {
            throw new AccessDeniedException("Área administrativa disponível somente para administradores internos");
        }
    }

    public void validarPermissaoDeGestao(Evento evento, UsuarioOperacaoContext usuario) {
        validarAdministradorInterno(usuario);

        String criador = logEventoRepository.findCriadorDoEvento(evento.getId()).orElse(null);

        if (!usuario.correspondeAoCriador(criador) && !usuario.correspondeAoCriador(evento.getNmResponsavel())) {
            throw new AccessDeniedException("Somente o administrador que criou o evento pode gerenciá-lo");
        }
    }

    public List<Long> listarIdsEventosCriados(UsuarioOperacaoContext usuario) {
        validarAdministradorInterno(usuario);

        Set<Long> eventoIds = new LinkedHashSet<>();
        for (String identificador : usuario.identificadoresRelacionados()) {
            for (Number eventoId : logEventoRepository.findIdsEventosCriadosPorUsuario(identificador)) {
                if (eventoId != null) {
                    eventoIds.add(eventoId.longValue());
                }
            }
        }

        return new ArrayList<>(eventoIds);
    }
}
