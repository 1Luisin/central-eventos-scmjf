package br.org.santacasa.centraleventos.api.repository;

import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class SetorRepository {

    private static final String LISTAR_SETORES_SQL = """
            SELECT DISTINCT NM_SETOR
            FROM DBAMV.SETOR
            WHERE NM_SETOR IS NOT NULL
            ORDER BY NM_SETOR
            """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public SetorRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<String> listarNomesSetores() {
        return jdbcTemplate.query(
                        LISTAR_SETORES_SQL,
                        (resultSet, rowNum) -> resultSet.getString("NM_SETOR")
                )
                .stream()
                .map(String::trim)
                .filter(nomeSetor -> !nomeSetor.isBlank())
                .toList();
    }
}
