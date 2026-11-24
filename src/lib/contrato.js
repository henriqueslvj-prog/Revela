// Gera o contrato em uma janela pronta para imprimir ou salvar como PDF.
// O texto é um MODELO: as cláusulas devem ser revisadas por um advogado antes do uso real.
import { fmtDate, fmtMoney } from './format.js'

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const or = (v, placeholder) => (v ? esc(v) : `<span class="ph">[${placeholder}]</span>`)

export function contratoHtml({ contrato, cliente, projeto }) {
  const c = contrato || {}
  const cli = cliente || {}
  const pro = projeto || {}
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Contrato ${esc(c.numero)}</title>
<style>
  @page { size: A4; margin: 22mm 20mm; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #111; line-height: 1.55; font-size: 12pt; margin: 0; }
  .aviso { font-family: Arial, sans-serif; font-size: 10pt; background: #FFF3D6; border: 1px solid #F5A524; padding: 8px 12px; margin: 0 0 18px; }
  h1 { font-size: 15pt; text-align: center; margin: 0 0 4px; letter-spacing: .5px; }
  .num { text-align: center; font-family: Arial, sans-serif; font-size: 10pt; color: #555; margin-bottom: 22px; }
  h2 { font-size: 11pt; margin: 18px 0 4px; text-transform: uppercase; letter-spacing: .4px; }
  p { margin: 0 0 8px; text-align: justify; }
  .ph { background: #FFF3D6; padding: 0 3px; }
  .assin { display: flex; gap: 40px; margin-top: 56px; }
  .assin div { flex: 1; border-top: 1px solid #111; padding-top: 6px; font-size: 10.5pt; text-align: center; }
  @media print { .aviso { display: none; } }
</style></head><body>
<div class="aviso">Modelo para revisão jurídica antes do uso. Preencha os trechos <b>[entre colchetes]</b>. Para salvar em PDF, escolha “Salvar como PDF” na janela de impressão.</div>
<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS</h1>
<div class="num">Nº ${esc(c.numero)} · emitido em ${esc(fmtDate(c.data_emissao))}</div>

<p><b>CONTRATADO:</b> ${or('', 'NOME DO ESTÚDIO')}, inscrito(a) no CPF/CNPJ ${or('', 'CPF/CNPJ')}, com sede em ${or('', 'ENDEREÇO DO ESTÚDIO')}.</p>
<p><b>CONTRATANTE:</b> ${or(cli.nome, 'NOME DO CLIENTE')}, inscrito(a) no CPF/CNPJ ${or(cli.documento, 'CPF/CNPJ')}, residente ou sediado(a) em ${or(cli.endereco, 'ENDEREÇO')}.</p>

<h2>Cláusula 1ª — Do objeto</h2>
<p>O presente contrato tem por objeto a prestação dos seguintes serviços fotográficos: ${or(c.servico, 'DESCRIÇÃO DO SERVIÇO')}${pro.titulo ? `, referentes ao projeto “${esc(pro.titulo)}”` : ''}.</p>

<h2>Cláusula 2ª — Dos prazos</h2>
<p>A sessão ou cobertura está prevista para ${or(fmtDate(pro.data_inicio) === '—' ? '' : fmtDate(pro.data_inicio), 'DATA DA SESSÃO')}, e a entrega do material final está prevista para ${or(fmtDate(pro.data_entrega) === '—' ? '' : fmtDate(pro.data_entrega), 'DATA DE ENTREGA')}.</p>

<h2>Cláusula 3ª — Do valor e do pagamento</h2>
<p>Pelos serviços, o CONTRATANTE pagará ao CONTRATADO o valor de ${or(fmtMoney(c.valor) === '—' ? '' : fmtMoney(c.valor), 'VALOR')}, na seguinte forma: ${or(c.forma_pagamento, 'FORMA DE PAGAMENTO')}.</p>

<h2>Cláusula 4ª — Dos direitos autorais e do uso de imagem</h2>
<p>Os direitos autorais sobre as fotografias pertencem ao CONTRATADO, nos termos da Lei nº 9.610/1998, sendo concedida ao CONTRATANTE licença de uso conforme combinado. Uso de imagem: ${or(c.uso_imagem, 'DEFINIR USO DE IMAGEM')}.</p>

<h2>Cláusula 5ª — Do cancelamento e da remarcação</h2>
<p>${or('', 'DEFINIR REGRAS DE CANCELAMENTO, REMARCAÇÃO E DEVOLUÇÃO DE VALORES')}.</p>

<h2>Cláusula 6ª — Do foro</h2>
<p>Fica eleito o foro da comarca de ${or('', 'CIDADE/UF')} para dirimir quaisquer dúvidas oriundas deste contrato.</p>

<p style="margin-top:18px">${or('', 'CIDADE')}, ${esc(fmtDate(c.data_emissao))}.</p>
<div class="assin"><div>CONTRATADO</div><div>CONTRATANTE<br>${esc(cli.nome || '')}</div></div>
</body></html>`
}

export function abrirContrato(dados) {
  const w = window.open('', '_blank')
  if (!w) {
    alert('Permita pop-ups neste site para abrir o contrato.')
    return
  }
  w.document.write(contratoHtml(dados))
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 400)
}
