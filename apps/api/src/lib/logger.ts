export const logger = {
  error(error: unknown): void {
    console.error(error);
  },
  info(message: string): void {
    console.info(message);
  }
};

