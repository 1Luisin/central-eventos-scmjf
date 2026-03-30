package br.org.santacasa.centraleventos.api.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "EVENTOS", schema = "CN_EVENTOS")
public class Evento {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seqEventosGenerator")
    @SequenceGenerator(
            name = "seqEventosGenerator",
            sequenceName = "CN_EVENTOS.SEQ_EVENTOS",
            allocationSize = 1
    )
    @Column(name = "CD_EVENTO")
    private Long id;

    @Column(name = "NM_EVENTO", nullable = false, length = 255)
    private String nmEvento;

    @Column(name = "DH_INICIO", nullable = false)
    private LocalDateTime dhInicio;

    @Column(name = "DH_FIM", nullable = false)
    private LocalDateTime dhFim;

    @Column(name = "NM_RESPONSAVEL", nullable = false, length = 255)
    private String nmResponsavel;

    @Column(name = "NM_SETOR", nullable = false, length = 255)
    private String nmSetor;

    @Column(name = "NR_CONTATO", nullable = false, length = 30)
    private String nrContato;

    @Column(name = "SN_ATIVO", nullable = false, length = 1)
    private String snAtivo;

    @Column(name = "DESCRICAO", length = 2000)
    private String descricao;

    @OneToMany(mappedBy = "evento", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<Categoria> categorias = new ArrayList<>();

    @OneToMany(mappedBy = "evento", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<Inscricao> inscricoes = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNmEvento() {
        return nmEvento;
    }

    public void setNmEvento(String nmEvento) {
        this.nmEvento = nmEvento;
    }

    public LocalDateTime getDhInicio() {
        return dhInicio;
    }

    public void setDhInicio(LocalDateTime dhInicio) {
        this.dhInicio = dhInicio;
    }

    public LocalDateTime getDhFim() {
        return dhFim;
    }

    public void setDhFim(LocalDateTime dhFim) {
        this.dhFim = dhFim;
    }

    public String getNmResponsavel() {
        return nmResponsavel;
    }

    public void setNmResponsavel(String nmResponsavel) {
        this.nmResponsavel = nmResponsavel;
    }

    public String getNmSetor() {
        return nmSetor;
    }

    public void setNmSetor(String nmSetor) {
        this.nmSetor = nmSetor;
    }

    public String getNrContato() {
        return nrContato;
    }

    public void setNrContato(String nrContato) {
        this.nrContato = nrContato;
    }

    public String getSnAtivo() {
        return snAtivo;
    }

    public void setSnAtivo(String snAtivo) {
        this.snAtivo = snAtivo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public List<Categoria> getCategorias() {
        return categorias;
    }

    public void setCategorias(List<Categoria> categorias) {
        this.categorias = categorias;
    }

    public List<Inscricao> getInscricoes() {
        return inscricoes;
    }

    public void setInscricoes(List<Inscricao> inscricoes) {
        this.inscricoes = inscricoes;
    }
}
