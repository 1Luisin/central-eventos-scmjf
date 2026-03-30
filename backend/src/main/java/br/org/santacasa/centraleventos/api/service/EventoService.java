package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.dto.EventoCreateRequest;
import br.org.santacasa.centraleventos.api.dto.EventoResponse;
import br.org.santacasa.centraleventos.api.entity.Evento;
import br.org.santacasa.centraleventos.api.exception.BusinessRuleException;
import br.org.santacasa.centraleventos.api.exception.ResourceNotFoundException;
import br.org.santacasa.centraleventos.api.repository.EventoRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EventoService {

    private final EventoRepository eventoRepository;
    private final LogEventoService logEventoService;

    public EventoService(EventoRepository eventoRepository, LogEventoService logEventoService) {
        this.eventoRepository = eventoRepository;
        this.logEventoService = logEventoService;
    }

    @Transactional
    public EventoResponse criarEvento(EventoCreateRequest request, String usuarioLog) {
        if (!request.dataHoraFim().isAfter(request.dataHoraInicio())) {
            throw new BusinessRuleException("Data/hora final deve ser maior que a inicial");
        }

        Evento evento = new Evento();
        evento.setNmEvento(request.nomeEvento().trim());
        evento.setDhInicio(request.dataHoraInicio());
        evento.setDhFim(request.dataHoraFim());
        evento.setNmResponsavel(request.nomeResponsavel().trim());
        evento.setNmSetor(request.nomeSetor().trim());
        evento.setNrContato(request.numeroContato().trim());
        evento.setSnAtivo(normalizarFlag(request.ativo()));
        evento.setDescricao(trimToNull(request.descricao()));

        Evento salvo = eventoRepository.save(evento);

        logEventoService.registrarAcao(
                "Criou o evento " + salvo.getId() + " - " + salvo.getNmEvento(),
                logEventoService.normalizarUsuarioLog(usuarioLog, salvo.getNmResponsavel())
        );

        return toResponse(salvo);
    }

    @Transactional(readOnly = true)
    public List<EventoResponse> listarEventos() {
        return eventoRepository.findAll(Sort.by(Sort.Direction.ASC, "dhInicio"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EventoResponse buscarEventoPorId(Long eventoId) {
        return toResponse(buscarEntidadePorId(eventoId));
    }

    @Transactional(readOnly = true)
    public Evento buscarEntidadePorId(Long eventoId) {
        return eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado"));
    }

    private EventoResponse toResponse(Evento evento) {
        return new EventoResponse(
                evento.getId(),
                evento.getNmEvento(),
                evento.getDhInicio(),
                evento.getDhFim(),
                evento.getNmResponsavel(),
                evento.getNmSetor(),
                evento.getNrContato(),
                evento.getSnAtivo(),
                evento.getDescricao()
        );
    }

    private String normalizarFlag(String flag) {
        return flag.trim().toUpperCase();
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
