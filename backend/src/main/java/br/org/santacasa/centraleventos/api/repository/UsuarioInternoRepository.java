package br.org.santacasa.centraleventos.api.repository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class UsuarioInternoRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final String loginSql;

    public UsuarioInternoRepository(
            NamedParameterJdbcTemplate jdbcTemplate,
            @Value("${app.auth.interno.mv-schema:DBAMV}") String mvSchema
    ) {
        this.jdbcTemplate = jdbcTemplate;
        String schema = normalizarSchema(mvSchema);
        this.loginSql = """
                SELECT
                    u.sn_ativo AS ativo,
                    u.nm_usuario AS nm_usuario,
                    u.ds_email AS ds_email,
                    %s.FNC_MV2000_HMVPEP(u.cd_usuario, :passwd) AS situacao,
                    %s.FNC_VERIFICA_ACESSO_V2(u.cd_usuario, :papeis) AS papel,
                    UPPER(u.cd_usuario) AS matricula,
                    p.cd_prestador AS prestador
                FROM %s.USUARIOS u
                LEFT JOIN %s.PRESTADOR p ON p.cd_prestador = u.cd_prestador
                WHERE UPPER(u.cd_usuario) = :matricula
                """.formatted(schema, schema, schema, schema);
    }

    public Optional<UsuarioInternoAutenticacaoRow> buscarParaAutenticacao(String matricula, String senha, String papeis) {
        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("matricula", matricula)
                .addValue("passwd", senha)
                .addValue("papeis", papeis);

        List<UsuarioInternoAutenticacaoRow> resultados = jdbcTemplate.query(
                loginSql,
                parameters,
                (resultSet, rowNum) -> mapRow(resultSet)
        );

        return resultados.stream().findFirst();
    }

    private UsuarioInternoAutenticacaoRow mapRow(ResultSet resultSet) throws SQLException {
        Long prestador = resultSet.getObject("prestador") == null
                ? null
                : resultSet.getLong("prestador");

        return new UsuarioInternoAutenticacaoRow(
                resultSet.getString("ativo"),
                resultSet.getString("nm_usuario"),
                resultSet.getString("ds_email"),
                resultSet.getString("situacao"),
                resultSet.getString("papel"),
                resultSet.getString("matricula"),
                prestador
        );
    }

    public record UsuarioInternoAutenticacaoRow(
            String ativo,
            String nomeUsuario,
            String email,
            String situacao,
            String papel,
            String matricula,
            Long prestador
    ) {
    }

    private String normalizarSchema(String schema) {
        if (schema == null || schema.isBlank()) {
            return "DBAMV";
        }
        return schema.trim().toUpperCase().replaceAll("[^A-Z0-9_]", "");
    }
}
