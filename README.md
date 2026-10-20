# FinFlow - Gestão Financeira Inteligente & Open Finance

Sistema completo para controle e gestão financeira pessoal e empresarial, com suporte a contas bancárias, cartões de crédito, carteira de investimentos, fluxo de caixa, leitor inteligente de extratos com IA (Google Gemini), gateway de pagamentos oficial **Asaas** e painel administrativo de gestão de assinantes.

---

## 🚀 Principais Módulos e Recursos

### 1. 🏦 Gestão de Contas Bancárias & Extrato Unificado
- **Contas Múltiplas**: Cadastro de contas correntes, poupanças e contas de pagamento com logotipo bancário e cores personalizadas.
- **Cheque Especial / Limite de Crédito**: Definição do limite com cálculo em tempo real do **Saldo Real**, **Limite do Cheque Especial** e **Saldo Total Disponível**.
- **Extrato Financeiro Interativo**: Débitos (-), créditos (+), saldo progressivo acumulado e filtros por data/categoria.
- **Leitor Inteligente de Extratos com IA Gemini**: Importação rápida colando o texto do extrato ou fatura bancária, ou enviando arquivo PDF/imagem com leitura de datas, valores e categorização automática inteligente.

### 2. 💳 Cartões de Crédito & Compras Parceladas
- **Controle de Limites**: Acompanhamento do limite total, valor comprometido (fatura atual + parcelas futuras) e limite disponível em tempo real.
- **Lançador Rápido de Parcelamento**: Registro de compras parceladas com atalhos de 1 clique para a 1ª fatura (**Mês Corrente**, **Próximo Mês** ou **Auto Fechamento**), e limpeza automática de campos.
- **Faturas & Parcelas no Dashboard**: Seção no painel principal exibindo as faturas e parcelas do mês corrente com mini cards por cartão, busca rápida, extrato consolidado e exibição da **Data da Compra** antes da **Data da Parcela**.
- **Visualização Flexível**: Alternância entre visão mensal de faturas e tabela unificada de todas as parcelas com filtros por status.
- **Pagamento Integrado de Fatura**: Liquidação direta da fatura debitando o montante na conta bancária de preferência.

### 3. 🏛️ Gestão de Dívidas & Empréstimos
- **Tabela Dedicada para Empréstimos e Financiamentos**: Cadastro e acompanhamento detalhado de passivos financeiros (Credor, Valor Total, Data de Vencimento, Número de Parcelas e Saldo Devedor Restante).
- **Baixa de Parcelas Integrada**: Registro de quitação de cada parcela individualmente com débito automático no extrato da conta bancária de sua escolha.

### 4. 📈 Carteira de Investimentos & Rendimentos
- **Diversas Classes de Ativos**: Renda Fixa (CDB, Tesouro Direto, LCI/LCA), Ações, FIIs, Fundos de Investimento, Criptoativos e Previdência.
- **Lançamento de Movimentações**: Registro de rendimentos/lucros (+), novos aportes (+), proventos/dividendos (+), resgates parciais (-) e taxas/impostos (-).
- **Saldo Patrimonial Dinâmico**: Acompanhamento do valor investido versus saldo total valorizado.

### 5. 📅 Contas a Pagar & Receber (Agenda Financeira)
- **Contas a Pagar (Saídas -)** e **Contas a Receber (Entradas +)** com agendamento de despesas e receitas.
- **Status em Tempo Real**: Alertas automáticos diários para contas pendentes, a vencer (< 3 dias) e liquidadas.
- **Baixa Integrada**: Débito/crédito automático na conta bancária selecionada no momento da quitação.

### 6. 💎 Gateway de Pagamento Asaas & Monetização (Novo)
- **Integração Completa Asaas (Homologação & Produção)**:
  - **PIX Instantâneo**: Geração de QR Code visual BRCode oficial e código Copia e Cola EMV com compensação em segundos.
  - **Cartão de Crédito**: Assinatura recorrente mensal ou anual com até 12x.
  - **Boleto Bancário**: Emissão com código de barras e data de vencimento.
