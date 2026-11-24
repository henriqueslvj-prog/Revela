# Revela V0.1 — Gestão para estúdio fotográfico

Clientes, contratos, prazos e sessões do estúdio em um só lugar. Base técnica herdada do ELO V0.21
(React + Vite + Supabase, instalável como app no celular), com identidade e módulos novos.

**Identidade:** grafite `#0F1115` · off-white `#F5F4F1` · cinza `#8A8F98` · âmbar `#F5A524`
· Sora (títulos), Inter (interface), JetBrains Mono (datas, valores e códigos) · símbolo: cantoneiras de enquadramento.

## Ver funcionando agora (modo demonstração)

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal e clique em **Entrar na demonstração**. Sem as variáveis do Supabase,
o Revela abre com dados de exemplo (nomes fictícios) guardados só no seu navegador. Você pode criar, editar
e excluir registros para testar. Para voltar ao início: menu lateral › **Restaurar exemplos**.

## O que tem nesta versão

| Módulo | O que faz |
|---|---|
| Painel | Prazos da semana, contratos aguardando assinatura, sessões da semana e prazos atrasados; listas de próximos prazos, contratos pendentes e próximas sessões |
| Clientes | Pessoa física ou empresa, documento, contato, origem e observações |
| Projetos | Trabalho do cliente (tipo, status, sessão, entrega prevista, responsável) |
| Contratos | Número automático (CT-0001…), cliente, projeto, valor, forma de pagamento, uso de imagem, status; botão para **gerar o contrato em PDF** |
| Prazos | Etapa (captação, seleção, edição, entrega), responsável, prioridade; situação calculada: em dia, a vencer (até 3 dias), atrasado |
| Agenda | Sessões e reuniões com início, fim, local e equipe |
| Equipe | Usuários, perfis (administrador, fotógrafo, editor, atendimento) e permissões por módulo (só administrador) |

Também: tema escuro (padrão) e claro, menu fixo no computador, barra inferior no celular, busca e filtros nos
cadastros, instalação como app (PWA) com ícone e tela de abertura.

## Usar de verdade (Supabase)

1. Crie um projeto em supabase.com.
2. No **SQL Editor**, execute o arquivo inteiro `supabase/revela-v0.1.sql`.
3. Em **Authentication › Users**, crie seu usuário e torne-o administrador (SQL Editor):
   ```sql
   update public.profiles set role = 'administrador', full_name = 'Seu Nome'
   where email = 'seu@email.com';
   ```
4. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   (Project Settings › API). Na Vercel, cadastre as mesmas duas variáveis.
5. Para criar usuários pela tela **Equipe**, publique a função:
   ```bash
   supabase functions deploy admin-create-user
   ```
6. Em **Authentication › URL Configuration**, inclua o endereço do app (usado na recuperação de senha).

Quem cria um usuário pela tela Equipe já recebe as permissões padrão do perfil; o administrador pode ajustar
em **Permissões**. O administrador tem acesso a tudo.

## Contrato em PDF

O botão de impressora, na lista de contratos, abre o contrato pronto para imprimir ou “Salvar como PDF”.
**O texto é um modelo.** As cláusulas e os trechos entre colchetes (dados do estúdio, cancelamento, foro)
precisam ser preenchidos e **revisados por um advogado** antes do uso real.

## Segurança

- Todas as tabelas usam segurança por linha (RLS): cada ação (ver, criar, editar, excluir) é checada no banco
  pela função `has_permission`, não só na tela.
- A chave `anon` é pública por desenho; quem protege os dados são as regras do banco.
- Nunca coloque a chave `service_role` no frontend.

## Estrutura

```
src/App.jsx, Root.jsx          estrutura do app e controle de sessão
src/components/                Login, tabela/formulário genérico (CrudManager), elementos de interface
src/modules/configs.js         descrição de cada cadastro (campos, colunas, filtros)
src/modules/Dashboard.jsx      painel
src/modules/Equipe.jsx         usuários e permissões
src/lib/                       dados (Supabase ou demonstração), formatos, vocabulário, contrato em PDF
supabase/revela-v0.1.sql       banco de dados completo
supabase/functions/            criação de usuários
public/                        ícones, tela de abertura, manifesto e service worker
```

Para acrescentar um campo a um cadastro, edite a configuração em `src/modules/configs.js` e a tabela em SQL.

## Ainda não está nesta versão

Busca global (Ctrl/⌘ + K), galerias de entrega ao cliente, financeiro (parcelas e vencimentos),
assinatura eletrônica, avisos por e-mail/WhatsApp, dados do estúdio configuráveis no contrato e
relatórios em PDF. A ordem de prioridade fica a seu critério.

## Observações técnicas

- As dependências usam `latest`, como no ELO. Quando estabilizar, vale fixar as versões.
- **O que foi testado:** o app em navegador, no modo demonstração (cadastros, filtros, painel, contrato em PDF,
  tema, celular); e o arquivo SQL num PostgreSQL 16 local com autenticação simulada, incluindo as regras de
  permissão (administrador, fotógrafo, editor, usuário inativo e visitante).
- **O que ainda não foi testado:** a conexão com um projeto Supabase real (login, recuperação de senha,
  criação de usuários pela função `admin-create-user`). Segue o mesmo padrão do ELO, mas confira no primeiro uso.
