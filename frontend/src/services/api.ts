import type { EnnoreDemoData } from '../types';

export const getEnnoreDemo = async (): Promise<EnnoreDemoData> => {
  const response = await fetch('/api/demo/ennore');
  if (!response.ok) {
    throw new Error('OceanWatch backend unavailable');
  }
  return await response.json();
};
