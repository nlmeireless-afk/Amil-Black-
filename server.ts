import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Provider, ValueHistory, NegotiationHistory, AuditLog, ERPLog } from "./src/types";

// Setup mock state
let providers: Provider[] = [
  {
    id: "p1",
    nome: "Hospital Israelita Albert Einstein - Unidade Morumbi",
    cnpj: "60.035.790/0001-44",
    uf: "SP",
    cidade: "São Paulo",
    especialidade: "Alta Complexidade e Oncologia",
    tipoServiço: "Internação",
    valorContratualValido: 18500.00,
    dataBaseContrato: "2018-05-12",
    proximoReajuste: "2027-05-12",
    statusContrato: "Ativo",
    historicoValores: [
      {
        id: "v1_1",
        previousValue: 17200.00,
        newValue: 18500.00,
        readjustmentPercent: 7.56,
        indexUsed: "IPCA",
        effectiveDate: "2026-05-12",
        observacao: "Reajuste anual acordado em mesa de negociação direta"
      },
      {
        id: "v1_2",
        previousValue: 16100.00,
        newValue: 17200.00,
        readjustmentPercent: 6.83,
        indexUsed: "ANS-FNP",
        effectiveDate: "2025-05-12",
        observacao: "Alinhamento com teto regional do prêmio Amil Black"
      }
    ],
    historicoNegociacoes: [
      {
        id: "n1_1",
        year: 2026,
        initialProposalPercent: 9.2,
        finalApprovedPercent: 7.56,
        status: "Concluído",
        dateConcluded: "2026-05-02",
        notes: "Negociação complexa devido aos custos de novos insumos oncológicos"
      },
      {
        id: "n1_2",
        year: 2025,
        initialProposalPercent: 8.0,
        finalApprovedPercent: 6.83,
        status: "Concluído",
        dateConcluded: "2025-04-28",
        notes: "Aprovado rapidamente no reajuste regulamentado"
      }
    ]
  },
  {
    id: "p2",
    nome: "Hospital Sírio-Libanês",
    cnpj: "61.590.510/0001-22",
    uf: "SP",
    cidade: "São Paulo",
    especialidade: "Oncologia e Cardiologia",
    tipoServiço: "SADT",
    valorContratualValido: 4800.00,
    dataBaseContrato: "2019-09-20",
    proximoReajuste: "2026-09-20",
    statusContrato: "Ativo",
    historicoValores: [
      {
        id: "v2_1",
        previousValue: 4550.00,
        newValue: 4800.00,
        readjustmentPercent: 5.49,
        indexUsed: "IPCA",
        effectiveDate: "2025-09-20",
        observacao: "Reajuste padrão acordado por canal eletrônico"
      }
    ],
    historicoNegociacoes: [
      {
        id: "n2_1",
        year: 2026,
        initialProposalPercent: 7.8,
        finalApprovedPercent: 0.0,
        status: "Em Negociação",
        notes: "Prestador solicitando reavaliação de taxas de exames de ressonância de alta intensidade"
      },
      {
        id: "n2_2",
        year: 2025,
        initialProposalPercent: 5.5,
        finalApprovedPercent: 5.49,
        status: "Concluído",
        dateConcluded: "2025-09-10"
      }
    ]
  },
  {
    id: "p3",
    nome: "Hospital Copa D'Or",
    cnpj: "33.911.328/0001-38",
    uf: "RJ",
    cidade: "Rio de Janeiro",
    especialidade: "Neurologia e Traumatologia",
    tipoServiço: "Internação",
    valorContratualValido: 12400.00,
    dataBaseContrato: "2021-06-15",
    proximoReajuste: "2026-06-15", // Expiring very soon! (it's 2026-06-01 now)
    statusContrato: "Sob Revisão",
    historicoValores: [
      {
        id: "v3_1",
        previousValue: 11800.00,
        newValue: 12400.00,
        readjustmentPercent: 5.08,
        indexUsed: "IGP-M",
        effectiveDate: "2025-06-15"
      }
    ],
    historicoNegociacoes: [
      {
        id: "n3_1",
        year: 2026,
        initialProposalPercent: 8.5,
        finalApprovedPercent: 0.0,
        status: "Em Negociação",
        notes: "Impasse sobre o índice aplicável. Prestador recusa IPCA do período."
      }
    ]
  },
  {
    id: "p4",
    nome: "Clínica de Olhos Dr. Arnaldo Silveira",
    cnpj: "12.345.678/0001-90",
    uf: "RJ",
    cidade: "Niterói",
    especialidade: "Oftalmologia Cirúrgica",
    tipoServiço: "Consulta",
    valorContratualValido: 680.00,
    dataBaseContrato: "2022-03-10",
    proximoReajuste: "2027-03-10",
    statusContrato: "Ativo",
    historicoValores: [
      {
        id: "v4_1",
        previousValue: 620.00,
        newValue: 680.00,
        readjustmentPercent: 9.67,
        indexUsed: "Acordo Direto",
        effectiveDate: "2026-03-10",
        observacao: "Acordo direto de ampliação da cobertura exclusiva Amil Black"
      }
    ],
    historicoNegociacoes: [
      {
        id: "n4_1",
        year: 2026,
        initialProposalPercent: 10.0,
        finalApprovedPercent: 9.67,
        status: "Concluído",
        dateConcluded: "2026-03-02"
      }
    ]
  },
  {
    id: "p5",
    nome: "Hospital Moinhos de Vento",
    cnpj: "92.765.234/0001-01",
    uf: "RS",
    cidade: "Porto Alegre",
    especialidade: "Cardiologia e Ortopedia de Elite",
    tipoServiço: "Cirurgia",
    valorContratualValido: 14200.00,
    dataBaseContrato: "2020-07-05",
    proximoReajuste: "2026-07-05", // Expiring soon in about 1 month
    statusContrato: "Ativo",
    historicoValores: [
      {
        id: "v5_1",
        previousValue: 13500.00,
        newValue: 14200.00,
        readjustmentPercent: 5.18,
        indexUsed: "IPCA",
        effectiveDate: "2025-07-05"
      }
    ],
    historicoNegociacoes: [
      {
        id: "n5_1",
        year: 2026,
        initialProposalPercent: 6.9,
        finalApprovedPercent: 0.0,
        status: "Em Negociação",
        notes: "Primeiro contato de renovação anual enviado via portal."
      }
    ]
  },
  {
    id: "p6",
    nome: "Laboratório Fleury - Unidade Itaim",
    cnpj: "60.409.075/0001-52",
    uf: "SP",
    cidade: "São Paulo",
    especialidade: "Exames de Imagem de Alta Resolução",
    tipoServiço: "SADT",
    valorContratualValido: 3450.00,
    dataBaseContrato: "2017-11-14",
    proximoReajuste: "2026-11-14",
    statusContrato: "Ativo",
    historicoValores: [
      {
        id: "v6_1",
        previousValue: 3250.00,
        newValue: 3450.00,
        readjustmentPercent: 6.15,
        indexUsed: "ANS-FNP",
        effectiveDate: "2025-11-14",
        observacao: "Reajuste regulado para prestadores credenciados VIP"
      }
    ],
    historicoNegociacoes: [
      {
        id: "n6_1",
        year: 2025,
        initialProposalPercent: 7.0,
        finalApprovedPercent: 6.15,
        status: "Concluído",
        dateConcluded: "2025-11-05"
      }
    ]
  }
];

