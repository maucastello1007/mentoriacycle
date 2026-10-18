# Gestão Cycle — publicação na conta Cloudflare

Pasta do sistema interno. O formulário público da raiz do repositório permanece separado.

## Configuração no Cloudflare Workers

- Nome do Worker: `cycle-gestao`
- Branch: `gestao-cycle`
- Diretório raiz: `gestao`
- Node.js: 24 (`NODE_VERSION=24` se necessário)
- Instalação: `npm ci`
- Build: `npm run build:cloudflare`
- Deploy: `npx wrangler deploy --config dist/server/wrangler.json`

O build usa o banco D1 `cycle-gestao` e o bucket privado `cycle-gestao-arquivos`, já criados na conta do proprietário. A configuração está em `config/cloudflare-deploy.json` e contém somente identificadores públicos, nunca credenciais.

As tabelas `leads` e `workspace` já foram criadas pelo proprietário no console D1. Não execute novamente a migração inicial em produção. Migrações futuras devem ser incrementais e revisadas.

Após publicar, adicionar o domínio personalizado `gestao.mauriciocastello.com.br` ao Worker. O domínio deve continuar protegido pelo aplicativo Access Gestão Cycle. O Worker valida a assinatura do JWT, emissor, AUD e expiração; depois verifica a lista de e-mails autorizados. Os endereços workers.dev e URLs de preview estão desativados no build de publicação.

## Dados

O código não contém o backup, registros pessoais ou os anexos. Após testar os dois acessos no domínio final, entrar como administrador, abrir Mentorias e vendas e importar o backup pelo botão Importar backup antigo. Os anexos presentes no backup são enviados ao R2 pelo sistema.

## Acessos

Maurício: acesso completo. Karla: CRM e acompanhamento de leads; mentorias, financeiro e anexos privados bloqueados no servidor.

## Pendências

- Publicação e revisão visual hospedada.
- Importação do backup em produção e teste dos anexos.
- Integração automática do Google Agenda (disponibilidade e criação de reuniões). Atualmente existe apenas preparação manual de evento no Google Agenda; não deve ser tratada como integração concluída.
- Integração dos candidatos do formulário público com o CRM.

Nenhum segredo deve ser colocado no repositório. A autorização da Cloudflare fica no fluxo nativo de conexão GitHub/Workers do proprietário.
