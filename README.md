# Construction Manager

Sistema de gest�o para empresas de constru��o civil com controle de fornecedores, documentos fiscais e adiantamentos.

## Tecnologias

- **Frontend**: Next.js 15.3, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MySQL
- **Autentica��o**: JWT com refresh token
- **Seguran�a**: Bcrypt, 2FA via email

## Requisitos

- Node.js 18+
- MySQL 8+
- npm 9+

## Instala��o

### 1. Clone o reposit�rio

```bash
git clone [URL_DO_REPOSITORIO]
cd Construction-manager
```

### 2. Instale as depend�ncias

```bash
npm install
```

### 3. Configure o banco de dados

Crie um banco MySQL:

```sql
CREATE DATABASE construction_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Execute os scripts de inicializa��o:

```bash
node scripts/db-schema.js
node scripts/inserir-perfis.js
node scripts/inserir-planos.js
```

### 4. Configure as vari�veis de ambiente

Crie um arquivo `.env.local` na raiz:

```env
# Banco de Dados
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=construction_manager

# JWT
JWT_SECRET=gere_uma_chave_aleatoria_aqui
JWT_REFRESH_SECRET=gere_outra_chave_aleatoria_aqui

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=senha_de_aplicativo
SMTP_FROM=Construction Manager <noreply@constructionmanager.com>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Executando o projeto

### Desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### Produ��o

```bash
npm run build
npm start
```

## Estrutura do Projeto

```
/app              # P�ginas e API Routes
  /api           # Endpoints da API
  /(p�ginas)     # P�ginas da aplica��o
/components       # Componentes React
/lib             # Utilit�rios e servi�os
/types           # TypeScript types
/scripts         # Scripts do banco
```

## Funcionalidades Principais

- **Autentica��o**: Login com JWT e 2FA opcional
- **Empresas**: Gest�o multi-tenant
- **Usu�rios**: M�ltiplos perfis de acesso
- **Fornecedores**: Cadastro PJ/PF com dados banc�rios
- **Documentos**: Upload e gest�o de documentos fiscais
- **Adiantamentos**: Controle de adiantamentos a fornecedores

## Scripts �teis

```bash
# Ver estrutura do banco
node scripts/ver-tabelas.js

# Ver dados de uma tabela
node scripts/ver-dados-tabela.js Usuario

# Validar c�digo
npm run lint

# Build com type check
npm run build
```

## Desenvolvimento

Ap�s altera��es no c�digo, sempre execute:

```bash
npm run lint
npm run build
```

## Acesso Inicial

1. O sistema cria um usu�rio admin padr�o
2. Use as credenciais fornecidas pelo administrador
3. Configure 2FA no primeiro acesso (recomendado)

## Suporte

Para d�vidas ou problemas, entre em contato com a equipe de desenvolvimento.