export type ApiErrorResponse = {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details: string[];
};

export type MessageResponse = {
  mensagem: string;
};

export type AuthLoginResponse<T> = {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  usuario: T;
};

export type EventoResponse = {
  id: number;
  nomeEvento: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  nomeResponsavel: string;
  nomeSetor: string;
  numeroContato: string;
  ativo: string;
  descricao: string | null;
};

export type CategoriaResponse = {
  id: number;
  eventoId: number;
  nomeCategoria: string;
  externo: string;
  descricao: string | null;
  ativo: string;
  limiteInscricoes: number;
  inscricoesRealizadas: number;
  vagasDisponiveis: number;
};

export type InscricaoResponse = {
  id: number;
  eventoId: number;
  categoriaId: number;
  idUsuarioExterno: number | null;
  tipoParticipante: "INTERNO" | "EXTERNO";
  numeroContato: string;
  dataHoraRegistro: string;
  nomeSetor: string;
  nomeUsuario: string;
  matricula: string;
};

export type EventoCreatePayload = {
  nomeEvento: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  nomeResponsavel: string;
  nomeSetor: string;
  numeroContato: string;
  ativo: "S" | "N";
  descricao?: string;
};

export type CategoriaCreatePayload = {
  eventoId: number;
  nomeCategoria: string;
  externo: "S" | "N";
  descricao?: string;
  ativo: "S" | "N";
  limiteInscricoes: number;
};

export type InscricaoCreatePayload = {
  eventoId: number;
  categoriaId: number;
  numeroContato: string;
  nomeSetor?: string;
  nomeUsuario?: string;
  matricula?: string;
  idUsuarioExterno?: number;
};

export type ExternalUserResponse = {
  idUsuarioExterno: number;
  nomeCompleto: string;
  cpf: string;
  email: string;
  numeroTelefone: string | null;
  dataNascimento: string | null;
  ativo: "S" | "N";
  aceiteLgpd: "S" | "N";
  dataCadastro: string;
  dataUltimaAtualizacao: string | null;
  dataUltimoAcesso: string | null;
};

export type ExternalUserRegisterPayload = {
  nomeCompleto: string;
  cpf: string;
  email: string;
  senha: string;
  numeroTelefone?: string;
  dataNascimento?: string;
  aceiteLgpd: boolean;
};

export type ExternalUserLoginPayload = {
  email: string;
  senha: string;
};

export type ExternalUserPasswordRecoveryPayload = {
  email: string;
  cpf: string;
};

export type ExternalUserPasswordRecoveryValidationPayload = {
  token: string;
};

export type ExternalUserPasswordRecoveryValidationResponse = {
  valido: boolean;
  emailMascarado: string | null;
  expiracaoEm: string | null;
  mensagem: string;
};

export type ExternalUserPasswordResetPayload = {
  token: string;
  codigo: string;
  novaSenha: string;
  confirmacaoNovaSenha: string;
};

export type InternalUserRole = "COMUM" | "ADMINISTRADOR";

export type InternalUserResponse = {
  matricula: string;
  nomeUsuario: string;
  email: string | null;
  ativo: "S" | "N";
  situacao: string;
  codigoPapel: string;
  tipoUsuario: InternalUserRole;
  prestador: number | null;
};

export type InternalUserLoginPayload = {
  matricula: string;
  senha: string;
};

export type CategoriaStatus =
  | "disponivel"
  | "lotada"
  | "evento-inativo"
  | "categoria-inativa";

export type CategoriaViewModel = CategoriaResponse & {
  eventoNome: string;
  eventoAtivo: string;
  eventoInicio: string;
  eventoFim: string;
  status: CategoriaStatus;
  statusLabel: string;
  statusDescription: string;
  permiteInscricao: boolean;
  ocupacaoPercentual: number;
  usuarioJaInscrito: boolean;
  inscricaoAtual: InscricaoResponse | null;
};

export type EventoDashboardItem = EventoResponse & {
  categorias: CategoriaViewModel[];
  totalCategorias: number;
  totalVagas: number;
  totalInscricoes: number;
  temInscricoesAbertas: boolean;
};

export type CategoriaAdminItem = CategoriaViewModel & {
  inscricoes: InscricaoResponse[];
};

export type EventoAdminItem = EventoResponse & {
  categorias: CategoriaAdminItem[];
  totalCategorias: number;
  totalVagas: number;
  totalInscricoes: number;
};

export type DashboardData = {
  eventos: EventoDashboardItem[];
  atualizadoEm: string;
  erroInicial?: string;
};

export type AdminData = {
  eventos: EventoAdminItem[];
  atualizadoEm: string;
  erroInicial?: string;
};

export type EnrollmentData = {
  eventos: EventoDashboardItem[];
  categorias: CategoriaViewModel[];
  atualizadoEm: string;
  erroInicial?: string;
};
