export function validarCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, '');

  if (cnpj.length !== 14) return false;

  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  let soma = 0;
  let peso = 2;

  for (let i = 11; i >= 0; i--) {
    soma += parseInt(cnpj[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }

  const digito1 = (soma % 11) < 2 ? 0 : 11 - (soma % 11);

  if (parseInt(cnpj[12]) !== digito1) return false;

  soma = 0;
  peso = 2;

  for (let i = 12; i >= 0; i--) {
    soma += parseInt(cnpj[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }

  const digito2 = (soma % 11) < 2 ? 0 : 11 - (soma % 11);

  return parseInt(cnpj[13]) === digito2;
}

export function formatarCNPJ(cnpj: string): string {
  const numeros = cnpj.replace(/[^\d]/g, '');
  return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function validarCEP(cep: string): boolean {
  const cepLimpo = cep.replace(/[^\d]/g, '');
  return cepLimpo.length === 8;
}

export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validarTelefone(telefone: string): boolean {
  const telefoneLimpo = telefone.replace(/[^\d]/g, '');
  return telefoneLimpo.length >= 10 && telefoneLimpo.length <= 11;
}

export function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');

  if (cpf.length !== 11) return false;

  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf[i]) * (10 - i);
  }

  const digito1 = (soma % 11) < 2 ? 0 : 11 - (soma % 11);

  if (parseInt(cpf[9]) !== digito1) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf[i]) * (11 - i);
  }

  const digito2 = (soma % 11) < 2 ? 0 : 11 - (soma % 11);

  return parseInt(cpf[10]) === digito2;
}

export function formatarCPF(cpf: string): string {
  const numeros = cpf.replace(/[^\d]/g, '');
  return numeros.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

export function formatarTelefone(telefone: string): string {
  const numeros = telefone.replace(/[^\d]/g, '');
  if (numeros.length === 11) {
    return numeros.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (numeros.length === 10) {
    return numeros.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return telefone;
}

export function formatarCEP(cep: string): string {
  const numeros = cep.replace(/[^\d]/g, '');
  return numeros.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

export function validarChavePIX(chave: string, tipo?: string): boolean {
  if (!chave || chave.trim() === '') return false;
  
  chave = chave.trim();
  
  // Se tipo não especificado, tentar detectar automaticamente
  if (!tipo) {
    // CPF
    if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(chave) || /^\d{11}$/.test(chave)) {
      return validarCPF(chave);
    }
    
    // CNPJ
    if (/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(chave) || /^\d{14}$/.test(chave)) {
      return validarCNPJ(chave);
    }
    
    // Email
    if (chave.includes('@')) {
      return validarEmail(chave);
    }
    
    // Telefone
    if (/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(chave) || /^\d{10,11}$/.test(chave)) {
      return validarTelefone(chave);
    }
    
    // Chave aleatória (UUID)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chave)) {
      return true;
    }
    
    return false;
  }
  
  // Validação específica por tipo
  switch (tipo.toLowerCase()) {
    case 'cpf':
      return validarCPF(chave);
    case 'cnpj':
      return validarCNPJ(chave);
    case 'email':
      return validarEmail(chave);
    case 'telefone':
      return validarTelefone(chave);
    case 'chave_aleatoria':
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chave);
    default:
      return false;
  }
}