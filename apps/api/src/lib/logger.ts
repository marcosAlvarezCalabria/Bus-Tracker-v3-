export const logger = {
  error(error: unknown): void {
    if (error instanceof Error) {
      console.error(error.stack ?? error.message);
      return;
    }

    try {
      console.error(JSON.stringify(error));
    } catch {
      console.error(String(error));
    }
  },
  info(message: string): void {
    console.info(message);
  }
};
