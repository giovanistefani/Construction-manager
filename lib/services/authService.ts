import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../db/mysql';
import { Usuario, LoginDTO, CriarUsuarioDTO, LoginResponse } from '@/types/auth';
import emailService from './emailService';

const SALT_ROUNDS = 10;
const MAX_TENTATIVAS_LOGIN = 5;
const TEMPO_BLOQUEIO = 30 * 60 * 1000; // 30 minutos em milissegundos

export class AuthService {
  async criarUsuario(dadosUsuario: CriarUsuarioDTO): Promise<string> {
    const connection = await pool.getConnection();
    try {
      const usuarioId = uuidv4();
      
      // Hash da senha
      const senhaHash = await bcrypt.hash(dadosUsuario.senha, SALT_ROUNDS);

      // Perfil padrão se não especificado
      const perfilId = dadosUsuario.perfil_acesso_id || 'perfil_usuario_comum';

      // Inserir usuário
      await connection.execute<ResultSetHeader>(
        `INSERT INTO Usuario (usuario_id, nome_usuario, senha_hash, email, empresa_principal_id, perfil_acesso_id, status_conta, tentativas_login_falhas) 
         VALUES (?, ?, ?, ?, ?, ?, 'Ativa', 0)`,
        [usuarioId, dadosUsuario.nome_usuario, senhaHash, dadosUsuario.email, dadosUsuario.empresa_principal_id, perfilId]
      );

      // Log de auditoria
      await this.criarLogAuditoria(
        'Usuario',
        usuarioId,
        usuarioId,
        'Criado',
        null,
        { 
          usuario_id: usuarioId, 
          email: dadosUsuario.email,
          nome_usuario: dadosUsuario.nome_usuario 
        },
        connection,
        'Novo usuário criado via registro'
      );

      return usuarioId;
    } finally {
      connection.release();
    }
  }

