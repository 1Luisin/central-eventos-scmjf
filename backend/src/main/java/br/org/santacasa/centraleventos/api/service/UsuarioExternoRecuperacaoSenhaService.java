package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.dto.MensagemResponse;
import br.org.santacasa.centraleventos.api.dto.UsuarioExternoRecuperacaoSenhaRedefinicaoRequest;
import br.org.santacasa.centraleventos.api.dto.UsuarioExternoRecuperacaoSenhaSolicitacaoRequest;
import br.org.santacasa.centraleventos.api.dto.UsuarioExternoRecuperacaoSenhaValidacaoRequest;
import br.org.santacasa.centraleventos.api.dto.UsuarioExternoRecuperacaoSenhaValidacaoResponse;
import br.org.santacasa.centraleventos.api.entity.RecupSenhaUsrExt;
import br.org.santacasa.centraleventos.api.entity.UsuarioExterno;
import br.org.santacasa.centraleventos.api.exception.BusinessRuleException;
import br.org.santacasa.centraleventos.api.repository.RecupSenhaUsrExtRepository;
import br.org.santacasa.centraleventos.api.repository.UsuarioExternoRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

@Service
public class UsuarioExternoRecuperacaoSenhaService {

    private static final String GENERIC_SUCCESS_MESSAGE =
            "Se os dados informados estiverem corretos, você receberá as instruções de redefinição por e-mail.";

    private final UsuarioExternoRepository usuarioExternoRepository;
    private final RecupSenhaUsrExtRepository recupSenhaUsrExtRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final LogEventoService logEventoService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final long expiracaoMinutos;
    private final int maxTentativas;
    private final String frontendBaseUrl;

    public UsuarioExternoRecuperacaoSenhaService(
            UsuarioExternoRepository usuarioExternoRepository,
            RecupSenhaUsrExtRepository recupSenhaUsrExtRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            LogEventoService logEventoService,
            @Value("${app.security.password-recovery.expiration-minutes:15}") long expiracaoMinutos,
            @Value("${app.security.password-recovery.max-attempts:5}") int maxTentativas,
            @Value("${app.frontend.base-url:http://127.0.0.1:3000}") String frontendBaseUrl
    ) {
        this.usuarioExternoRepository = usuarioExternoRepository;
        this.recupSenhaUsrExtRepository = recupSenhaUsrExtRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.logEventoService = logEventoService;
        this.expiracaoMinutos = expiracaoMinutos;
        this.maxTentativas = maxTentativas;
        this.frontendBaseUrl = frontendBaseUrl == null ? "http://127.0.0.1:3000" : frontendBaseUrl.trim();
    }

    @Transactional
    public MensagemResponse solicitarRecuperacao(
            UsuarioExternoRecuperacaoSenhaSolicitacaoRequest request,
            String ipSolicitante
    ) {
        String email = normalizarEmail(request.email());
        String cpf = normalizarCpf(request.cpf());

        UsuarioExterno usuarioExterno = usuarioExternoRepository
                .findByDsEmailIgnoreCaseAndNrCpf(email, cpf)
                .orElse(null);

        if (usuarioExterno == null || !isAtivo(usuarioExterno.getFlAtivo())) {
            return new MensagemResponse(GENERIC_SUCCESS_MESSAGE);
        }

        LocalDateTime agora = LocalDateTime.now();
        desativarSolicitacoesAtivas(usuarioExterno, agora);

        String token = gerarToken();
        String codigo = gerarCodigo();
        String link = buildLinkRedefinicao(token);

        RecupSenhaUsrExt solicitacao = new RecupSenhaUsrExt();
        solicitacao.setUsuarioExterno(usuarioExterno);
        solicitacao.setDsTokenHash(hashToken(token));
        solicitacao.setDsCodigoHash(passwordEncoder.encode(codigo));
        solicitacao.setDtSolicitacao(agora);
        solicitacao.setDtExpiracao(agora.plusMinutes(expiracaoMinutos));
        solicitacao.setDtUltimaAtualizacao(agora);
        solicitacao.setFlAtivo("S");
        solicitacao.setNrTentativas(0);
        solicitacao.setNrIpSolicitante(normalizarIp(ipSolicitante));

        recupSenhaUsrExtRepository.save(solicitacao);

        emailService.enviarRecuperacaoSenhaUsuarioExterno(usuarioExterno, codigo, link, expiracaoMinutos);

        logEventoService.registrarAcao(
                "Solicitou recuperação de senha para o usuário externo " + usuarioExterno.getId() + " - " + usuarioExterno.getDsEmail(),
                usuarioExterno.getDsEmail()
        );

        return new MensagemResponse(GENERIC_SUCCESS_MESSAGE);
    }

