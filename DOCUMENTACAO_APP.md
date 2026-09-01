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

## 3. Banco de Dados na Nuvem e Como Acessá-lo

### 3.1. Qual o Banco de Dados Usado?
O banco de dados oficial é o **Google Cloud Firestore**, configurado através do Firebase.

### 3.2. Estrutura das Coleções no Firestore
O modelo de dados é particionado por usuário (`users/{userId}/...`):
- `users/{userId}`: Perfil do usuário, preferências e configurações de notificação.
- `users/{userId}/accounts/{accountId}`: Contas bancárias cadastradas (saldo inicial, agência, conta, cheque especial, cor, etc.).
- `users/{userId}/bankTransactions/{transactionId}`: Lançamentos bancários (débitos, créditos, pix, boletos, transferências).
- `users/{userId}/cards/{cardId}`: Cartões de crédito (limite, dias de fechamento/vencimento, bandeira).
- `users/{userId}/cardTransactions/{transactionId}`: Lançamentos de cartão (compras, parcelamentos, conciliação).
- `users/{userId}/futurePayments/{paymentId}`: Contas a pagar e receber agendadas.
- `users/{userId}/investments/{investmentId}`: Ativos financeiros (renda fixa, ações, FIIs, criptoativos).
- `users/{userId}/categories/{categoryId}`: Categorias personalizadas de receitas e despesas.