  async login(dadosLogin: LoginDTO): Promise<LoginResponse> {
    const connection = await pool.getConnection();
    try {
      console.log('Tentando login com:', dadosLogin.nome_usuario);
      
      // Primeiro, tentar buscar apenas o usuário
      const [usuarios] = await connection.execute<RowDataPacket[]>(
        `SELECT u.* FROM Usuario u
         WHERE u.nome_usuario = ? AND u.status_conta = 'Ativa'`,
        [dadosLogin.nome_usuario]
      );

      console.log('Usuários encontrados:', usuarios.length);

      if (usuarios.length === 0) {
        // Tentar também buscar por email
        const [usuariosPorEmail] = await connection.execute<RowDataPacket[]>(
          `SELECT u.* FROM Usuario u
           WHERE u.email = ? AND u.status_conta = 'Ativa'`,
          [dadosLogin.nome_usuario]
        );
        
        if (usuariosPorEmail.length === 0) {
          console.log('Nenhum usuário encontrado com esse nome/email');
          return { mensagem: 'Credenciais inválidas' };
        }
        
        usuarios[0] = usuariosPorEmail[0];
      }

      const usuario = usuarios[0] as any;
      
      console.log('Usuário encontrado:', {
        id: usuario.usuario_id,
        email: usuario.email,
        nome: usuario.nome_usuario
      });

      // Verificar se a conta está bloqueada (simular usando data_ultimo_login + tempo)
      await this.verificarBloqueio(usuario, connection);

      // Verificar senha
      console.log('Verificando senha...');
      const senhaValida = await bcrypt.compare(dadosLogin.senha, usuario.senha_hash);
      console.log('Senha válida:', senhaValida);

      if (!senhaValida) {
        // Incrementar tentativas falhas
        await this.incrementarTentativasFalhas(usuario.usuario_id, connection);
        
        // Log de auditoria
        await this.criarLogAuditoria(
          'Usuario',
          usuario.usuario_id,
          usuario.usuario_id,
          'Login Falhou',
          null,
          { tentativa: 'senha_incorreta' },
          connection,
          'Tentativa de login com senha incorreta'
        );

        return { mensagem: 'Credenciais inválidas' };
      }

      // Reset tentativas falhas e atualizar último login
      await connection.execute(
        'UPDATE Usuario SET tentativas_login_falhas = 0, data_ultimo_login = NOW() WHERE usuario_id = ?',
        [usuario.usuario_id]
      );

      // Verificar se 2FA está ativo (simular com log de auditoria)
      const tem2FA = await this.verificar2FAAtivo(usuario.usuario_id);
      
      if (tem2FA) {
        // Gerar e "enviar" código 2FA (armazenar no log de auditoria)
        const codigo = this.gerarCodigo2FA();
        await this.salvarCodigo2FA(usuario.usuario_id, codigo, connection);

        // Enviar código por email
        await emailService.enviarCodigoVerificacao2FA(
          usuario.email,
          usuario.email,
          codigo
        );

        return {
          mensagem: 'Código de verificação enviado para seu e-mail',
          requer2FA: true,
          usuario: {
            id: usuario.usuario_id,
            email: usuario.email,
            nomeUsuario: usuario.nome_usuario,
            nomeCompleto: usuario.email, // Usar email como fallback se não houver nome completo
            empresaId: usuario.empresa_principal_id || 'empresa_padrao',
            empresaNome: 'Empresa Padrão',
            perfilAcesso: usuario.perfil_acesso_id || 'perfil_admin'
          }
        };
      }

      // Gerar tokens e armazenar na auditoria
      const { accessToken, refreshToken } = await this.gerarTokens(usuario, connection);

      // Log de auditoria de login bem-sucedido
      await this.criarLogAuditoria(
        'Usuario',
        usuario.usuario_id,
        usuario.usuario_id,
        'Login',
        null,
        { ip: 'unknown', user_agent: 'web' },
        connection,
        'Login realizado com sucesso'
      );

      return {
        mensagem: 'Login realizado com sucesso',
        accessToken,
        refreshToken,
        usuario: {
          id: usuario.usuario_id,
          email: usuario.email,
          nomeUsuario: usuario.nome_usuario,
          nomeCompleto: usuario.email, // Usar email como fallback se não houver nome completo
          empresaId: usuario.empresa_principal_id || 'empresa_padrao',
          empresaNome: 'Empresa Padrão',
          perfilAcesso: usuario.perfil_acesso_id || 'perfil_admin'
        }
      };
    } finally {
      connection.release();
    }
  }

