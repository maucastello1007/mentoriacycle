# CYCLE — Formulário e painel de aplicações

## O que enviar ao GitHub

Envie o conteúdo desta pasta ao seu repositório. Não é necessário enviar os arquivos temporários do desenvolvimento.

- `index.html`: formulário completo, com fontes, logo, estilos e JavaScript incorporados. Sem instalação ou compilação para o GitHub Pages.
- `CNAME`: domínio solicitado, `cycle.mauriciocastello.com.br`.
- `.nojekyll`: entrega dos arquivos estáticos pelo GitHub Pages.
- `servidor/`: código do serviço que salva as respostas e do painel privado. Esta pasta é código-fonte; GitHub Pages NÃO executa este servidor.
- `.gitignore`: impede inclusão acidental de arquivos de configuração privados e dependências.

## Destino das respostas

O HTML já aponta para:

`https://cycle-aplicacao.mauriciocastello954.chatgpt.site/api/applications`

O serviço salva as nove respostas no banco CYCLE. O código autoriza o envio a partir de `https://cycle.mauriciocastello.com.br`. Se o domínio mudar, a origem autorizada também precisará mudar no servidor. Abrir o HTML por arquivo local não autoriza envio real, porque a origem não é o domínio configurado.

## Painel privado

Acesse `https://cycle-aplicacao.mauriciocastello954.chatgpt.site/painel` com a conta proprietária utilizada para criar a CYCLE no ChatGPT. O painel permite buscar candidatos, ler as nove respostas, registrar anotações e atualizar a etapa: Novo, Contatado ou Agendado.

O acesso às respostas é verificado no servidor. O HTML público não contém senha nem chave de acesso ao banco.

## Publicar o formulário

1. Envie os arquivos ao repositório.
2. Ative GitHub Pages na pasta raiz da branch escolhida.
3. Configure o domínio personalizado `cycle.mauriciocastello.com.br` no GitHub Pages.
4. No provedor de DNS, configure o CNAME de `cycle` para o endereço GitHub Pages informado pelo GitHub, por exemplo `SEU-USUARIO.github.io`. Não use este exemplo como valor real.
5. Ative HTTPS após a validação do domínio e do certificado.
6. Faça uma aplicação de teste pelo domínio final e confira a chegada no painel.

O repositório e o DNS não foram alterados por esta entrega. O serviço e o banco têm hospedagem separada do GitHub Pages. Se você optar por mudar essa hospedagem, será necessário migrar os dados, configurar as credenciais do servidor e atualizar o endpoint no HTML. A autenticação do painel utiliza a plataforma Sites; ela também precisa ser adaptada em uma migração para outro provedor.

## Avisos por e-mail

Destinatário solicitado: `drmauriciocastello@gmail.com`.

A integração com Resend está preparada, mas ainda NÃO envia e-mails: falta conectar uma conta e configurar `RESEND_API_KEY` e `EMAIL_FROM` (remetente autorizado). Configure esses valores como segredos/variáveis na hospedagem do servidor, jamais no HTML ou em um repositório público. Depois de configurar, publique novamente para aplicar os valores.

O aviso contém somente uma mensagem de nova aplicação, o protocolo e o link para o painel privado. Ele é tentado após a gravação. Uma falha de e-mail não remove a aplicação; fica indicada como pendente no banco. Esta versão não inclui tentativas automáticas agendadas. O painel informa quando o envio não está configurado.

## Desenvolvimento do servidor

Em `servidor/`, use Node.js e `npm ci`, seguido de `npm run build`. A compilação prepara um Worker compatível com Cloudflare e o banco D1. As migrações em `drizzle/` devem ser aplicadas na ordem por sua plataforma de hospedagem. Não altere migrações já aplicadas nem apague tabelas para atualizar o painel.

As configurações necessárias estão em `.env.example`, sem valores secretos. Preserve o banco existente ao atualizar o servidor. Nunca envie dados de candidatos ao repositório.
