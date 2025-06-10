const mysql = require('mysql2/promise');
require('dotenv').config();

async function verDadosTabela(nomeTabela) {
  let connection;
  
  try {
    // Verificar se foi passado o nome da tabela
    if (!nomeTabela) {
      console.error('Erro: Nome da tabela não fornecido!');
      console.log('\nUso: node scripts/ver-dados-tabela.js <nome-da-tabela>');
      console.log('Exemplo: node scripts/ver-dados-tabela.js Fornecedor');
      process.exit(1);
    }

    // Criar conexão com o banco
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'construction_manager'
    });

    console.log(`=== ESTRUTURA DA TABELA: ${nomeTabela} ===\n`);

    // Verificar se a tabela existe
    const [tables] = await connection.execute('SHOW TABLES');
    const tableExists = tables.some(table => Object.values(table)[0] === nomeTabela);
    
    if (!tableExists) {
      console.error(`Erro: A tabela '${nomeTabela}' não existe no banco de dados.`);
      console.log('\nUse "node scripts/ver-tabelas.js" para listar todas as tabelas disponíveis.');
      process.exit(1);
    }

    // Executar SHOW CREATE TABLE
    const [createTableResult] = await connection.execute(`SHOW CREATE TABLE \`${nomeTabela}\``);
    const createTableStatement = createTableResult[0]['Create Table'];
    
    console.log('CREATE TABLE Statement:');
    console.log('----------------------');
    console.log(createTableStatement);
    console.log('\n');

    // Mostrar informações detalhadas das colunas
    console.log('=== DETALHES DAS COLUNAS ===\n');
    const [columns] = await connection.execute(`DESCRIBE \`${nomeTabela}\``);
    
    // Formatar saída das colunas
    const columnInfo = columns.map(col => ({
      Campo: col.Field,
      Tipo: col.Type,
      Nulo: col.Null,
      Chave: col.Key,
      Padrão: col.Default || 'NULL',
      Extra: col.Extra || '-'
    }));

    console.table(columnInfo);

    // Mostrar índices
    console.log('\n=== ÍNDICES ===\n');
    const [indexes] = await connection.execute(`SHOW INDEX FROM \`${nomeTabela}\``);
    
    if (indexes.length > 0) {
      const indexInfo = indexes.map(idx => ({
        Nome: idx.Key_name,
        Coluna: idx.Column_name,
        Único: idx.Non_unique === 0 ? 'Sim' : 'Não',
        Tipo: idx.Index_type
      }));
      console.table(indexInfo);
    } else {
      console.log('Nenhum índice encontrado.');
    }

    // Mostrar contagem de registros
    console.log('\n=== ESTATÍSTICAS ===\n');
    const [countResult] = await connection.execute(`SELECT COUNT(*) as total FROM \`${nomeTabela}\``);
    console.log(`Total de registros: ${countResult[0].total}`);

    // Mostrar relações (foreign keys)
    console.log('\n=== CHAVES ESTRANGEIRAS ===\n');
    const [foreignKeys] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME as 'Nome',
        COLUMN_NAME as 'Coluna',
        REFERENCED_TABLE_NAME as 'Tabela_Referenciada',
        REFERENCED_COLUMN_NAME as 'Coluna_Referenciada'
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'construction_manager'}'
        AND TABLE_NAME = '${nomeTabela}'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    if (foreignKeys.length > 0) {
      console.table(foreignKeys);
    } else {
      console.log('Nenhuma chave estrangeira encontrada.');
    }

  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Pegar o nome da tabela dos argumentos da linha de comando
const nomeTabela = process.argv[2];

// Executar o script
verDadosTabela(nomeTabela).catch(console.error);