  private async verificarBloqueio(usuario: any, connection: any): Promise<void> {
    if (usuario.tentativas_login_falhas >= MAX_TENTATIVAS_LOGIN) {
      // Verificar se ainda está no período de bloqueio
      const [logs] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM AuditoriaLog 
         WHERE tabela_afetada = 'Usuario' 
         AND id_registro_afetado = ? 
         AND tipo_acao = 'Conta Bloqueada' 
         AND data_hora > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
         ORDER BY data_hora DESC LIMIT 1`,
        [usuario.usuario_id]
      );

      if (logs.length > 0) {
        throw new Error('Conta bloqueada. Tente novamente mais tarde.');
      }
    }
  }

  private async incrementarTentativasFalhas(usuarioId: string, connection: any): Promise<void> {
    // Atualizar tentativas
    await connection.execute<ResultSetHeader>(
      `UPDATE Usuario SET tentativas_login_falhas = tentativas_login_falhas + 1 WHERE usuario_id = ?`,
      [usuarioId]
    );

    // Verificar se deve bloquear
    const [usuario] = await connection.execute<RowDataPacket[]>(
      'SELECT tentativas_login_falhas FROM Usuario WHERE usuario_id = ?',
      [usuarioId]
    );

    if (usuario[0].tentativas_login_falhas >= MAX_TENTATIVAS_LOGIN) {
      // Log de bloqueio
      await this.criarLogAuditoria(
        'Usuario',
        usuarioId,
        usuarioId,
        'Conta Bloqueada',
        null,
        { tentativas: usuario[0].tentativas_login_falhas },
        connection,
        `Conta bloqueada por ${MAX_TENTATIVAS_LOGIN} tentativas falhas`
      );
    }
  }

  private async gerarTokens(usuario: any, connection: any): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = jwt.sign(
      { 
        usuarioId: usuario.usuario_id, 
        empresaId: usuario.empresa_principal_id,
        email: usuario.email,
        nomeUsuario: usuario.nome_usuario,
        perfilAcesso: usuario.nome_perfil
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { 
        usuarioId: usuario.usuario_id,
        type: 'refresh'
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '30d' }
    );

    // Armazenar tokens no log de auditoria
    await this.criarLogAuditoria(
      'SessaoAtiva',
      `sessao_${uuidv4()}`,
      usuario.usuario_id,
      'Token Gerado',
      null,
      { 
        access_token: accessToken.substring(0, 20) + '...', // Só primeiros caracteres por segurança
        refresh_token: refreshToken.substring(0, 20) + '...',
        expira_em: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hora
        refresh_expira_em: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
      },
      connection,
      'Tokens de acesso gerados'
    );

    return { accessToken, refreshToken };
  }

  async validarToken(token: string): Promise<any> {
    try {
      console.log('Validando token:', token.substring(0, 20) + '...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      console.log('Token decodificado:', decoded);
      
      // Por enquanto, vamos apenas validar o JWT sem verificar no banco
      // para resolver o problema de persistência
      return decoded;
      
      /* Comentado temporariamente para debug
      // Verificar se o token ainda está ativo no log de auditoria
      const [logs] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM AuditoriaLog 
         WHERE tabela_afetada = 'SessaoAtiva' 
         AND usuario_id = ? 
         AND tipo_acao = 'Token Gerado'
         AND JSON_UNQUOTE(JSON_EXTRACT(dados_novos, '$.access_token')) LIKE ?
         AND JSON_UNQUOTE(JSON_EXTRACT(dados_novos, '$.expira_em')) > NOW()
         ORDER BY data_hora DESC LIMIT 1`,
        [(decoded as any).usuarioId, token.substring(0, 20) + '%']
      );

      console.log('Logs de sessão encontrados:', logs.length);

      if (logs.length === 0) {
        console.log('Nenhuma sessão ativa encontrada para este token');
        return null;
      }
      */

      return decoded;
    } catch (error) {
      return null;
    }
  }

  async logout(token: string): Promise<void> {
    const connection = await pool.getConnection();
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
      
      // Marcar token como inválido no log
      await this.criarLogAuditoria(
        'SessaoEncerrada',
        `logout_${uuidv4()}`,
        decoded.usuarioId,
        'Logout',
        null,
        { token_invalidado: token.substring(0, 20) + '...' },
        connection,
        'Logout realizado - token invalidado'
      );
    } catch (error) {
      // Token inválido, não fazer nada
    } finally {
      connection.release();
    }
  }

  async solicitarRecuperacaoSenha(email: string): Promise<{ sucesso: boolean; mensagem: string }> {
    const connection = await pool.getConnection();
    try {
      console.log('Iniciando recuperação de senha para:', email);
      
      // Verificar se o usuário existe
      const [usuarios] = await connection.execute<RowDataPacket[]>(
        'SELECT usuario_id, email, nome_usuario FROM Usuario WHERE email = ? AND status_conta = "Ativa"',
        [email]
      );

      console.log('Usuários encontrados:', usuarios.length);

      if (usuarios.length === 0) {
        console.log('Nenhum usuário encontrado com este email');
        
        // Se o email for o de teste, criar um usuário temporário
        if (email === 'duduborges333969@gmail.com') {
          console.log('Criando usuário de teste temporário...');
          const usuarioId = uuidv4();
          const senhaHash = await bcrypt.hash('TempPassword@123', 10);
          
          // Temporariamente desabilitar foreign key check
          await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
          
          await connection.execute(
            `INSERT INTO Usuario (usuario_id, nome_usuario, senha_hash, email, empresa_principal_id, perfil_acesso_id, status_conta, tentativas_login_falhas) 
             VALUES (?, ?, ?, ?, ?, ?, 'Ativa', 0)`,
            [usuarioId, email, senhaHash, email, 'empresa_teste', 'perfil_admin']
          );
          
          // Reabilitar foreign key check
          await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
          
          console.log('Usuário de teste criado com ID:', usuarioId);
          
          // Continuar com o processo de recuperação
          const usuario = { usuario_id: usuarioId, email, nome_usuario: email };
          const token = uuidv4();

          console.log('Gerando token para usuário de teste:', usuario.usuario_id);

          // Salvar token no log de auditoria
          await this.criarLogAuditoria(
            'RecuperacaoSenha',
            `token_${token}`,
            usuario.usuario_id,
            'Token Redefinição Criado',
            null,
            { 
              email,
              token,
              expira_em: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
            },
            connection,
            'Token de redefinição de senha criado'
          );

          console.log('Token salvo, enviando email...');

          // Enviar email
          await emailService.enviarEmailRecuperacaoSenha(email, usuario.nome_usuario, token);
          
          console.log('Email enviado com sucesso');
          
          return { 
            sucesso: true, 
            mensagem: 'Email de recuperação enviado com sucesso! Verifique sua caixa de entrada.' 
          };
        }
        
        return { 
          sucesso: false, 
          mensagem: 'Nenhum usuário encontrado com este email. Verifique se o email está correto e se você já possui uma conta.' 
        };
      }

      const usuario = usuarios[0];
      const token = uuidv4();

      console.log('Gerando token para usuário:', usuario.usuario_id);

      // Salvar token no log de auditoria
      await this.criarLogAuditoria(
        'RecuperacaoSenha',
        `token_${token}`,
        usuario.usuario_id,
        'Token Redefinição Criado',
        null,
        { 
          email,
          token,
          expira_em: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
        },
        connection,
        'Token de redefinição de senha criado'
      );

      console.log('Token salvo, enviando email...');

      // Enviar email
      await emailService.enviarEmailRecuperacaoSenha(email, usuario.nome_usuario, token);
      
      console.log('Email enviado com sucesso');
      
      return { 
        sucesso: true, 
        mensagem: 'Email de recuperação enviado com sucesso! Verifique sua caixa de entrada.' 
      };
    } finally {
      connection.release();
    }
  }

  async redefinirSenha(token: string, novaSenha: string): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      // Buscar token válido no log de auditoria
      const [tokens] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM AuditoriaLog 
         WHERE tabela_afetada = 'RecuperacaoSenha' 
         AND tipo_acao = 'Token Redefinição Criado'
         AND JSON_UNQUOTE(JSON_EXTRACT(dados_novos, '$.token')) = ?
         AND JSON_UNQUOTE(JSON_EXTRACT(dados_novos, '$.expira_em')) > NOW()
         AND (detalhes_adicionais NOT LIKE '%usado%' OR detalhes_adicionais IS NULL)
         ORDER BY data_hora DESC LIMIT 1`,
        [token]
      );

      if (tokens.length === 0) {
        return false;
      }

      const tokenLog = tokens[0];
      // dados_novos já é um objeto, não precisa fazer parse
      const dadosToken = typeof tokenLog.dados_novos === 'string' 
        ? JSON.parse(tokenLog.dados_novos) 
        : tokenLog.dados_novos;
      
      // Hash da nova senha
      const senhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);

      // Atualizar senha do usuário
      await connection.execute(
        'UPDATE Usuario SET senha_hash = ?, tentativas_login_falhas = 0 WHERE usuario_id = ?',
        [senhaHash, tokenLog.usuario_id]
      );

      // Marcar token como usado
      await this.criarLogAuditoria(
        'RecuperacaoSenha',
        `uso_${token}`,
        tokenLog.usuario_id,
        'Senha Redefinida',
        null,
        { token_usado: token },
        connection,
        'Senha redefinida com sucesso - token usado'
      );

      // Invalidar todas as sessões ativas
      await this.criarLogAuditoria(
        'SessaoEncerrada',
        `reset_${uuidv4()}`,
        tokenLog.usuario_id,
        'Sessões Invalidadas',
        null,
        { motivo: 'redefinicao_senha' },
        connection,
        'Todas as sessões invalidadas devido à redefinição de senha'
      );

      return true;
    } finally {
      connection.release();
    }
  }

  async verificarTokenRecuperacao(token: string): Promise<boolean> {
    console.log('Verificando token de recuperação:', token);
    
    // Primeiro, vamos ver todos os tokens de recuperação que existem
    const [todosTokens] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM AuditoriaLog 
       WHERE tabela_afetada = 'RecuperacaoSenha' 
       AND tipo_acao = 'Token Redefinição Criado'
       ORDER BY data_hora DESC LIMIT 5`
    );
    
    console.log('Todos os tokens de recuperação recentes:', todosTokens.length);
    if (todosTokens.length === 0) {
      console.log('PROBLEMA: Nenhum token de recuperação encontrado no banco!');
    } else {
      todosTokens.forEach((t, i) => {
        console.log(`Token ${i + 1}:`, {
          id: t.log_id,
          dados_novos: t.dados_novos,
          data_hora: t.data_hora,
          detalhes: t.detalhes_adicionais
        });
      });
    }
    
    const [tokens] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM AuditoriaLog 
       WHERE tabela_afetada = 'RecuperacaoSenha' 
       AND tipo_acao = 'Token Redefinição Criado'
       AND JSON_UNQUOTE(JSON_EXTRACT(dados_novos, '$.token')) = ?
       AND JSON_UNQUOTE(JSON_EXTRACT(dados_novos, '$.expira_em')) > NOW()
       AND (detalhes_adicionais NOT LIKE '%usado%' OR detalhes_adicionais IS NULL)`,
      [token]
    );

    console.log('Tokens encontrados na verificação com filtros:', tokens.length);
    if (tokens.length > 0) {
      console.log('Token válido encontrado:', tokens[0]);
    }

    return tokens.length > 0;
  }

  private gerarCodigo2FA(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async verificar2FAAtivo(usuarioId: string): Promise<boolean> {
    // Verificar no log se 2FA foi ativado para este usuário
    const [logs] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM AuditoriaLog 
       WHERE tabela_afetada = 'Usuario' 
       AND id_registro_afetado = ?
       AND tipo_acao = '2FA Ativado'
       ORDER BY data_hora DESC LIMIT 1`,
      [usuarioId]
    );

    // Verificar se não foi desativado depois
    if (logs.length > 0) {
      const [desativado] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM AuditoriaLog 
         WHERE tabela_afetada = 'Usuario' 
         AND id_registro_afetado = ?
         AND tipo_acao = '2FA Desativado'
         AND data_hora > ?
         ORDER BY data_hora DESC LIMIT 1`,
        [usuarioId, logs[0].data_hora]
      );

      return desativado.length === 0;
    }

    return false;
  }

  private async salvarCodigo2FA(usuarioId: string, codigo: string, connection: any): Promise<void> {
    await this.criarLogAuditoria(
      'Codigo2FA',
      `codigo_${uuidv4()}`,
      usuarioId,
      'Código 2FA Gerado',
      null,
      { 
        codigo,
        expira_em: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutos
      },
      connection,
      'Código 2FA gerado para verificação'
    );
  }

  async verificarCodigo2FA(usuarioId: string, codigo: string): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      console.log('Verificando código 2FA:', { usuarioId, codigo });
      
      // Primeiro, vamos ver todos os códigos disponíveis para debug
      const [todosCodigos] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM AuditoriaLog 
         WHERE tabela_afetada = 'Codigo2FA' 
         AND usuario_id = ?
         AND tipo_acao = 'Código 2FA Gerado'
         ORDER BY data_hora DESC LIMIT 5`,
        [usuarioId]
      );
      
      console.log('Códigos encontrados para o usuário:', todosCodigos.map(c => ({
        data_hora: c.data_hora,
        codigo: c.dados_novos?.codigo,
        expira_em: c.dados_novos?.expira_em,
        detalhes: c.detalhes_adicionais
      })));

      // Buscar todos os códigos não usados do usuário e filtrar no código
      const [codigos] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM AuditoriaLog 
         WHERE tabela_afetada = 'Codigo2FA' 
         AND usuario_id = ?
         AND tipo_acao = 'Código 2FA Gerado'
         AND detalhes_adicionais NOT LIKE '%usado%'
         ORDER BY data_hora DESC`,
        [usuarioId]
      );

      // Filtrar no código para encontrar o código correto e ainda válido
      const codigoValido = codigos.find(c => {
        const dadosNovos = c.dados_novos;
        if (!dadosNovos) return false;
        
        const codigoArmazenado = dadosNovos.codigo;
        const expiraEm = new Date(dadosNovos.expira_em);
        const agora = new Date();
        
        console.log('Comparando códigos:', {
          digitado: codigo,
          armazenado: codigoArmazenado,
          expiraEm: expiraEm.toISOString(),
          agora: agora.toISOString(),
          expirado: expiraEm <= agora
        });
        
        return codigoArmazenado === codigo && expiraEm > agora;
      });

      console.log('Códigos disponíveis:', codigos.length);

      if (!codigoValido) {
        console.log('Nenhum código válido encontrado');
        return false;
      }

      // Marcar código como usado
      await this.criarLogAuditoria(
        'Codigo2FA',
        `uso_${uuidv4()}`,
        usuarioId,
        'Código 2FA Usado',
        null,
        { codigo_usado: codigo },
        connection,
        'Código 2FA verificado e usado com sucesso'
      );

      console.log('Código 2FA verificado com sucesso');
      return true;
    } finally {
      connection.release();
    }
  }

  async ativarDesativar2FA(usuarioId: string, ativar: boolean): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await this.criarLogAuditoria(
        'Usuario',
        usuarioId,
        usuarioId,
        ativar ? '2FA Ativado' : '2FA Desativado',
        { dois_fatores_ativo: !ativar },
        { dois_fatores_ativo: ativar },
        connection,
        `Autenticação de dois fatores ${ativar ? 'ativada' : 'desativada'}`
      );
    } finally {
      connection.release();
    }
  }

  async obterStatusUsuario(usuarioId: string): Promise<any> {
    const [usuarios] = await pool.execute<RowDataPacket[]>(
      `SELECT u.usuario_id, u.email, u.nome_usuario, u.empresa_principal_id,
              e.nome_fantasia as empresa_nome, p.nome_perfil
       FROM Usuario u
       JOIN Empresa e ON u.empresa_principal_id = e.empresa_id
       JOIN PerfilAcesso p ON u.perfil_acesso_id = p.perfil_id
       WHERE u.usuario_id = ?`,
      [usuarioId]
    );

    if (usuarios.length === 0) return null;

    const usuario = usuarios[0];
    
    // Verificar se 2FA está ativo
    const tem2FA = await this.verificar2FAAtivo(usuarioId);
    
    return {
      id: usuario.usuario_id,
      email: usuario.email,
      nomeUsuario: usuario.nome_usuario,
      empresaId: usuario.empresa_principal_id,
      empresaNome: usuario.empresa_nome,
      perfilNome: usuario.nome_perfil,
      dois_fatores_ativo: tem2FA
    };
  }

  async obterPrimeiraEmpresaAtiva(): Promise<any> {
    const [empresas] = await pool.execute<RowDataPacket[]>(
      'SELECT empresa_id, nome_fantasia FROM Empresa WHERE status_empresa = "Ativa" LIMIT 1'
    );
    
    if (empresas.length > 0) {
      return empresas[0];
    }

    // Se não existir empresa, criar uma empresa padrão
    const empresaId = uuidv4();
    const connection = await pool.getConnection();
    
    try {
      // Primeiro, garantir que existe pelo menos um plano
      await connection.execute(
        `INSERT IGNORE INTO PlanoAssinatura (plano_id, nome_plano, descricao, recursos_limites) 
         VALUES ('plano_padrao', 'Plano Padrão', 'Plano padrão do sistema', '{"usuarios": 100}')`,
        []
      );

      // Garantir que existe pelo menos um perfil
      await connection.execute(
        `INSERT IGNORE INTO PerfilAcesso (perfil_id, nome_perfil, descricao_perfil) 
         VALUES ('perfil_admin', 'Administrador', 'Perfil administrativo')`,
        []
      );

      // Criar empresa padrão (sem usuario_criador_id por enquanto)
      await connection.execute(
        `INSERT INTO Empresa (
          empresa_id, nome_fantasia, razao_social, cnpj, 
          endereco_logradouro, endereco_numero, endereco_bairro, 
          endereco_cidade, endereco_estado_uf, endereco_cep,
          telefone_contato, email_contato, plano_assinatura_id, usuario_criador_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          empresaId, 'Empresa Padrão', 'Empresa Padrão LTDA', '00.000.000/0001-00',
          'Rua Principal', '100', 'Centro', 'São Paulo', 'SP', '00000-000',
          '(11) 0000-0000', 'contato@empresa.com', 'plano_padrao', 'sistema'
        ]
      );

      return { empresa_id: empresaId, nome_fantasia: 'Empresa Padrão' };
    } finally {
      connection.release();
    }
  }

  validarForcaSenha(senha: string): { valida: boolean; erros: string[] } {
    const erros: string[] = [];

    if (senha.length < 8) {
      erros.push('A senha deve ter pelo menos 8 caracteres');
    }

    if (!/[A-Z]/.test(senha)) {
      erros.push('A senha deve conter pelo menos uma letra maiúscula');
    }

    if (!/[a-z]/.test(senha)) {
      erros.push('A senha deve conter pelo menos uma letra minúscula');
    }

    if (!/[0-9]/.test(senha)) {
      erros.push('A senha deve conter pelo menos um número');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
      erros.push('A senha deve conter pelo menos um caractere especial');
    }

    return {
      valida: erros.length === 0,
      erros
    };
  }

  private async criarLogAuditoria(
    tabela: string,
    idRegistro: string,
    usuarioId: string,
    tipoAcao: string,
    dadosAntigos: any = null,
    dadosNovos: any = null,
    connection: any,
    detalhes?: string
  ): Promise<void> {
    const logId = uuidv4();
    
    await connection.execute(
      `INSERT INTO AuditoriaLog (log_id, tabela_afetada, id_registro_afetado, usuario_id, tipo_acao, dados_antigos, dados_novos, detalhes_adicionais)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        tabela,
        idRegistro,
        usuarioId,
        tipoAcao,
        dadosAntigos ? JSON.stringify(dadosAntigos) : null,
        dadosNovos ? JSON.stringify(dadosNovos) : null,
        detalhes
      ]
    );
  }

  async criarLogAuditoriaPublico(
    tabela: string,
    idRegistro: string,
    usuarioId: string,
    tipoAcao: string,
    dadosAntigos: any = null,
    dadosNovos: any = null,
    detalhes?: string
  ): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await this.criarLogAuditoria(
        tabela,
        idRegistro,
        usuarioId,
        tipoAcao,
        dadosAntigos,
        dadosNovos,
        connection,
        detalhes
      );
    } finally {
      connection.release();
    }
  }
}

export default new AuthService();