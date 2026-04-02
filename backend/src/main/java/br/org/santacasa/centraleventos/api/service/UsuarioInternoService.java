package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.auth.AuthenticatedUser;
import br.org.santacasa.centraleventos.api.auth.AuthTokenService;
import br.org.santacasa.centraleventos.api.dto.AuthLoginResponse;
import br.org.santacasa.centraleventos.api.dto.UsuarioInternoLoginRequest;
import br.org.santacasa.centraleventos.api.dto.UsuarioInternoResponse;
import br.org.santacasa.centraleventos.api.exception.AccessDeniedException;
import br.org.santacasa.centraleventos.api.exception.AuthenticationFailedException;
import br.org.santacasa.centraleventos.api.repository.UsuarioInternoRepository;
import br.org.santacasa.centraleventos.api.repository.UsuarioInternoRepository.UsuarioInternoAutenticacaoRow;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Set;

@Service
public class UsuarioInternoService {

    private static final Logger LOGGER = LoggerFactory.getLogger(UsuarioInternoService.class);

    private static final String TIPO_USUARIO_COMUM = "COMUM";
    private static final String TIPO_USUARIO_ADMINISTRADOR = "ADMINISTRADOR";
    private static final String LOGIN_SCOPE = "LOGIN_INTERNO";
    private static final Set<String> SITUACOES_SENHA_VALIDAS = Set.of(
            "OK",
            "S",
            "VALIDA",
            "VALIDO",
            "SENHA VALIDA",
            "SENHA CORRETA",
            "AUTENTICADO",
            "USUARIO AUTENTICADO",
            "ACESSO LIBERADO",
            "ACESSO AUTORIZADO",
            "AUTORIZADO",
            "LOGIN EFETUADO",
            "LOGON EFETUADO"
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
    private final AuthenticationAttemptService authenticationAttemptService;
    private final AuthTokenService authTokenService;
    private final String papelUsuarioComum;
    private final String papelUsuarioAdministrador;

    public UsuarioInternoService(
            UsuarioInternoRepository usuarioInternoRepository,
            LogEventoService logEventoService,
            AuthenticationAttemptService authenticationAttemptService,
            AuthTokenService authTokenService,
            @Value("${app.auth.interno.papel-comum:652}") String papelUsuarioComum,
            @Value("${app.auth.interno.papel-admin:653}") String papelUsuarioAdministrador
    ) {
        this.usuarioInternoRepository = usuarioInternoRepository;
        this.logEventoService = logEventoService;
        this.authenticationAttemptService = authenticationAttemptService;
        this.authTokenService = authTokenService;
        this.papelUsuarioComum = papelUsuarioComum;
        this.papelUsuarioAdministrador = papelUsuarioAdministrador;
    }

    @Transactional
    public AuthLoginResponse<UsuarioInternoResponse> autenticar(UsuarioInternoLoginRequest request) {
        String matricula = normalizarMatricula(request.matricula());
        String senha = normalizarSenhaObrigatoria(request.senha());

        authenticationAttemptService.assertCanAttempt(LOGIN_SCOPE, matricula);

        try {
            UsuarioInternoAutenticacaoRow usuarioInterno = usuarioInternoRepository
                    .buscarParaAutenticacao(matricula, senha, papeisPermitidos())
                    .orElseThrow(() -> new AuthenticationFailedException("Matrícula ou senha inválidos"));

            if (!isAtivo(usuarioInterno.ativo())) {
                LOGGER.warn("Login interno negado para matricula {} porque o usuário está inativo.", matricula);
                throw new AuthenticationFailedException("Matrícula ou senha inválidos");
            }

            if (!senhaValida(usuarioInterno.situacao())) {
                LOGGER.warn(
                        "Login interno negado para matricula {} com retorno de situação da MV: {}",
                        matricula,
                        usuarioInterno.situacao()
                );
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

            UsuarioInternoResponse usuario = new UsuarioInternoResponse(
                    usuarioInterno.matricula(),
                    usuarioInterno.nomeUsuario(),
                    usuarioInterno.email(),
                    usuarioInterno.ativo(),
                    usuarioInterno.situacao(),
                    codigoPapel,
                    tipoUsuario,
                    usuarioInterno.prestador()
            );

            authenticationAttemptService.registerSuccess(LOGIN_SCOPE, matricula);

            logEventoService.registrarAcao(
                    "Realizou login interno na Central de Eventos com a matrícula "
                            + usuario.matricula()
                            + " como "
                            + tipoUsuario,
                    usuario.matricula()
            );

            return new AuthLoginResponse<>(
                    authTokenService.issueToken(buildAuthenticatedUser(usuario)),
                    "Bearer",
                    authTokenService.getExpirationSeconds(),
                    usuario
            );
        } catch (AuthenticationFailedException exception) {
            authenticationAttemptService.registerFailure(LOGIN_SCOPE, matricula);
            throw exception;
        }
    }

    private AuthenticatedUser buildAuthenticatedUser(UsuarioInternoResponse usuario) {
        return new AuthenticatedUser(
                "INTERNO",
                usuario.matricula(),
                usuario.nomeUsuario(),
                TIPO_USUARIO_ADMINISTRADOR.equalsIgnoreCase(usuario.tipoUsuario()),
                usuario.codigoPapel(),
                usuario.matricula(),
                null,
                usuario.email(),
                null,
                null
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

        if (MARCADORES_SENHA_INVALIDA.stream().anyMatch(normalizada::contains)) {
            return false;
        }

        return true;
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

    private String normalizarSenhaObrigatoria(String senha) {
        if (senha == null || senha.isEmpty()) {
            throw new AuthenticationFailedException("Senha é obrigatória");
        }
        return senha;
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
