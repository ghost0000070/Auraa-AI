// Global analytics tracking
declare global {
  interface Window {
    // Basic gtag typings: event + config forms
    gtag: (
      command: 'js',
      date: Date
    ) => void;
    gtag: (
      command: 'config',
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
    gtag: (
      command: 'event',
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

export {};