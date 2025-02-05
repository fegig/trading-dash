import { encryptData, decryptData } from './encryption';

export const saveItem = (key: string, value: string) => {
  const encryptedValue = encryptData(value);
  localStorage.setItem(key, encryptedValue || '');
};

export const getItem = (key: string) => {
  const encryptedValue = localStorage.getItem(key);
  return decryptData(encryptedValue || '');
};

export const removeItem = (key: string) => {
  localStorage.removeItem(key);
};

export const clearStorage = () => {
  localStorage.clear();
};
