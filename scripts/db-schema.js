const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function showDatabaseSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('=== ESTRUTURA DO BANCO DE DADOS ===\n');
    
    // Obter todas as tabelas
    const [tables] = await connection.execute('SHOW TABLES');
    const tableKey = `Tables_in_${process.env.DB_NAME}`;
    
    for (const table of tables) {
      const tableName = table[tableKey];
      console.log(`📋 Tabela: ${tableName}`);
      console.log('─'.repeat(50));
      
      // Obter estrutura da tabela
      const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
      
      for (const column of columns) {
        console.log(`  • ${column.Field} - ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key === 'PRI' ? '(PRIMARY KEY)' : ''} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
      }
      
      // Obter índices
      const [indexes] = await connection.execute(`SHOW INDEX FROM ${tableName}`);
      if (indexes.length > 0) {
        console.log('\n  Índices:');
        const uniqueIndexes = [...new Set(indexes.map(idx => idx.Key_name))];
        for (const indexName of uniqueIndexes) {
          const indexColumns = indexes
            .filter(idx => idx.Key_name === indexName)
            .map(idx => idx.Column_name)
            .join(', ');
          console.log(`    - ${indexName}: (${indexColumns})`);
        }
      }
      
      // Obter foreign keys
      const [foreignKeys] = await connection.execute(`
        SELECT 
          CONSTRAINT_NAME,
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM 
          INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE 
          TABLE_SCHEMA = ? 
          AND TABLE_NAME = ?
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [process.env.DB_NAME, tableName]);
      
      if (foreignKeys.length > 0) {
        console.log('\n  Foreign Keys:');
        for (const fk of foreignKeys) {
          console.log(`    - ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}(${fk.REFERENCED_COLUMN_NAME})`);
        }
      }
      
      console.log('\n');
    }
    
    // Resumo
    console.log('=== RESUMO ===');
    console.log(`Total de tabelas: ${tables.length}`);
    
  } catch (error) {
    console.error('Erro ao obter estrutura do banco:', error);
  } finally {
    await connection.end();
  }
}

showDatabaseSchema();