let apiToken = "amil_black_token_94812371";

let auditLogs: AuditLog[] = [
  {
    id: "log_1",
    timestamp: "2026-06-01T10:30:15Z",
    usuario: "auditoria.amil@amilblack.com.br",
    acao: "Sistema Iniciado",
    detalhes: "Mecanismo de monitoramento de reajustes Amil Black carregado com sucesso.",
    tipo: "Sistema"
  },
  {
    id: "log_2",
    timestamp: "2026-06-01T11:15:32Z",
    usuario: "andre.silva@amilblack.com.br",
    acao: "Consulta de Prestadores",
    detalhes: "Exportação manual de dados de segurança do Einstein realizada.",
    providerId: "p1",
    tipo: "Cadastro"
  },
  {
    id: "log_3",
    timestamp: "2026-05-31T17:40:00Z",
    usuario: "sistema.financeiro@amil.int",
    acao: "Conciliação de Tarifas",
    detalhes: "Auditoria automática anual: Einstein com reajuste de 7.56% validado com o bando de dados principal de faturamento.",
    providerId: "p1",
    tipo: "Sistema Financeiro"
  }
];

let erpLogs: ERPLog[] = [
  {
    id: "erp_1",
    providerId: "p1",
    providerName: "Hospital Israelita Albert Einstein - Unidade Morumbi",
    timestamp: "2026-05-12T14:30:00Z",
    endpoint: "https://financeiro.amil.int/api/v2/contracts/update",
    payload: {
      cnpj: "60.035.790/0001-44",
      contract_id: "p1",
      new_value: 18500.00,
      adjusted_at: "2026-05-12",
      token_auth: "ERP_OK_991823"
    },
    status: "Sucesso",
    responseCode: 200,
    responseMsg: "CONTRATO_SINC_OK: Novo valor contratual de R$ 18.500,00 registrado no lote ERP-4581."
  },
  {
    id: "erp_2",
    providerId: "p4",
    providerName: "Clínica de Olhos Dr. Arnaldo Silveira",
    timestamp: "2026-03-10T09:12:00Z",
    endpoint: "https://financeiro.amil.int/api/v2/contracts/update",
    payload: {
      cnpj: "12.345.678/0001-90",
      contract_id: "p4",
      new_value: 680.00,
      adjusted_at: "2026-03-10",
      token_auth: "ERP_OK_991823"
    },
    status: "Sucesso",
    responseCode: 200,
    responseMsg: "CONTRATO_SINC_OK: Reajuste de 9.67% aprovado e sincronizado."
  }
];

