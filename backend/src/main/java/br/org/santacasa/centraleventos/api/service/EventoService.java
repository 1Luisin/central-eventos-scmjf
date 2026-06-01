package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.dto.EventoCreateRequest;
import br.org.santacasa.centraleventos.api.dto.EventoResponse;
import br.org.santacasa.centraleventos.api.dto.UsuarioOperacaoContext;
import br.org.santacasa.centraleventos.api.entity.Evento;
import br.org.santacasa.centraleventos.api.exception.BusinessRuleException;
import br.org.santacasa.centraleventos.api.exception.ResourceNotFoundException;
import br.org.santacasa.centraleventos.api.repository.EventoRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class EventoService {

    private final EventoRepository eventoRepository;
    private final LogEventoService logEventoService;
    private final EventoOwnershipService eventoOwnershipService;

    public EventoService(
            EventoRepository eventoRepository,
            LogEventoService logEventoService,
            EventoOwnershipService eventoOwnershipService
    ) {
        this.eventoRepository = eventoRepository;
        this.logEventoService = logEventoService;
        this.eventoOwnershipService = eventoOwnershipService;
    }

    @Transactional
    public EventoResponse criarEvento(EventoCreateRequest request, UsuarioOperacaoContext usuario) {
        eventoOwnershipService.validarAdministradorInterno(usuario);

        Evento evento = new Evento();
        preencherDadosEvento(evento, request);

        Evento salvo = eventoRepository.save(evento);

        logEventoService.registrarAcao(
                "Criou o evento " + salvo.getId() + " - " + salvo.getNmEvento(),
                logEventoService.normalizarUsuarioLog(usuario.usuarioParaAuditoria(salvo.getNmResponsavel()), salvo.getNmResponsavel())
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
    public List<EventoResponse> listarMeusEventos(UsuarioOperacaoContext usuario) {
        List<Long> eventoIds = eventoOwnershipService.listarIdsEventosCriados(usuario);
        Set<Long> eventosIncluidos = new LinkedHashSet<>();
        List<Evento> eventos = new ArrayList<>();

        for (Evento evento : eventoRepository.findAllById(eventoIds)) {
            if (eventosIncluidos.add(evento.getId())) {
                eventos.add(evento);
            }
        }

        if (usuario.nomeUsuario() != null && !usuario.nomeUsuario().isBlank()) {
            for (Evento evento : eventoRepository.findByNmResponsavelIgnoreCaseOrderByDhInicioAsc(usuario.nomeUsuario())) {
                if (eventosIncluidos.add(evento.getId())) {
                    eventos.add(evento);
                }
            }
        }

        return eventos
                .stream()
                .sorted(Comparator.comparing(Evento::getDhInicio))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EventoResponse buscarEventoPorId(Long eventoId) {
        return toResponse(buscarEntidadePorId(eventoId));
    }

    @Transactional
    public EventoResponse atualizarEvento(Long eventoId, EventoCreateRequest request, UsuarioOperacaoContext usuario) {
        Evento evento = buscarEntidadePorId(eventoId);
        eventoOwnershipService.validarPermissaoDeGestao(evento, usuario);

        preencherDadosEvento(evento, request);

        Evento salvo = eventoRepository.save(evento);

        logEventoService.registrarAcao(
                "Atualizou o evento " + salvo.getId() + " - " + salvo.getNmEvento(),
                logEventoService.normalizarUsuarioLog(usuario.usuarioParaAuditoria(salvo.getNmResponsavel()), salvo.getNmResponsavel())
        );

        return toResponse(salvo);
    }

    @Transactional(readOnly = true)
    public Evento buscarEntidadePorId(Long eventoId) {
        return eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado"));
    }

    public void validarPermissaoDeGestao(Evento evento, UsuarioOperacaoContext usuario) {
        eventoOwnershipService.validarPermissaoDeGestao(evento, usuario);
    }

    private void preencherDadosEvento(Evento evento, EventoCreateRequest request) {
        validarDatas(request);
        evento.setNmEvento(request.nomeEvento().trim());
        evento.setDhInicio(request.dataHoraInicio());
        evento.setDhFim(request.dataHoraFim());
        evento.setNmResponsavel(request.nomeResponsavel().trim());
        evento.setNmSetor(request.nomeSetor().trim());
        evento.setNrContato(request.numeroContato().trim());
        evento.setSnAtivo(normalizarFlag(request.ativo()));
        evento.setDescricao(trimToNull(request.descricao()));
    }

    private void validarDatas(EventoCreateRequest request) {
        if (!request.dataHoraFim().isAfter(request.dataHoraInicio())) {
            throw new BusinessRuleException("Data/hora final deve ser maior que a inicial");
        }
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
