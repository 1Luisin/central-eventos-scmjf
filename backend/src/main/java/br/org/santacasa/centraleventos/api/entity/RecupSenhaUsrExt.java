package br.org.santacasa.centraleventos.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "RECUP_SENHA_USR_EXT", schema = "CN_EVENTOS")
public class RecupSenhaUsrExt {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seqRecupSenhaUsrExtGenerator")
    @SequenceGenerator(
            name = "seqRecupSenhaUsrExtGenerator",
            sequenceName = "CN_EVENTOS.SEQ_RECUP_SENHA_USR_EXT",
            allocationSize = 1
    )
    @Column(name = "ID_RECUPERACAO")
    private Long idRecuperacao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_USUARIO_EXTERNO", nullable = false)
    private UsuarioExterno usuarioExterno;

    @Column(name = "DS_TOKEN_HASH", nullable = false, length = 64)
    private String dsTokenHash;

    @Column(name = "DS_CODIGO_HASH", nullable = false, length = 255)
    private String dsCodigoHash;

    @Column(name = "DT_SOLICITACAO", nullable = false)
    private LocalDateTime dtSolicitacao;

    @Column(name = "DT_EXPIRACAO", nullable = false)
    private LocalDateTime dtExpiracao;

    @Column(name = "DT_UTILIZACAO")
    private LocalDateTime dtUtilizacao;

    @Column(name = "DT_ULTIMA_ATUALIZACAO")
    private LocalDateTime dtUltimaAtualizacao;

    @Column(name = "FL_ATIVO", nullable = false, length = 1)
    private String flAtivo;

    @Column(name = "NR_TENTATIVAS", nullable = false)
    private Integer nrTentativas;

    @Column(name = "NR_IP_SOLICITANTE", length = 45)
    private String nrIpSolicitante;

    public Long getIdRecuperacao() {
        return idRecuperacao;
    }

    public void setIdRecuperacao(Long idRecuperacao) {
        this.idRecuperacao = idRecuperacao;
    }

    public UsuarioExterno getUsuarioExterno() {
        return usuarioExterno;
    }

    public void setUsuarioExterno(UsuarioExterno usuarioExterno) {
        this.usuarioExterno = usuarioExterno;
    }

    public String getDsTokenHash() {
        return dsTokenHash;
    }

    public void setDsTokenHash(String dsTokenHash) {
        this.dsTokenHash = dsTokenHash;
    }

    public String getDsCodigoHash() {
        return dsCodigoHash;
    }

    public void setDsCodigoHash(String dsCodigoHash) {
        this.dsCodigoHash = dsCodigoHash;
    }

    public LocalDateTime getDtSolicitacao() {
        return dtSolicitacao;
    }

    public void setDtSolicitacao(LocalDateTime dtSolicitacao) {
        this.dtSolicitacao = dtSolicitacao;
    }

    public LocalDateTime getDtExpiracao() {
        return dtExpiracao;
    }

    public void setDtExpiracao(LocalDateTime dtExpiracao) {
        this.dtExpiracao = dtExpiracao;
    }

    public LocalDateTime getDtUtilizacao() {
        return dtUtilizacao;
    }

    public void setDtUtilizacao(LocalDateTime dtUtilizacao) {
        this.dtUtilizacao = dtUtilizacao;
    }

    public LocalDateTime getDtUltimaAtualizacao() {
        return dtUltimaAtualizacao;
    }

    public void setDtUltimaAtualizacao(LocalDateTime dtUltimaAtualizacao) {
        this.dtUltimaAtualizacao = dtUltimaAtualizacao;
    }

    public String getFlAtivo() {
        return flAtivo;
    }

    public void setFlAtivo(String flAtivo) {
        this.flAtivo = flAtivo;
    }

    public Integer getNrTentativas() {
        return nrTentativas;
    }

    public void setNrTentativas(Integer nrTentativas) {
        this.nrTentativas = nrTentativas;
    }

    public String getNrIpSolicitante() {
        return nrIpSolicitante;
    }

    public void setNrIpSolicitante(String nrIpSolicitante) {
        this.nrIpSolicitante = nrIpSolicitante;
    }
}