// Start server function
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Define helper to log audit actions
  const logAudit = (usuario: string, acao: string, detalhes: string, providerId?: string, tipo: AuditLog["tipo"] = "Cadastro") => {
    const newLog: AuditLog = {
      id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      usuario,
      acao,
      detalhes,
      providerId,
      tipo
    };
    auditLogs.unshift(newLog);
  };

  // Define helper to log ERP actions
  const logERP = (providerId: string, providerName: string, endpoint: string, payload: any, status: ERPLog["status"], responseCode: number, responseMsg: string) => {
    const newERPLog: ERPLog = {
      id: "erp_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      providerId,
      providerName,
      timestamp: new Date().toISOString(),
      endpoint,
      payload,
      status,
      responseCode,
      responseMsg
    };
    erpLogs.unshift(newERPLog);
  };

  // 1. Providers core API
  app.get("/api/providers", (req, res) => {
    res.json(providers);
  });

  app.post("/api/providers", (req, res) => {
    const data = req.body;
    if (!data.nome || !data.cnpj || !data.especialidade) {
       res.status(400).json({ error: "Nome, CNPJ e Especialidade são obrigatórios" });
       return;
    }

    const newProvider: Provider = {
      id: "p_" + Date.now(),
      nome: data.nome,
      cnpj: data.cnpj,
      uf: data.uf || "SP",
      cidade: data.cidade || "São Paulo",
      especialidade: data.especialidade,
      tipoServiço: data.tipoServiço || "Consulta",
      valorContratualValido: Number(data.valorContratualValido) || 0,
      dataBaseContrato: data.dataBaseContrato || new Date().toISOString().substring(0, 10),
      proximoReajuste: data.proximoReajuste || new Date().toISOString().substring(0, 10),
      statusContrato: data.statusContrato || "Ativo",
      historicoValores: data.historicoValores || [],
      historicoNegociacoes: data.historicoNegociacoes || []
    };

    providers.push(newProvider);
    logAudit("usuario.sistema@amil.com.br", "Criação de Prestador", `Criado novo prestador ${newProvider.nome} CNPJ: ${newProvider.cnpj}`, newProvider.id, "Cadastro");
    res.status(201).json(newProvider);
  });

  app.put("/api/providers/:id", (req, res) => {
    const { id } = req.params;
    const index = providers.findIndex(p => p.id === id);
    if (index === -1) {
       res.status(404).json({ error: "Prestador não encontrado" });
       return;
    }

    const old = providers[index];
    const data = req.body;

    // Support deep updates of historic fields if provided
    const updatedProvider: Provider = {
      ...old,
      ...data,
      // Ensure numeric fields are typed correctly
      valorContratualValido: data.valorContratualValido !== undefined ? Number(data.valorContratualValido) : old.valorContratualValido,
    };

    providers[index] = updatedProvider;
    logAudit("usuario.sistema@amil.com.br", "Edição de Prestador", `Alterado cadastro do prestador ${updatedProvider.nome} pelo gestor.`, id, "Cadastro");
    res.json(updatedProvider);
  });

  app.delete("/api/providers/:id", (req, res) => {
    const { id } = req.params;
    const index = providers.findIndex(p => p.id === id);
    if (index === -1) {
       res.status(404).json({ error: "Prestador não encontrado" });
       return;
    }
    const name = providers[index].nome;
    providers.splice(index, 1);
    logAudit("usuario.sistema@amil.com.br", "Exclusão de Prestador", `Excluído prestador do cadastro Amil Black: ${name}`, id, "Cadastro");
    res.json({ success: true, message: `Prestador ${name} removido com sucesso` });
  });

  // Reajustar contract action (Adicionar histórico de valores)
  app.post("/api/providers/:id/reajustar", (req, res) => {
    const { id } = req.params;
    const { newValue, indexUsed, effectiveDate, observacao } = req.body;

    const providerIndex = providers.findIndex(p => p.id === id);
    if (providerIndex === -1) {
       res.status(404).json({ error: "Prestador não encontrado" });
       return;
    }

    const provider = providers[providerIndex];
    const previousValue = provider.valorContratualValido;
    const newValNum = Number(newValue);

    if (!newValNum || newValNum <= 0) {
       res.status(400).json({ error: "Valor de reajuste deve ser maior que zero" });
       return;
    }

    const diffPercent = ((newValNum - previousValue) / previousValue) * 100;
    const roundedPercent = Number(diffPercent.toFixed(2));

    const newHistoryEntry: ValueHistory = {
      id: "v_" + Date.now(),
      previousValue,
      newValue: newValNum,
      readjustmentPercent: roundedPercent,
      indexUsed: indexUsed || "Acordo Direto",
      effectiveDate: effectiveDate || new Date().toISOString().substring(0, 10),
      observacao: observacao || "Aplicado via painel de reajuste"
    };

    // Calculate next year adjustment anniversary
    const nextYearDate = new Date(newHistoryEntry.effectiveDate);
    nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
    const nextYearStr = nextYearDate.toISOString().substring(0, 10);

    // Update active provider details
    provider.valorContratualValido = newValNum;
    provider.proximoReajuste = nextYearStr;
    provider.historicoValores.unshift(newHistoryEntry);

    // Also add/update negotiation entry for current year to 'Concluído'
    const currentYear = new Date(newHistoryEntry.effectiveDate).getFullYear();
    const existingNeg = provider.historicoNegociacoes.find(n => n.year === currentYear);
    if (existingNeg) {
      existingNeg.status = "Concluído";
      existingNeg.finalApprovedPercent = roundedPercent;
      existingNeg.dateConcluded = newHistoryEntry.effectiveDate;
    } else {
      provider.historicoNegociacoes.unshift({
        id: "n_" + Date.now(),
        year: currentYear,
        initialProposalPercent: roundedPercent,
        finalApprovedPercent: roundedPercent,
        status: "Concluído",
        dateConcluded: newHistoryEntry.effectiveDate,
        notes: "Registrado automaticamente ao aplicar reajuste."
      });
    }

    logAudit(
      "andre.silva@amilblack.com.br",
      "Reajuste Aplicado",
      `Aplicado reajuste no valor de R$ ${previousValue} para R$ ${newValNum} (${roundedPercent}% de aumento via ${indexUsed})`,
      id,
      "Reajuste"
    );

    // Trigger financial system sync payload
    const syncUrl = "https://financeiro.amil.int/api/v2/contracts/update";
    const erpPayload = {
      cnpj: provider.cnpj,
      contract_id: provider.id,
      new_value: newValNum,
      adjusted_at: newHistoryEntry.effectiveDate,
      token_auth: "ERP_OK_991823"
    };

    // Simulate success response almost always
    const isSuccess = true;
    const responseCode = isSuccess ? 200 : 500;
    const responseMsg = isSuccess
      ? `CONTRATO_SINC_OK: Reajuste aprovado no sistema corporativo de faturamento Amil. Lote #${Math.floor(Math.random() * 90000) + 10000}.`
      : "ERRO_CONTRATO_SINC: Falha interna de comunicação com a fila SAP do faturamento.";

    logERP(provider.id, provider.nome, syncUrl, erpPayload, isSuccess ? "Sucesso" : "Falha", responseCode, responseMsg);

    res.json({
      success: true,
      provider,
      newPercentage: roundedPercent,
      erpStatus: isSuccess ? "Sucesso" : "Falha"
    });
  });

  // Action manually push audit payload to financial system (ERP)
  app.post("/api/sync-erp", (req, res) => {
    const { providerId, customValue } = req.body;
    const provider = providers.find(p => p.id === providerId);
    if (!provider) {
       res.status(404).json({ error: "Prestador não encontrado" });
       return;
    }

    const valueToSync = customValue ? Number(customValue) : provider.valorContratualValido;
    const syncUrl = "https://financeiro.amil.int/api/v2/contracts/update";
    const payload = {
      cnpj: provider.cnpj,
      contract_id: provider.id,
      new_value: valueToSync,
      adjusted_at: new Date().toISOString().substring(0, 10),
      token_auth: "ERP_OK_991823"
    };

    logERP(provider.id, provider.nome, syncUrl, payload, "Sucesso", 200, `MANUAL_SINC_OK: Forçada sincronização de contrato do prestador Amil Black. Faturado reajustado aceito na API.`);
    logAudit("financeiro.gestor@amil.com.br", "Sincronização Manual", `Sincronização manual com ERP financeiro acionada pelo usuário para ${provider.nome}`, provider.id, "Sistema Financeiro");

    res.json({ success: true, message: `Sincronia manual com ERP efetuada para ${provider.nome}.` });
  });

  // 2. Audit and ERP Logs Routes
  app.get("/api/audit-logs", (req, res) => {
    res.json(auditLogs);
  });

  app.get("/api/erp-logs", (req, res) => {
    res.json(erpLogs);
  });

  // 3. API Developer & Real-Time Export Token API
  app.get("/api/api-token", (req, res) => {
    res.json({ key: apiToken });
  });

  app.post("/api/api-token/regenerate", (req, res) => {
    apiToken = "amil_black_token_" + Math.floor(Math.random() * 90000000 + 10000000);
    logAudit("administrador@amil.com.br", "Regeneração de Token API", "Uma nova chave de segurança para exportações de dados foi emitida.", undefined, "Sistema");
    res.json({ key: apiToken, message: "Nova chave de acesso gerada com sucesso!" });
  });

  // REAL-TIME DATA EXPORT (CHAVE VIA API)
  // Requisitos solicitados: "Ter chave de acesso via API para exportação de dados em tempo real."
  // Accepts token either on 'X-API-KEY' header or query parameter 'key'
  const checkApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const incomingHeader = req.headers["x-api-key"] || req.headers["X-API-KEY"];
    const incomingQuery = req.query.key;

    const providedKey = incomingHeader || incomingQuery;

    if (!providedKey || providedKey !== apiToken) {
       res.status(401).json({
        error: "Não autorizado",
        message: "Chave de acesso API (API Key) ausente ou inválida. Forneça o cabeçalho X-API-KEY ou o parâmetro '?key='."
      });
       return;
    }
    next();
  };

  app.get("/api/export-providers", checkApiKey, (req, res) => {
    // Audit-log the API export execution
    logAudit("API_INTEGRATOR", "Exportação via API", "Dados de prestadores exportados em tempo real via chamada API REST.", undefined, "Sistema");
    
    // Support filtering on the API endpoint itself for realistic developer features
    const { uf, status } = req.query;
    let filtered = [...providers];

    if (uf) {
      filtered = filtered.filter(p => p.uf.toString().toLowerCase() === uf.toString().toLowerCase());
    }
    if (status) {
      filtered = filtered.filter(p => p.statusContrato.toString().toLowerCase() === status.toString().toLowerCase());
    }

    res.json({
      title: "Exportação de Prestadores Amil Black - Tempo Real",
      exportedAt: new Date().toISOString(),
      apiVersion: "1.0",
      totalCount: filtered.length,
      data: filtered.map(p => ({
        id: p.id,
        nome: p.nome,
        cnpj: p.cnpj,
        uf: p.uf,
        cidade: p.cidade,
        especialidade: p.especialidade,
        tipo_cadastro: p.tipoServiço,
        valor_contratual_atual: p.valorContratualValido,
        data_base: p.dataBaseContrato,
        proximo_reajuste: p.proximoReajuste,
        status_contrato: p.statusContrato,
        historico_valores: p.historicoValores,
        historico_negociacoes: p.historicoNegociacoes
      }))
    });
  });

  // Vite integration middleware (Vite handles asset serving & hot reloading in SPA mode)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the built files as static content from dist/
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[GERENCIADOR AMIL BLACK] Backend rodando na porta ${PORT}`);
  });
}

startServer();
