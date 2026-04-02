package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.auth.AuthTokenService;
import br.org.santacasa.centraleventos.api.dto.AuthLoginResponse;
import br.org.santacasa.centraleventos.api.dto.UsuarioInternoLoginRequest;
import br.org.santacasa.centraleventos.api.dto.UsuarioInternoResponse;
import br.org.santacasa.centraleventos.api.exception.AccessDeniedException;
import br.org.santacasa.centraleventos.api.exception.AuthenticationFailedException;
import br.org.santacasa.centraleventos.api.repository.UsuarioInternoRepository;
import br.org.santacasa.centraleventos.api.repository.UsuarioInternoRepository.UsuarioInternoAutenticacaoRow;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioInternoServiceTest {

    @Mock
    private UsuarioInternoRepository usuarioInternoRepository;

    @Mock
    private LogEventoService logEventoService;

    private UsuarioInternoService service;

    @BeforeEach
    void setUp() {
        service = new UsuarioInternoService(
                usuarioInternoRepository,
                logEventoService,
                new AuthenticationAttemptService(5, 15),
                new AuthTokenService(new ObjectMapper(), "segredo-de-teste", 600),
                "652",
                "653"
        );
    }

    @Test
    void deveAutenticarAdministradorComSenhaValida() {
        when(usuarioInternoRepository.buscarParaAutenticacao("F19033", "Senha@2026", "652,653"))
                .thenReturn(Optional.of(new UsuarioInternoAutenticacaoRow(
                        "S",
                        "Luis Guilherme",
                        "luis@santacasajf.org.br",
                        "Senha correta",
                        "653",
                        "F19033",
                        99L
                )));

        AuthLoginResponse<UsuarioInternoResponse> response = service.autenticar(
                new UsuarioInternoLoginRequest("f19033", "Senha@2026")
        );

        assertFalse(response.accessToken().isBlank());
        assertEquals("Bearer", response.tokenType());
        assertEquals("ADMINISTRADOR", response.usuario().tipoUsuario());
        assertEquals("F19033", response.usuario().matricula());
        verify(logEventoService).registrarAcao(contains("Realizou login interno"), eq("F19033"));
    }

    @Test
    void deveBloquearSenhaInvalidaRetornadaPelaMV() {
        when(usuarioInternoRepository.buscarParaAutenticacao("F19033", "SenhaErrada@2026", "652,653"))
                .thenReturn(Optional.of(new UsuarioInternoAutenticacaoRow(
                        "S",
                        "Luis Guilherme",
                        "luis@santacasajf.org.br",
                        "SENHA INVALIDA",
                        "653",
                        "F19033",
                        99L
                )));

        assertThrows(
                AuthenticationFailedException.class,
                () -> service.autenticar(new UsuarioInternoLoginRequest("F19033", "SenhaErrada@2026"))
        );

        verify(logEventoService, never()).registrarAcao(contains("Realizou login interno"), eq("F19033"));
    }

    @Test
    void deveNegarUsuarioSemPapelPermitido() {
        when(usuarioInternoRepository.buscarParaAutenticacao("F19033", "Senha@2026", "652,653"))
                .thenReturn(Optional.of(new UsuarioInternoAutenticacaoRow(
                        "S",
                        "Luis Guilherme",
                        "luis@santacasajf.org.br",
                        "AUTENTICADO",
                        "999",
                        "F19033",
                        99L
                )));

        assertThrows(
                AccessDeniedException.class,
                () -> service.autenticar(new UsuarioInternoLoginRequest("F19033", "Senha@2026"))
        );

        verify(logEventoService, never()).registrarAcao(contains("Realizou login interno"), eq("F19033"));
    }
}
