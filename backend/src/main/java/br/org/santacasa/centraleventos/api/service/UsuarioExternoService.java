package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.dto.UsuarioExternoCreateRequest;
import br.org.santacasa.centraleventos.api.dto.UsuarioExternoLoginRequest;
import br.org.santacasa.centraleventos.api.dto.UsuarioExternoResponse;
import br.org.santacasa.centraleventos.api.entity.UsuarioExterno;
import br.org.santacasa.centraleventos.api.exception.AuthenticationFailedException;
import br.org.santacasa.centraleventos.api.exception.BusinessRuleException;
import br.org.santacasa.centraleventos.api.exception.ResourceNotFoundException;
import br.org.santacasa.centraleventos.api.repository.UsuarioExternoRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class UsuarioExternoService {

    private final UsuarioExternoRepository usuarioExternoRepository;
    private final PasswordEncoder passwordEncoder;
    private final LogEventoService logEventoService;

    public UsuarioExternoService(
            UsuarioExternoRepository usuarioExternoRepository,
            PasswordEncoder passwordEncoder,
            LogEventoService logEventoService
    ) {
        this.usuarioExternoRepository = usuarioExternoRepository;
        this.passwordEncoder = passwordEncoder;
        this.logEventoService = logEventoService;
    }

    @Transactional
    public UsuarioExternoResponse cadastrar(UsuarioExternoCreateRequest request, String usuarioLog) {
        String cpf = normalizarCpf(request.cpf());
        String email = normalizarEmail(request.email());

        if (!Boolean.TRUE.equals(request.aceiteLgpd())) {
            throw new BusinessRuleException("Aceite LGPD é obrigatório");
        }
        if (cpf.length() != 11) {
            throw new BusinessRuleException("CPF deve conter 11 dígitos");
        }
        if (usuarioExternoRepository.existsByNrCpf(cpf)) {
            throw new BusinessRuleException("Já existe um usuário externo cadastrado com este CPF");
        }
        if (usuarioExternoRepository.existsByDsEmailIgnoreCase(email)) {
            throw new BusinessRuleException("Já existe um usuário externo cadastrado com este e-mail");
        }

        LocalDateTime agora = LocalDateTime.now();

        UsuarioExterno usuarioExterno = new UsuarioExterno();
        usuarioExterno.setNmCompleto(normalizarObrigatorio(request.nomeCompleto(), "Nome completo é obrigatório"));
        usuarioExterno.setNrCpf(cpf);
        usuarioExterno.setDsEmail(email);
        usuarioExterno.setDsSenhaHash(passwordEncoder.encode(normalizarObrigatorio(request.senha(), "Senha é obrigatória")));
        usuarioExterno.setNrTelefone(normalizarOpcional(request.numeroTelefone()));
        usuarioExterno.setDtNascimento(request.dataNascimento());
        usuarioExterno.setFlAtivo("S");
        usuarioExterno.setFlAceiteLgpd("S");
        usuarioExterno.setDtCadastro(agora);
        usuarioExterno.setDtUltimaAtualizacao(agora);

        UsuarioExterno salvo = usuarioExternoRepository.save(usuarioExterno);

        logEventoService.registrarAcao(
                "Criou o cadastro do usuário externo " + salvo.getId() + " - " + salvo.getDsEmail(),
                logEventoService.normalizarUsuarioLog(usuarioLog, salvo.getDsEmail())
        );

        return toResponse(salvo);
    }

    @Transactional
    public UsuarioExternoResponse autenticar(UsuarioExternoLoginRequest request) {
        UsuarioExterno usuarioExterno = usuarioExternoRepository.findByDsEmailIgnoreCase(normalizarEmail(request.email()))
                .orElseThrow(() -> new AuthenticationFailedException("Credenciais inválidas"));

        if (!isAtivo(usuarioExterno.getFlAtivo())) {
            throw new AuthenticationFailedException("Cadastro externo inativo");
        }
        if (!passwordEncoder.matches(normalizarObrigatorio(request.senha(), "Senha é obrigatória"), usuarioExterno.getDsSenhaHash())) {
            throw new AuthenticationFailedException("Credenciais inválidas");
        }

        usuarioExterno.setDtUltimoAcesso(LocalDateTime.now());
        usuarioExterno.setDtUltimaAtualizacao(LocalDateTime.now());
        UsuarioExterno atualizado = usuarioExternoRepository.save(usuarioExterno);

        logEventoService.registrarAcao(
                "Realizou login com o usuário externo " + atualizado.getId() + " - " + atualizado.getDsEmail(),
                atualizado.getDsEmail()
        );

        return toResponse(atualizado);
    }

    @Transactional(readOnly = true)
    public UsuarioExterno buscarEntidadePorId(Long usuarioExternoId) {
        return usuarioExternoRepository.findById(usuarioExternoId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário externo não encontrado"));
    }

    private UsuarioExternoResponse toResponse(UsuarioExterno usuarioExterno) {
        return new UsuarioExternoResponse(
                usuarioExterno.getId(),
                usuarioExterno.getNmCompleto(),
                usuarioExterno.getNrCpf(),
                usuarioExterno.getDsEmail(),
                usuarioExterno.getNrTelefone(),
                usuarioExterno.getDtNascimento(),
                usuarioExterno.getFlAtivo(),
                usuarioExterno.getFlAceiteLgpd(),
                usuarioExterno.getDtCadastro(),
                usuarioExterno.getDtUltimaAtualizacao(),
                usuarioExterno.getDtUltimoAcesso()
        );
    }

    private String normalizarCpf(String cpf) {
        return cpf == null ? "" : cpf.replaceAll("\\D", "");
    }

    private String normalizarEmail(String email) {
        return normalizarObrigatorio(email, "E-mail é obrigatório").toLowerCase();
    }

    private String normalizarObrigatorio(String valor, String mensagemErro) {
        if (valor == null || valor.isBlank()) {
            throw new BusinessRuleException(mensagemErro);
        }
        return valor.trim();
    }

    private String normalizarOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }

    private boolean isAtivo(String flag) {
        return flag != null && "S".equalsIgnoreCase(flag.trim());
    }
}
