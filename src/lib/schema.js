// Vocabulário do estúdio: rótulos, navegação, perfis e permissões padrão.

export const ROLES = {
  administrador: 'Administrador',
  fotografo: 'Fotógrafo',
  editor: 'Editor',
  atendimento: 'Atendimento',
}

// [id do módulo, rótulo]
export const NAV = [
  { group: 'Visão geral', items: [['dashboard', 'Painel']] },
  { group: 'Relacionamento', items: [['clientes', 'Clientes'], ['contratos', 'Contratos']] },
  { group: 'Produção', items: [['projetos', 'Projetos'], ['prazos', 'Prazos'], ['agenda', 'Agenda']] },
]
export const MODULES = NAV.flatMap((g) => g.items)

export const PAGE_INFO = {
  dashboard: ['Visão geral', 'Prazos, contratos e sessões do estúdio num só lugar.'],
  clientes: ['Relacionamento', 'Cadastro de pessoas e empresas atendidas pelo estúdio.'],
  contratos: ['Relacionamento', 'Contratos com cliente, valor e status. Gere o PDF para assinatura.'],
  projetos: ['Produção', 'Cada trabalho reúne cliente, contrato, prazos e sessões.'],
  prazos: ['Produção', 'Captação, seleção, edição e entrega, com responsável e data limite.'],
  agenda: ['Produção', 'Sessões, locações e reuniões com clientes.'],
  equipe: ['Administração', 'Perfis de acesso e permissões por módulo.'],
}

export const L = {
  tipoCliente: { pessoa: 'Pessoa física', empresa: 'Empresa' },
  projetoStatus: {
    orcamento: 'Orçamento', agendado: 'Agendado', em_andamento: 'Em andamento',
    entregue: 'Entregue', concluido: 'Concluído', cancelado: 'Cancelado',
  },
  tipoEnsaio: {
    Casamento: 'Casamento', 'Família': 'Família', Gestante: 'Gestante', Newborn: 'Newborn',
    Corporativo: 'Corporativo', Produto: 'Produto', Evento: 'Evento', Retrato: 'Retrato', Outro: 'Outro',
  },
  contratoStatus: {
    rascunho: 'Rascunho', enviado: 'Aguardando assinatura', assinado: 'Assinado',
    encerrado: 'Encerrado', cancelado: 'Cancelado',
  },
  etapa: { captacao: 'Captação', selecao: 'Seleção', edicao: 'Edição', entrega: 'Entrega', outro: 'Outro' },
  prioridade: { baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente' },
  prazoStatus: { pendente: 'Pendente', em_andamento: 'Em andamento', concluido: 'Concluído', cancelado: 'Cancelado' },
  sessaoStatus: { agendada: 'Agendada', realizada: 'Realizada', cancelada: 'Cancelada' },
}
export const entries = (map) => Object.entries(map)

// Tom visual de cada status. Diferenças de preenchimento e contorno, não só de cor.
//  hot = âmbar preenchido (exige ação) · warn = contorno âmbar (pendente)
//  ok = contorno claro · neutral = contorno cinza · muted = esmaecido
export const TONE = {
  urgente: 'hot',
  alta: 'warn', media: 'neutral', baixa: 'neutral',
  enviado: 'warn', orcamento: 'warn', pendente: 'warn', agendado: 'warn', agendada: 'warn', em_andamento: 'warn',
  assinado: 'ok', entregue: 'ok',
  rascunho: 'neutral',
  concluido: 'muted', encerrado: 'muted', realizada: 'muted', cancelado: 'muted', cancelada: 'muted',
}

const V = { view: true }
const VCE = { view: true, create: true, edit: true }
export const ROLE_PRESETS = {
  fotografo: { dashboard: V, clientes: V, contratos: V, projetos: VCE, prazos: VCE, agenda: VCE },
  editor: { dashboard: V, projetos: V, prazos: { view: true, edit: true }, agenda: V },
  atendimento: { dashboard: V, clientes: VCE, contratos: VCE, projetos: VCE, prazos: VCE, agenda: VCE },
}
