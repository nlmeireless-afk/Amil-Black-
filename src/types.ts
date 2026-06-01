export interface ValueHistory {
  id: string;
  previousValue: number;
  newValue: number;
  readjustmentPercent: number;
  indexUsed: "IPCA" | "IGP-M" | "ANS-FNP" | "Acordo Direto";
  effectiveDate: string; // YYYY-MM-DD
  observacao?: string;
}

export interface NegotiationHistory {
  id: string;
  year: number;
  initialProposalPercent: number;
  finalApprovedPercent: number;
  status: "Concluído" | "Em Negociação" | "Recusado" | "Cancelado";
  dateConcluded?: string;
  notes?: string;
}

export interface Provider {
  id: string;
  nome: string;
  uf: string;
  cidade: string;
  cnpj: string;
  especialidade: string;
  tipoServiço: "Consulta" | "SADT" | "Cirurgia" | "Internação" | "Outro";
  valorContratualValido: number;
  dataBaseContrato: string; // YYYY-MM-DD (anniversary date)
  proximoReajuste: string; // YYYY-MM-DD
  statusContrato: "Ativo" | "Suspenso" | "Sob Revisão";
  historicoValores: ValueHistory[];
  historicoNegociacoes: NegotiationHistory[];
}

export interface ERPLog {
  id: string;
  providerId: string;
  providerName: string;
  timestamp: string;
  endpoint: string;
  payload: any;
  status: "Sucesso" | "Pendente" | "Falha";
  responseCode: number;
  responseMsg: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  usuario: string;
  acao: string;
  detalhes: string;
  providerId?: string;
  tipo: "Sistema" | "Cadastro" | "Reajuste" | "Sistema Financeiro";
}

export interface DashboardMetrics {
  totalProviders: number;
  avgReadjustment: number;
  pendingNegotiations: number;
  expiringContracts30Days: number;
  totalContractValue: number;
}
