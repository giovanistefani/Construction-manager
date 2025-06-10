import { NextResponse } from 'next/server';
import pool from '@/lib/db/mysql';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  let connection;
  
  try {
    // Para planos, vamos permitir acesso mesmo com token expirado
    // pois é uma consulta básica necessária para o cadastro
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        jwt.verify(token, process.env.JWT_SECRET!);
      } catch (tokenError: any) {
        // Se o token estiver expirado, vamos permitir a consulta mesmo assim
        if (tokenError.name !== 'TokenExpiredError') {
          return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }
        console.log('Token expirado, mas permitindo acesso aos planos');
      }
    }
    
    connection = await pool.getConnection();
    
    const [planos] = await connection.execute(
      'SELECT plano_id, nome_plano, descricao FROM PlanoAssinatura ORDER BY nome_plano'
    ) as any;
    
    return NextResponse.json(planos);
    
  } catch (error: any) {
    console.error('Erro ao buscar planos:', error);
    
    return NextResponse.json({ 
      error: 'Erro ao buscar planos' 
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}