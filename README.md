# BD-RF — CRUD de pessoas

Projeto para praticar operações CRUD (criar, consultar, editar e excluir) com JavaScript, React, Express e MySQL. O backend usa `mysql2` com pool de conexões e consultas parametrizadas. O schema da tabela `people` é criado automaticamente quando a API inicia.

## Requisitos

- Node.js 18 ou superior e npm.
- MySQL Community Server instalado e em execução (padrão: `localhost:3306`).
- Acesso ao registro npm para instalar as dependências.

## Preparar o MySQL

1. Abra o MySQL Workbench e conecte-se como administrador.
2. Execute este SQL para criar o banco e um usuário dedicado ao projeto:

   ```sql
   CREATE DATABASE IF NOT EXISTS bd_rf
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_0900_ai_ci;

   CREATE USER IF NOT EXISTS 'bd_rf_app'@'localhost'
     IDENTIFIED BY 'change_this_password';

   GRANT SELECT, INSERT, UPDATE, DELETE, CREATE
     ON bd_rf.* TO 'bd_rf_app'@'localhost';
   ```

   Troque `change_this_password` por uma senha sua e use a mesma no próximo passo. O usuário do projeto tem permissões apenas no banco `bd_rf`.

3. Na pasta do projeto, copie `.env.example` para `.env` e preencha a senha usada acima. No PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   O `.env` fica fora do controle de versão. Se o host, a porta ou o usuário forem diferentes, ajuste também os campos `DB_HOST`, `DB_PORT` e `DB_USER`.

## Instalar e executar

Na pasta do projeto, rode:

```powershell
npm.cmd install
npm.cmd run dev
```

O primeiro comando instala ou atualiza as dependências e o `package-lock.json`. O segundo inicia a API Express na porta 3001 e o front-end Vite (normalmente em http://localhost:5173). O Vite encaminha as chamadas `/api` para a API. Na primeira inicialização, o servidor cria a tabela `people` no banco `bd_rf`.

Para executar somente a API, use `npm.cmd run dev:server`. Para gerar a versão compilada da interface, use `npm.cmd run build`. Para iniciar a API sem modo de desenvolvimento, use `npm.cmd start`.

## Configuração do banco

As configurações ficam no arquivo `.env`:

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `DB_HOST` | `localhost` | Servidor MySQL |
| `DB_PORT` | `3306` | Porta do MySQL |
| `DB_USER` | `bd_rf_app` | Usuário do projeto |
| `DB_PASSWORD` | — | Senha do usuário |
| `DB_NAME` | `bd_rf` | Banco utilizado |

## API disponível

| Método | Caminho | Ação |
| --- | --- | --- |
| `GET` | `/api/people` | Lista pessoas |
| `POST` | `/api/people` | Cadastra pessoa (`name`, `email`, `phone`) |
| `PUT` | `/api/people/:id` | Atualiza pessoa |
| `DELETE` | `/api/people/:id` | Exclui pessoa |

Nome e e-mail são obrigatórios; telefone é opcional. Os e-mails são únicos no banco.

## Estrutura

```text
src/                 Interface React e estilos
server/index.js      API REST Express
server/database.js  Pool MySQL e criação do schema
.env.example         Modelo de configuração da conexão
```
