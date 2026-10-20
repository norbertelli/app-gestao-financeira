# Documentação Técnica e Funcional do Aplicativo FinFlow

## 1. Visão Geral do Sistema
O **FinFlow** é um sistema completo e moderno de gestão financeira pessoal e empresarial leve, multimoeda e multiusuário. O aplicativo foi projetado para fornecer controle rigoroso de fluxo de caixa, conciliação bancária, gestão de cartões de crédito, contas futuras a pagar e receber, projeções de fluxo de caixa, carteira de investimentos, inteligência artificial financeira com Google Gemini, gateway de cobranças oficial **Asaas** e painel administrativo de gestão de assinantes.

---

## 2. Arquitetura e Tecnologias

### 2.1. Frontend
- **Framework**: React 18+ com TypeScript
- **Bundler & Dev Server**: Vite (com integração Express no backend)
- **Estilização**: Tailwind CSS com tema dinâmico (Modo Claro / Modo Escuro)
- **Ícones**: Lucide React
- **Gráficos e Visualizações**: Recharts
- **Exportação de Relatórios**: `jspdf`, `jspdf-autotable`, `xlsx`

### 2.2. Backend e Infraestrutura Serverless
- **Servidor Dev/Fullstack**: `server.ts` executando Express com proxy de API e middlewares do Vite.
- **Rotas Serverless Vercel (`/api/`)**:
  - `/api/asaas/create-checkout.ts`: Criação de clientes e pagamentos (PIX, Cartão e Boleto).
  - `/api/asaas/check-status.ts`: Consulta de status de pagamento em tempo real.
  - `/api/asaas/webhook.ts`: Receptor de notificações assíncronas do Asaas com autenticação via cabeçalho `asaas-access-token`.
  - `/api/parse-statement.ts`: Leitura e extração estruturada de extratos com a IA Gemini.
  - `/api/health.ts`: Verificação de saúde e status das integrações (Gemini e Asaas).

### 2.3. Banco de Dados e Autenticação
- **Banco de Dados em Nuvem**: **Google Cloud Firestore (Firebase)**
  - Banco de dados NoSQL baseado em documentos e coleções com sincronização bidirecional em tempo real via WebSockets (`onSnapshot`).
  - Isolamento rígido por usuário (`users/{userId}/...`).
- **Autenticação**: Firebase Authentication (Google OAuth, E-mail/Senha e Modo Administrador Master).
- **Armazenamento Local Fallback**: `localStorage` estruturado para modo offline.

### 2.4. Inteligência Artificial
- **SDK**: `@google/genai` (Google GenAI TypeScript SDK)
- **Modelo**: `gemini-2.5-flash`
- **Capacidades**: Processamento de texto colado e arquivos de extrato bancário em base64 (PDFs, imagens e planilhas), retornando JSON estruturado com data, descrição, valor, categoria e tipo.

### 2.5. Gateway de Pagamento
- **Plataforma**: Asaas API V3
- **Ambientes**: Sandbox (homologação) e Produção oficial.
- **Métodos**: PIX Dinâmico (com QR Code SVG e código Copia e Cola EMV), Cartão de Crédito e Boleto Bancário.

---

## 3. Módulos e Recursos do Sistema

### 3.1. Dashboard Consolidado & Faturas do Mês Corrente
- **Painel de Métricas Principais (KPIs)**:
  - Saldo Total Líquido (Contas Bancárias + Investimentos - Fatura do Mês Corrente).
  - Saldo Total em Contas Bancárias (incluindo Cheque Especial).
  - Fatura do Mês Corrente (com total a pagar, quantidade de lançamentos e dívida total projetada).
  - Total Investido em Carteira.
- **Seção Dedicada: Faturas & Parcelas do Mês Corrente**:
  - Mini cards interativos por cartão com cor personalizada, últimos 4 dígitos e dia de vencimento.
  - Busca rápida e filtros por cartão.
  - Tabela com status, data de compra, data de cobrança e indicador de parcela.
- **Ações Rápidas do Cabeçalho**:
  - Botão de Suporte WhatsApp Oficial.
  - Botão **Indicar no WhatsApp** para compartilhamento viral do aplicativo.
  - Botão **Importar Extrato Copiado** com leitor de IA.

### 3.2. Cartões de Crédito & Gestão de Parcelamentos
- **Controle de Limites**: Limite total, valor comprometido e limite disponível em tempo real.
- **Lançador Rápido de Parcelamento**:
  - Atalhos de 1 clique para a 1ª fatura: Mês Corrente, Próximo Mês ou Auto Fechamento.
  - Reset e limpeza automática dos campos.
- **Visualização Flexível**: Alternância entre fatura mensal e lista unificada de parcelas.

### 3.3. Contas Bancárias & Conciliação
- **Múltiplas Contas**: Cadastro de contas com cor, agência, conta e limites.
- **Cheque Especial**: Cálculo automático do Saldo Real e Saldo Total Disponível.
- **Extrato Interativo**: Débitos (-), Créditos (+) e saldo progressivo pós-transação.

### 3.4. Gestão de Dívidas & Empréstimos
- Acompanhamento de passivos financeiros com valor contratado, credor, data de vencimento, número de parcelas e saldo devedor restante com barra de amortização.
- Baixa de parcelas com liquidação direta no extrato bancário.

