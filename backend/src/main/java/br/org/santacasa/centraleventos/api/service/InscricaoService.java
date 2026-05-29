package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.dto.InscricaoCreateRequest;
import br.org.santacasa.centraleventos.api.dto.InscricaoResponse;
import br.org.santacasa.centraleventos.api.dto.UsuarioOperacaoContext;
import br.org.santacasa.centraleventos.api.entity.Categoria;
import br.org.santacasa.centraleventos.api.entity.Evento;
import br.org.santacasa.centraleventos.api.entity.Inscricao;
import br.org.santacasa.centraleventos.api.entity.UsuarioExterno;
import br.org.santacasa.centraleventos.api.exception.AccessDeniedException;
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

    private static final String SETOR_PUBLICO_EXTERNO = "Público externo";

    private final InscricaoRepository inscricaoRepository;
    private final CategoriaRepository categoriaRepository;
    private final EventoService eventoService;
    private final LogEventoService logEventoService;
    private final UsuarioExternoService usuarioExternoService;

    public InscricaoService(
            InscricaoRepository inscricaoRepository,
            CategoriaRepository categoriaRepository,
            EventoService eventoService,
            LogEventoService logEventoService,
            UsuarioExternoService usuarioExternoService
    ) {
        this.inscricaoRepository = inscricaoRepository;
        this.categoriaRepository = categoriaRepository;
        this.eventoService = eventoService;
        this.logEventoService = logEventoService;
        this.usuarioExternoService = usuarioExternoService;
    }

    @Transactional
    public InscricaoResponse criarInscricao(InscricaoCreateRequest request, UsuarioOperacaoContext usuario) {
        Evento evento = eventoService.buscarEntidadePorId(request.eventoId());
        Categoria categoria = categoriaRepository.findByIdForUpdate(request.categoriaId())
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));

        validarVinculoEventoCategoria(evento, categoria);
        validarAtivacao(evento, categoria);
        validarPrazoInscricao(categoria);
        validarLimiteDeVagas(categoria);

        Inscricao inscricao = new Inscricao();
        inscricao.setEvento(evento);
        inscricao.setCategoria(categoria);
        inscricao.setDhRegistro(LocalDateTime.now());

        String identificadorParticipante;

        if (usuario.isExterno()) {
            if (usuario.idUsuarioExterno() == null) {
                throw new AccessDeniedException("Sessão externa inválida. Faça login novamente para continuar.");
            }

            UsuarioExterno usuarioExterno = usuarioExternoService.buscarEntidadePorId(usuario.idUsuarioExterno());
            validarInscricaoExterna(categoria, usuarioExterno);
            validarDuplicidadeExterna(request.categoriaId(), usuarioExterno.getId());

            inscricao.setUsuarioExterno(usuarioExterno);
            inscricao.setNrContato(normalizarContatoExterno(request.numeroContato(), usuarioExterno));
            inscricao.setNmSetor(SETOR_PUBLICO_EXTERNO);
            inscricao.setNmUsuario(usuarioExterno.getNmCompleto());
            inscricao.setMatricula(usuarioExterno.getNrCpf());
            identificadorParticipante = usuarioExterno.getDsEmail();
        } else if (usuario.isInterno()) {
            validarCamposInscricaoInterna(request);
            validarDuplicidadeInterna(request.categoriaId(), usuario.usuarioLog());

            inscricao.setNrContato(request.numeroContato().trim());
            inscricao.setNmSetor(request.nomeSetor().trim());
            inscricao.setNmUsuario(usuario.nomeUsuario());
            inscricao.setMatricula(usuario.usuarioLog());
            identificadorParticipante = usuario.usuarioLog();
        } else {
            throw new AccessDeniedException("Sessão inválida. Faça login novamente para continuar.");
        }

        Inscricao salva = inscricaoRepository.save(inscricao);

        logEventoService.registrarAcao(
                "Criou a inscrição " + salva.getId() + " no evento " + evento.getId() + " e categoria " + categoria.getId(),
                logEventoService.normalizarUsuarioLog(usuario.usuarioParaAuditoria(identificadorParticipante), identificadorParticipante)
        );

        return toResponse(salva);
    }

    @Transactional
    public void cancelarInscricao(Long inscricaoId, UsuarioOperacaoContext usuario) {
        Inscricao inscricao = inscricaoRepository.findDetalhadaById(inscricaoId)
                .orElseThrow(() -> new ResourceNotFoundException("Inscrição não encontrada"));
        eventoService.validarPermissaoDeGestao(inscricao.getEvento(), usuario);

        inscricaoRepository.delete(inscricao);

        String identificadorParticipante = inscricao.getUsuarioExterno() != null
                ? inscricao.getUsuarioExterno().getDsEmail()
                : inscricao.getMatricula();

        logEventoService.registrarAcao(
                "Cancelou a inscrição " + inscricao.getId() + " do evento " + inscricao.getEvento().getId()
                        + " e categoria " + inscricao.getCategoria().getId(),
                logEventoService.normalizarUsuarioLog(usuario.usuarioParaAuditoria(identificadorParticipante), identificadorParticipante)
        );
    }

    @Transactional(readOnly = true)
    public List<InscricaoResponse> listarPorEvento(Long eventoId, UsuarioOperacaoContext usuario) {
        Evento evento = eventoService.buscarEntidadePorId(eventoId);
        eventoService.validarPermissaoDeGestao(evento, usuario);

        return inscricaoRepository.findByEvento_IdOrderByDhRegistroDesc(eventoId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InscricaoResponse> listarMinhasInscricoes(UsuarioOperacaoContext usuario) {
        if (usuario.isExterno()) {
            if (usuario.idUsuarioExterno() == null) {
                throw new AccessDeniedException("Sessão externa inválida. Faça login novamente para continuar.");
            }

            return inscricaoRepository.findByUsuarioExternoIdDetalhadaOrderByDhRegistroDesc(usuario.idUsuarioExterno())
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        if (usuario.isInterno()) {
            if (usuario.usuarioLog() == null || usuario.usuarioLog().isBlank()) {
                throw new AccessDeniedException("Sessão interna inválida. Faça login novamente para continuar.");
            }

            return inscricaoRepository.findByMatriculaDetalhadaOrderByDhRegistroDesc(usuario.usuarioLog())
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        throw new AccessDeniedException("Sessão inválida. Faça login novamente para continuar.");
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

    private void validarInscricaoExterna(Categoria categoria, UsuarioExterno usuarioExterno) {
        if (isInativo(usuarioExterno.getFlAtivo())) {
            throw new BusinessRuleException("Cadastro externo inativo");
        }
        if (!"S".equalsIgnoreCase(categoria.getSnExterno())) {
            throw new BusinessRuleException("Categoria não permite inscrições externas");
        }
    }

    private void validarCamposInscricaoInterna(InscricaoCreateRequest request) {
        if (request.numeroContato() == null || request.numeroContato().isBlank()) {
            throw new BusinessRuleException("Contato é obrigatório");
        }
        if (request.nomeSetor() == null || request.nomeSetor().isBlank()) {
            throw new BusinessRuleException("Setor é obrigatório");
        }
    }

    private void validarDuplicidadeInterna(Long categoriaId, String matricula) {
        if (inscricaoRepository.existsByCategoria_IdAndMatriculaIgnoreCase(categoriaId, matricula.trim())) {
            throw new BusinessRuleException("Usuário já inscrito");
        }
    }

    private void validarDuplicidadeExterna(Long categoriaId, Long usuarioExternoId) {
        if (inscricaoRepository.existsByCategoria_IdAndUsuarioExterno_Id(categoriaId, usuarioExternoId)) {
            throw new BusinessRuleException("Usuário externo já inscrito");
        }
    }

    private void validarLimiteDeVagas(Categoria categoria) {
        long inscricoesRealizadas = inscricaoRepository.countByCategoria_Id(categoria.getId());
        if (inscricoesRealizadas >= categoria.getNrInscricoes()) {
            throw new BusinessRuleException("Categoria lotada");
        }
    }

    private void validarPrazoInscricao(Categoria categoria) {
        if (categoria.getDhFimInsc() != null && LocalDateTime.now().isAfter(categoria.getDhFimInsc())) {
            throw new BusinessRuleException("Prazo de inscrição encerrado para esta categoria");
        }
    }

    private String normalizarContatoExterno(String numeroContato, UsuarioExterno usuarioExterno) {
        if (numeroContato != null && !numeroContato.isBlank()) {
            return numeroContato.trim();
        }
        if (usuarioExterno.getNrTelefone() != null && !usuarioExterno.getNrTelefone().isBlank()) {
            return usuarioExterno.getNrTelefone().trim();
        }
        throw new BusinessRuleException("Contato é obrigatório");
    }

    private boolean isInativo(String flag) {
        return flag == null || !"S".equalsIgnoreCase(flag.trim());
    }

    private InscricaoResponse toResponse(Inscricao inscricao) {
        return new InscricaoResponse(
                inscricao.getId(),
                inscricao.getEvento().getId(),
                inscricao.getCategoria().getId(),
                inscricao.getUsuarioExterno() != null ? inscricao.getUsuarioExterno().getId() : null,
                inscricao.getUsuarioExterno() != null ? "EXTERNO" : "INTERNO",
                inscricao.getNrContato(),
                inscricao.getDhRegistro(),
                inscricao.getNmSetor(),
                inscricao.getNmUsuario(),
                inscricao.getMatricula()
        );
    }
}
