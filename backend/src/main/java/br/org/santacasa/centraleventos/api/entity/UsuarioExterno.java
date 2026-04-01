package br.org.santacasa.centraleventos.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "USUARIOS_EXTERNOS", schema = "CN_EVENTOS")
public class UsuarioExterno {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seqUsuariosExternosGenerator")
    @SequenceGenerator(
            name = "seqUsuariosExternosGenerator",
            sequenceName = "CN_EVENTOS.SEQ_USUARIOS_EXTERNOS",
            allocationSize = 1
    )
    @Column(name = "ID_USUARIO_EXTERNO")
    private Long id;

    @Column(name = "NM_COMPLETO", nullable = false, length = 150)
    private String nmCompleto;

    @Column(name = "NR_CPF", nullable = false, length = 11)
    private String nrCpf;

    @Column(name = "DS_EMAIL", nullable = false, length = 150)
    private String dsEmail;

    @Column(name = "DS_SENHA_HASH", nullable = false, length = 255)
    private String dsSenhaHash;

    @Column(name = "NR_TELEFONE", length = 20)
    private String nrTelefone;

    @Column(name = "DT_NASCIMENTO")
    private LocalDate dtNascimento;

    @Column(name = "FL_ATIVO", nullable = false, length = 1)
    private String flAtivo;

    @Column(name = "FL_ACEITE_LGPD", nullable = false, length = 1)
    private String flAceiteLgpd;

    @Column(name = "DT_CADASTRO", nullable = false)
    private LocalDateTime dtCadastro;

    @Column(name = "DT_ULTIMA_ATUALIZACAO")
    private LocalDateTime dtUltimaAtualizacao;

    @Column(name = "DT_ULTIMO_ACESSO")
    private LocalDateTime dtUltimoAcesso;

    @OneToMany(mappedBy = "usuarioExterno", fetch = FetchType.LAZY)
    private List<Inscricao> inscricoes = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNmCompleto() {
        return nmCompleto;
    }

    public void setNmCompleto(String nmCompleto) {
        this.nmCompleto = nmCompleto;
    }

    public String getNrCpf() {
        return nrCpf;
    }

    public void setNrCpf(String nrCpf) {
        this.nrCpf = nrCpf;
    }

    public String getDsEmail() {
        return dsEmail;
    }

    public void setDsEmail(String dsEmail) {
        this.dsEmail = dsEmail;
    }

    public String getDsSenhaHash() {
        return dsSenhaHash;
    }

    public void setDsSenhaHash(String dsSenhaHash) {
        this.dsSenhaHash = dsSenhaHash;
    }

    public String getNrTelefone() {
        return nrTelefone;
    }

    public void setNrTelefone(String nrTelefone) {
        this.nrTelefone = nrTelefone;
    }

    public LocalDate getDtNascimento() {
        return dtNascimento;
    }

    public void setDtNascimento(LocalDate dtNascimento) {
        this.dtNascimento = dtNascimento;
    }

    public String getFlAtivo() {
        return flAtivo;
    }

    public void setFlAtivo(String flAtivo) {
        this.flAtivo = flAtivo;
    }

    public String getFlAceiteLgpd() {
        return flAceiteLgpd;
    }

    public void setFlAceiteLgpd(String flAceiteLgpd) {
        this.flAceiteLgpd = flAceiteLgpd;
    }

    public LocalDateTime getDtCadastro() {
        return dtCadastro;
    }

    public void setDtCadastro(LocalDateTime dtCadastro) {
        this.dtCadastro = dtCadastro;
    }

    public LocalDateTime getDtUltimaAtualizacao() {
        return dtUltimaAtualizacao;
    }

    public void setDtUltimaAtualizacao(LocalDateTime dtUltimaAtualizacao) {
        this.dtUltimaAtualizacao = dtUltimaAtualizacao;
    }

    public LocalDateTime getDtUltimoAcesso() {
        return dtUltimoAcesso;
    }

    public void setDtUltimoAcesso(LocalDateTime dtUltimoAcesso) {
        this.dtUltimoAcesso = dtUltimoAcesso;
    }

    public List<Inscricao> getInscricoes() {
        return inscricoes;
    }

    public void setInscricoes(List<Inscricao> inscricoes) {
        this.inscricoes = inscricoes;
    }
}