    @Transactional(readOnly = true)
    public UsuarioExternoRecuperacaoSenhaValidacaoResponse validarToken(
            UsuarioExternoRecuperacaoSenhaValidacaoRequest request
    ) {
        RecupSenhaUsrExt solicitacao = buscarSolicitacaoAtiva(request.token());

        if (solicitacao == null) {
            return new UsuarioExternoRecuperacaoSenhaValidacaoResponse(
                    false,
                    null,
                    null,
                    "O link informado é inválido ou já foi encerrado."
            );
        }

        if (isExpirada(solicitacao)) {
            return new UsuarioExternoRecuperacaoSenhaValidacaoResponse(
                    false,
                    mascararEmail(solicitacao.getUsuarioExterno().getDsEmail()),
                    solicitacao.getDtExpiracao(),
                    "O prazo deste link expirou. Solicite uma nova recuperação de senha."
            );
        }

        if (solicitacao.getNrTentativas() != null && solicitacao.getNrTentativas() >= maxTentativas) {
            return new UsuarioExternoRecuperacaoSenhaValidacaoResponse(
                    false,
                    mascararEmail(solicitacao.getUsuarioExterno().getDsEmail()),
                    solicitacao.getDtExpiracao(),
                    "Esta solicitação foi bloqueada. Solicite uma nova recuperação de senha."
            );
        }

        return new UsuarioExternoRecuperacaoSenhaValidacaoResponse(
                true,
                mascararEmail(solicitacao.getUsuarioExterno().getDsEmail()),
                solicitacao.getDtExpiracao(),
                "Link válido. Informe o código recebido por e-mail e a nova senha."
        );
    }

    @Transactional
    public MensagemResponse redefinirSenha(
            UsuarioExternoRecuperacaoSenhaRedefinicaoRequest request,
            String ipSolicitante
    ) {
        if (!request.novaSenha().trim().equals(request.confirmacaoNovaSenha().trim())) {
            throw new BusinessRuleException("A confirmação da nova senha deve ser igual à senha informada.");
        }

        RecupSenhaUsrExt solicitacao = buscarSolicitacaoAtivaObrigatoria(request.token());
        LocalDateTime agora = LocalDateTime.now();

        if (isExpirada(solicitacao)) {
            encerrarSolicitacao(solicitacao, agora, false);
            throw new BusinessRuleException("O prazo para redefinição expirou. Solicite uma nova recuperação de senha.");
        }

        int tentativasAtuais = solicitacao.getNrTentativas() == null ? 0 : solicitacao.getNrTentativas();
        if (tentativasAtuais >= maxTentativas) {
            encerrarSolicitacao(solicitacao, agora, false);
            throw new BusinessRuleException("Esta solicitação foi bloqueada. Solicite uma nova recuperação de senha.");
        }

        if (!passwordEncoder.matches(normalizarCodigo(request.codigo()), solicitacao.getDsCodigoHash())) {
            solicitacao.setNrTentativas(tentativasAtuais + 1);
            solicitacao.setNrIpSolicitante(normalizarIp(ipSolicitante));
            solicitacao.setDtUltimaAtualizacao(agora);

            if (solicitacao.getNrTentativas() >= maxTentativas) {
                solicitacao.setFlAtivo("N");
            }

            recupSenhaUsrExtRepository.save(solicitacao);
            throw new BusinessRuleException(
                    solicitacao.getNrTentativas() >= maxTentativas
                            ? "O código informado é inválido e a solicitação foi bloqueada. Solicite uma nova recuperação de senha."
                            : "Código de verificação inválido."
            );
        }

        UsuarioExterno usuarioExterno = solicitacao.getUsuarioExterno();
        if (!isAtivo(usuarioExterno.getFlAtivo())) {
            throw new BusinessRuleException("O cadastro externo está inativo. Entre em contato com a equipe responsável.");
        }

        usuarioExterno.setDsSenhaHash(passwordEncoder.encode(request.novaSenha().trim()));
        usuarioExterno.setDtUltimaAtualizacao(agora);
        usuarioExternoRepository.save(usuarioExterno);

        encerrarSolicitacao(solicitacao, agora, true);
        desativarSolicitacoesAtivas(usuarioExterno, agora);

        logEventoService.registrarAcao(
                "Redefiniu a senha do usuário externo " + usuarioExterno.getId() + " - " + usuarioExterno.getDsEmail(),
                usuarioExterno.getDsEmail()
        );

        return new MensagemResponse("Senha redefinida com sucesso. Você já pode entrar com a nova senha.");
    }

