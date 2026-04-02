package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.entity.UsuarioExterno;
import br.org.santacasa.centraleventos.api.exception.BusinessRuleException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String fromName;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${app.mail.from-address:}") String fromAddress,
            @Value("${app.mail.from-name:Central de Eventos Santa Casa}") String fromName
    ) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress == null ? "" : fromAddress.trim();
        this.fromName = fromName == null ? "Central de Eventos Santa Casa" : fromName.trim();
    }

    public void enviarRecuperacaoSenhaUsuarioExterno(
            UsuarioExterno usuarioExterno,
            String codigo,
            String linkRedefinicao,
            long expiracaoMinutos
    ) {
        validarConfiguracao();

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());

            helper.setTo(usuarioExterno.getDsEmail());
            helper.setFrom(fromAddress, fromName);
            helper.setSubject("Recuperação de senha | Central de Eventos");
            helper.setText(buildRecuperacaoSenhaBody(usuarioExterno, codigo, linkRedefinicao, expiracaoMinutos), false);

            mailSender.send(message);
        } catch (MessagingException exception) {
            throw new BusinessRuleException("Não foi possível enviar o e-mail de recuperação no momento.");
        } catch (Exception exception) {
            throw new BusinessRuleException("Não foi possível concluir o envio do e-mail de recuperação.");
        }
    }

    private void validarConfiguracao() {
        if (fromAddress.isBlank()) {
            throw new BusinessRuleException("O serviço de e-mail ainda não está configurado para envio.");
        }
    }

    private String buildRecuperacaoSenhaBody(
            UsuarioExterno usuarioExterno,
            String codigo,
            String linkRedefinicao,
            long expiracaoMinutos
    ) {
        return """
                Olá, %s!

                Recebemos uma solicitação para redefinir a senha do seu acesso externo na Central de Eventos da Santa Casa.

                Código de verificação: %s

                Link para redefinição:
                %s

                Este código expira em %d minutos.

                Se você não reconhece esta solicitação, desconsidere esta mensagem.

                Atenciosamente,
                Central de Eventos | Santa Casa de Misericórdia
                """.formatted(
                usuarioExterno.getNmCompleto(),
                codigo,
                linkRedefinicao,
                expiracaoMinutos
        );
    }
}
