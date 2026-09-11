# Facilitador de CPOR

Aplicação web para acelerar dois documentos recorrentes em projetos de migração/implantação Microsoft 365:

- **E-mail de Conclusão de Projeto (CPOR)** — você informa o nome da empresa, envia as capturas de tela de evidência (Planner, Empresa, Domínio, Licenças, Teams, SharePoint, OneDrive, Apps 365, Exchange), e a ferramenta identifica automaticamente em qual seção cada imagem entra, monta o e-mail com pré-visualização ao vivo e deixa pronto para copiar (assunto e corpo separados, com imagens em resolução real).
- **Engagement POE (Proof of Execution)** — gera o documento oficial de comprovação de execução exigido pelo programa Microsoft Partner Incentives, nas duas páginas (Modern Work & Security Usage e Business Applications), fiel ao layout, cores, tipografia e ordem de workloads do modelo usado no dia a dia, com exportação em PDF.

## Funcionalidades

- Classificação automática de imagens por nome de arquivo, com reconhecimento visual como reforço.
- Pré-visualização ao vivo do e-mail e do documento POE enquanto os campos são preenchidos.
- Cópia em um clique do assunto e do corpo do e-mail, com imagens embutidas em qualidade original.
- Exportação do Engagement POE em PDF, com paginação automática.
- Histórico de documentos salvos por empresa, com download e exclusão.
- Tema claro, escuro ou automático (segue o sistema).
- Configurações de padrões (parceiro, cargo do responsável, texto de abertura do e-mail) e confirmação opcional antes de excluir.

## Como usar

A aplicação é um único arquivo estático (`index.html`, HTML/CSS/JS sem dependências de build). Duas formas de rodar:

1. **Localmente**: baixe `index.html` e abra no navegador.
2. **Publicado como site estático**: sirva `index.html` a partir de qualquer hospedagem de arquivos estáticos (GitHub Pages, Netlify, Vercel, um servidor próprio, etc.). Não há passo de build — o conteúdo do repositório já é o que vai para produção.

Ao rodar como página estática comum, todos os recursos de geração de e-mail e de documento POE funcionam normalmente, incluindo classificação de imagem por nome de arquivo, pré-visualização, cópia e exportação em PDF. Preferências de tema e configurações padrão ficam salvas no navegador local. Sincronização de histórico entre dispositivos e reconhecimento visual de imagens (quando o nome do arquivo não é suficiente) dependem de um backend compatível e não estão disponíveis nessa forma de hospedagem.

## Estrutura do repositório

- `index.html` — a aplicação completa.
- `project/`, `chats/` — material do protótipo de design original que deu origem a este projeto, mantido como histórico.
