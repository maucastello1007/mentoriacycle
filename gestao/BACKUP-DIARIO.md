# Backup diário do Gestão Cycle

- Horário: 23h55 em America/Cuiaba (03h55 UTC do dia seguinte).
- Retenção: dia atual e os 29 dias anteriores.
- Destino privado: bucket cycle-gestao-arquivos, pasta backups/daily/AAAA-MM-DD/.
- Conteúdo: todas as linhas das tabelas leads e workspace, mais uma cópia dos anexos cycle/.
- O arquivo manifest.json é gravado por último. Só uma pasta com esse arquivo representa um backup concluído.
- A limpeza só ocorre depois da conclusão do backup do dia e só remove pastas antigas de backups/daily/. Os arquivos ativos cycle/ não são removidos pela rotina.
- Falhas aparecem nos eventos do Cron Trigger e nos logs do Worker como erro. A mensagem cycle_daily_backup_complete identifica uma conclusão.
- Novos agendamentos da Cloudflare podem levar alguns minutos para propagar. A primeira execução diária será às 23h55 após a publicação.

## Consultar e recuperar

Na Cloudflare, abra R2 > cycle-gestao-arquivos > backups/daily/. Confira a data e a existência de manifest.json. Baixe esse arquivo e os anexos da subpasta files/ para ter uma cópia fora da conta Cloudflare.

O manifesto é um formato de recuperação técnica, diferente do botão Importar backup antigo do sistema. Para restaurar, primeiro exporte o estado atual e pause novas edições. Regrave os arquivos listados de backupKey para originalKey preservando os metadados e restaure as linhas de database.leads e database.workspace nas respectivas tabelas D1 em uma transação. A recuperação requer acesso administrativo; nunca publique os arquivos de backup no GitHub.

As cópias estão na mesma conta e no mesmo bucket: protegem contra alterações e exclusões na aplicação, mas não substituem uma cópia externa contra perda da conta ou exclusão completa do bucket. Os anexos são copiados a cada dia e contam para o armazenamento R2.

O backup registra as linhas D1 em uma mesma operação batch e copia os anexos em seguida. Como não há bloqueio de edições, evite modificar ou excluir anexos durante esse horário. Uma alteração detectada durante a cópia cancela a conclusão do backup e preserva as cópias anteriores.

## Validação local

node tests/daily-backup.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
node scripts/build-cloudflare.mjs
