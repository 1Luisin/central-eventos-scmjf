package br.org.santacasa.centraleventos.api.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class UsuarioInternoRepository {

    private static final String LOGIN_SQL = """
            SELECT
                u.sn_ativo AS ativo,
                u.nm_usuario AS nm_usuario,
                u.ds_email AS ds_email,
                FNC_MV2000_HMVPEP(u.cd_usuario, :passwd) AS situacao,
                FNC_VERIFICA_ACESSO_V2(u.cd_usuario, :papeis) AS papel,
                UPPER(u.cd_usuario) AS matricula,
                p.cd_prestador AS prestador
            FROM dbasgu.usuarios u
            LEFT JOIN dbasgu.prestador p ON p.cd_prestador = u.cd_prestador
            WHERE UPPER(u.cd_usuario) = :matricula
            """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public UsuarioInternoRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<UsuarioInternoAutenticacaoRow> buscarParaAutenticacao(String matricula, String senha, String papeis) {
        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("matricula", matricula)
                .addValue("passwd", senha)
                .addValue("papeis", papeis);

        List<UsuarioInternoAutenticacaoRow> resultados = jdbcTemplate.query(
                LOGIN_SQL,
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
}
