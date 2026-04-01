package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.dto.UsuarioInternoLoginRequest;
import br.org.santacasa.centraleventos.api.dto.UsuarioInternoResponse;
import br.org.santacasa.centraleventos.api.exception.AccessDeniedException;
import br.org.santacasa.centraleventos.api.exception.AuthenticationFailedException;
import br.org.santacasa.centraleventos.api.repository.UsuarioInternoRepository;
import br.org.santacasa.centraleventos.api.repository.UsuarioInternoRepository.UsuarioInternoAutenticacaoRow;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Set;

@Service
public class UsuarioInternoService {

    private static final String TIPO_USUARIO_COMUM = "COMUM";
    private static final String TIPO_USUARIO_ADMINISTRADOR = "ADMINISTRADOR";
    private static final Set<String> SITUACOES_SENHA_VALIDAS = Set.of(
            "OK",
            "S",
            "SENHA VALIDA",
            "VALIDA",
            "VALIDO"
    );
    private static final Set<String> MARCADORES_SENHA_INVALIDA = Set.of(
            "INVALID",
            "INCORRET",
            "EXPIR",
            "BLOQUE",
            "NEGAD",
            "ERRO",
            "FALHA"
    );

    private final UsuarioInternoRepository usuarioInternoRepository;
    private final LogEventoService logEventoService;
    private final String papelUsuarioComum;
    private final String papelUsuarioAdministrador;

    public UsuarioInternoService(
            UsuarioInternoRepository usuarioInternoRepository,
            LogEventoService logEventoService,
            @Value("${app.auth.interno.papel-comum:652}") String papelUsuarioComum,
            @Value("${app.auth.interno.papel-admin:653}") String papelUsuarioAdministrador
    ) {
        this.usuarioInternoRepository = usuarioInternoRepository;
        this.logEventoService = logEventoService;
        this.papelUsuarioComum = papelUsuarioComum;
        this.papelUsuarioAdministrador = papelUsuarioAdministrador;
    }

    @Transactional
    public UsuarioInternoResponse autenticar(UsuarioInternoLoginRequest request) {
        String matricula = normalizarMatricula(request.matricula());
        String senha = normalizarObrigatorio(request.senha(), "Senha é obrigatória");

        UsuarioInternoAutenticacaoRow usuarioInterno = usuarioInternoRepository
                .buscarParaAutenticacao(matricula, senha, papeisPermitidos())
                .orElseThrow(() -> new AuthenticationFailedException("Matrícula não encontrada"));

        if (!isAtivo(usuarioInterno.ativo())) {
            throw new AccessDeniedException("Usuário interno inativo");
        }

        if (!senhaValida(usuarioInterno.situacao())) {
            throw new AuthenticationFailedException("Matrícula ou senha inválidos");
        }

        String codigoPapel = resolverCodigoPapel(usuarioInterno.papel());
        if (codigoPapel == null) {
            throw new AccessDeniedException(
                    "Seu usuário não possui acesso à Central de Eventos. Entre em contato com a TI."
            );
        }

        String tipoUsuario = papelUsuarioAdministrador.equals(codigoPapel)
                ? TIPO_USUARIO_ADMINISTRADOR
                : TIPO_USUARIO_COMUM;

        logEventoService.registrarAcao(
                "Realizou login interno na Central de Eventos com a matrícula "
                        + usuarioInterno.matricula()
                        + " como "
                        + tipoUsuario,
                usuarioInterno.matricula()
        );

        return new UsuarioInternoResponse(
                usuarioInterno.matricula(),
                usuarioInterno.nomeUsuario(),
                usuarioInterno.email(),
                usuarioInterno.ativo(),
                usuarioInterno.situacao(),
                codigoPapel,
                tipoUsuario,
                usuarioInterno.prestador()
        );
    }

    private String papeisPermitidos() {
        return papelUsuarioComum + "," + papelUsuarioAdministrador;
    }

    private String resolverCodigoPapel(String papel) {
        if (papel == null || papel.isBlank()) {
            return null;
        }

        String papelNormalizado = papel.replaceAll("\\s+", "");
        if (papelNormalizado.contains(papelUsuarioAdministrador)) {
            return papelUsuarioAdministrador;
        }
        if (papelNormalizado.contains(papelUsuarioComum)) {
            return papelUsuarioComum;
        }
        return null;
    }

    private boolean senhaValida(String situacao) {
        if (situacao == null || situacao.isBlank()) {
            return false;
        }

        String normalizada = normalizarSituacao(situacao);
        if (SITUACOES_SENHA_VALIDAS.contains(normalizada)) {
            return true;
        }

        return MARCADORES_SENHA_INVALIDA.stream().noneMatch(normalizada::contains);
    }

    private String normalizarMatricula(String matricula) {
        return normalizarObrigatorio(matricula, "Matrícula é obrigatória").trim().toUpperCase();
    }

    private String normalizarObrigatorio(String valor, String mensagemErro) {
        if (valor == null || valor.isBlank()) {
            throw new AuthenticationFailedException(mensagemErro);
        }
        return valor.trim();
    }

    private boolean isAtivo(String ativo) {
        return ativo != null && "S".equalsIgnoreCase(ativo.trim());
    }

    private String normalizarSituacao(String situacao) {
        return Normalizer.normalize(situacao, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim()
                .toUpperCase();
    }
}
