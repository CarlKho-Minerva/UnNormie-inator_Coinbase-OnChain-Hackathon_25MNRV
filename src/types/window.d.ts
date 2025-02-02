import { Eip1193Provider } from 'ethers';

declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      isMetaMask?: boolean;
      on?: (eventName: string, callback: (params: any) => void) => void;
      removeListener?: (eventName: string, callback: (params: any) => void) => void;
    };
  }
}