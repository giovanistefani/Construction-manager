const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });
const { v4: uuidv4 } = require('uuid');

async function inserirPlanos() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Inserindo planos de assinatura...');

    const planos = [
      {
        plano_id: uuidv4(),
        nome_plano: 'Básico',
        descricao: 'Ideal para pequenas construtoras - até 5 usuários e 10 projetos',
        recursos_limites: JSON.stringify({
          usuarios: 5,
          projetos: 10,
          empresas: 1,
          documentos_mes: 100,
          armazenamento_gb: 5
        })
      },
      {
        plano_id: uuidv4(),
        nome_plano: 'Profissional',
        descricao: 'Perfeito para construtoras em crescimento - até 20 usuários e 50 projetos',
        recursos_limites: JSON.stringify({
          usuarios: 20,
          projetos: 50,
          empresas: 3,
          documentos_mes: 500,
          armazenamento_gb: 25
        })
      },
      {
        plano_id: uuidv4(),
        nome_plano: 'Enterprise',
        descricao: 'Para grandes construtoras - usuários e projetos ilimitados',
        recursos_limites: JSON.stringify({
          usuarios: -1,
          projetos: -1,
          empresas: -1,
          documentos_mes: -1,
          armazenamento_gb: 100
        })
      }
    ];

    for (const plano of planos) {
      await connection.execute(
        `INSERT INTO PlanoAssinatura (plano_id, nome_plano, descricao, recursos_limites) 
         VALUES (?, ?, ?, ?)`,
        [plano.plano_id, plano.nome_plano, plano.descricao, plano.recursos_limites]
      );
      
      console.log(`✓ Plano "${plano.nome_plano}" inserido com ID: ${plano.plano_id}`);
    }

    console.log('\n🎉 Todos os planos foram inseridos com sucesso!');
    
    // Listar planos inseridos
    const [planosInseridos] = await connection.execute(
      'SELECT * FROM PlanoAssinatura ORDER BY nome_plano'
    );
    
    console.log('\n📋 Planos disponíveis:');
    planosInseridos.forEach((plano, index) => {
      const recursos = JSON.parse(plano.recursos_limites);
      console.log(`\n${index + 1}. ${plano.nome_plano}`);
      console.log(`   Descrição: ${plano.descricao}`);
      console.log(`   Usuários: ${recursos.usuarios === -1 ? 'Ilimitado' : recursos.usuarios}`);
      console.log(`   Projetos: ${recursos.projetos === -1 ? 'Ilimitado' : recursos.projetos}`);
      console.log(`   Armazenamento: ${recursos.armazenamento_gb}GB`);
    });

  } catch (error) {
    console.error('❌ Erro ao inserir planos:', error);
  } finally {
    await connection.end();
  }
}

inserirPlanos();