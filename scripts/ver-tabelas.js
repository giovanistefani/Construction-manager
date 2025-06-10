const mysql = require('mysql2/promise');
require('dotenv').config();

async function verTabelas() {
  let connection;
  
  try {
    // Criar conexão com o banco
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'construction_manager'
    });

    console.log('=== TABELAS DO BANCO DE DADOS ===\n');
    console.log(`Banco: ${process.env.DB_NAME || 'construction_manager'}`);
    console.log(`Host: ${process.env.DB_HOST || 'localhost'}\n`);

    // Executar SHOW TABLES
    const [tables] = await connection.execute('SHOW TABLES');
    
    console.log(`Total de tabelas encontradas: ${tables.length}\n`);
    
    // Listar todas as tabelas
    console.log('Tabelas:');
    console.log('--------');
    tables.forEach((table, index) => {
      // O nome da coluna varia dependendo do nome do banco
      const tableName = Object.values(table)[0];
      console.log(`${index + 1}. ${tableName}`);
    });

    // Para cada tabela, mostrar a contagem de registros
    console.log('\n=== CONTAGEM DE REGISTROS ===\n');
    
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      try {
        const [countResult] = await connection.execute(`SELECT COUNT(*) as total FROM \`${tableName}\``);
        console.log(`${tableName}: ${countResult[0].total} registros`);
      } catch (error) {
        console.log(`${tableName}: Erro ao contar registros`);
      }
    }

  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error.message);
    console.error('\nVerifique suas configurações de banco de dados no arquivo .env');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar o script
verTabelas().catch(console.error);