- **Webhooks Seguros**: Autenticação através do cabeçalho `asaas-access-token` e tratamento automático de pagamentos confirmados e vencidos.
- **Planos & Feature Gating**:
  - **Plano Grátis**: até 2 contas bancárias, 2 cartões de crédito e 30 lançamentos/mês.
  - **FinFlow PRO Mensal / Anual**: Contas e cartões ilimitados, extratos ilimitados, IA Gemini sem restrições e exportações executivas.
  - **Enterprise BPO**: Multi-empresas e escritórios de contabilidade.
- **Ambiente de Teste Prático de Checkout**: Aba interativa no app para testar o fluxo de PIX, simular aprovação e verificar a ativação das travas em tempo real.

### 7. 👥 Painel de Gestão de Assinantes & Clientes (Novo)
- **Exclusivo para Administrador (`isAdmin`)**:
  - Métricas em tempo real: **Total de Usuários**, **Assinantes PRO Ativos**, **MRR (Receita Recorrente Mensal)** e **Taxa de Conversão**.
  - Tabela completa de clientes com busca e filtros por plano e status.
  - **Ações Rápidas**: Alteração manual de planos (cortesia/VIP), edição de telefone e botão de contato direto no WhatsApp.

### 8. 💬 Suporte via WhatsApp Dinâmico & Indicação (Novo)
- **Número Central do Suporte**: `55 11 932058703` (recuperado dinamicamente do cadastro do administrador no Firestore).
- **Interface Limpa**: O número de telefone não é exposto como texto solto; botões exibem rótulos visuais elegantes (*"Suporte ou Ajuda"*, *"Atendimento Online"*).
- **Suporte na Tela de Login**: Botão de atendimento presente na tela de acesso/login e widget flutuante em todas as telas.
- **Cadastro com Telefone/WhatsApp**: Campo adicionado no registro de novos usuários.
- **Botão "Indicar no WhatsApp" no Dashboard**: Permite divulgar o aplicativo com 1 clique para contatos e grupos.

### 9. 🛡️ Central de Auditoria, Segurança & Testes de Carga
- **Testes Massivos (Stress Testing)**: Injeção sintética de 50 a 2.000 transações em lote com medição de latência (ms) e vazão (ops/s).
- **Trilha de Auditoria (Audit Trail)**: Registro cronológico imutável de eventos sensíveis no Firestore.
- **Scanner de Conformidade**: Reconciliação matemática automática de saldos e limites.

### 10. ☁️ Nuvem & Multi-dispositivo (Firebase Firestore)
- Sincronização em tempo real via WebSockets (`onSnapshot`) com isolamento multi-tenant por usuário e regras de segurança (`firestore.rules`).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Recharts.
- **Backend & Serverless**: Express, Vite, Vercel Serverless Functions (`/api/asaas/*`, `/api/parse-statement`, `/api/health`).
- **Banco de Dados & Autenticação**: Firebase Firestore & Firebase Authentication.
- **Inteligência Artificial**: Google GenAI SDK (`@google/genai` com Gemini Flash).
- **Gateway de Pagamento**: Asaas API V3 (PIX, Cartão e Boleto).
- **Exportações**: jsPDF, jsPDF-AutoTable, XLSX.

---

## ⚙️ Variáveis de Ambiente (.env)

| Variável | Descrição |
| :--- | :--- |
| `GEMINI_API_KEY` | Chave da API do Google Gemini para leitura de extratos com IA. |
| `ASAAS_API_KEY` | Chave de API do Asaas (`$aact_prod_...` para produção). |
| `ASAAS_ENV` | Ambiente do gateway (`production` ou `sandbox`). |
| `ASAAS_WEBHOOK_TOKEN` | Token de autenticação seguro configurado no webhook do Asaas. |
| `APP_URL` | URL de hospedagem do aplicativo (ex: `https://seu-app.vercel.app`). |

---

## 🚀 Como Executar Localmente e Deploy

### Execução Local:
```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento (porta 3000)
npm run dev

# 3. Compilar e verificar tipos
npm run build
npm run lint
```

### Deploy na Vercel:
1. Importe o repositório do GitHub na **Vercel**.
2. Configure as **Environment Variables** (`GEMINI_API_KEY`, `ASAAS_API_KEY`, `ASAAS_ENV`, `ASAAS_WEBHOOK_TOKEN`).
3. O arquivo `vercel.json` gerenciará as rotas do SPA Vite e as funções serverless da pasta `/api` automaticamente.
