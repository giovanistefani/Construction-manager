import { NextResponse } from 'next/server';
import mysql from '@/lib/db/mysql';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
    } catch (tokenError) {
      return NextResponse.json({ 
        error: 'Sessão expirada. Faça login novamente.',
        code: 'TOKEN_EXPIRED'
      }, { status: 401 });
    }
    
    const [perfis] = await mysql.execute(
      'SELECT perfil_id, nome_perfil, descricao_perfil FROM PerfilAcesso ORDER BY nome_perfil'
    );
    
    return NextResponse.json({ perfis });
    
  } catch (error) {
    console.error('Erro ao buscar perfis:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar perfis' 
    }, { status: 500 });
  }
}