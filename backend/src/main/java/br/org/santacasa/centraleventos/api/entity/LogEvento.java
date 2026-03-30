package br.org.santacasa.centraleventos.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "LOG_EVENTOS", schema = "CN_EVENTOS")
public class LogEvento {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seqLogEventosGenerator")
    @SequenceGenerator(
            name = "seqLogEventosGenerator",
            sequenceName = "CN_EVENTOS.SEQ_LOG_EVENTOS",
            allocationSize = 1
    )
    @Column(name = "ID")
    private Long id;

    @Column(name = "NM_ACAO", nullable = false, length = 2000)
    private String nmAcao;

    @Column(name = "CD_USUARIO", nullable = false, length = 255)
    private String cdUsuario;

    @Column(name = "DH_LOG", nullable = false)
    private LocalDateTime dhLog;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNmAcao() {
        return nmAcao;
    }

    public void setNmAcao(String nmAcao) {
        this.nmAcao = nmAcao;
    }

    public String getCdUsuario() {
        return cdUsuario;
    }

    public void setCdUsuario(String cdUsuario) {
        this.cdUsuario = cdUsuario;
    }

    public LocalDateTime getDhLog() {
        return dhLog;
    }

    public void setDhLog(LocalDateTime dhLog) {
        this.dhLog = dhLog;
    }
}
