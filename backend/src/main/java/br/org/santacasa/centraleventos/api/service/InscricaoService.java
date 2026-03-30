package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.dto.InscricaoCreateRequest;
import br.org.santacasa.centraleventos.api.dto.InscricaoResponse;
import br.org.santacasa.centraleventos.api.entity.Categoria;
import br.org.santacasa.centraleventos.api.entity.Evento;
import br.org.santacasa.centraleventos.api.entity.Inscricao;
import br.org.santacasa.centraleventos.api.exception.BusinessRuleException;
import br.org.santacasa.centraleventos.api.exception.ResourceNotFoundException;
import br.org.santacasa.centraleventos.api.repository.CategoriaRepository;
import br.org.santacasa.centraleventos.api.repository.InscricaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InscricaoService {

    private final InscricaoRepository inscricaoRepository;
    private final CategoriaRepository categoriaRepository;
    private final EventoService eventoService;
    private final LogEventoService logEventoService;

    public InscricaoService(
            InscricaoRepository inscricaoRepository,
            CategoriaRepository categoriaRepository,
            EventoService eventoService,
            LogEventoService logEventoService
    ) {
        this.inscricaoRepository = inscricaoRepository;
        this.categoriaRepository = categoriaRepository;
        this.eventoService = eventoService;
        this.logEventoService = logEventoService;
    }

    @Transactional
    public InscricaoResponse criarInscricao(InscricaoCreateRequest request, String usuarioLog) {
        Evento evento = eventoService.buscarEntidadePorId(request.eventoId());
        Categoria categoria = categoriaRepository.findByIdForUpdate(request.categoriaId())
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));

        validarVinculoEventoCategoria(evento, categoria);
        validarAtivacao(evento, categoria);
        validarDuplicidade(request.categoriaId(), request.matricula());
        validarLimiteDeVagas(categoria);

        Inscricao inscricao = new Inscricao();
        inscricao.setEvento(evento);
        inscricao.setCategoria(categoria);
        inscricao.setNrContato(request.numeroContato().trim());
        inscricao.setDhRegistro(LocalDateTime.now());
        inscricao.setNmSetor(request.nomeSetor().trim());
        inscricao.setNmUsuario(request.nomeUsuario().trim());
        inscricao.setMatricula(request.matricula().trim());

        Inscricao salva = inscricaoRepository.save(inscricao);

        logEventoService.registrarAcao(
                "Criou a inscrição " + salva.getId() + " no evento " + evento.getId() + " e categoria " + categoria.getId(),
                logEventoService.normalizarUsuarioLog(usuarioLog, salva.getMatricula())
        );

        return toResponse(salva);
    }

    @Transactional
    public void cancelarInscricao(Long inscricaoId, String usuarioLog) {
        Inscricao inscricao = inscricaoRepository.findDetalhadaById(inscricaoId)
                .orElseThrow(() -> new ResourceNotFoundException("Inscrição não encontrada"));

        inscricaoRepository.delete(inscricao);

        logEventoService.registrarAcao(
                "Cancelou a inscrição " + inscricao.getId() + " do evento " + inscricao.getEvento().getId()
                        + " e categoria " + inscricao.getCategoria().getId(),
                logEventoService.normalizarUsuarioLog(usuarioLog, inscricao.getMatricula())
        );
    }

    @Transactional(readOnly = true)
    public List<InscricaoResponse> listarPorEvento(Long eventoId) {
        eventoService.buscarEntidadePorId(eventoId);

        return inscricaoRepository.findByEvento_IdOrderByDhRegistroDesc(eventoId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private void validarVinculoEventoCategoria(Evento evento, Categoria categoria) {
        if (!categoria.getEvento().getId().equals(evento.getId())) {
            throw new BusinessRuleException("Categoria não pertence ao evento informado");
        }
    }

    private void validarAtivacao(Evento evento, Categoria categoria) {
        if (isInativo(evento.getSnAtivo())) {
            throw new BusinessRuleException("Evento inativo");
        }
        if (isInativo(categoria.getSnAtivo())) {
            throw new BusinessRuleException("Categoria inativa");
        }
    }

    private void validarDuplicidade(Long categoriaId, String matricula) {
        if (inscricaoRepository.existsByCategoria_IdAndMatriculaIgnoreCase(categoriaId, matricula.trim())) {
            throw new BusinessRuleException("Usuário já inscrito");
        }
    }

    private void validarLimiteDeVagas(Categoria categoria) {
        long inscricoesRealizadas = inscricaoRepository.countByCategoria_Id(categoria.getId());
        if (inscricoesRealizadas >= categoria.getNrInscricoes()) {
            throw new BusinessRuleException("Categoria lotada");
        }
    }

    private boolean isInativo(String flag) {
        return flag == null || !"S".equalsIgnoreCase(flag.trim());
    }

    private InscricaoResponse toResponse(Inscricao inscricao) {
        return new InscricaoResponse(
                inscricao.getId(),
                inscricao.getEvento().getId(),
                inscricao.getCategoria().getId(),
                inscricao.getNrContato(),
                inscricao.getDhRegistro(),
                inscricao.getNmSetor(),
                inscricao.getNmUsuario(),
                inscricao.getMatricula()
        );
    }
}
