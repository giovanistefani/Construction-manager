const mysql = require('mysql2/promise');
require('dotenv').config();

async function inserirPerfis() {
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

    console.log('Inserindo perfis de acesso...');

    const perfis = [
      {
        perfil_id: 'perfil_admin_sistema',
        nome_perfil: 'Administrador do Sistema',
        descricao_perfil: 'Acesso total ao sistema, incluindo gestão de empresas e usuários'
      },
      {
        perfil_id: 'perfil_admin_empresa',
        nome_perfil: 'Administrador da Empresa',
        descricao_perfil: 'Acesso completo aos dados da empresa, exceto gestão de outras empresas'
      },
      {
        perfil_id: 'perfil_usuario_comum',
        nome_perfil: 'Usuário Comum',
        descricao_perfil: 'Acesso básico aos recursos da empresa'
      },
      {
        perfil_id: 'perfil_financeiro',
        nome_perfil: 'Financeiro',
        descricao_perfil: 'Acesso aos recursos financeiros e pagamentos'
      },
      {
        perfil_id: 'perfil_operacional',
        nome_perfil: 'Operacional',
        descricao_perfil: 'Acesso aos recursos operacionais e projetos'
      }
    ];

    for (const perfil of perfis) {
      await connection.execute(
        'INSERT INTO PerfilAcesso (perfil_id, nome_perfil, descricao_perfil) VALUES (?, ?, ?)',
        [perfil.perfil_id, perfil.nome_perfil, perfil.descricao_perfil]
      );
      console.log(`✓ Perfil "${perfil.nome_perfil}" inserido com sucesso`);
    }

    console.log('\n✅ Todos os perfis foram inseridos com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao inserir perfis:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

inserirPerfis();