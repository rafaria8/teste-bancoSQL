# BD-RF — CRUD de pessoas

Projeto de estudo com JavaScript, React, Express e Microsoft SQL Server. A interface permite cadastrar, consultar, editar, pesquisar e excluir pessoas. A API usa o pacote `mssql` com consultas parametrizadas e cria a tabela `dbo.people` na primeira inicialização.

## Requisitos

- Node.js LTS e npm.
- Microsoft SQL Server Express ou Developer com Database Engine.
- SQL Server Management Studio (SSMS) para administrar a instância e executar o SQL de preparação.
- Acesso ao registro npm durante a instalação das dependências.

O driver `mssql` usa o driver JavaScript Tedious, então o projeto não exige Python nem compilador C++ para as dependências do backend. [Documentação do pacote `mssql`](https://github.com/tediousjs/node-mssql) · [Driver SQL Server para Node.js](https://learn.microsoft.com/sql/connect/node-js/node-js-driver-for-sql-server/).

## Instalação em outro computador Windows

### 1. Instale as ferramentas

1. Instale a versão LTS do [Node.js](https://nodejs.org/en/download/). O npm é instalado junto.
2. Instale o [SQL Server Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) ou o Developer. Durante a instalação, selecione o **Database Engine Services** e use o nome de instância `SQLEXPRESS`.
3. Instale o [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/en-us/ssms/install/install).
4. No Windows, abra **Services** e confirme que `SQL Server (SQLEXPRESS)` está em execução. Inicie também `SQL Server Browser` para que o driver encontre a porta da instância nomeada.

### 2. Crie o banco e o usuário da aplicação

1. Abra o SSMS e conecte à instância `localhost\SQLEXPRESS` usando **Windows Authentication**.
2. Habilite o modo de autenticação **SQL Server and Windows Authentication mode** nas propriedades do servidor, se ainda não estiver habilitado. Reinicie o serviço do SQL Server após alterar esse modo.
3. Abra uma nova consulta no SSMS e execute o script abaixo como administrador. Se mudar a senha, use o mesmo valor no `.env` na etapa seguinte.

   ```sql
   IF DB_ID(N'bd_rf') IS NULL
       CREATE DATABASE [bd_rf];
   GO

   IF SUSER_ID(N'bd_rf_app') IS NULL
       CREATE LOGIN [bd_rf_app]
           WITH PASSWORD = N'BD-RF_ChangeMe2026!', CHECK_POLICY = ON;
   GO

   USE [bd_rf];
   GO

   IF DATABASE_PRINCIPAL_ID(N'bd_rf_app') IS NULL
       CREATE USER [bd_rf_app] FOR LOGIN [bd_rf_app];
   GO

   GRANT SELECT, INSERT, UPDATE, DELETE, CREATE TABLE TO [bd_rf_app];
   GRANT ALTER ON SCHEMA::[dbo] TO [bd_rf_app];
   GO
   ```

   A API cria `dbo.people` ao iniciar. O login da aplicação recebe permissões CRUD e as permissões necessárias para criar essa tabela.

### 3. Baixe e configure o projeto

Clone o repositório e entre na pasta:

```powershell
git clone <URL_DO_REPOSITORIO>
Set-Location <PASTA_DO_PROJETO>
```

Copie o arquivo de exemplo de configuração e revise a conexão:

```powershell
Copy-Item .env.example .env
```

No `.env`, configure os parâmetros da instância criada:

| Variável | Exemplo | Descrição |
| --- | --- | --- |
| `DB_HOST` | `localhost` | Nome ou endereço do computador do SQL Server |
| `DB_INSTANCE` | `SQLEXPRESS` | Nome da instância; deixe vazio para conectar pela porta |
| `DB_PORT` | `1433` | Porta TCP, usada se `DB_INSTANCE` estiver vazio |
| `DB_USER` | `bd_rf_app` | Login SQL da aplicação |
| `DB_PASSWORD` | (senha configurada) | Senha do login |
| `DB_NAME` | `bd_rf` | Banco da aplicação |
| `DB_ENCRYPT` | `true` | Criptografa a conexão |
| `DB_TRUST_SERVER_CERTIFICATE` | `true` | Aceita certificado local de desenvolvimento |

Se usar uma instância sem nome, deixe `DB_INSTANCE` vazio e configure a porta TCP no SQL Server Configuration Manager. Para uma instância em outro computador, configure `DB_HOST`, habilite conexões remotas no SQL Server e permita a porta/firewall correspondente.

### 4. Instale as dependências e inicie

Na pasta do projeto, rode:

```powershell
npm.cmd install
npm.cmd run dev
```

O primeiro comando instala as dependências JavaScript e atualiza o `package-lock.json`. O segundo inicia a API Express na porta 3001 e o front-end Vite, normalmente em http://localhost:5173. O Vite encaminha chamadas `/api` para a API.

Para executar somente a API, use `npm.cmd run dev:server`. Para compilar o front-end, use `npm.cmd run build`. Para iniciar somente o servidor Express sem modo de desenvolvimento, use `npm.cmd start`.

## API disponível

| Método | Caminho | Ação |
| --- | --- | --- |
| `GET` | `/api/people` | Lista pessoas |
| `POST` | `/api/people` | Cadastra pessoa (`name`, `email`, `phone`) |
| `PUT` | `/api/people/:id` | Atualiza pessoa |
| `DELETE` | `/api/people/:id` | Exclui pessoa |

Nome e e-mail são obrigatórios; telefone é opcional. O SQL Server impede e-mails duplicados.

## Estrutura

```text
src/                 Interface React e estilos
server/index.js      API REST Express
server/database.js  Conexão, pool e criação da tabela SQL Server
.env.example         Modelo de configuração da conexão
```
