# Documentação Técnica e Funcional do Aplicativo FinFlow

## 1. Visão Geral do Sistema
O **FinFlow** é um sistema completo e moderno de gestão financeira pessoal e empresarial multimoeda e multiusuário. O aplicativo foi projetado para fornecer controle rigoroso de fluxo de caixa, conciliação bancária, gestão de cartões de crédito, contas futuras a pagar e receber, projeções de fluxo de caixa, carteira de investimentos e inteligência artificial financeira com Google Gemini.

---

## 2. Arquitetura e Tecnologias

### 2.1. Frontend
- **Framework**: React 18+ com TypeScript
- **Bundler & Dev Server**: Vite
- **Estilização**: Tailwind CSS com tema dinâmico (Modo Claro / Modo Escuro)
- **Animações e Transições**: `motion` (`motion/react`)
- **Ícones**: Lucide React
- **Gráficos e Visualizações**: Recharts e D3
- **Exportação de Relatórios**: `jspdf`, `jspdf-autotable`, `xlsx`

### 2.2. Backend e Nuvem
- **Banco de Dados em Nuvem**: **Google Cloud Firestore (Firebase)**
  - Banco de dados NoSQL baseado em documentos e coleções com sincronização bidirecional em tempo real via WebSockets (`onSnapshot`).
  - Isolamento por usuário (`users/{userId}/...`).
- **Autenticação**: Firebase Authentication (Google OAuth, Email/Senha e Modo Visitante Seguro).
- **Armazenamento Local Fallback**: `localStorage` criptografado/estruturado para modo offline ou usuário sem login.
- **Inteligência Artificial**: Google GenAI SDK (`@google/genai`) para categorização automática, leitura de extratos/faturas e insights preditivos.

---

## 3. Módulos e Recursos do Sistema

### 3.1. Dashboard Consolidado & Faturas do Mês Corrente
- **Painel de Métricas Principais (KPIs)**:
  - Saldo Total Líquido (Contas Bancárias + Investimentos - Fatura do Mês Corrente).
  - Saldo Total em Contas Bancárias (incluindo visão detalhada do Cheque Especial).
  - Fatura do Mês Corrente (com total a pagar no mês, quantidade de lançamentos e dívida total projetada).
  - Total Investido em Carteira.
- **Seção Dedicada: Faturas & Parcelas do Mês Corrente**:
  - Mini cards interativos por cartão com cor personalizada, últimos 4 dígitos, dia de vencimento e valor a pagar no mês.
  - Filtros rápidos por cartão e busca textual em tempo real por descrição ou categoria.
  - Tabela consolidada com tags de status (`Aberto` / `Faturado`), data de compra, data de cobrança, indicador de parcela (`X/Y` ou `À vista`) e atalho direto para o extrato completo.

### 3.2. Cartões de Crédito & Gestão de Parcelamentos
- **Controle de Limites**: Limite total, limite utilizado e limite disponível calculado em tempo real.
- **Lançador Inteligente de Compras Parceladas**:
  - Atalhos de 1 clique para definir a 1ª fatura: **Mês Corrente**, **Próximo Mês** ou **Auto Fechamento**.
  - Reset e limpeza automática dos campos ao abrir, fechar ou submeter o formulário (prevenindo estados sujos).
  - Botão dedicado **"Limpar Campos"**.
- **Visualização Flexível**:
  - **Por Fatura Mensal**: Carrossel navegável por meses com totais calculados.
  - **Todas as Parcelas**: Lista unificada com filtros rápidos (`Todas`, `Mês Corrente`, `Meses Futuros`, `Faturadas/Anteriores`).
  - Botão de atalho **"Mês Corrente"** para retorno imediato à fatura do mês atual.

### 3.3. Contas Bancárias & Conciliação
- **Múltiplas Contas**: Cadastro com código do banco, agência, conta, cor e tipo.
- **Cheque Especial**: Definição do limite de crédito com cálculo do Saldo Real e Saldo Total Disponível.
- **Extrato Interativo**: Débitos (-), Créditos (+) e saldo acumulado pós-lançamento.
- **Conciliação e Leitor com IA**: Importação de arquivos (PDF, CSV, OFX) e texto colado com leitura de dados via IA Gemini.

### 3.4. Contas a Pagar & Receber (Agenda Financeira)
- Lançamentos com natureza **A Pagar** (saída) e **A Receber** (entrada).
- Status automatizado: *Pendente* (em atraso), *Em Aberto* (a vencer) e *Pago/Recebido* (liquidado).
- Baixa direta com débito/crédito automático na conta bancária selecionada.

---

## 4. Banco de Dados na Nuvem e Como Acessá-lo

### 4.1. Qual o Banco de Dados Usado?
O banco de dados oficial é o **Google Cloud Firestore**, configurado através do Firebase.

