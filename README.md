# Gestão Financeira & Open Finance

Sistema completo para controle e gestão financeira pessoal e empresarial, com suporte a contas bancárias, cartões de crédito, carteira de investimentos, fluxo de caixa e leitor inteligente de extratos.

---

## 🚀 Principais Funcionalidades

### 1. 🏦 Gestão de Contas Bancárias & Extratos
- **Contas Múltiplas**: Cadastro de contas correntes, poupanças e contas de pagamento com logotipo e identificação bancária.
- **Cheque Especial / Limite de Crédito**: Definição do limite de cheque especial com cálculo automático do **Saldo Real**, **Limite do Cheque Especial** e **Saldo Total Disponível**.
- **Extrato Financeiro Interativo**: Visualização de lançamentos detalhados com débitos (-), créditos (+), saldo progressivo acumulado e filtros por data/categoria.
- **Leitor Inteligente de Extratos**: Importação rápida colando o texto do extrato ou fatura bancária, com leitura inteligente de datas, valores e categorização automática.

### 2. 💳 Cartões de Crédito & Compras Parceladas
- **Controle de Limites**: Acompanhamento do limite total, valor comprometido (fatura atual + parcelas futuras) e limite disponível em tempo real.
- **Parcelamento Automático**: Registro de compras parceladas com distribuição automática das parcelas ao longo das faturas mensais.
- **Fechamento e Vencimento**: Configuração dos dias de corte e vencimento de cada cartão.
- **Pagamento de Fatura**: Liquidação direta da fatura debitando o montante na conta bancária de preferência.

### 3. 📈 Carteira de Investimentos & Rendimentos
- **Diversas Classes de Ativos**: Renda Fixa (CDB, Tesouro Direto, LCI/LCA), Ações, FIIs (Fundos Imobiliários), Fundos de Investimento, Criptoativos e Previdência Privada.
- **Lançamento de Movimentações**: Registro de rendimentos/lucros (+), novos aportes (+), proventos/dividendos (+), resgates parciais (-) e taxas/impostos (-).
- **Saldo Patrimonial Dinâmico**: Acompanhamento do valor investido versus saldo total valorizado.

### 4. 📅 Contas a Pagar & Receber (Agenda Financeira)
- **Contas a Pagar (Saídas -)**: Agendamento de boletos, tributos, aluguel e despesas fixas ou variáveis.
- **Contas a Receber (Entradas +)**: Planejamento de salários, honorários, aluguéis recebidos e vendas.
- **Status em Tempo Real**: Identificação imediata de contas *Pendentes* (vencidas), *Em Aberto* (a vencer) e *Liquidadas* (pagas/recebidas).
- **Baixa Integrada**: Ao liquidar, as contas a pagar são debitadas (-) e as contas a receber creditadas (+) automaticamente no extrato bancário escolhido.

### 5. 🏷️ Gerenciamento de Categorias
- **Categorização Personalizada**: Criação, edição e exclusão de categorias para Despesas, Receitas ou Ambos.
- **Identificação Visual**: Cores customizáveis para cada categoria, facilitando a identificação em gráficos e relatórios.

### 6. 📄 Relatórios e Exportação de Dados
- **Exportação para PDF**: Documento formatado pronto para impressão ou envio.
- **Exportação para Excel (.xlsx) e CSV**: Planilhas detalhadas para auditoria e conciliação externa.

### 7. ☁️ Nuvem & Multi-dispositivo (Firebase Firestore)
- Sincronização segura em tempo real para acesso simultâneo em múltiplos navegadores, smartphones e tablets.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Motion.
- **Exportação**: jsPDF, jsPDF-AutoTable, XLSX.
- **Banco de Dados & Autenticação**: Firebase Firestore / Firebase Auth.
- **Build & Execução**: Vite, Node.js / Express.
