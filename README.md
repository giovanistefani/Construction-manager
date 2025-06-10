# Construction Manager

Sistema de gestão para empresas de construção civil com controle de fornecedores, documentos fiscais e adiantamentos.

## Tecnologias

- **Frontend**: Next.js 15.3, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MySQL
- **Autenticação**: JWT com refresh token
- **Segurança**: Bcrypt, 2FA via email

## Requisitos

- Node.js 18+
- MySQL 8+
- npm 9+

## Instalação

### 1. Clone o repositório

```bash
git clone [URL_DO_REPOSITORIO]
cd Construction-manager
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados

Crie um banco MySQL:

```sql
CREATE DATABASE construction_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Execute os scripts de inicialização:

```bash
node scripts/db-schema.js
node scripts/inserir-perfis.js
node scripts/inserir-planos.js
```

### 4. Configure as variáveis de ambiente

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

### Produção

```bash
npm run build
npm start
```

## Estrutura do Projeto

```
/app              # Páginas e API Routes
  /api           # Endpoints da API
  /(páginas)     # Páginas da aplicação
/components       # Componentes React
/lib             # Utilitários e serviços
/types           # TypeScript types
/scripts         # Scripts do banco
```

## Funcionalidades Principais

- **Autenticação**: Login com JWT e 2FA opcional
- **Empresas**: Gestão multi-tenant
- **Usuários**: Múltiplos perfis de acesso
- **Fornecedores**: Cadastro PJ/PF com dados bancários
- **Documentos**: Upload e gestão de documentos fiscais
- **Adiantamentos**: Controle de adiantamentos a fornecedores

## Scripts Úteis

```bash
# Ver estrutura do banco
node scripts/ver-tabelas.js

# Ver dados de uma tabela
node scripts/ver-dados-tabela.js Usuario

# Validar código
npm run lint

# Build com type check
npm run build
```

## Desenvolvimento

Após alterações no código, sempre execute:

```bash
npm run lint
npm run build
```

## Acesso Inicial

1. O sistema cria um usuário admin padrão
2. Use as credenciais fornecidas pelo administrador
3. Configure 2FA no primeiro acesso (recomendado)

## Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.