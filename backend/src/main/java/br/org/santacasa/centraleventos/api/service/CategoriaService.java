package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.dto.CategoriaCreateRequest;
import br.org.santacasa.centraleventos.api.dto.CategoriaResponse;
import br.org.santacasa.centraleventos.api.dto.UsuarioOperacaoContext;
import br.org.santacasa.centraleventos.api.entity.Categoria;
import br.org.santacasa.centraleventos.api.entity.Evento;
import br.org.santacasa.centraleventos.api.exception.BusinessRuleException;
import br.org.santacasa.centraleventos.api.exception.ResourceNotFoundException;
import br.org.santacasa.centraleventos.api.repository.CategoriaRepository;
import br.org.santacasa.centraleventos.api.repository.InscricaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final InscricaoRepository inscricaoRepository;
    private final EventoService eventoService;
    private final LogEventoService logEventoService;

    public CategoriaService(
            CategoriaRepository categoriaRepository,
            InscricaoRepository inscricaoRepository,
            EventoService eventoService,
            LogEventoService logEventoService
    ) {
        this.categoriaRepository = categoriaRepository;
        this.inscricaoRepository = inscricaoRepository;
        this.eventoService = eventoService;
        this.logEventoService = logEventoService;
    }

    @Transactional
    public CategoriaResponse criarCategoria(CategoriaCreateRequest request, UsuarioOperacaoContext usuario) {
        Evento evento = eventoService.buscarEntidadePorId(request.eventoId());
        eventoService.validarPermissaoDeGestao(evento, usuario);

        Categoria categoria = new Categoria();
        categoria.setEvento(evento);
        preencherCategoria(categoria, request);

        Categoria salva = categoriaRepository.save(categoria);

        logEventoService.registrarAcao(
                "Criou a categoria " + salva.getId() + " - " + salva.getNmCategoria() + " no evento " + evento.getId(),
                logEventoService.normalizarUsuarioLog(usuario.usuarioParaAuditoria(evento.getNmResponsavel()), evento.getNmResponsavel())
        );

        return toResponse(salva, 0L);
    }

    @Transactional
    public CategoriaResponse atualizarCategoria(Long categoriaId, CategoriaCreateRequest request, UsuarioOperacaoContext usuario) {
        Categoria categoria = buscarEntidadePorId(categoriaId);
        Evento evento = categoria.getEvento();
        eventoService.validarPermissaoDeGestao(evento, usuario);

        if (!evento.getId().equals(request.eventoId())) {
            throw new BusinessRuleException("A categoria só pode ser atualizada dentro do evento original.");
        }

        long inscricoesRealizadas = inscricaoRepository.countByCategoria_Id(categoria.getId());
        validarLimiteNaoMenorQueInscricoes(request.limiteInscricoes(), inscricoesRealizadas);

        preencherCategoria(categoria, request);
        Categoria salva = categoriaRepository.save(categoria);

        logEventoService.registrarAcao(
                "Atualizou a categoria " + salva.getId() + " - " + salva.getNmCategoria() + " no evento " + evento.getId(),
                logEventoService.normalizarUsuarioLog(usuario.usuarioParaAuditoria(evento.getNmResponsavel()), evento.getNmResponsavel())
        );

        return toResponse(salva, inscricoesRealizadas);
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listarPorEvento(Long eventoId) {
        List<Categoria> categorias = categoriaRepository.findByEvento_IdOrderByIdAsc(eventoId);

        if (categorias.isEmpty()) {
            eventoService.buscarEntidadePorId(eventoId);
        }

        return categorias
                .stream()
                .map(categoria -> toResponse(categoria, inscricaoRepository.countByCategoria_Id(categoria.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public Categoria buscarEntidadePorId(Long categoriaId) {
        return categoriaRepository.findById(categoriaId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
    }

    private void preencherCategoria(Categoria categoria, CategoriaCreateRequest request) {
        categoria.setNmCategoria(request.nomeCategoria().trim());
        categoria.setSnExterno(normalizarFlag(request.externo()));
        categoria.setDescricao(trimToNull(request.descricao()));
        categoria.setSnAtivo(normalizarFlag(request.ativo()));
        categoria.setNrInscricoes(request.limiteInscricoes());
        categoria.setDhFimInsc(request.dataHoraFimInscricao());
    }

    private void validarLimiteNaoMenorQueInscricoes(Long limiteInscricoes, long inscricoesRealizadas) {
        if (limiteInscricoes != null && limiteInscricoes < inscricoesRealizadas) {
            throw new BusinessRuleException(
                    "O limite de vagas não pode ser menor que o número de inscrições já registradas."
            );
        }
    }

    private CategoriaResponse toResponse(Categoria categoria, long inscricoesRealizadas) {
        long vagasDisponiveis = Math.max(categoria.getNrInscricoes() - inscricoesRealizadas, 0);

        return new CategoriaResponse(
                categoria.getId(),
                categoria.getEvento().getId(),
                categoria.getNmCategoria(),
                categoria.getSnExterno(),
                categoria.getDescricao(),
                categoria.getSnAtivo(),
                categoria.getNrInscricoes(),
                categoria.getDhFimInsc(),
                inscricoesRealizadas,
                vagasDisponiveis
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
