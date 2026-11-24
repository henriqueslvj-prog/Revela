// Configuração dos cadastros. Cada módulo é descrito aqui; a tela é gerada pelo CrudManager.
import { L, entries } from '../lib/schema.js'
import { daysUntil, prazoSituacao, todayISO } from '../lib/format.js'
import { abrirContrato } from '../lib/contrato.js'

const byRef = (ref, id) => (ref || []).find((x) => x.id === id)

export const CFG = {
  clientes: {
    table: 'clientes', plural: 'clientes', singular: 'cliente', novo: 'Novo cliente',
    fields: [
      { key: 'nome', label: 'Nome', kind: 'text', required: true, full: true },
      { key: 'tipo', label: 'Tipo', kind: 'select', required: true, options: entries(L.tipoCliente), def: 'pessoa' },
      { key: 'documento', label: 'CPF / CNPJ', kind: 'text', mono: true },
      { key: 'email', label: 'E-mail', kind: 'email' },
      { key: 'telefone', label: 'Telefone', kind: 'tel', mono: true },
      { key: 'endereco', label: 'Endereço', kind: 'text', full: true },
      { key: 'origem', label: 'Como conheceu o estúdio', kind: 'text', full: true },
      { key: 'observacoes', label: 'Observações', kind: 'textarea', full: true },
    ],
    columns: [
      { key: 'nome', label: 'Nome', kind: 'text' },
      { key: 'tipo', label: 'Tipo', kind: 'map', map: L.tipoCliente },
      { key: 'telefone', label: 'Telefone', kind: 'text', mono: true },
      { key: 'email', label: 'E-mail', kind: 'text' },
      { key: 'origem', label: 'Origem', kind: 'text' },
    ],
    sort: (a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'),
  },

  projetos: {
    table: 'projetos', plural: 'projetos', singular: 'projeto', novo: 'Novo projeto',
    fields: [
      { key: 'titulo', label: 'Título do projeto', kind: 'text', required: true, full: true },
      { key: 'cliente_id', label: 'Cliente', kind: 'ref', required: true, ref: { table: 'clientes', label: 'nome' } },
      { key: 'tipo', label: 'Tipo de trabalho', kind: 'select', options: entries(L.tipoEnsaio) },
      { key: 'status', label: 'Status', kind: 'select', required: true, options: entries(L.projetoStatus), def: 'orcamento' },
      { key: 'responsavel_id', label: 'Responsável', kind: 'team' },
      { key: 'data_inicio', label: 'Data da sessão', kind: 'date' },
      { key: 'data_entrega', label: 'Entrega prevista', kind: 'date' },
      { key: 'local', label: 'Local', kind: 'text', full: true },
      { key: 'observacoes', label: 'Observações', kind: 'textarea', full: true },
    ],
    columns: [
      { key: 'titulo', label: 'Projeto', kind: 'text' },
      { key: 'cliente_id', label: 'Cliente', kind: 'ref', ref: { table: 'clientes', label: 'nome' } },
      { key: 'tipo', label: 'Tipo', kind: 'text' },
      { key: 'status', label: 'Status', kind: 'chip', map: L.projetoStatus },
      { key: 'data_entrega', label: 'Entrega', kind: 'date', mono: true },
    ],
    filters: [{
      id: 'situacao', label: 'Situação', default: 'abertos',
      options: [['abertos', 'Em aberto'], ['todos', 'Todos'], ['encerrados', 'Encerrados']],
      test: (r, v) => {
        const fechado = ['concluido', 'cancelado', 'entregue'].includes(r.status)
        return v === 'abertos' ? !fechado : fechado
      },
    }],
    sort: (a, b) => String(a.data_entrega || '9999').localeCompare(String(b.data_entrega || '9999')),
  },

  contratos: {
    table: 'contratos', plural: 'contratos', singular: 'contrato', novo: 'Novo contrato',
    fields: [
      { key: 'cliente_id', label: 'Cliente', kind: 'ref', required: true, ref: { table: 'clientes', label: 'nome' } },
      { key: 'projeto_id', label: 'Projeto', kind: 'ref', ref: { table: 'projetos', label: 'titulo', filterBy: 'cliente_id' }, hint: 'Mostra só os projetos do cliente escolhido.' },
      { key: 'servico', label: 'Serviço contratado', kind: 'textarea', required: true, full: true },
      { key: 'valor', label: 'Valor (R$)', kind: 'number', mono: true },
      { key: 'forma_pagamento', label: 'Forma de pagamento', kind: 'text', placeholder: 'Ex.: 50% na assinatura e 50% na entrega' },
      { key: 'uso_imagem', label: 'Uso de imagem', kind: 'text', full: true, placeholder: 'Ex.: Portfólio do estúdio autorizado' },
      { key: 'status', label: 'Status', kind: 'select', required: true, options: entries(L.contratoStatus), def: 'rascunho' },
      { key: 'data_emissao', label: 'Data de emissão', kind: 'date', def: todayISO },
      { key: 'data_assinatura', label: 'Data de assinatura', kind: 'date' },
      { key: 'observacoes', label: 'Observações', kind: 'textarea', full: true },
    ],
    columns: [
      { key: 'numero', label: 'Nº', kind: 'text', mono: true },
      { key: 'cliente_id', label: 'Cliente', kind: 'ref', ref: { table: 'clientes', label: 'nome' } },
      { key: 'projeto_id', label: 'Projeto', kind: 'ref', ref: { table: 'projetos', label: 'titulo' } },
      { key: 'valor', label: 'Valor', kind: 'money', mono: true },
      { key: 'status', label: 'Status', kind: 'chip', map: L.contratoStatus },
    ],
    filters: [{
      id: 'status', label: 'Status', default: 'todos',
      options: [['todos', 'Todos os status'], ...entries(L.contratoStatus)],
      test: (r, v) => r.status === v,
    }],
    sort: (a, b) => String(b.numero).localeCompare(String(a.numero)),
    actions: [{
      label: 'Gerar PDF do contrato', icon: 'print',
      run: (row, ctx) => abrirContrato({
        contrato: row,
        cliente: byRef(ctx.refs.clientes, row.cliente_id),
        projeto: byRef(ctx.refs.projetos, row.projeto_id),
      }),
    }],
  },

  prazos: {
    table: 'prazos', plural: 'prazos', singular: 'prazo', novo: 'Novo prazo',
    fields: [
      { key: 'titulo', label: 'O que precisa ser feito', kind: 'text', required: true, full: true },
      { key: 'projeto_id', label: 'Projeto', kind: 'ref', ref: { table: 'projetos', label: 'titulo' } },
      { key: 'etapa', label: 'Etapa', kind: 'select', required: true, options: entries(L.etapa), def: 'edicao' },
      { key: 'data_limite', label: 'Data limite', kind: 'date', required: true },
      { key: 'responsavel_id', label: 'Responsável', kind: 'team' },
      { key: 'prioridade', label: 'Prioridade', kind: 'select', required: true, options: entries(L.prioridade), def: 'media' },
      { key: 'status', label: 'Status', kind: 'select', required: true, options: entries(L.prazoStatus), def: 'pendente' },
      { key: 'observacoes', label: 'Observações', kind: 'textarea', full: true },
    ],
    columns: [
      { key: 'titulo', label: 'Prazo', kind: 'text' },
      { key: 'projeto_id', label: 'Projeto', kind: 'ref', ref: { table: 'projetos', label: 'titulo' } },
      { key: 'etapa', label: 'Etapa', kind: 'map', map: L.etapa },
      { key: 'data_limite', label: 'Data limite', kind: 'date', mono: true },
      { key: 'status', label: 'Situação', kind: 'situacao' },
      { key: 'responsavel_id', label: 'Responsável', kind: 'team' },
    ],
    filters: [{
      id: 'situacao', label: 'Situação', default: 'abertos',
      options: [['abertos', 'Em aberto'], ['atrasados', 'Atrasados'], ['semana', 'Próximos 7 dias'], ['concluidos', 'Concluídos'], ['todos', 'Todos']],
      test: (r, v) => {
        const aberto = !['concluido', 'cancelado'].includes(r.status)
        const d = daysUntil(r.data_limite)
        if (v === 'abertos') return aberto
        if (v === 'atrasados') return aberto && d !== null && d < 0
        if (v === 'semana') return aberto && d !== null && d >= 0 && d <= 7
        return !aberto
      },
    }],
    // Em aberto primeiro, por data limite; concluídos por último.
    sort: (a, b) => {
      const fa = prazoSituacao(a).tone === 'muted' ? 1 : 0
      const fb = prazoSituacao(b).tone === 'muted' ? 1 : 0
      return fa - fb || String(a.data_limite).localeCompare(String(b.data_limite))
    },
  },

  agenda: {
    table: 'sessoes', plural: 'sessões', singular: 'sessão', novo: 'Nova sessão',
    fields: [
      { key: 'titulo', label: 'Título', kind: 'text', required: true, full: true },
      { key: 'projeto_id', label: 'Projeto', kind: 'ref', ref: { table: 'projetos', label: 'titulo' } },
      { key: 'status', label: 'Status', kind: 'select', required: true, options: entries(L.sessaoStatus), def: 'agendada' },
      { key: 'inicio', label: 'Início', kind: 'datetime', required: true },
      { key: 'fim', label: 'Fim', kind: 'datetime' },
      { key: 'local', label: 'Local', kind: 'text', full: true },
      { key: 'equipe', label: 'Equipe envolvida', kind: 'text', full: true },
      { key: 'observacoes', label: 'Observações', kind: 'textarea', full: true },
    ],
    columns: [
      { key: 'titulo', label: 'Sessão', kind: 'text' },
      { key: 'projeto_id', label: 'Projeto', kind: 'ref', ref: { table: 'projetos', label: 'titulo' } },
      { key: 'inicio', label: 'Início', kind: 'datetime', mono: true },
      { key: 'local', label: 'Local', kind: 'text' },
      { key: 'status', label: 'Status', kind: 'chip', map: L.sessaoStatus },
    ],
    filters: [{
      id: 'periodo', label: 'Período', default: 'proximas',
      options: [['proximas', 'Próximas'], ['passadas', 'Passadas'], ['todos', 'Todas']],
      test: (r, v) => (v === 'proximas' ? daysUntil(r.inicio) >= 0 : daysUntil(r.inicio) < 0),
    }],
    sort: (a, b) => String(a.inicio).localeCompare(String(b.inicio)),
  },
}