### 3.5. Carteira de Investimentos
- Suporte a Renda Fixa, Ações, FIIs, Fundos, Criptoativos e Previdência.
- Lançamento de rendimentos (+), aportes (+), proventos (+), resgates (-) e taxas (-).

### 3.6. Contas a Pagar & Receber (Agenda Financeira)
- Lançamentos com natureza A Pagar e A Receber.
- Verificação diária automática de contas vencidas e a vencer em até 3 dias com banner de alerta de urgência.
- Baixa integrada com débito/crédito na conta bancária.

### 3.7. Planos, Preços & Feature Gating
- **Matriz de Limites**:
  - **Plano Grátis**: Até 2 contas bancárias, até 2 cartões de crédito e até 30 lançamentos por mês.
  - **FinFlow PRO**: Contas, cartões e lançamentos ilimitados, IA Gemini irrestrita e exportações executivas.
  - **Enterprise BPO**: Multi-empresas e escritórios contábeis.
- **Modal de Upgrade (`UpgradePromptModal.tsx`)**: Acionado automaticamente ao tentar exceder os limites gratuitos.
- **Ambiente de Teste Prático de Checkout**: Aba dedicada permitindo simulação do PIX, teste de cartão e validação de travas com 1 clique.

### 3.8. Painel de Gestão de Assinantes (`AdminSubscribersView.tsx`)
- **Exclusivo para o Administrador**:
  - Métricas: Total de Usuários, Assinantes PRO Ativos, MRR e Taxa de Conversão.
  - Tabela completa de clientes com busca e filtros por plano e status.
  - Alteração de plano com 1 clique (conceder PRO manual ou cortesia).
  - Edição do telefone/WhatsApp do cliente.
  - Botão direto para iniciar conversa de atendimento no WhatsApp com mensagem personalizada.

### 3.9. Central de Auditoria & Testes de Carga
- Testes massivos de stress testing com 50 a 2.000 transações em lote.
- Registro cronológico imutável de eventos sensíveis no Firestore.
- Scanner de integridade matemática e conformidade.

---

## 4. Banco de Dados Firestore e Regras de Segurança

### 4.1. Estrutura de Documentos
- `users/{userId}`: Perfil do usuário, telefone, plano (`subscriptionPlan`), status (`subscriptionStatus`) e papel (`role`).
- `users/{userId}/subscriptions/current`: Dados detalhados da assinatura ativa.
- `users/{userId}/accounts/{accountId}`: Contas bancárias.
- `users/{userId}/bankTransactions/{txId}`: Lançamentos bancários.
- `users/{userId}/cards/{cardId}`: Cartões de crédito.
- `users/{userId}/cardTransactions/{txId}`: Lançamentos de cartão.
- `users/{userId}/futurePayments/{pmtId}`: Contas a pagar e receber.
- `users/{userId}/investments/{invId}`: Carteira de ativos.
- `users/{userId}/debts/{debtId}`: Empréstimos e financiamentos.
- `system/admin_support`: Telefone oficial de suporte do administrador (`5511932058703`).
- `system/asaas_config`: Configurações salvas do gateway Asaas.

### 4.2. Regras de Segurança (`firestore.rules`)
```javascript
function isAdmin() {
  return isSignedIn() && (
    request.auth.token.email == 'norberto.bertelli.NB@gmail.com' ||
    request.auth.token.email == 'norberto.bertelli.nb@gmail.com' ||
    request.auth.token.email == 'admin@finflow.app' ||
    request.auth.uid == 'admin_master_uid' ||
    (request.auth.token.email != null && request.auth.token.email.matches('.*admin.*'))
  );
}

match /users/{userId} {
  allow get: if isOwner(userId) || isAdmin();
  allow list: if isAdmin();
  allow create, update: if (isOwner(userId) && isValidId(userId)) || isAdmin();
  allow delete: if isAdmin();
}
```

---

## 5. Variáveis de Ambiente e Configuração de Produção

### 5.1. Arquivo `.env` (Protegido no servidor, nunca enviado ao Git)
```env
# Chave da Google Gemini API para IA de extratos
GEMINI_API_KEY="seu_gemini_api_key_aqui"

# Chave Oficial da API do Asaas (Produção)
ASAAS_API_KEY="seu_asaas_api_key_producao_aqui"

# Ambiente Asaas
ASAAS_ENV="production"

# Token de Autenticação do Webhook do Asaas
ASAAS_WEBHOOK_TOKEN="seu_asaas_webhook_token_aqui"
```

### 5.2. Webhook no Painel do Asaas
- **URL**: `https://seu-app.vercel.app/api/asaas/webhook`
- **Cabeçalho de Autenticação**: Valida automaticamente o token recebido no header `asaas-access-token`.
- **Eventos Monitorados**: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`.

---

## 6. Procedimento de Build e Deploy na Vercel
1. Conecte o repositório GitHub à Vercel.
2. Adicione as 4 variáveis de ambiente listadas acima no painel da Vercel.
3. O build command executará `npm run build` gerando a pasta `dist` otimizada.
4. As rotas serverless sob `/api/` serão implantadas como Vercel Serverless Functions automaticamente.
