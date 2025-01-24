export const env = (): Record<string, string | undefined> => {
  return { ...import.meta.env };
};
