import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true para 465, false para outras portas
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async enviarEmailRecuperacaoSenha(email: string, nome: string, token: string): Promise<void> {
    try {
      console.log('Configuração SMTP:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM
      });

      const linkRecuperacao = `${process.env.NEXTAUTH_URL}/redefinir-senha?token=${token}`;
      console.log('Link de recuperação:', linkRecuperacao);
      
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@example.com',
        to: email,
        subject: 'Recuperação de Senha - Gerenciador de Obras',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Gerenciador de Obras</h1>
            </div>
            <div style="padding: 20px; background-color: #f3f4f6;">
              <h2 style="color: #1f2937;">Olá ${nome},</h2>
              <p style="color: #4b5563;">
                Recebemos uma solicitação para redefinir sua senha. Se você não fez essa solicitação, 
                pode ignorar este e-mail com segurança.
              </p>
              <p style="color: #4b5563;">
                Para redefinir sua senha, clique no botão abaixo:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${linkRecuperacao}" 
                   style="background-color: #2563eb; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                  Redefinir Senha
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                Este link expirará em 30 minutos por motivos de segurança.
              </p>
              <p style="color: #6b7280; font-size: 14px;">
                Se o botão não funcionar, copie e cole este link no seu navegador:
                <br>
                <a href="${linkRecuperacao}" style="color: #2563eb;">${linkRecuperacao}</a>
              </p>
            </div>
            <div style="background-color: #e5e7eb; padding: 15px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © 2024 Gerenciador de Obras. Todos os direitos reservados.
              </p>
            </div>
          </div>
        `
      };

      console.log('Enviando email para:', email);
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado com sucesso:', result.messageId);
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      throw error;
    }
  }

  async enviarCodigoVerificacao2FA(email: string, nome: string, codigo: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@example.com',
      to: email,
      subject: 'Código de Verificação - Gerenciador de Obras',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Gerenciador de Obras</h1>
          </div>
          <div style="padding: 20px; background-color: #f3f4f6;">
            <h2 style="color: #1f2937;">Olá ${nome},</h2>
            <p style="color: #4b5563;">
              Seu código de verificação para login é:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #2563eb; color: white; padding: 20px; 
                          font-size: 32px; font-weight: bold; letter-spacing: 5px; 
                          display: inline-block; border-radius: 10px;">
                ${codigo}
              </div>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Este código expirará em 5 minutos.
            </p>
            <p style="color: #dc2626; font-size: 14px;">
              <strong>Importante:</strong> Não compartilhe este código com ninguém. 
              Nossa equipe nunca pedirá seu código de verificação.
            </p>
          </div>
          <div style="background-color: #e5e7eb; padding: 15px; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              © 2024 Gerenciador de Obras. Todos os direitos reservados.
            </p>
          </div>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async verificarConexao(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Erro ao verificar conexão SMTP:', error);
      return false;
    }
  }
}

export default new EmailService();