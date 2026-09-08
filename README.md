# 🎓 Ms Carelli - Painel de Gestão Pedagógica (Clone Profeu)

Clone com fidelidade 1:1 da dashboard autenticada da plataforma **Profeu** (`https://app.aula.app.br/app/dashboard`), projetado com arquitetura modular, componentização moderna e alta performance para deploy automatizado no **Appwrite Sites** e versionado no **GitHub**.

---

## 📸 Demonstração Visual

| Desktop (1920x1080) | Mobile (390x844) |
| :---: | :---: |
| ![Desktop Preview](public/dashboard-desktop.png) | ![Mobile Preview](public/dashboard-mobile.png) |

---

## 🛠️ Tech Stack & Justificativa Técnica

Durante a fase de **Tech Stack Discovery** e inspeção da aplicação original em produção, foram identificados os seguintes padrões e dependências:

- **Frontend Core:** **React 18/19** com **TypeScript** e **Vite** como bundler de última geração.
- **Estilização:** **Tailwind CSS** com sistema de tokens slate (`bg-slate-900`, `bg-slate-50`, `border-slate-100`, etc.), garantindo carregamento atômico ultraleve (CSS compilado de ~22KB).
- **Ícones:** **Lucide React** (mesma biblioteca utilizada pela aplicação original: `LayoutDashboard`, `Users`, `Calendar`, `BookOpen`, `Clock`, etc.).
- **Deploy Target:** **Appwrite Sites** (SPA estático com fallback para `index.html`).

---

## 📐 Arquitetura de Informação & Componentes

O projeto foi estruturado de forma modular e desacoplada:

```text
├── public/
│   ├── _redirects              # Configuração de SPA routing
│   ├── dashboard-desktop.png   # Screenshot Desktop em alta resolução
│   └── dashboard-mobile.png    # Screenshot Mobile em alta resolução
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardView.tsx   # View unificada da Visão do Dia
│   │   │   ├── StatCards.tsx       # Cards de Alunos e Horas de Aula (Hoje)
│   │   │   ├── TodaySchedule.tsx   # Agenda detalhada de hoje com status
│   │   │   └── WeekView.tsx        # Grade semanal interativa (Seg a Sex)
│   │   ├── layout/
│   │   │   ├── MobileHeader.tsx    # Cabeçalho superior responsivo mobile
│   │   │   └── Sidebar.tsx         # Barra lateral retrátil (w-64 / w-16)
│   │   ├── finance/
│   │   │   └── FinanceView.tsx     # Visão financeira e faturamento
│   │   ├── schedule/
│   │   │   └── ScheduleView.tsx    # Agenda cronológica completa
│   │   ├── settings/
│   │   │   └── SettingsView.tsx    # Perfil do professor e preferências
│   │   └── students/
│   │       └── StudentsView.tsx    # Lista e filtros de alunos
│   ├── data/
│   │   └── mockData.ts             # Dados mockados inteligentes
│   ├── types/
│   │   └── index.ts                # Definições de tipos TypeScript
│   ├── App.tsx                     # Layout mestre e orquestrador de estado
│   ├── index.css                   # Diretivas Tailwind e estilização base
│   └── main.tsx                    # Ponto de entrada React
├── appwrite.json                   # Especificação de deploy Appwrite
├── package.json                    # Scripts e dependências
├── tailwind.config.js              # Configuração de tema do Tailwind
├── tsconfig.json                   # Configuração de compilação TS
└── vite.config.ts                  # Configuração do Vite
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js (v18+)
- npm (v9+)

### Instalação e Execução
```bash
# 1. Instalar dependências
npm install

# 2. Executar ambiente de desenvolvimento
npm run dev

# 3. Gerar build de produção otimizada
npm run build

# 4. Pré-visualizar build local
npm run preview
```

---

## 🌐 Deploy no Appwrite Sites (Passo a Passo)

O **Appwrite Sites** permite hospedar Single Page Applications diretamente conectadas ao seu repositório GitHub.

### 1. Conectar o Repositório no GitHub
Se ainda não enviou os arquivos para o repositório remoto:
```bash
git remote add origin https://github.com/isabellecarelli/mscarelli.git
git branch -M main
git push -u origin main
```

### 2. Criar o Site no Console do Appwrite
1. Acesse o seu console: [https://cloud.appwrite.io/](https://cloud.appwrite.io/) (ou sua instância self-hosted).
2. Selecione ou crie seu Projeto Appwrite.
3. No menu lateral esquerdo, clique em **Sites** (ou **Deploy > Sites**).
4. Clique no botão **Create Site** / **New Site**.
5. Conecte com o seu GitHub e selecione o repositório:
   - **Repository:** `isabellecarelli/mscarelli`
   - **Branch:** `main`
6. Preencha as configurações de build:
   - **Framework:** `Vite` (ou `React`)
   - **Root Directory:** `./`
   - **Install Command:** `npm install`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
7. Em **Routing / Fallback**: configure para `index.html` (para garantir o roteamento SPA das abas).
8. Clique em **Deploy**! O Appwrite irá clonar, instalar dependências, compilar o projeto e disponibilizar uma URL com SSL automático.

---

## 🔒 Segurança e Boas Práticas

- Nenhum token sensível ou chave de autenticação privada foi fixado no código estático.
- O arquivo `.gitignore` previne a submissão de `node_modules`, `dist` e variáveis de ambiente locais.
- Arquitetura 100% pronta para plugar no backend do Appwrite (Appwrite Auth, Databases e Storage).
