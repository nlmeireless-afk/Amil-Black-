import { useEffect, useState, FormEvent } from "react";
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  Award,
  Sparkles,
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Layers,
  ShieldCheck,
  Key,
  Copy,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ChevronRight,
  User,
  Check,
  X,
  PlusCircle,
  HelpCircle
} from "lucide-react";
import { Provider, ValueHistory, NegotiationHistory, AuditLog, ERPLog } from "./types";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [tab, setTab] = useState<string>("dashboard");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [erpLogs, setErpLogs] = useState<ERPLog[]>([]);
  const [apiKey, setApiKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterRegion, setFilterRegion] = useState<string>("TODOS");
  const [filterSpecialty, setFilterSpecialty] = useState<string>("TODOS");
  const [filterStatus, setFilterStatus] = useState<string>("TODOS");

  // Selection & Forms state
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [showAddProviderModal, setShowAddProviderModal] = useState<boolean>(false);
  const [showEditProviderModal, setShowEditProviderModal] = useState<boolean>(false);
  const [showReadjustmentModal, setShowReadjustmentModal] = useState<boolean>(false);
  const [isSyncingERP, setIsSyncingERP] = useState<string | null>(null);
  
  // New Provider Form State
  const [newProviderForm, setNewProviderForm] = useState({
    nome: "",
    cnpj: "",
    uf: "",
    cidade: "",
    especialidade: "",
    tipoServiço: "Consulta",
    valorContratualValido: 0,
    dataBaseContrato: "",
    proximoReajuste: "",
    statusContrato: "Ativo"
  });

  // Edit Provider Form State
  const [editProviderForm, setEditProviderForm] = useState<Provider | null>(null);

  // Readjustment Form State
  const [readjustmentForm, setReadjustmentForm] = useState({
    newValue: "",
    indexUsed: "IPCA",
    effectiveDate: new Date().toISOString().substring(0, 10),
    observacao: ""
  });

  // Copy helper
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Trigger loading initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resProviders, resAudit, resErp, resKey] = await Promise.all([
        fetch("/api/providers").then(r => r.json()),
        fetch("/api/audit-logs").then(r => r.json()),
        fetch("/api/erp-logs").then(r => r.json()),
        fetch("/api/api-token").then(r => r.json())
      ]);
      setProviders(resProviders);
      setAuditLogs(resAudit);
      setErpLogs(resErp);
      setApiKey(resKey.key);
    } catch (e) {
      console.error("Erro ao carregar dados do servidor express", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegenerateApiKey = async () => {
    if(!confirm("Tem certeza que deseja revogar a chave de API anterior e gerar uma nova? Todas as aplicações integradas perderão o acesso até serem atualizadas.")) {
      return;
    }
    try {
      const res = await fetch("/api/api-token/regenerate", { method: "POST" });
      const data = await res.json();
      setApiKey(data.key);
      alert("Nova chave de acesso REST gerada em tempo real.");
      loadData();
    } catch(err) {
      console.error(err);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleAddProvider = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProviderForm.nome || !newProviderForm.cnpj || !newProviderForm.especialidade) {
      alert("Por favor preencha os campos obrigatórios (*)");
      return;
    }
    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProviderForm)
      });
      if (res.ok) {
        setShowAddProviderModal(false);
        setNewProviderForm({
          nome: "",
          cnpj: "",
          uf: "SP",
          cidade: "",
          especialidade: "",
          tipoServiço: "Consulta",
          valorContratualValido: 0,
          dataBaseContrato: new Date().toISOString().substring(0, 10),
          proximoReajuste: new Date(Date.now() + 365*24*60*60*1000).toISOString().substring(0, 10),
          statusContrato: "Ativo"
        });
        loadData();
      } else {
        const err = await res.json();
        alert("Erro ao adicionar: " + err.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProvider = async (e: FormEvent) => {
    e.preventDefault();
    if (!editProviderForm) return;
    try {
      const res = await fetch(`/api/providers/${editProviderForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editProviderForm)
      });
      if (res.ok) {
        setShowEditProviderModal(false);
        loadData();
      } else {
        const err = await res.json();
        alert("Erro ao salvar alterações: " + err.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProvider = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir permanentemente o prestador VIP "${name}" da base Amil Black?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/providers/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedProviderId === id) {
          setSelectedProviderId(null);
        }
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyReadjustment = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProviderId) return;
    const provider = providers.find(p => p.id === selectedProviderId);
    if (!provider) return;

    if (!readjustmentForm.newValue || Number(readjustmentForm.newValue) <= 0) {
      alert("Por favor insira um valor válido de reajuste");
      return;
    }

    try {
      const res = await fetch(`/api/providers/${selectedProviderId}/reajustar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(readjustmentForm)
      });
      if (res.ok) {
        setShowReadjustmentModal(false);
        setReadjustmentForm({
          newValue: "",
          indexUsed: "IPCA",
          effectiveDate: new Date().toISOString().substring(0, 10),
          observacao: ""
        });
        loadData();
      } else {
        const err = await res.json();
        alert("Erro no reajuste: " + err.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualSyncERP = async (providerId: string, customValue?: number) => {
    setIsSyncingERP(providerId);
    try {
      const res = await fetch("/api/sync-erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, customValue })
      });
      if (res.ok) {
        // give brief delay for sleek premium UX
        setTimeout(() => {
          setIsSyncingERP(null);
          loadData();
        }, 800);
      } else {
        setIsSyncingERP(null);
      }
    } catch (error) {
      console.error(error);
      setIsSyncingERP(null);
    }
  };

  // Pre-populate editing forms
  const openEditModal = (provider: Provider) => {
    setEditProviderForm(provider);
    setShowEditProviderModal(true);
  };

  const openReadjustmentForm = (provider: Provider) => {
    setSelectedProviderId(provider.id);
    setReadjustmentForm({
      newValue: (provider.valorContratualValido * 1.055).toFixed(2), // pre fill with a modest 5.5% adjustment suggestion
      indexUsed: "IPCA",
      effectiveDate: new Date().toISOString().substring(0, 10),
      observacao: "Reajuste de mesa direta baseado no IPCA acumulado."
    });
    setShowReadjustmentModal(true);
  };

  // Computed Select filters
  const uniqueRegions = Array.from(new Set(providers.map(p => p.uf)));
  const uniqueSpecialties = Array.from(new Set(providers.map(p => p.especialidade)));

  // Filter and search providers
  const filteredProviders = providers.filter(p => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = p.nome.toLowerCase().includes(query) || 
                          p.cnpj.includes(query) || 
                          p.especialidade.toLowerCase().includes(query) || 
                          p.cidade.toLowerCase().includes(query);
    
    const matchesRegion = filterRegion === "TODOS" || p.uf === filterRegion;
    const matchesSpecialty = filterSpecialty === "TODOS" || p.especialidade === filterSpecialty;
    const matchesStatus = filterStatus === "TODOS" || p.statusContrato === filterStatus;

    return matchesSearch && matchesRegion && matchesSpecialty && matchesStatus;
  });

  const selectedProvider = providers.find(p => p.id === selectedProviderId);

  // Expiration notifications for top status highlight
  const totalWarnings = providers.filter(p => {
    const nextDate = new Date(p.proximoReajuste);
    const diffTime = nextDate.getTime() - new Date("2026-06-01").getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 45;
  }).length;

  return (
    <div className="w-full min-h-screen bg-[#0A0A0B] text-[#EDEDED] font-sans flex flex-row overflow-x-hidden" id="app-container">
      
      {/* Sidebar Navigation */}
      <aside className="w-72 border-r border-zinc-800 flex flex-col bg-[#0d0d0f] shrink-0 sticky top-0 h-screen" id="app-sidebar">
        <div className="p-8 flex-1 flex flex-col justify-between">
          <div>
            {/* Header / Brand */}
            <div className="flex items-center gap-2 mb-10">
              <div className="w-9 h-9 bg-zinc-100 rounded flex items-center justify-center shadow-md">
                <div className="w-4 h-4 bg-black rounded-xs"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tighter uppercase leading-none text-white">
                  Amil <span className="text-zinc-500">Black</span>
                </span>
                <span className="text-[10px] text-zinc-500 tracking-widest font-mono">REAJUSTES</span>
              </div>
            </div>

            {/* Nav Menu */}
            <nav className="space-y-4">
              <button 
                onClick={() => { setTab("dashboard"); setSelectedProviderId(null); }}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg transition-all text-left text-xs uppercase tracking-wider font-semibold ${
                  tab === "dashboard" 
                    ? "bg-zinc-800/80 text-white border-l-2 border-white shadow-inner" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${tab === "dashboard" ? "bg-white" : "bg-transparent"}`}></div>
                <span>Dashboard</span>
              </button>

              <button 
                onClick={() => setTab("providers")}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg transition-all text-left text-xs uppercase tracking-wider font-semibold ${
                  tab === "providers" 
                    ? "bg-zinc-800/80 text-white border-l-2 border-white shadow-inner" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${tab === "providers" ? "bg-white" : "bg-transparent"}`}></div>
                <span>Prestadores VIP</span>
              </button>

              <button 
                onClick={() => setTab("audit")}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg transition-all text-left text-xs uppercase tracking-wider font-semibold ${
                  tab === "audit" 
                    ? "bg-zinc-800/80 text-white border-l-2 border-white shadow-inner" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${tab === "audit" ? "bg-white" : "bg-transparent"}`}></div>
                <span>Auditoria & ERP</span>
              </button>

              <button 
                onClick={() => setTab("api")}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg transition-all text-left text-xs uppercase tracking-wider font-semibold ${
                  tab === "api" 
                    ? "bg-zinc-800/80 text-white border-l-2 border-white shadow-inner" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${tab === "api" ? "bg-white" : "bg-transparent"}`}></div>
                <span>Configurações API</span>
              </button>
            </nav>
          </div>

          {/* Quick API Key Status Box */}
          <div className="pt-6 border-t border-zinc-850">
            <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 text-left">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono mb-2">API Realtime Token</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] pulsing-dot"></div>
                  <code className="text-[10px] text-zinc-400 font-mono">
                    {apiKey ? `${apiKey.substring(0, 15)}...` : "Carregando..."}
                  </code>
                </div>
                <button 
                  onClick={handleCopyKey}
                  title="Copiar token para exportação"
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <Copy size={12} />
                </button>
              </div>
              {copiedText && <span className="block text-[8px] text-emerald-400 font-mono mt-1">Copiado para o clipboard!</span>}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0" id="main-workbench">
        
        {/* Superior Header */}
        <header className="h-24 border-b border-zinc-800 flex items-center justify-between px-10 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-light tracking-tight text-white flex items-center gap-2">
              Gestão de Reajustes Amil Black <span className="text-zinc-500">/ Auditoria de Contratos</span>
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-1">Operando sob data base de simulação: 01 de Junho de 2026</p>
          </div>
          
          <div className="flex items-center gap-6">
            {totalWarnings > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-full border border-amber-500/20 shadow-xs animate-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider">{totalWarnings} Reajustes nos próximos 45d</span>
              </div>
            )}

            <div 
              onClick={() => { setTab("api"); setSelectedProviderId(null); }}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Key size={13} className="text-zinc-400" />
              <span>Chave API Ativa</span>
            </div>

            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-mono font-bold text-zinc-300">
              AB
            </div>
          </div>
        </header>

        {/* Content Box */}
        <main className="p-10 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
              <RefreshCw className="animate-spin text-zinc-500 w-10 h-10" />
              <p className="text-zinc-400 text-sm">Carregando carteira de dados Amil Black seguros...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD DETALHADO */}
              {tab === "dashboard" && (
                <Dashboard 
                  providers={providers} 
                  onSelectTab={setTab} 
                  onSelectProvider={(id) => {
                    setSelectedProviderId(id);
                    setTab("providers");
                  }} 
                />
              )}

              {/* TAB 2: GERENCIADOR DE PRESTADORES */}
              {tab === "providers" && (
                <div className="space-y-6">
                  
                  {/* Top Bar with Filters and Actions */}
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                    
                    {/* Search Field */}
                    <div className="flex-1 bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-lg flex items-center gap-3">
                      <Search className="w-4 h-4 text-zinc-500" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar prestador por nome, especialidade, CNPJ ou cidade..." 
                        className="bg-transparent border-none text-zinc-200 placeholder-zinc-500 text-xs w-full focus:outline-hidden"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="text-zinc-500 hover:text-zinc-200">
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Regional Dropdown */}
                    <div className="w-full lg:w-48">
                      <select 
                        value={filterRegion}
                        onChange={(e) => setFilterRegion(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 text-xs px-3 py-2.5 rounded-lg text-zinc-400 w-full outline-hidden focus:border-zinc-600"
                      >
                        <option value="TODOS">Todas Regiões (UF)</option>
                        {uniqueRegions.map(uf => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>

                    {/* Specialty Dropdown */}
                    <div className="w-full lg:w-48">
                      <select 
                        value={filterSpecialty}
                        onChange={(e) => setFilterSpecialty(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 text-xs px-3 py-2.5 rounded-lg text-zinc-400 w-full outline-hidden focus:border-zinc-600"
                      >
                        <option value="TODOS">Especialidades</option>
                        {uniqueSpecialties.map(spec => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status Dropdown */}
                    <div className="w-full lg:w-40">
                      <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 text-xs px-3 py-2.5 rounded-lg text-zinc-400 w-full outline-hidden focus:border-zinc-600"
                      >
                        <option value="TODOS">Status Contrato</option>
                        <option value="Ativo">Ativo</option>
                        <option value="Sob Revisão">Sob Revisão</option>
                        <option value="Suspenso">Suspenso</option>
                      </select>
                    </div>

                    {/* Trigger code to Add Provider */}
                    <button 
                      onClick={() => {
                        setNewProviderForm({
                          nome: "",
                          cnpj: "",
                          uf: "SP",
                          cidade: "",
                          especialidade: "",
                          tipoServiço: "Consulta",
                          valorContratualValido: 1200,
                          dataBaseContrato: new Date().toISOString().substring(0, 10),
                          proximoReajuste: new Date(Date.now() + 365*24*60*60*1000).toISOString().substring(0, 10),
                          statusContrato: "Ativo"
                        });
                        setShowAddProviderModal(true);
                      }}
                      className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-5 py-2.5 rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Plus size={14} />
                      <span>Cadastrar Prestador</span>
                    </button>
                  </div>

                  {/* Main split workbench: Left column results, Right column detail inspector panel */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    
                    {/* Providers Table Column */}
                    <div className={`xl:col-span-7 bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden flex flex-col`}>
                      <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Credenciados VIP Cadastrados ({filteredProviders.length} de {providers.length})
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">CAMPANHA GERAL BLACK</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-950/80 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                              <th className="p-4">Prestador / CNPJ</th>
                              <th className="p-4">Especialidade / Região</th>
                              <th className="p-4">Valor Contratual</th>
                              <th className="p-4">Aniversário / Reajuste</th>
                              <th className="p-4 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-850">
                            {filteredProviders.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-zinc-500 text-xs">
                                  Nenhum prestador Amil Black corresponde aos filtros avançados selecionados.
                                </td>
                              </tr>
                            ) : (
                              filteredProviders.map(p => {
                                const isSelected = selectedProviderId === p.id;
                                const isExpiringSoon = (new Date(p.proximoReajuste).getTime() - new Date("2026-06-01").getTime()) <= 45*24*60*60*1000;

                                return (
                                  <tr 
                                    key={p.id} 
                                    onClick={() => setSelectedProviderId(p.id)}
                                    className={`hover:bg-zinc-800/20 cursor-pointer transition-colors ${
                                      isSelected ? "bg-zinc-800/40 border-l-4 border-amber-500" : ""
                                    }`}
                                  >
                                    <td className="p-4">
                                      <div className="font-semibold text-zinc-200 text-xs">{p.nome}</div>
                                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">CNPJ: {p.cnpj}</div>
                                    </td>
                                    <td className="p-4">
                                      <div className="text-zinc-300 text-xs italic">{p.especialidade}</div>
                                      <div className="text-[10px] text-zinc-500 mt-0.5">{p.cidade} - {p.uf}</div>
                                    </td>
                                    <td className="p-4">
                                      <div className="font-mono text-zinc-100 text-xs font-semibold">
                                        R$ {p.valorContratualValido.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </div>
                                      <div className="text-[9px] text-zinc-500">{p.tipoServiço}</div>
                                    </td>
                                    <td className="p-4">
                                      <div className="text-[10px] text-zinc-300 space-y-1">
                                        <div>Base: {p.dataBaseContrato.split("-").reverse().join("/")}</div>
                                        <div className="flex items-center gap-1">
                                          <span className="text-zinc-500">Próx:</span>
                                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                                            isExpiringSoon ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" : "bg-zinc-800 text-zinc-400"
                                          }`}>
                                            {p.proximoReajuste.split("-").reverse().join("/")}
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button 
                                          title="Editar cadastro básico"
                                          onClick={() => openEditModal(p)}
                                          className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors"
                                        >
                                          <Edit2 size={13} />
                                        </button>
                                        <button 
                                          title="Negociar / Reajustar novo valor"
                                          onClick={() => openReadjustmentForm(p)}
                                          className="text-amber-400 hover:text-amber-300 p-1 rounded hover:bg-zinc-800 transition-colors text-[10px] font-bold uppercase tracking-wider px-2 border border-amber-500/25 bg-amber-500/5"
                                        >
                                          Reajustar
                                        </button>
                                        <button 
                                          title="Remover prestador"
                                          onClick={() => handleDeleteProvider(p.id, p.nome)}
                                          className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition-colors"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="p-4 bg-zinc-900/50 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-500">
                        <span>Exibindo {filteredProviders.length} cadastros VIP Amil Black</span>
                        <span className="font-mono text-[10px]">Portal de Honorários Amil</span>
                      </div>
                    </div>

                    {/* Right column detailed inspector panel */}
                    <div className="xl:col-span-5 space-y-6">
                      {selectedProvider ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-6 relative">
                          
                          {/* Close highlight */}
                          <div className="absolute top-5 right-5">
                            <button 
                              onClick={() => setSelectedProviderId(null)}
                              className="text-zinc-500 hover:text-zinc-300 p-1 hover:bg-zinc-800 rounded transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          {/* Quick identification card header */}
                          <div className="space-y-2">
                            <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                              Amil Black Credenciado # {selectedProvider.id}
                            </span>
                            <h3 className="text-lg font-semibold text-white tracking-tight pr-6">{selectedProvider.nome}</h3>
                            <p className="text-xs text-zinc-400">CNPJ {selectedProvider.cnpj} • {selectedProvider.cidade}/{selectedProvider.uf}</p>
                          </div>

                          {/* Premium Quick actions */}
                          <div className="border border-zinc-800 bg-[#0d0d0f] rounded-lg p-3 flex flex-wrap gap-2 justify-between items-center">
                            <div className="text-xs">
                              <span className="block text-[10px] text-zinc-500">Valor com vigência regulada:</span>
                              <span className="font-mono text-zinc-150 font-bold text-sm">
                                R$ {selectedProvider.valorContratualValido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <button 
                              onClick={() => openReadjustmentForm(selectedProvider)}
                              className="bg-zinc-100 hover:bg-white text-black px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all"
                            >
                              Aplicar Reajuste
                            </button>
                          </div>

                          {/* Detail Grid */}
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="bg-zinc-950 p-3 rounded border border-zinc-850">
                              <span className="text-[10px] text-zinc-500 block uppercase font-mono">Especialidade</span>
                              <span className="text-zinc-300 font-semibold">{selectedProvider.especialidade}</span>
                            </div>
                            <div className="bg-zinc-950 p-3 rounded border border-zinc-855">
                              <span className="text-[10px] text-zinc-500 block uppercase font-mono">Tipo do Acordo</span>
                              <span className="text-zinc-300 font-semibold">{selectedProvider.tipoServiço}</span>
                            </div>
                            <div className="bg-zinc-950 p-3 rounded border border-zinc-850">
                              <span className="text-[10px] text-zinc-500 block uppercase font-mono">Data Cadastro Base</span>
                              <span className="text-zinc-300 font-semibold">
                                {selectedProvider.dataBaseContrato.split("-").reverse().join("/")}
                              </span>
                            </div>
                            <div className="bg-zinc-950 p-3 rounded border border-zinc-855">
                              <span className="text-[10px] text-zinc-500 block uppercase font-mono">Próxima Renovação</span>
                              <span className="text-amber-400 font-semibold font-mono">
                                {selectedProvider.proximoReajuste.split("-").reverse().join("/")}
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-zinc-800 pt-5">
                            {/* Histórico de Valores */}
                            <div className="flex items-center justify-between mb-3 text-xs font-semibold text-zinc-300 uppercase tracking-widest text-[10px]">
                              <span>Histórico de Valores Vigentes</span>
                              <span className="text-zinc-500">Retroatividade</span>
                            </div>

                            {selectedProvider.historicoValores.length === 0 ? (
                              <p className="text-zinc-550 italic text-[11px] py-1 bg-zinc-950 p-2.5 rounded border border-zinc-850">
                                Sem alterações de valores acumuladas. O valor contratual original é de R$ {selectedProvider.valorContratualValido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.
                              </p>
                            ) : (
                              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                                {selectedProvider.historicoValores.map((h, idx) => (
                                  <div key={h.id || idx} className="bg-zinc-950 p-2.5 rounded border border-zinc-850 hover:bg-zinc-900 transition-colors">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-bold text-zinc-200">R$ {h.newValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                      <span className="text-[10px] font-semibold text-emerald-400">+{h.readjustmentPercent}%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-1">
                                      <span>Prev: R$ {h.previousValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                      <span className="font-semibold text-zinc-300 bg-zinc-900 border border-zinc-850 px-1.5 py-0.2 rounded-xs">{h.indexUsed}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] text-zinc-500 mt-1.5 pt-1.5 border-t border-zinc-900">
                                      <span>Em vigor: {h.effectiveDate.split("-").reverse().join("/")}</span>
                                      {h.observacao && <span className="text-zinc-400 truncate max-w-[200px]" title={h.observacao}>{h.observacao}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="border-t border-zinc-800 pt-5">
                            {/* Histórico de Negociações */}
                            <div className="flex items-center justify-between mb-3 text-xs font-semibold text-zinc-300 uppercase tracking-widest text-[10px]">
                              <span>Histórico de Negociações Anuais</span>
                              <span className="text-zinc-500">Mesa e Status</span>
                            </div>

                            {selectedProvider.historicoNegociacoes.length === 0 ? (
                              <p className="text-zinc-550 italic text-[11px] py-1">Sem propostas formais cadastradas.</p>
                            ) : (
                              <div className="space-y-2.5">
                                {selectedProvider.historicoNegociacoes.map((n, idx) => (
                                  <div key={n.id || idx} className="bg-zinc-950/70 p-2.5 rounded border border-zinc-850">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-semibold text-zinc-200">Campanha {n.year}</span>
                                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                        n.status === "Concluído" 
                                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                          : n.status === "Em Negociação"
                                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                          : "bg-red-500/10 text-red-500 border-red-500/20"
                                      }`}>
                                        {n.status}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-[10px] text-zinc-400 flex justify-between">
                                      <span>Proposta: +{n.initialProposalPercent}%</span>
                                      {n.finalApprovedPercent > 0 && <span>Fechado em: +{n.finalApprovedPercent}%</span>}
                                    </div>
                                    {n.notes && <p className="text-[9px] text-zinc-500 font-light mt-1.5 italic bg-zinc-900/50 p-1.5 rounded">{n.notes}</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* ERP Sync Quick Manual Force */}
                          <div className="border-t border-zinc-800 pt-5 flex items-center justify-between bg-zinc-950/40 p-4 rounded-lg border border-zinc-850">
                            <div>
                              <span className="text-[10px] uppercase font-mono text-zinc-500 block">Auditoria de Sincronismo ERP</span>
                              <p className="text-[11px] text-zinc-400 mt-0.5">Força validação de valores vigentes com faturamento Amil.</p>
                            </div>
                            <button 
                              onClick={() => handleManualSyncERP(selectedProvider.id)}
                              disabled={isSyncingERP === selectedProvider.id}
                              className="text-[10px] uppercase font-bold text-zinc-300 hover:text-white px-3 py-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 rounded disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {isSyncingERP === selectedProvider.id ? (
                                <>
                                  <RefreshCw className="animate-spin" size={11} />
                                  <span>Conectando...</span>
                                </>
                              ) : (
                                <>
                                  <RefreshCw size={11} />
                                  <span>Forçar Sincronia</span>
                                </>
                              )}
                            </button>
                          </div>

                        </div>
                      ) : (
                        <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl p-10 text-center space-y-4">
                          <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-500">
                            <User size={20} />
                          </div>
                          <div>
                            <h4 className="text-zinc-300 text-sm font-semibold">Inspetor Amil Black</h4>
                            <p className="text-zinc-500 text-xs mt-1">Selecione qualquer prestador da lista ao lado para inspecionar, editar, auditar repasses ou aplicar reajustes anuais de mesa direta.</p>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: AUDITORIA FINANCEIRA & ERP */}
              {tab === "audit" && (
                <div className="space-y-8">
                  {/* Explanatory introduction of the integration */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12">
                      <ShieldCheck size={180} />
                    </div>
                    <div className="max-w-3xl space-y-2">
                      <div className="flex items-center gap-2 text-zinc-300 font-semibold text-xs bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full w-fit">
                        <CheckCircle2 size={13} className="text-emerald-400" />
                        <span>Mecanismo de Auditoria de Lançamentos Financeiros ERP</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white tracking-tight">Sincronismo Direto e Conciliação Eletrônica</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Todas as inserções de reajuste efetuadas neste painel disparam instantaneamente pacotes de atualização para as APIs internas Amil (SAP/SAD) visando mitigar fraudes e inconsistências relativas ao faturamento de honorários médicos e exames premium na cobertura Amil Black.
                      </p>
                    </div>
                  </div>

                  {/* Two lists side by side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Audit logs table */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <div className="p-4 bg-zinc-950 border-b border-zinc-850 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Log de Operações e Auditoria</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded font-mono">USUÁRIOS E MAQUINA</span>
                      </div>
                      
                      <div className="p-4 bg-[#0d0d0f] border-b border-zinc-800/80 text-xs text-zinc-400">
                        Histórico cronológico de acessos, alterações cadastrais de prestadores ou reajustes validados.
                      </div>

                      <div className="divide-y divide-zinc-850 max-h-[500px] overflow-y-auto">
                        {auditLogs.map((log) => (
                          <div key={log.id} className="p-4 hover:bg-zinc-800/20 transition-colors space-y-1.5 text-xs">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-zinc-200">{log.acao}</span>
                              <span className="text-[10px] font-mono text-zinc-500">
                                {new Date(log.timestamp).toLocaleString("pt-BR")}
                              </span>
                            </div>
                            <p className="text-zinc-400 font-light text-[11px] leading-relaxed">{log.detalhes}</p>
                            <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1">
                              <span className="flex items-center gap-1">Autoria: <code className="text-zinc-400">{log.usuario}</code></span>
                              <span className="bg-zinc-950 px-1.5 py-0.2 rounded border border-zinc-800 text-[9px] text-indigo-400 uppercase font-bold">{log.tipo}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ERP Integration Logs table */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <div className="p-4 bg-zinc-950 border-b border-zinc-850 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Integração Financeira (ERP APIs)</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded font-mono">CONCILIAÇÃO SAP</span>
                      </div>

                      <div className="p-4 bg-[#0d0d0f] border-b border-zinc-800/80 text-xs text-zinc-400">
                        Payloads de transmissão XML/JSON em tempo real com barramentos corporativos de pagamento.
                      </div>

                      <div className="divide-y divide-zinc-850 max-h-[500px] overflow-y-auto">
                        {erpLogs.map((erp) => (
                          <div key={erp.id} className="p-4 hover:bg-zinc-800/20 transition-colors space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {erp.providerName}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-500">
                                {new Date(erp.timestamp).toLocaleTimeString("pt-BR")}
                              </span>
                            </div>

                            <div className="bg-zinc-950 p-2 rounded border border-zinc-850 font-mono text-[9px] text-zinc-400 space-y-1">
                              <div><span className="text-zinc-650">POST</span> {erp.endpoint}</div>
                              <div className="text-zinc-500 truncate">Payload: {JSON.stringify(erp.payload)}</div>
                            </div>

                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-zinc-500">Status Resposta: <code className="text-zinc-300">{erp.responseCode} OK</code></span>
                              <span className="font-semibold text-emerald-400 px-2 bg-emerald-500/10 rounded-sm border border-emerald-500/15">
                                Sincronizado
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-400 italic font-mono bg-zinc-950/40 p-1.5 border border-zinc-850 rounded">
                              {erp.responseMsg}
                            </p>
                          </div>
                        ))}
                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* TAB 4: CONFIGURAÇÕES API & CHAVE INTEGRADO */}
              {tab === "api" && (
                <div className="space-y-8 max-w-4xl">
                  {/* Detailed specs of the requested API access feature */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-1 py-1 px-3 bg-amber-500/10 border border-amber-500/20 rounded-full w-fit">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Integração de Sistemas de Prontuários</span>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-white">Chave de Acesso para Exportações em Tempo Real</h2>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Para automatizar o fechamento tributário, auditorias mensais ou exportar a tabela de credenciados Amil Black para outros painéis externos de faturamento, você pode realizar chamadas diretas REST a qualquer momento enviando o token de portabilidade de dados.
                      </p>
                    </div>

                    {/* Display of the API credentials key */}
                    <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-805 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">TOKEN REQUISICAO REST (X-API-KEY)</span>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm font-mono text-white bg-zinc-900 px-3 py-1 rounded border border-zinc-800 font-bold select-all">
                            {apiKey}
                          </code>
                          <button 
                            onClick={handleCopyKey}
                            className="bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white px-2 py-1.5 rounded text-xs transition-all flex items-center gap-1.5"
                          >
                            <Copy size={13} />
                            <span>{copiedText ? "Copiado!" : "Copiar"}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto self-end md:self-center">
                        <button 
                          onClick={handleRegenerateApiKey}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-150 border border-zinc-755 text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RefreshCw size={13} />
                          <span>Regenerar Credenciais</span>
                        </button>

                        <a 
                          href={`/api/export-providers?key=${apiKey}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#EDEDED] hover:bg-white text-black text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-center"
                        >
                          <ExternalLink size={13} />
                          <span>Testar Endpoint API</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Documentation Interactive Section */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-4 bg-zinc-950 border-b border-zinc-850 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Especificações de Negócios para Engenheiros</span>
                      <span className="text-[10px] text-zinc-500 font-mono">REST JSON API v1.0</span>
                    </div>

                    <div className="p-6 space-y-6 text-xs">
                      {/* Endpoint 1 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-sm font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">GET</span>
                          <code className="text-zinc-200">/api/export-providers</code>
                        </div>
                        <p className="text-zinc-400">Retorna um JSON listando todos os prestadores VIP com o respectivo histórico de negociações anuais cadastradas.</p>
                        
                        <div className="space-y-1">
                          <p className="text-zinc-500 font-semibold uppercase text-[9px] font-mono tracking-wider">Parâmetros de Cabeçalho (Header):</p>
                          <div className="bg-zinc-950 p-2.5 rounded border border-zinc-850 font-mono text-[10px] text-zinc-400">
                            X-API-KEY: {apiKey}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-zinc-500 font-semibold uppercase text-[9px] font-mono tracking-wider">Ou Parâmetros de Query String:</p>
                          <div className="bg-zinc-950 p-2.5 rounded border border-zinc-850 font-mono text-[10px] text-zinc-400">
                            ?key={apiKey}&uf=SP&status=Ativo
                          </div>
                        </div>
                      </div>

                      {/* Code Snippet Example block */}
                      <div className="space-y-2 pt-4 border-t border-zinc-800">
                        <p className="text-zinc-200 font-semibold">Exemplo de Requisição Integrada em Node.js / Python</p>
                          <div className="bg-zinc-950 p-4 rounded border border-zinc-855 font-mono text-[10px] text-zinc-405 space-y-1">
                            <p className="text-zinc-500 font-semibold uppercase text-[9px] mb-1">// Exemplo em Node.js / Python</p>
                            <pre className="whitespace-pre-wrap text-zinc-350 select-all font-mono leading-relaxed">
{`const res = await fetch("https://amil.financeiro.int/api/export-providers?key=${apiKey || "SUA_API_KEY"}");
const data = await res.json();
console.log(\`Sucesso: \${data.length || 0} prestadores Amil Black listados.\`);`}
                            </pre>
                          </div>
                      </div>

                      {/* Rules block */}
                      <div className="bg-amber-500/5 border border-amber-100/10 rounded-lg p-4 space-y-2">
                        <h4 className="text-amber-400 font-semibold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                          <AlertTriangle size={14} />
                          Salvaguarda de Segurança de Dados Regulatórios ANS
                        </h4>
                        <p className="text-zinc-400 leading-relaxed text-[11px]">
                          As chaves de acesso emitidas concedem privilégios restritos de leitura. Edições de contratos devem ocorrer estritamente pelo painel autenticado devido às regras de governança e auditoria integrada dos sistemas de faturamento.
                        </p>
                      </div>

                    </div>
                  </div>

                </div>
              )}

            </>
          )}
        </main>
      </div>

      {/* MODAL 1: ADICIONAR PRESTADOR */}
      {showAddProviderModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Cadastrar Prestador Amil Black</h3>
              <button 
                onClick={() => setShowAddProviderModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddProvider} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold">Nome do Prestador VIP *</label>
                <input 
                  type="text" 
                  required
                  value={newProviderForm.nome}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, nome: e.target.value })}
                  placeholder="Ex: Novo Hospital Amil Black Morumbi" 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-150 focus:outline-hidden focus:border-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold">CNPJ *</label>
                  <input 
                    type="text" 
                    required
                    value={newProviderForm.cnpj}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, cnpj: e.target.value })}
                    placeholder="Ex: 00.354.789/0001-22" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-150 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold">Especialidade Principal *</label>
                  <input 
                    type="text" 
                    required
                    value={newProviderForm.especialidade}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, especialidade: e.target.value })}
                    placeholder="Ex: Cirurgia Cardíaca de Elite" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-150 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold">Estado (UF)</label>
                  <input 
                    type="text" 
                    maxLength={2}
                    value={newProviderForm.uf}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, uf: e.target.value.toUpperCase() })}
                    placeholder="SP" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-150 font-bold text-center focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-zinc-400 font-semibold">Cidade</label>
                  <input 
                    type="text" 
                    value={newProviderForm.cidade}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, cidade: e.target.value })}
                    placeholder="São Paulo" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-150 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold">Tipo do Serviço</label>
                  <select 
                    value={newProviderForm.tipoServiço}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, tipoServiço: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-300 focus:outline-hidden"
                  >
                    <option value="Consulta">Consulta</option>
                    <option value="SADT">SADT</option>
                    <option value="Cirurgia">Cirurgia</option>
                    <option value="Internação">Internação</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold">Valor Contratual Vigente (R$)</label>
                  <input 
                    type="number" 
                    value={newProviderForm.valorContratualValido}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, valorContratualValido: Number(e.target.value) })}
                    placeholder="1200" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-150 font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold">Aniversário Contrato</label>
                  <input 
                    type="date" 
                    value={newProviderForm.dataBaseContrato}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, dataBaseContrato: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold">Vencimento Reajuste</label>
                  <input 
                    type="date" 
                    value={newProviderForm.proximoReajuste}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, proximoReajuste: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold">Status do Contrato</label>
                <select 
                  value={newProviderForm.statusContrato}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, statusContrato: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-300 focus:outline-hidden"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Sob Revisão">Sob Revisão</option>
                  <option value="Suspenso">Suspenso</option>
                </select>
              </div>

              <p className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-850">
                * Novos cadastrados entram imediatamente no fluxo de monitoramento e auditoria em tempo real.
              </p>

              <div className="flex justify-end gap-2 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddProviderModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-750 text-white px-4 py-2.5 rounded font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-white hover:bg-zinc-200 text-black px-5 py-2.5 rounded font-bold uppercase tracking-wider"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR PRESTADOR CADASTRO BÁSICO */}
      {showEditProviderModal && editProviderForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 bg-radial">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Editar Cadastro Contratual Black</h3>
              <button 
                onClick={() => setShowEditProviderModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditProvider} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold">Nome Oficial do Estabelecimento VIP *</label>
                <input 
                  type="text" 
                  required
                  value={editProviderForm.nome}
                  onChange={(e) => setEditProviderForm({ ...editProviderForm, nome: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-150 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold">CNPJ</label>
                  <input 
                    type="text" 
                    readOnly
                    value={editProviderForm.cnpj}
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded p-2.5 text-zinc-500 italic focus:outline-hidden cursor-not-allowed"
                  />
                  <span className="text-[9px] text-zinc-650">CNPJ inalterável para auditoria</span>
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold">Especialidade *</label>
                  <input 
                    type="text" 
                    required
                    value={editProviderForm.especialidade}
                    onChange={(e) => setEditProviderForm({ ...editProviderForm, especialidade: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-150 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold">Estado (UF)</label>
                  <input 
                    type="text" 
                    maxLength={2}
                    value={editProviderForm.uf}
                    onChange={(e) => setEditProviderForm({ ...editProviderForm, uf: e.target.value.toUpperCase() })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-150 font-bold text-center focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-zinc-400 font-semibold">Cidade</label>
                  <input 
                    type="text" 
                    value={editProviderForm.cidade}
                    onChange={(e) => setEditProviderForm({ ...editProviderForm, cidade: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-150 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold">Tipo do Serviço</label>
                  <select 
                    value={editProviderForm.tipoServiço}
                    onChange={(e) => setEditProviderForm({ ...editProviderForm, tipoServiço: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-300 focus:outline-hidden"
                  >
                    <option value="Consulta">Consulta</option>
                    <option value="SADT">SADT</option>
                    <option value="Cirurgia">Cirurgia</option>
                    <option value="Internação">Internação</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold">Valor Contratual Ativo (R$)</label>
                  <input 
                    type="number" 
                    value={editProviderForm.valorContratualValido}
                    onChange={(e) => setEditProviderForm({ ...editProviderForm, valorContratualValido: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-150 font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold">Aniversário Contrato</label>
                  <input 
                    type="date" 
                    value={editProviderForm.dataBaseContrato}
                    onChange={(e) => setEditProviderForm({ ...editProviderForm, dataBaseContrato: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold">Próximo Reajuste</label>
                  <input 
                    type="date" 
                    value={editProviderForm.proximoReajuste}
                    onChange={(e) => setEditProviderForm({ ...editProviderForm, proximoReajuste: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold">Status do Contrato</label>
                <select 
                  value={editProviderForm.statusContrato}
                  onChange={(e) => setEditProviderForm({ ...editProviderForm, statusContrato: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-300 focus:outline-hidden"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Sob Revisão">Sob Revisão</option>
                  <option value="Suspenso">Suspenso</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-850">
                <button 
                  type="button" 
                  onClick={() => setShowEditProviderModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-750 text-white px-4 py-2.5 rounded font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-white hover:bg-zinc-200 text-black px-5 py-2.5 rounded font-bold uppercase tracking-wider"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REAJUSTAR CONTRATO & NEGOCIAR (REGULAÇÃO DE HONORÁRIOS) */}
      {showReadjustmentModal && selectedProvider && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center bg-radial">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">APLICAR REAJUSTE DE HONORÁRIOS</h3>
                <h4 className="text-sm font-semibold text-white mt-0.5">{selectedProvider.nome}</h4>
              </div>
              <button 
                onClick={() => setShowReadjustmentModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyReadjustment} className="p-6 space-y-5 text-xs">
              
              <div className="p-3 bg-zinc-950 rounded border border-zinc-850 flex justify-between items-center">
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase">Honorário Atual em vigor</span>
                  <span className="text-zinc-300 font-mono text-xs font-bold">
                    R$ {selectedProvider.valorContratualValido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 block text-[9px] uppercase">Faturamento Amil Black</span>
                  <span className="bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded text-[10px] border border-amber-500/15">
                    {selectedProvider.tipoServiço}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold block">Novo Valor Contratual (R$)</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    value={readjustmentForm.newValue}
                    onChange={(e) => setReadjustmentForm({ ...readjustmentForm, newValue: e.target.value })}
                    placeholder="19525.00" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-150 font-mono focus:outline-hidden font-bold"
                  />
                  <span className="block text-[10px] text-zinc-550 mt-1">
                    Proposta sugerida: +5.5%
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold block">Índice Regulatório Utilizado</label>
                  <select 
                    value={readjustmentForm.indexUsed}
                    onChange={(e) => setReadjustmentForm({ ...readjustmentForm, indexUsed: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-300 focus:outline-hidden"
                  >
                    <option value="IPCA">IPCA (Recomendação Black)</option>
                    <option value="IGP-M">IGP-M</option>
                    <option value="ANS-FNP">ANS-FNP</option>
                    <option value="Acordo Direto">Acordo Direto Múltiplo</option>
                  </select>
                  <span className="block text-[10px] text-zinc-550 mt-1">
                    Indexação financeira
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold">Data da Vigência de Atualização</label>
                <input 
                  type="date" 
                  value={readjustmentForm.effectiveDate}
                  onChange={(e) => setReadjustmentForm({ ...readjustmentForm, effectiveDate: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-300 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold">Parecer Técnico / Observações da Ata</label>
                <textarea 
                  value={readjustmentForm.observacao}
                  onChange={(e) => setReadjustmentForm({ ...readjustmentForm, observacao: e.target.value })}
                  placeholder="Ex: Acordo direto estabelecido em auditoria conjunta. Limite do IPCA setorial aprovado no comitê de credenciamento regional." 
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-150 focus:outline-hidden resize-none"
                />
              </div>

              {/* simulated integration alert banner */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded text-zinc-300">
                <div className="flex gap-2 items-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 pulsing-dot"></div>
                  <span className="font-bold text-[11px] text-emerald-400 uppercase tracking-wide">Transmissão Síncrona SAP Ativa</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Ao confirmar, esta alteração de valor gerará um payload de atualização instantânea para os barramentos financeiros, reconciliando faturamentos futuros.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button 
                  type="button" 
                  onClick={() => setShowReadjustmentModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-750 text-white px-4 py-2.5 rounded font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-white hover:bg-zinc-200 text-black px-5 py-2.5 rounded font-bold uppercase tracking-wider flex items-center gap-1"
                >
                  Confirmar e Transmitir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
