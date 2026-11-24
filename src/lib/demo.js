// Dados de exemplo do modo demonstração. Nomes fictícios; datas relativas a hoje.
import { addDaysISO } from './format.js'

const at = (offsetDays, hour) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const DEMO_PROFILE = {
  id: 'u1', full_name: 'Estúdio (demonstração)', email: 'demo@revela.app', role: 'administrador', status: 'ativo',
}

export function seed() {
  const now = new Date().toISOString()
  const base = { created_at: now, updated_at: now }
  return {
    equipe: [
      { id: 'u1', full_name: 'Estúdio (demonstração)', role: 'administrador' },
      { id: 'u2', full_name: 'Camila Duarte', role: 'fotografo' },
      { id: 'u3', full_name: 'Bruno Teixeira', role: 'editor' },
    ],
    clientes: [
      { id: 'c1', nome: 'Ana Beatriz Lima', tipo: 'pessoa', documento: '000.000.000-00', email: 'ana@exemplo.com', telefone: '(11) 90000-0001', endereco: 'Rua das Acácias, 120', origem: 'Indicação', observacoes: null, ...base },
      { id: 'c2', nome: 'Família Carvalho', tipo: 'pessoa', documento: null, email: 'carvalho@exemplo.com', telefone: '(11) 90000-0002', endereco: null, origem: 'Instagram', observacoes: 'Prefere sessões ao ar livre.', ...base },
      { id: 'c3', nome: 'Clínica Vitta', tipo: 'empresa', documento: '00.000.000/0001-00', email: 'contato@vitta.exemplo.com', telefone: '(11) 3000-0003', endereco: 'Av. Central, 800, sala 12', origem: 'Site', observacoes: null, ...base },
      { id: 'c4', nome: 'Julia Prado', tipo: 'pessoa', documento: null, email: 'julia@exemplo.com', telefone: '(11) 90000-0004', endereco: null, origem: 'Indicação', observacoes: null, ...base },
    ],
    projetos: [
      { id: 'p1', titulo: 'Casamento Ana & Lucas', cliente_id: 'c1', tipo: 'Casamento', status: 'em_andamento', data_inicio: addDaysISO(-9), data_entrega: addDaysISO(-1), local: 'Espaço Jardim', responsavel_id: 'u2', observacoes: null, ...base },
      { id: 'p2', titulo: 'Ensaio de família Carvalho', cliente_id: 'c2', tipo: 'Família', status: 'agendado', data_inicio: addDaysISO(3), data_entrega: addDaysISO(18), local: 'Parque da Cidade', responsavel_id: 'u2', observacoes: null, ...base },
      { id: 'p3', titulo: 'Book corporativo Clínica Vitta', cliente_id: 'c3', tipo: 'Corporativo', status: 'em_andamento', data_inicio: addDaysISO(-4), data_entrega: addDaysISO(5), local: 'Sede da clínica', responsavel_id: 'u3', observacoes: null, ...base },
      { id: 'p4', titulo: 'Ensaio gestante Julia Prado', cliente_id: 'c4', tipo: 'Gestante', status: 'orcamento', data_inicio: addDaysISO(12), data_entrega: addDaysISO(26), local: null, responsavel_id: null, observacoes: null, ...base },
    ],
    contratos: [
      { id: 'k1', numero: 'CT-0001', cliente_id: 'c1', projeto_id: 'p1', servico: 'Cobertura fotográfica de casamento (cerimônia e festa) com entrega de galeria digital editada.', valor: 4800, forma_pagamento: '50% na assinatura e 50% na entrega', uso_imagem: 'Portfólio e redes sociais do estúdio autorizados', data_emissao: addDaysISO(-40), data_assinatura: addDaysISO(-35), status: 'assinado', observacoes: null, ...base },
      { id: 'k2', numero: 'CT-0002', cliente_id: 'c2', projeto_id: 'p2', servico: 'Ensaio de família ao ar livre, até 2 horas, com 40 fotos editadas.', valor: 950, forma_pagamento: '100% na assinatura', uso_imagem: 'Uso exclusivo do cliente', data_emissao: addDaysISO(-2), data_assinatura: null, status: 'enviado', observacoes: null, ...base },
      { id: 'k3', numero: 'CT-0003', cliente_id: 'c3', projeto_id: 'p3', servico: 'Book corporativo da equipe (12 profissionais) e fotos institucionais do espaço.', valor: 3200, forma_pagamento: '30% na assinatura e 70% na entrega', uso_imagem: 'Uso comercial do cliente, com crédito ao estúdio', data_emissao: addDaysISO(-8), data_assinatura: addDaysISO(-6), status: 'assinado', observacoes: null, ...base },
      { id: 'k4', numero: 'CT-0004', cliente_id: 'c4', projeto_id: 'p4', servico: 'Ensaio gestante em estúdio, com 30 fotos editadas.', valor: 780, forma_pagamento: null, uso_imagem: null, data_emissao: addDaysISO(0), data_assinatura: null, status: 'rascunho', observacoes: null, ...base },
    ],
    prazos: [
      { id: 'z1', titulo: 'Entrega da galeria do casamento', projeto_id: 'p1', etapa: 'entrega', responsavel_id: 'u3', prioridade: 'urgente', status: 'em_andamento', data_limite: addDaysISO(-1), observacoes: null, ...base },
      { id: 'z2', titulo: 'Seleção das fotos do book', projeto_id: 'p3', etapa: 'selecao', responsavel_id: 'u2', prioridade: 'alta', status: 'pendente', data_limite: addDaysISO(2), observacoes: null, ...base },
      { id: 'z3', titulo: 'Edição do book corporativo', projeto_id: 'p3', etapa: 'edicao', responsavel_id: 'u3', prioridade: 'media', status: 'pendente', data_limite: addDaysISO(4), observacoes: null, ...base },
      { id: 'z4', titulo: 'Captação do ensaio de família', projeto_id: 'p2', etapa: 'captacao', responsavel_id: 'u2', prioridade: 'media', status: 'pendente', data_limite: addDaysISO(3), observacoes: null, ...base },
      { id: 'z5', titulo: 'Entrega do ensaio de família', projeto_id: 'p2', etapa: 'entrega', responsavel_id: 'u3', prioridade: 'baixa', status: 'pendente', data_limite: addDaysISO(18), observacoes: null, ...base },
      { id: 'z6', titulo: 'Prova de álbum do casamento', projeto_id: 'p1', etapa: 'outro', responsavel_id: 'u1', prioridade: 'baixa', status: 'concluido', data_limite: addDaysISO(-6), observacoes: null, ...base },
    ],
    sessoes: [
      { id: 's1', titulo: 'Ensaio de família Carvalho', projeto_id: 'p2', inicio: at(3, 9), fim: at(3, 11), local: 'Parque da Cidade', equipe: 'Camila Duarte', status: 'agendada', observacoes: null, ...base },
      { id: 's2', titulo: 'Reunião de briefing — Julia Prado', projeto_id: 'p4', inicio: at(1, 15), fim: at(1, 16), local: 'Estúdio', equipe: null, status: 'agendada', observacoes: null, ...base },
      { id: 's3', titulo: 'Fotos institucionais — Clínica Vitta', projeto_id: 'p3', inicio: at(6, 10), fim: at(6, 13), local: 'Sede da clínica', equipe: 'Camila Duarte', status: 'agendada', observacoes: null, ...base },
      { id: 's4', titulo: 'Retratos da equipe — Clínica Vitta', projeto_id: 'p3', inicio: at(-4, 14), fim: at(-4, 17), local: 'Sede da clínica', equipe: 'Camila Duarte', status: 'realizada', observacoes: null, ...base },
    ],
  }
}