### 4.2. Estrutura das Coleções no Firestore
O modelo de dados é particionado por usuário (`users/{userId}/...`):
- `users/{userId}`: Perfil do usuário, preferências e configurações de notificação.
- `users/{userId}/accounts/{accountId}`: Contas bancárias cadastradas.
- `users/{userId}/bankTransactions/{transactionId}`: Lançamentos bancários (débitos, créditos, pix, boletos, transferências).
- `users/{userId}/cards/{cardId}`: Cartões de crédito (limite, dias de fechamento/vencimento, bandeira).
- `users/{userId}/cardTransactions/{transactionId}`: Lançamentos de cartão (compras, parcelamentos, conciliação).
- `users/{userId}/futurePayments/{paymentId}`: Contas a pagar e receber agendadas.
- `users/{userId}/investments/{investmentId}`: Ativos financeiros (renda fixa, ações, FIIs, criptoativos).
- `users/{userId}/categories/{categoryId}`: Categorias personalizadas de receitas e despesas.

### 4.3. Como Acessar o Banco de Dados na Nuvem
1. **Via Firebase Console**:
   - Acesse: [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Selecione o projeto vinculado ao aplicativo.
   - No menu lateral esquerdo, clique em **Firestore Database**.
   - Inspecione as coleções `users` em tempo real.
2. **Via Interface do Próprio FinFlow**:
   - Sincronização em tempo real via WebSockets (`onSnapshot`).

---

## 5. Regras de Negócio e Cálculos Financeiros

### 5.1. Contas Bancárias e Cheque Especial
- **Saldo Real da Conta**: 
  $$\text{Saldo Real} = \text{Saldo Inicial} + \sum \text{Lançamentos a Crédito (+)} - \sum \text{Lançamentos a Débito (-)}$$
- **Saldo Total Disponível da Conta**:
  $$\text{Saldo Total Disponível} = \text{Saldo Real} + \text{Cheque Especial}$$

### 5.2. Cartões de Crédito e Faturas
- **Limite Disponível**:
  $$\text{Limite Disponível} = \text{Limite Total} - \sum \text{Fatura Atual Não Paga} - \sum \text{Parcelas Futuras}$$
- **Fatura do Mês Corrente**:
  $$\text{Fatura Mês Corrente} = \sum_{\text{invoiceMonth} = \text{YYYY-MM}} \text{Valor das Parcelas/Compras}$$

---

## 6. Estrutura de Arquivos do Projeto

```
/
├── src/
│   ├── components/
│   │   ├── BankAccountsView.tsx       # Gestão de contas correntes, extrato, filtros e exportações
│   │   ├── CreditCardsView.tsx        # Gestão de cartões, faturas mensais e parcelas
│   │   ├── FuturePaymentsView.tsx     # Contas a pagar e receber com baixa automática
│   │   ├── DashboardView.tsx          # Visão consolidada com seção de faturas do mês corrente
│   │   ├── InvestmentsView.tsx        # Carteira de investimentos e rentabilidade
│   │   ├── CashFlowProjectionView.tsx # Projeção de fluxo de caixa futuro
│   │   ├── SmartImportModal.tsx       # Importador OFX/CSV/PDF com IA
│   │   ├── BankReconciliationModal.tsx# Conciliação bancária inteligente
│   │   ├── Navigation.tsx             # Menu lateral e topo responsivo
│   │   └── ...
│   ├── services/
│   │   ├── firebase.ts                # Inicialização, autenticação e métodos CRUD do Firestore
│   │   ├── gemini.ts                  # Agente de IA para finanças
│   │   └── exportService.ts           # Geração de PDF e planilhas Excel/CSV
│   ├── utils/
│   │   └── financeUtils.ts            # Cálculos de saldos, limites, faturas e projeções
│   ├── types.ts                       # Tipos e interfaces TypeScript
│   ├── App.tsx                        # Componente raiz e sincronização em nuvem
│   ├── main.tsx                       # Ponto de entrada do React
│   └── index.css                      # Estilização global com Tailwind CSS
├── firestore.rules                    # Regras de segurança do Firestore
├── firebase-applet-config.json        # Configuração do projeto Firebase
├── package.json                       # Dependências e scripts de execução
├── DOCUMENTACAO_APP.md                # Documentação técnica completa
└── README.md                          # Instruções rápidas do projeto
```

---

## 7. Como Executar e Fazer Deploy

### 7.1. Execução Local
1. Instalar dependências: `npm install`
2. Executar servidor de desenvolvimento: `npm run dev`
3. Compilar para produção: `npm run build`

### 7.2. Variáveis de Ambiente
```env
GEMINI_API_KEY=sua_chave_do_google_gemini
```