    private void desativarSolicitacoesAtivas(UsuarioExterno usuarioExterno, LocalDateTime agora) {
        List<RecupSenhaUsrExt> ativos = recupSenhaUsrExtRepository.findByUsuarioExterno_IdAndFlAtivo(usuarioExterno.getId(), "S");

        if (ativos.isEmpty()) {
            return;
        }

        for (RecupSenhaUsrExt item : ativos) {
            item.setFlAtivo("N");
            item.setDtUltimaAtualizacao(agora);
        }

        recupSenhaUsrExtRepository.saveAll(ativos);
    }

    private void encerrarSolicitacao(RecupSenhaUsrExt solicitacao, LocalDateTime agora, boolean utilizada) {
        solicitacao.setFlAtivo("N");
        solicitacao.setDtUltimaAtualizacao(agora);

        if (utilizada) {
            solicitacao.setDtUtilizacao(agora);
        }

        recupSenhaUsrExtRepository.save(solicitacao);
    }

    private RecupSenhaUsrExt buscarSolicitacaoAtivaObrigatoria(String token) {
        RecupSenhaUsrExt solicitacao = buscarSolicitacaoAtiva(token);

        if (solicitacao == null) {
            throw new BusinessRuleException("O link informado é inválido ou já foi encerrado.");
        }

        return solicitacao;
    }

    private RecupSenhaUsrExt buscarSolicitacaoAtiva(String token) {
        String tokenHash = hashToken(normalizarToken(token));
        return recupSenhaUsrExtRepository
                .findTopByDsTokenHashAndFlAtivoOrderByDtSolicitacaoDesc(tokenHash, "S")
                .orElse(null);
    }

    private boolean isExpirada(RecupSenhaUsrExt solicitacao) {
        return solicitacao.getDtExpiracao() != null && solicitacao.getDtExpiracao().isBefore(LocalDateTime.now());
    }

    private String buildLinkRedefinicao(String token) {
        String normalizedBase = frontendBaseUrl.replaceAll("/+$", "");
        return normalizedBase + "/redefinir-senha?token=" + token;
    }

    private String gerarToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private String gerarCodigo() {
        int numero = secureRandom.nextInt(1_000_000);
        return "%06d".formatted(numero);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Algoritmo de hash indisponível", exception);
        }
    }

    private String mascararEmail(String email) {
        if (email == null || email.isBlank() || !email.contains("@")) {
            return null;
        }

        String[] parts = email.split("@", 2);
        String local = parts[0];
        String domain = parts[1];

        if (local.isEmpty()) {
            return "***@" + domain;
        }

        if (local.length() <= 2) {
            return local.charAt(0) + "***@" + domain;
        }

        return local.substring(0, 2) + "***@" + domain;
    }

    private String normalizarEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String normalizarCpf(String cpf) {
        return cpf == null ? "" : cpf.replaceAll("\\D", "");
    }

    private String normalizarCodigo(String codigo) {
        return codigo == null ? "" : codigo.replaceAll("\\D", "");
    }

    private String normalizarToken(String token) {
        if (token == null || token.isBlank()) {
            throw new BusinessRuleException("O link informado é inválido.");
        }
        return token.trim();
    }

    private String normalizarIp(String ipSolicitante) {
        if (ipSolicitante == null || ipSolicitante.isBlank()) {
            return null;
        }
        return ipSolicitante.trim().substring(0, Math.min(45, ipSolicitante.trim().length()));
    }

    private boolean isAtivo(String flag) {
        return flag != null && "S".equalsIgnoreCase(flag.trim());
    }
}
