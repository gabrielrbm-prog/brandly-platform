/**
 * Phyllo Connect SDK — integra o widget de conexao de redes sociais
 * Carrega o SDK via CDN e gerencia o ciclo de vida da conexao
 */

const PHYLLO_CDN = 'https://cdn.getphyllo.com/connect/v2/phyllo-connect.js';

declare global {
  interface Window {
    PhylloConnect: {
      initialize(config: PhylloConfig): PhylloInstance;
    };
  }
}

interface PhylloConfig {
  clientDisplayName: string;
  environment: string;
  userId: string;
  token: string;
  workPlatformId?: string;
}

interface PhylloInstance {
  on(event: 'accountConnected', cb: (accountId: string, workPlatformId: string, userId: string) => void): void;
  on(event: 'accountDisconnected', cb: (accountId: string, workPlatformId: string, userId: string) => void): void;
  on(event: 'tokenExpired', cb: (userId: string) => void): void;
  on(event: 'exit', cb: (reason: string, userId: string) => void): void;
  open(): void;
}

let _loaded = false;

function loadScript(): Promise<void> {
  if (_loaded && window.PhylloConnect) return Promise.resolve();

  return new Promise((resolve, reject) => {
    // Verificar se ja esta carregado
    if (window.PhylloConnect) {
      _loaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = PHYLLO_CDN;
    script.async = true;
    script.onload = () => {
      _loaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Falha ao carregar Phyllo Connect SDK'));
    document.head.appendChild(script);
  });
}

export interface PhylloConnectCallbacks {
  onAccountConnected: (accountId: string, workPlatformId: string, userId: string) => void;
  onAccountDisconnected?: (accountId: string, workPlatformId: string, userId: string) => void;
  onTokenExpired?: (userId: string) => void;
  onExit?: (reason: string, userId: string) => void;
}

export async function openPhylloConnect(
  sdkToken: string,
  phylloUserId: string,
  environment: string,
  callbacks: PhylloConnectCallbacks,
): Promise<void> {
  await loadScript();

  const phyllo = window.PhylloConnect.initialize({
    clientDisplayName: 'Brandly',
    environment,
    userId: phylloUserId,
    token: sdkToken,
  });

  phyllo.on('accountConnected', callbacks.onAccountConnected);

  if (callbacks.onAccountDisconnected) {
    phyllo.on('accountDisconnected', callbacks.onAccountDisconnected);
  }

  if (callbacks.onTokenExpired) {
    phyllo.on('tokenExpired', callbacks.onTokenExpired);
  }

  if (callbacks.onExit) {
    phyllo.on('exit', callbacks.onExit);
  }

  phyllo.open();
}
