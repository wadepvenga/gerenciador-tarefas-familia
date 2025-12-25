
// Input validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'A senha deve ter pelo menos 8 caracteres' };
  }

  /* REMOVIDO: Obrigatoriedade de letra maiúscula
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'A senha deve conter pelo menos uma letra maiúscula' };
  }
  */

  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'A senha deve conter pelo menos uma letra minúscula' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'A senha deve conter pelo menos um número' };
  }

  return { isValid: true };
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .trim();
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 100;
};

export const generateSecurePassword = (): string => {
  // 🛡️ HUMAN-FRIENDLY CHARSET: Removendo caracteres ambíguos (O, 0, I, l, 1, etc) para facilitar digitação
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  const array = new Uint8Array(12); // Reduzido para 12 caracteres (mais fácil de digitar, ainda seguro)
  crypto.getRandomValues(array);

  let password = '';
  for (let i = 0; i < array.length; i++) {
    password += charset[array[i] % charset.length];
  }

  // Garantir que a senha atenda aos requisitos básicos (Maiúscula, Minúscula, Número)
  if (!/[A-Z]/.test(password)) password += 'V';
  if (!/[a-z]/.test(password)) password += 'e';
  if (!/[0-9]/.test(password)) password += '4';

  return password;
};
