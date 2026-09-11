# Facilitador de CPOR

Aplicação web para o dia a dia de uma consultoria Microsoft Partner: gera os documentos recorrentes de um projeto de migração/implantação Microsoft 365, organiza consultas de qualificação de tenant e centraliza os acessos e ferramentas usados no trabalho.

## Documentos

- **E-mail de Conclusão de Projeto (CPOR)** — você informa o nome da empresa, envia as capturas de tela de evidência (Planner, Empresa, Domínio, Licenças, Teams, SharePoint, OneDrive, Apps 365, Exchange), e a ferramenta identifica automaticamente em qual seção cada imagem entra, monta o e-mail com pré-visualização ao vivo e deixa pronto para copiar (assunto e corpo separados, com imagens em resolução real).
- **Engagement POE (Proof of Execution)** — gera o documento oficial de comprovação de execução exigido pelo programa Microsoft Partner Incentives, nas duas páginas (Modern Work & Security Usage e Business Applications), fiel ao layout, cores, tipografia e ordem de workloads do modelo usado no dia a dia, com exportação em PDF.
- **Checklist de Finalização (Ata de Reunião)** — fiel ao modelo em Excel de acompanhamento de projeto: informações da reunião, identificação do cliente, objetivo, histórico de alterações, próximas ações e aprovação, com listas de serviços/tecnologias/nível de benefícios que alimentam os campos do documento automaticamente. Exporta em PDF, paginado para caber em uma página quando possível.

## Consulta de Tenant ID

Cole o resultado bruto do tenantidfinder.com (ou do whatismytenantid.com) e a ferramenta monta sozinha a tabela colorida, a legenda e as estatísticas (% ativos, % identificados) — a mesma transformação que normalmente seria feita manualmente numa planilha. Aceita tanto o formato de texto que essas ferramentas retornam quanto uma tabela colada com colunas separadas por tab. Exporta o relatório em `.xlsx`, com as mesmas cores.

## Portal / Links

Página inicial com os acessos e ferramentas do dia a dia organizados por categoria (wiki, aprendizado, senhas, relatórios, suporte, projetos) — como uma intranet simples.

## Configurações

Tema (claro/escuro/automático), cor de destaque, tamanho de fonte, densidade das tabelas, equipe da consultoria (nomes usados nos seletores do Checklist), padrões de preenchimento por tipo de documento, comportamento do app (aba inicial, ordenação e paginação de Documentos salvos, aviso ao sair com alterações não salvas), confirmação antes de excluir, e exportação/importação de todas essas preferências em um arquivo.

## Como usar

O front-end é um único arquivo estático (`index.html`, HTML/CSS/JS sem dependências de build). Formas de rodar:

1. **Localmente**: baixe `index.html` e abra no navegador — modo somente-local (preferências no `localStorage` do navegador, sem sincronizar entre dispositivos).
2. **Publicado como site estático simples** (GitHub Pages, Netlify, Vercel, etc.): mesma limitação do modo local — não há passo de build, mas também não há banco de dados por trás.
3. **Publicado no Azure (produção)**: Azure Static Web Apps servindo `index.html` + a API em [`api/`](api/) (Azure Functions), com Cosmos DB (histórico de documentos e configurações da equipe) e Blob Storage (imagens anexadas). Nesse modo o salvamento é automático e sincronizado entre dispositivos — é o que fica publicado a partir deste repositório via GitHub Actions a cada push na branch principal. Veja [`api/README.md`](api/README.md) para as application settings necessárias.

A identificação automática por IA de qual seção cada print pertence é específica do runtime de Claude Artifacts (onde este projeto também roda, usando os mesmos `db`/`assets`) e não está disponível na hospedagem Azure — nela, a classificação é manual pelo seletor de cada imagem.

## Estrutura do repositório

- `index.html` — a aplicação completa (front-end).
- `api/` — backend Azure Functions (Cosmos DB + Blob Storage) usado na publicação no Azure.
- `project/`, `chats/` — material do protótipo de design original que deu origem a este projeto, mantido como histórico.
