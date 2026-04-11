# 🧙‍♂️⚔️ UniQuest

![Theme](https://img.shields.io/badge/Categoria-Education_Tech-lightgrey?style=for-the-badge&labelColor=black)
![Framework](https://img.shields.io/badge/Framework-Svelte-lightgrey?style=for-the-badge&logo=svelte&logoColor=white&labelColor=black)
![Language](https://img.shields.io/badge/Made_with-TypeScript_/_JS-lightgrey?style=for-the-badge&logo=javascript&logoColor=white&labelColor=black)
![Build](https://img.shields.io/badge/Build-Vite-lightgrey?style=for-the-badge&logo=vite&logoColor=white&labelColor=black)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white)
![Hackathon](https://img.shields.io/badge/🏆_Edumi_Hackathon-2nd_Place-gold?style=for-the-badge&labelColor=black)

> **Uma plataforma gamificada que transforma a procura de emprego e o desenvolvimento de competências numa aventura RPG épica.**

> 🏆 **2º Lugar — Edumi Hackathon** 🏆
>
> O UniQuest conquistou o **segundo lugar** no **Edumi Hackathon**, sendo reconhecido pela sua abordagem inovadora em gamificação educacional e análise inteligente de competências profissionais.

O **UniQuest** é uma aplicação web desenvolvida em **Svelte** e **Vite**, projetada para extrair, categorizar e pontuar requisitos técnicos e comportamentais a partir de descrições de vagas. O projeto evoluiu para uma interface visual imersiva onde os utilizadores criam uma "Ficha de Personagem", enfrentam "Bosses" (Vagas de Emprego) e completam "Missões" (Cursos) para evoluir na sua carreira.

## 🗡️ Funcionalidades Principais

O sistema está agora dividido em três ecrãs principais de interação (SPA) e um motor de processamento em segundo plano:

| Funcionalidade | Descrição |
| :--- | :--- |
| 🛡️ **Perfil RPG (Player Card)** | Crie o seu avatar, escolha a sua "Classe" (ex: Desenvolvedor Front-end, Concept Artist, Psicólogo Clínico) e selecione as suas competências. A barra de XP visual aumenta conforme adiciona skills. Inclui a capacidade de **exportar a ficha de jogador como imagem (PNG)** para partilhar no GitHub ou LinkedIn. |
| ⚔️ **Arena de Batalha (Job Match)** | Cole a descrição de uma vaga de emprego e o motor *LexerParser* entra em ação. O ecrã simula um embate visual entre o Herói e o "Boss" (a vaga). Se a correspondência de competências for igual ou superior a 75%, o jogador vence a batalha (com direito a animação de confettis 🎉). |
| 📜 **Missões de Aprimoramento (Quest Log)** | As competências que faltaram para conquistar a vaga transformam-se automaticamente em Missões. O sistema gera atalhos de estudo dinâmicos, recomendando cursos específicos ou criando **links de pesquisa automáticos para a Udemy e YouTube** para cada competência em falta. |
| 🧠 **Supreme Skill Engine** | O motor de processamento de linguagem natural (NLP) contínua a alimentar a app. Limpa ruídos das vagas, reconhece jargões de recrutamento e auto-regista novas competências desconhecidas, classificando-as em categorias e gerando recursos de aprendizagem em tempo real. |
| 💾 **Persistência de Dados** | Todo o progresso do jogador (Avatar, Skills, Vagas Analisadas e Missões) é guardado automaticamente no `localStorage` do navegador. |

## 🛠️ Stack Tecnológico Atualizado

* **Frontend:** Svelte (v5)
* **Routing:** `svelte-routing` (Navegação SPA sem recarregar a página)
* **Build & Bundler:** Vite
* **Bibliotecas Visuais:** * `html2canvas` (Para exportação da Ficha de Jogador)
  * `canvas-confetti` (Para feedback visual de vitória)
* **Deployment:** Preparado para a **Vercel** com reescrita de rotas configurada (`vercel.json`).

## 🧝 Arquitetura do Sistema

```mermaid
graph TD
    User["Utilizador"] --> SPA[Svelte SPA]
    
    subgraph Frontend App
        Router["Svelte Routing"] --> Profile["/ (PlayerCard)"]
        Router --> Battle["/fight (FightScreen)"]
        Router --> Quests["/quest (QuestScreen)"]
    end
    
    SPA --> Router
    
    subgraph Logic & Storage
        Battle --> Engine["Supreme Skill Engine (LexerParser)"]
        Engine --> |Extrai Competências| Quests
        Profile -.-> |Guarda Estado| Storage[(localStorage)]
        Battle -.-> |Guarda Progresso| Storage
        Quests -.-> |Lê Missões| Storage
    end
    
    Quests --> ExtLinks["Links Udemy/YouTube"]
````

## 🧚 Como Executar Localmente

### Requisitos

  * **Node.js** v18+
  * **npm** (ou Yarn/PNPM)

### Instalação

```bash
# Clone e entre na pasta da aplicação web
git clone [https://github.com/EduLoboM/UniQuest.git](https://github.com/EduLoboM/UniQuest.git)
cd UniQuest/webapp

# Instalar as dependências do projeto
npm install

# Executar o servidor de desenvolvimento com hot-reload (HMR)
npm run dev

# Aceda à aplicação através do link indicado na consola (geralmente http://localhost:5173)
```

## 🏰 Estrutura do Projeto

A estrutura foi reorganizada para suportar componentes de interface:

```
UniQuest/
└── webapp/
    ├── package.json              # Dependências e scripts do frontend
    ├── vercel.json               # Configuração de rotas para deploy na Vercel
    ├── vite.config.js            # Configuração do Vite
    ├── LexerParser.js            # Motor de Parsing & NLP
    ├── skill_registry.json       # Base de dados estruturada das habilidades
    ├── skill_courses.json        # Mapeamento do currículo de cursos pré-definidos
    └── src/
        ├── App.svelte            # Ponto de entrada e configuração do Router
        ├── stores.js             # Gestão de estado global e localStorage
        └── components/
            ├── PlayerCard.svelte # Componente do Perfil do Jogador
            ├── FightScreen.svelte# Componente de Análise de Vagas/Batalha
            └── QuestScreen.svelte# Componente de Missões e Cursos
```

## 🚀 Deployment (CI/CD)

O projeto está configurado para deploy instantâneo na **Vercel**. O ficheiro `vercel.json` incluído na raiz da pasta `webapp` garante que a navegação SPA funcione corretamente em produção, redirecionando todos os pedidos de rotas (como `/fight` ou `/quest`) para o ficheiro `index.html`.

-----

<p align="center">
Desenvolvido com ⚔️ por <b>Eduardo Lôbo Moreira</b>.
</p>
