package br.org.santacasa.centraleventos.api.config;

import br.org.santacasa.centraleventos.api.auth.ApiAuthenticationInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcAuthConfig implements WebMvcConfigurer {

    private final ApiAuthenticationInterceptor apiAuthenticationInterceptor;

    public WebMvcAuthConfig(ApiAuthenticationInterceptor apiAuthenticationInterceptor) {
        this.apiAuthenticationInterceptor = apiAuthenticationInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(apiAuthenticationInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns(
                        "/usuarios-internos/login",
                        "/usuarios-externos",
                        "/usuarios-externos/login",
                        "/usuarios-externos/recuperacao-senha/**",
                        "/error"
                );
    }
}