### 3.3. Como Acessar o Banco de Dados na Nuvem
1. **Via Firebase Console**:
   - Acesse: [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Selecione o projeto vinculado ao aplicativo.
   - No menu lateral esquerdo, clique em **Firestore Database** (ou Banco de Dados Firestore).
   - Você verá as coleções `users`, podendo inspecionar diretamente cada documento e subcoleção em tempo real.
2. **Via Interface do Próprio FinFlow**:
   - O aplicativo possui sincronização em tempo real. Qualquer alteração feita no console do Firebase ou em outro dispositivo reflete instantaneamente na interface do usuário.

---

## 4. Regras de Negócio e Cálculos Financeiros

### 4.1. Contas Bancárias e Cheque Especial
- **Saldo Real da Conta**: 
  $$\text{Saldo Real} = \text{Saldo Inicial} + \sum \text{Lançamentos a Crédito (+)} - \sum \text{Lançamentos a Débito (-)}$$
- **Cheque Especial / Limite de Crédito da Conta**:
  - Valor cadastrado no campo `overdraftLimit`.
- **Saldo Total Disponível da Conta**:
  $$\text{Saldo Total Disponível} = \text{Saldo Real} + \text{Cheque Especial}$$
  - O aplicativo exibe tanto o saldo próprio em conta quanto a composição com o cheque especial nos cartões de KPI e tabelas detalhadas.

### 4.2. Contas a Pagar e Contas a Receber (Lançamentos Futuros)
- **Natureza do Lançamento**:
  - `PaymentNature = 'Pagar'`: Conta a pagar (despesa prevista).
  - `PaymentNature = 'Receber'`: Conta a receber (receita prevista).
- **Baixa / Liquidação no Extrato**:
  - Quando uma conta **A Pagar** é baixada, é gerada uma transação bancária com valor **negativo (-)** na conta de débito selecionada.
  - Quando uma conta **A Receber** é baixada, é gerada uma transação bancária com valor **positivo (+)** na conta de crédito selecionada.

### 4.3. Cartões de Crédito e Faturas
- **Limite Disponível**:
  $$\text{Limite Disponível} = \text{Limite Total} - \sum \text{Fatura Atual Não Paga} - \sum \text{Parcelas Futuras}$$
- **Parcelamento Inteligente**:
  - Divisão automática do valor entre as faturas futuras conforme o dia de fechamento do cartão.

### 4.4. Projeção de Fluxo de Caixa (DRE e Cash Flow)
- O sistema projeta o saldo futuro diário nos próximos 30/60/90 dias somando o saldo atual às contas a receber e subtraindo as contas a pagar e faturas a vencer.

---

## 5. Estrutura de Arquivos do Projeto

```
/
├── src/
│   ├── components/
│   │   ├── BankAccountsView.tsx       # Gestão de contas correntes, extrato, filtros e exportações
│   │   ├── CreditCardsView.tsx        # Gestão de cartões, faturas e lançamentos
│   │   ├── FuturePaymentsView.tsx     # Contas a pagar e receber com baixa automática
│   │   ├── DashboardView.tsx          # Visão consolidada de saldos, KPIs e gráficos
│   │   ├── InvestmentsView.tsx        # Carteira de investimentos e rentabilidade
│   │   ├── CashFlowProjectionView.tsx # Projeção de fluxo de caixa futuro
│   │   ├── SmartImportModal.tsx       # Importador OFX/CSV/PDF com inteligência artificial
│   │   ├── BankReconciliationModal.tsx# Conciliação bancária inteligente
│   │   ├── Navigation.tsx             # Menu lateral e topo responsivo
│   │   └── ...
│   ├── services/
│   │   ├── firebase.ts                # Inicialização, autenticação e métodos CRUD do Firestore
│   │   ├── gemini.ts                  # Agente de Inteligência Artificial para finanças
│   │   └── exportService.ts           # Geração de PDF e planilhas Excel/CSV
│   ├── utils/
│   │   └── financeUtils.ts            # Funções puras de cálculo de saldos, limites e projeções
│   ├── types.ts                       # Tipos, interfaces TypeScript e enums
│   ├── App.tsx                        # Componente raiz, orquestração de estado e sincronização
│   ├── main.tsx                       # Ponto de entrada do React
│   └── index.css                      # Estilização global com Tailwind CSS
├── firestore.rules                    # Regras de segurança do Firestore
├── firebase-applet-config.json        # Configuração do projeto Firebase
├── package.json                       # Dependências e scripts de execução
├── DOCUMENTACAO_APP.md                # Documentação técnica completa
└── README.md                          # Instruções rápidas do projeto
```

---

## 6. Modelagem de Dados (TypeScript)

### 6.1. Conta Bancária (`BankAccount`)
```typescript
interface BankAccount {
  id: string;
  bankCode: string;         // Ex: "001", "237", "341", "260"
  bankName: string;         // Ex: "Banco do Brasil", "Nubank", "Itaú"
  agency: string;           // Ex: "0001"
  accountNumber: string;    // Ex: "12345-6"
  type: 'Corrente' | 'Poupança' | 'Pagamentos' | 'Salário' | 'Outra';
  initialBalance: number;   // Saldo inicial
  overdraftLimit?: number;  // Limite do Cheque Especial
  color: string;            // Cor de identificação visual
  openFinanceConnected?: boolean;
  lastSyncAt?: string;
}
```

### 6.2. Lançamento Bancário (`BankTransaction`)
```typescript
interface BankTransaction {
  id: string;
  accountId: string;
  date: string;             // YYYY-MM-DD
  description: string;
  amount: number;           // Positivo (+) para entrada, Negativo (-) para saída
  category: TransactionCategory;
  type: TransactionType;    // PIX, TED, Boleto, Cartão, Tarifa, Rendimento
  reconciled: boolean;
  notes?: string;
}
```

### 6.3. Conta Futura (`FuturePayment`)
```typescript
interface FuturePayment {
  id: string;
  nature: 'Pagar' | 'Receber'; // Natureza do título
  dueDate: string;             // Data de vencimento
  description: string;
  expectedAmount: number;      // Valor nominal esperado
  category: TransactionCategory;
  status: 'Pendente' | 'Pago' | 'Vencido';
  paidDate?: string;
  paidAmount?: number;
  accountId?: string;
  notes?: string;
}
```

---

## 7. Como Executar e Fazer Deploy

### 7.1. Execução em Ambiente Local
1. Instalar dependências:
   ```bash
   npm install
   ```
2. Executar servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Compilar para produção:
   ```bash
   npm run build
   ```

### 7.2. Configuração de Variáveis de Ambiente
Crie um arquivo `.env` com as seguintes chaves caso use serviços personalizados:
```env
GEMINI_API_KEY=sua_chave_do_google_gemini
```

---

## 8. Considerações Finais e Manutenibilidade
- Todos os formulários possuem estados estritamente isolados para evitar persistência indesejada entre aberturas de janelas modais.
- A persistência é tolerante a falhas: se o dispositivo estiver temporariamente sem conexão, os dados são salvos localmente e sincronizados assim que a conexão com a nuvem for restabelecida.
