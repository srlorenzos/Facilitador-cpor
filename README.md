# Facilitador de CPOR

Aplicação web para o dia a dia de uma consultoria Microsoft Partner: gera os documentos recorrentes de um projeto de migração/implantação Microsoft 365, organiza consultas de qualificação de tenant e centraliza os acessos e ferramentas usados no trabalho.

## Documentos

- **E-mail de Conclusão de Projeto (CPOR)** — você informa o nome da empresa, envia as capturas de tela de evidência (Planner, Empresa, Domínio, Licenças, Teams, SharePoint, OneDrive, Apps 365, Exchange), e a ferramenta identifica automaticamente em qual seção cada imagem entra, monta o e-mail com pré-visualização ao vivo e deixa pronto para copiar (assunto e corpo separados, com imagens em resolução real).
- **Engagement POE (Proof of Execution)** — gera o documento oficial de comprovação de execução exigido pelo programa Microsoft Partner Incentives, nas duas páginas (Modern Work & Security Usage e Business Applications), fiel ao layout, cores, tipografia e ordem de workloads do modelo usado no dia a dia, com exportação em PDF.
- **Checklist de Finalização (Ata de Reunião)** — fiel ao modelo em Excel de acompanhamento de projeto: informações da reunião, identificação do cliente, objetivo, histórico de alterações, próximas ações e aprovação, com listas de serviços/tecnologias/nível de benefícios que alimentam os campos do documento automaticamente. Exporta em PDF, paginado para caber em uma página quando possível.

## Consulta de Tenant ID

Cole o resultado bruto do tenantidfinder.com (ou do whatismytenantid.com) e a ferramenta monta sozinha a tabela colorida, a legenda e as estatísticas (% ativos, % identificados) — a mesma transformação que normalmente seria feita manualmente numa planilha. Aceita tanto o formato de texto que essas ferramentas retornam quanto uma tabela colada com colunas separadas por tab. Exporta o relatório em `.xlsx`, com as mesmas cores.

## Portal / Links

Página inicial com os acessos e ferramentas do dia a dia organizados por categoria (wiki, aprendizado, senhas, relatórios, suporte, projetos) — como uma intranet simples. Título, subtítulo e todos os links (categoria, ícone, título, descrição, URL) são editáveis em Configurações → Portal / Links, sem precisar alterar código — útil para quem administra o site publicado manter os acessos atualizados.

## Configurações

Tema (claro/escuro/automático), cor de destaque, tamanho de fonte, densidade das tabelas, equipe da consultoria (nomes usados nos seletores do Checklist), padrões de preenchimento por tipo de documento, comportamento do app (aba inicial, ordenação e paginação de Documentos salvos, aviso ao sair com alterações não salvas), confirmação antes de excluir, os links do Portal, e exportação/importação de todas essas preferências em um arquivo.

## Como usar

A aplicação é um único arquivo estático (`index.html`, HTML/CSS/JS sem dependências de build). Duas formas de rodar:

1. **Localmente**: baixe `index.html` e abra no navegador.
2. **Publicado como site estático**: sirva `index.html` a partir de qualquer hospedagem de arquivos estáticos (GitHub Pages, Netlify, Vercel, um servidor próprio, etc.). Não há passo de build — o conteúdo do repositório já é o que vai para produção.

Ao rodar como página estática comum, todos os recursos de geração de documentos, consulta de Tenant ID e exportação (PDF/planilha) funcionam normalmente. Preferências de tema e configurações padrão ficam salvas no navegador local. Sincronização de histórico entre dispositivos e reconhecimento visual de imagens (quando o nome do arquivo não é suficiente para o CPOR) dependem de um backend compatível e não estão disponíveis nessa forma de hospedagem.

## Estrutura do repositório

- `index.html` — a aplicação completa.
- `project/`, `chats/` — material do protótipo de design original que deu origem a este projeto, mantido como histórico.
