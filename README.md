# Facilitador de CPOR

Ferramenta para montar rapidamente o e-mail de **Conclusão de Projeto (CPOR)** de migrações/implantações Microsoft 365: você digita o nome da empresa, joga as capturas de tela de evidência (Teams, SharePoint, OneDrive, Apps 365, Exchange, licenças, domínio, etc.) e a ferramenta identifica sozinha em qual seção cada imagem entra, monta o e-mail ao vivo e deixa pronto para copiar e colar no seu cliente de e-mail.

## Onde usar

A versão em uso é publicada como um **Claude Artifact** (roda no navegador, com identificação automática de imagem, salvamento automático por empresa e histórico de CPORs — recursos que dependem do runtime do Artifact e não existem na versão estática deste repositório).

> Peça o link do Artifact publicado a quem está mantendo este projeto — artifacts do Claude são privados por padrão.

## O que tem neste repositório

- `app/` — uma versão estática (HTML/CSS/JS puro, sem build) do fluxo original de "enviar fotos por e-mail". Serve como base/histórico; não tem identificação automática por imagem nem salvamento (esses recursos dependem de capacidades exclusivas do Claude Artifact).
- `project/`, `chats/` — material do handoff de design original (Claude Design) que deu origem ao protótipo. Histórico, mantido por referência.

## Histórico do projeto

1. Começou como um protótipo genérico de "enviar fotos por e-mail" (Claude Design → `project/Enviar Fotos por Email.dc.html`).
2. Virou o **Facilitador de CPOR**: modelo de e-mail de conclusão de projeto Microsoft 365, com identificação automática de evidências por seção, pré-visualização ao vivo, cópia do assunto/corpo com imagens em tamanho real, e CPORs salvos por empresa.
3. Um fluxo futuro, "Criar Engagement POE", está reservado na navegação por abas do Artifact, ainda não implementado.

## Nota sobre dono/nome do repositório

Este repositório está hospedado em `brinfotec/enviar-fotos-por-email`. Renomear o repositório e transferir a propriedade para outra conta são ações administrativas do GitHub que precisam ser feitas por quem tem acesso de administrador nas **configurações do repositório no próprio GitHub** (Settings → renomear / Settings → Danger Zone → Transfer ownership) — não é algo que uma sessão do Claude Code consiga fazer por API neste ambiente.
