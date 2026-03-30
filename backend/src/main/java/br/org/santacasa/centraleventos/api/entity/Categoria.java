package br.org.santacasa.centraleventos.api.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "CATEGORIAS", schema = "CN_EVENTOS")
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seqCategoriasGenerator")
    @SequenceGenerator(
            name = "seqCategoriasGenerator",
            sequenceName = "CN_EVENTOS.SEQ_CATEGORIAS",
            allocationSize = 1
    )
    @Column(name = "CD_CATEGORIA")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CD_EVENTO", nullable = false)
    private Evento evento;

    @Column(name = "NM_CATEGORIA", nullable = false, length = 255)
    private String nmCategoria;

    @Column(name = "SN_EXTERNO", nullable = false, length = 1)
    private String snExterno;

    @Column(name = "DESCRICAO", length = 2000)
    private String descricao;

    @Column(name = "SN_ATIVO", nullable = false, length = 1)
    private String snAtivo;

    @Column(name = "NR_INSCRICOES", nullable = false)
    private Long nrInscricoes;

    @OneToMany(mappedBy = "categoria", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<Inscricao> inscricoes = new ArrayList<>();

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

    public String getNmCategoria() {
        return nmCategoria;
    }

    public void setNmCategoria(String nmCategoria) {
        this.nmCategoria = nmCategoria;
    }

    public String getSnExterno() {
        return snExterno;
    }

    public void setSnExterno(String snExterno) {
        this.snExterno = snExterno;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getSnAtivo() {
        return snAtivo;
    }

    public void setSnAtivo(String snAtivo) {
        this.snAtivo = snAtivo;
    }

    public Long getNrInscricoes() {
        return nrInscricoes;
    }

    public void setNrInscricoes(Long nrInscricoes) {
        this.nrInscricoes = nrInscricoes;
    }

    public List<Inscricao> getInscricoes() {
        return inscricoes;
    }

    public void setInscricoes(List<Inscricao> inscricoes) {
        this.inscricoes = inscricoes;
    }
}
