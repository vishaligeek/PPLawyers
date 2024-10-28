import bcrypt from 'bcryptjs';

export const encryptPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

export const decryptPassword = async (enteredPassword: string, userPassord: string): Promise<boolean> => {
  const result = await bcrypt.compare(enteredPassword, userPassord);
  return result;
};
