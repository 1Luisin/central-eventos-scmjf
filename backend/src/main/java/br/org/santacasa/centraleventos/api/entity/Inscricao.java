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
@Table(name = "INSCRICAO", schema = "CN_EVENTOS")
public class Inscricao {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seqInscricaoGenerator")
    @SequenceGenerator(
            name = "seqInscricaoGenerator",
            sequenceName = "CN_EVENTOS.SEQ_INSCRICAO",
            allocationSize = 1
    )
    @Column(name = "CD_INSCRICAO")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CD_EVENTO", nullable = false)
    private Evento evento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CD_CATEGORIA", nullable = false)
    private Categoria categoria;

    @Column(name = "NR_CONTATO", nullable = false, length = 30)
    private String nrContato;

    @Column(name = "DH_REGISTRO", nullable = false)
    private LocalDateTime dhRegistro;

    @Column(name = "NM_SETOR", nullable = false, length = 255)
    private String nmSetor;

    @Column(name = "NM_USUARIO", nullable = false, length = 255)
    private String nmUsuario;

    @Column(name = "MATRICULA", nullable = false, length = 255)
    private String matricula;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Evento getEvento() {
        return evento;
    }

    public void setEvento(Evento evento) {
        this.evento = evento;
    }

    public Categoria getCategoria() {
        return categoria;
    }

    public void setCategoria(Categoria categoria) {
        this.categoria = categoria;
    }

    public String getNrContato() {
        return nrContato;
    }

    public void setNrContato(String nrContato) {
        this.nrContato = nrContato;
    }

    public LocalDateTime getDhRegistro() {
        return dhRegistro;
    }

    public void setDhRegistro(LocalDateTime dhRegistro) {
        this.dhRegistro = dhRegistro;
    }

    public String getNmSetor() {
        return nmSetor;
    }

    public void setNmSetor(String nmSetor) {
        this.nmSetor = nmSetor;
    }

    public String getNmUsuario() {
        return nmUsuario;
    }

    public void setNmUsuario(String nmUsuario) {
        this.nmUsuario = nmUsuario;
    }

    public String getMatricula() {
        return matricula;
    }

    public void setMatricula(String matricula) {
        this.matricula = matricula;
    }
}
