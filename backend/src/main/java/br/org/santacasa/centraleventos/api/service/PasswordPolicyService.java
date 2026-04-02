package br.org.santacasa.centraleventos.api.service;

import br.org.santacasa.centraleventos.api.exception.BusinessRuleException;
import org.springframework.stereotype.Service;

@Service
public class PasswordPolicyService {

    public void validateOrThrow(String rawPassword) {
        String password = rawPassword == null ? "" : rawPassword;

        if (password.length() < 8 || password.length() > 120) {
            throw new BusinessRuleException("A senha deve ter entre 8 e 120 caracteres.");
        }
        if (password.chars().noneMatch(Character::isUpperCase)) {
            throw new BusinessRuleException("A senha deve conter pelo menos uma letra maiúscula.");
        }
        if (password.chars().noneMatch(Character::isLowerCase)) {
            throw new BusinessRuleException("A senha deve conter pelo menos uma letra minúscula.");
        }
        if (password.chars().noneMatch(Character::isDigit)) {
            throw new BusinessRuleException("A senha deve conter pelo menos um número.");
        }
        if (password.chars().allMatch(Character::isLetterOrDigit)) {
            throw new BusinessRuleException("A senha deve conter pelo menos um caractere especial.");
        }
        if (password.contains(" ")) {
            throw new BusinessRuleException("A senha não pode conter espaços em branco.");
        }
    }
}
