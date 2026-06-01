import { Provider, ValueHistory } from "../types";
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  ChevronRight, 
  Award,
  ArrowUpRight,
  Sparkles,
  MapPin,
  Stethoscope,
  Briefcase,
  Layers,
  PieChart as PieIcon,
  Activity
} from "lucide-react";
import { useState } from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area
} from "recharts";

interface DashboardProps {
  providers: Provider[];
  onSelectTab: (tab: string) => void;
  onSelectProvider: (id: string) => void;
}

export default function Dashboard({ providers, onSelectTab, onSelectProvider }: DashboardProps) {
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>("TODOS");

  // Calculate stats based on 2026-06-01 (Current local date)
  const currentDate = new Date("2026-06-01");

  const totalProviders = providers.length;
  
  // Total volume R$
  const totalVolume = providers.reduce((sum, p) => sum + p.valorContratualValido, 0);

  // Calculate average of final approved negotiation percentages inside provider history
  let allPercentages: number[] = [];
  providers.forEach(p => {
    p.historicoValores.forEach(v => {
      allPercentages.push(v.readjustmentPercent);
    });
  });
  const avgReadjustment = allPercentages.length > 0 
    ? Number((allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length).toFixed(1))
    : 6.2; // default simulated

  // Count pending negotiations for this year (2026)
  const pendingNegotiations = providers.filter(p => 
    p.historicoNegociacoes.some(n => n.year === 2026 && n.status === "Em Negociação")
  ).length;

  // Contracts expiring or due for readjustment in the next 30-45 days
  const expiringSoonList = providers.filter(p => {
    const nextDate = new Date(p.proximoReajuste);
    const diffTime = nextDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 45;
  });

  const overdueList = providers.filter(p => {
    const nextDate = new Date(p.proximoReajuste);
    const diffTime = nextDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0; // missed date
  });

  // Calculate speciality distribution
  const specialtyCounts = providers.reduce((acc, p) => {
    acc[p.especialidade] = (acc[p.especialidade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate regional distribution
  const regionCounts = providers.reduce((acc, p) => {
    const region = p.uf;
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Specialty Data for local bar chart
  const specialtyData = Object.entries(specialtyCounts).map(([spec, count]) => ({
    name: spec,
    Quantidade: count,
    Porcentagem: Math.round((count / totalProviders) * 100)
  })).sort((a, b) => b.Quantidade - a.Quantidade);

  // Region Data
  const regionData = Object.entries(regionCounts).map(([uf, count]) => ({
    uf,
    count,
    percentage: Math.round((count / totalProviders) * 100)
  })).sort((a, b) => b.count - a.count);

  // Status distribution
  const statusCounts = providers.reduce((acc, p) => {
    const status = p.statusContrato || "Ativo";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusPieData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
    percentage: Math.round((value / totalProviders) * 100)
  }));

  // Average contract value by service type
  const serviceTypeValue = providers.reduce((acc, p) => {
    const type = p.tipoServiço || "Consulta";
    acc[type] = (acc[type] || 0) + p.valorContratualValido;
    return acc;
  }, {} as Record<string, number>);

  const serviceChartData = Object.entries(serviceTypeValue).map(([type, total]) => {
    const count = providers.filter(p => p.tipoServiço === type).length || 1;
    return {
      name: type,
      "Faturamento Total (K R$)": Math.round(total / 1000),
      "Ticket Médio (R$)": Math.round(total / count)
    };
  });

  // Reajuste por índice utilizado
  const indexUsage: Record<string, number> = {};
  providers.forEach(p => {
    p.historicoValores.forEach(v => {
      indexUsage[v.indexUsed] = (indexUsage[v.indexUsed] || 0) + 1;
    });
  });

  const indexPieData = Object.entries(indexUsage).map(([name, value]) => ({
    name,
    value
  }));

  // Elegant luxury colors for our chart layers
  const LUX_COLORS = [
    "#D4AF37", // Amber/Gold (Highlight)
    "#A8A29E", // Stone/Grey
    "#F5F5F7", // Snow White
    "#57534E", // Charcoal Stone
    "#D97706", // Deep Amber
    "#27272A"  // Extreme Dark Zinc
  ];

  const STATUS_COLORS: Record<string, string> = {
    "Ativo": "#10B981",       // Emerald Green
    "Sob Revisão": "#F59E0B",  // Amber
    "Suspenso": "#EF4444"      // Crimson Red
  };

  return (
    <div className="space-y-6" id="dashboard-component">
      
      {/* Premium Notification Center */}
      {(expiringSoonList.length > 0 || overdueList.length > 0) && (
        <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-lg p-5 shadow-xs transition-all border border-amber-500/20" id="notification-center">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-amber-400 shrink-0 w-6 h-6 mt-0.5" id="alert-icon-main" />
            <div className="flex-1">
              <h4 className="text-amber-300 font-semibold text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                Campanha Black: Contratos Exigindo Reajuste Anual Imediato
              </h4>
              <p className="text-zinc-300 text-xs mt-1">
                Foram identificados <span className="font-bold text-amber-400">{expiringSoonList.length} reajustes vencendo nos próximos 45 dias</span> e{" "}
                <span className="font-bold text-red-400">{overdueList.length} pendentes de regularização</span>. Certifique-se de renegociar antes que os índices de honorários SAP sejam bloqueados.
              </p>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {expiringSoonList.concat(overdueList).slice(0, 4).map(p => {
                  const daysLeft = Math.ceil((new Date(p.proximoReajuste).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
                  const isOverdue = daysLeft < 0;

                  return (
                    <div 
                      key={p.id}
                      onClick={() => {
                        onSelectTab("providers");
                        onSelectProvider(p.id);
                      }}
                      className="cursor-pointer bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-850 hover:border-amber-500/50 p-2.5 rounded-md flex items-center justify-between transition-all"
                      id={`notification-badge-${p.id}`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${isOverdue ? "bg-red-500" : "bg-amber-500"} shrink-0`}></span>
                          <p className="text-xs font-bold text-zinc-100 truncate">{p.nome}</p>
                        </div>
                        <p className="text-[10px] text-zinc-500 ml-4 truncate">{p.especialidade} • {p.cidade}/{p.uf}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                          isOverdue 
                            ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {isOverdue ? `Atrasado ${Math.abs(daysLeft)}d` : `${daysLeft} dias`}
                        </span>
                        <p className="text-[9px] text-zinc-500 mt-1">Aniversário: {p.proximoReajuste.split("-").reverse().join("/")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(expiringSoonList.length + overdueList.length) > 4 && (
                <div className="text-right mt-2">
                  <button 
                    onClick={() => onSelectTab("providers")} 
                    className="text-[10px] font-bold text-amber-400 hover:text-amber-300 uppercase tracking-widest hover:underline"
                  >
                    Ver mais {expiringSoonList.length + overdueList.length - 4} notificações de vencimento →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Headline */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900 p-6 rounded-xl border border-zinc-800 relative overflow-hidden shadow-md" id="dashboard-hero">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-16 -translate-y-16 select-none pointer-events-none">
          <Award size={250} className="text-zinc-100" />
        </div>
        <div className="z-10 space-y-1">
          <div className="flex items-center space-x-2 bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-full w-fit">
            <Sparkles className="w-4 h-4 text-amber-400 font-bold" />
            <span className="text-xs font-semibold text-zinc-300 tracking-wider">PORTFÓLIO AMIL BLACK DE ELITE</span>
          </div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Painel de Reajustes e Saúde do Portfólio</h2>
          <p className="text-zinc-400 text-xs max-w-2xl">
            Visão contábil e tática da rede de prestadores VIP. Gerencie datas de aniversário contratual, correções monetárias, homologação junto ao ERP e audite o faturamento instantaneamente.
          </p>
        </div>
        <div className="mt-4 md:mt-0 z-10 flex items-center space-x-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <div className="text-xs font-mono text-zinc-300">
            <span className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Último Sincronismo ERP</span>
            100% Homologado SAP
          </div>
        </div>
      </div>

      {/* Metric Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-metrics-grid">
        {/* Card 1 */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl shadow-xs transition-transform hover:-translate-y-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Prestadores VIP</span>
            <div className="p-2 bg-zinc-950 rounded-lg text-zinc-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-light text-zinc-100 tracking-tight">{totalProviders}</h3>
            <div className="flex items-center space-x-1 mt-2 text-[10px]">
              <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                MILLIONAIRE NET
              </span>
              <span className="text-zinc-500">Credenciados Top-Tier</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl shadow-xs transition-transform hover:-translate-y-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Média de Reajustes</span>
            <div className="p-2 bg-zinc-950 rounded-lg text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-light text-emerald-400 tracking-tight">+{avgReadjustment}%</h3>
            <div className="flex items-center space-x-1 mt-2 text-[10px]">
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                CORREÇÃO ANUAL
              </span>
              <span className="text-zinc-500">Acima do IPCA</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl shadow-xs transition-transform hover:-translate-y-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Mesa Negociação '26</span>
            <div className="p-2 bg-zinc-950 rounded-lg text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-light text-amber-400 tracking-tight">{pendingNegotiations}</h3>
            <div className="flex items-center space-x-1 mt-2 text-[10px]">
              <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold font-semibold animate-pulse">
                EM DISCUSSÃO
              </span>
              <span className="text-zinc-500">Mesa de Acordo</span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl shadow-xs transition-transform hover:-translate-y-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Volume Contratual/Mês</span>
            <div className="p-2 bg-zinc-950 rounded-lg text-zinc-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-light text-zinc-100 tracking-tight">
              R$ {totalVolume.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
            </h3>
            <div className="flex items-center space-x-1 mt-2 text-[10px]">
              <span className="text-[10px] text-zinc-400 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded font-mono font-bold">
                AUDITADO
              </span>
              <span className="text-zinc-500">Faturamento Real VIP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Charts Segment powered by Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-visual-analytics">
        
        {/* Graph 1: Service Type financial distribution */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-zinc-400" />
                Valores de Faturamento Médio por Categoria
              </h4>
              <p className="text-[10px] text-zinc-500 font-medium">Divisão financeira de ticket e volumes negociados em K R$</p>
            </div>
            <div className="text-zinc-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 mt-4" id="service-value-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={serviceChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#71717A" 
                  fontSize={10}
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#71717A" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#EDEDED", fontSize: "11px" }}
                  labelStyle={{ color: "#A1A1AA", fontSize: "11px", fontWeight: "bold" }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: "10px", marginTop: "10px" }}
                  iconSize={10}
                />
                <Bar dataKey="Faturamento Total (K R$)" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ticket Médio (R$)" fill="#71717A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Contract Status Breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-zinc-400" />
              Saturação e Status dos Contratos Vigentes
            </h4>
            <p className="text-[10px] text-zinc-500 font-medium">Porcentagem de prestadores sob as visões Ativo, Suspenso ou Revisão</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mt-4">
            {/* Visual Pie */}
            <div className="h-44 w-full flex justify-center items-center" id="status-pie-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STATUS_COLORS[entry.name] || LUX_COLORS[index % LUX_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090b",
                      border: "1px solid #27272a",
                      borderRadius: "6px"
                    }}
                    itemStyle={{ color: "#EDEDED", fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Indicator Details */}
            <div className="space-y-3">
              {statusPieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-xs border-b border-zinc-850 pb-1.5 last:border-none">
                  <div className="flex items-center space-x-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: STATUS_COLORS[entry.name] || LUX_COLORS[index % LUX_COLORS.length] }}
                    ></span>
                    <span className="font-semibold text-zinc-300">{entry.name}</span>
                  </div>
                  <span className="font-mono text-zinc-400 text-[10px]">
                    {entry.value} {entry.value === 1 ? "prestador" : "prestadores"} ({entry.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Visual Analytics Grid 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-geographic-specialty">
        
        {/* Progress bars specialty (Columns 7) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xs lg:col-span-7">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-2 mt-1">
              <Stethoscope className="text-zinc-300 w-5 h-5 animate-pulse" />
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">Segmento de Especialização da Rede</h4>
                <p className="text-[10px] text-zinc-500 font-medium font-semibold">Proporção e contagem detalhada por especialidade Black</p>
              </div>
            </div>
            <span className="text-[9px] font-mono bg-zinc-950 font-bold border border-zinc-850 rounded px-2.5 py-1 text-zinc-400">
              AUDITADO
            </span>
          </div>
          
          <div className="space-y-4">
            {specialtyData.map((item, index) => {
              // Custom gradient color based on the design philosophy
              const col = index === 0 ? "bg-amber-500" : index === 1 ? "bg-zinc-300" : "bg-zinc-650";

              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                      <span className="w-1 h-3 bg-zinc-500 rounded"></span>
                      {item.name}
                    </span>
                    <span className="text-zinc-400 font-mono text-[11px] font-bold">
                      {item.Quantidade} clin ({item.Porcentagem}%)
                    </span>
                  </div>
                  {/* Visual Bar */}
                  <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850">
                    <div 
                      className={`h-full rounded-full ${col} transition-all duration-1000`} 
                      style={{ width: `${item.Porcentagem}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Region stats & geographical map analysis (Columns 5) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xs lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="text-zinc-300 w-5 h-5" />
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">Dispersão Física por Estado (UF)</h4>
                <p className="text-[10px] text-zinc-500 font-medium">Volumetria de atuação de alta complexidade</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {regionData.map(item => (
                <div 
                  key={item.uf} 
                  className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg text-center hover:border-amber-500/20 transition-all cursor-default"
                >
                  <span className="block text-xs font-mono font-bold text-zinc-400">{item.uf}</span>
                  <span className="block text-2xl font-light text-zinc-100 mt-1">{item.count}</span>
                  <span className="inline-block text-[9px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 rounded mt-1">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-950 rounded-lg p-3.5 text-zinc-300 border border-zinc-850 relative overflow-hidden mt-4">
            <div className="absolute right-0 bottom-0 opacity-15 transform translate-x-3 translate-y-3 pointer-events-none">
              <MapPin size={85} className="text-zinc-800" />
            </div>
            <h5 className="text-[9px] uppercase font-bold text-amber-500 tracking-wider">Políticas Regulatórias Amil Black</h5>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              O portfólio Amil Black opera sob reajustes automáticos pelo IPCA setorial de acordo com os marcos contratuais vigentes. Alterações manuais disparam alertas imediatos para a controladoria central.
            </p>
          </div>
        </div>

      </div>

      {/* Pending negotiation action list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xs" id="pending-negotiation-block">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold text-zinc-200">Painel de Negociações e Dissídios Contratuais • Campanha 2026</h4>
            <p className="text-[10px] text-zinc-500">Credenciados com discussões de reajustes anuais em andamento</p>
          </div>
          <button 
            onClick={() => onSelectTab("providers")} 
            className="text-xs text-zinc-300 hover:text-white font-medium flex items-center space-x-0.5 hover:underline"
          >
            <span>Ver listagem de prestadores</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400">
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Nome do Prestador VIP</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">UF/Cidade</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Especialidade</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Proposta Amil</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Status da Mesa</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Próximo Vencimento</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px] text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 text-zinc-300">
              {providers.map(p => {
                const currentNeg = p.historicoNegociacoes.find(n => n.year === 2026);
                if (!currentNeg) return null;

                const isCompleted = currentNeg.status === "Concluído";

                return (
                  <tr key={p.id} className="hover:bg-zinc-800/10 transition-colors">
                    <td className="p-3 font-bold text-zinc-200">
                      <div>{p.nome}</div>
                      <div className="text-[9px] text-zinc-500 font-mono">CNPJ: {p.cnpj}</div>
                    </td>
                    <td className="p-3 text-zinc-400">{p.uf} • {p.cidade}</td>
                    <td className="p-3 text-zinc-400 italic">{p.especialidade}</td>
                    <td className="p-3 font-mono font-bold text-amber-400">
                      +{currentNeg.initialProposalPercent}%
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        isCompleted 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {currentNeg.status}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-400 font-mono">
                      {p.proximoReajuste.split("-").reverse().join("/")}
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => {
                          onSelectTab("providers");
                          onSelectProvider(p.id);
                        }}
                        className="text-zinc-100 hover:text-white font-bold text-xs hover:underline inline-flex items-center border border-zinc-800 bg-zinc-950 px-2 py-1 rounded cursor-pointer"
                      >
                        Avaliar <ArrowUpRight className="w-3 h-3 ml-1 text-amber-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
