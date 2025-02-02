import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './metamask-tutorial.scss';

interface Step {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  videoValidation?: (stream: MediaStream) => Promise<boolean>;
}

// Contract address for sending rewards (you'll deploy this)
const REWARD_CONTRACT_ADDRESS = '0x...'; // We'll create this contract later

export const MetaMaskTutorial = ({ videoStream }: { videoStream: MediaStream | null }) => {
  const [account, setAccount] = useState<string>('');
  const [steps, setSteps] = useState<Step[]>([
    {
      id: 1,
      title: 'Install MetaMask',
      description: 'First, install the MetaMask browser extension',
      completed: false,
    },
    {
      id: 2,
      title: 'Create or Import Wallet',
      description: 'Create a new wallet or import an existing one',
      completed: false,
    },
    {
      id: 3,
      title: 'Connect to Base Sepolia',
      description: 'Add and connect to Base Sepolia testnet',
      completed: false,
    },
    {
      id: 4,
      title: 'Get Test ETH',
      description: 'Get some test ETH from the Base Sepolia faucet',
      completed: false,
    }
  ]);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed!');
      }

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);

      // Switch to Base Sepolia
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x14A34' }], // Base Sepolia chainId
        });
      } catch (switchError: any) {
        // Chain doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x14A34',
              chainName: 'Base Sepolia',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org']
            }]
          });
        }
      }

      // Mark step as completed
      setSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === 2 ? { ...step, completed: true } : step
        )
      );

      showNotification('Wallet connected successfully!');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      showNotification('Error connecting wallet. Please try again.');
    }
  };

  const sendReward = async (stepId: number) => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed!');
      }

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();

      // Check if we're on Base Sepolia
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(0x14A34)) {
        throw new Error('Please switch to Base Sepolia network');
      }

      // Send a tiny amount of ETH as reward (0.00000001 ETH)
      const tx = await signer.sendTransaction({
        to: account,
        value: ethers.parseEther('0.00000001'),
        gasLimit: 21000, // Standard gas limit for ETH transfers
      });

      showNotification(`🎉 Task ${stepId} completed! Transaction sent: ${tx.hash}`);

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        // Update step completion
        setSteps(prevSteps =>
          prevSteps.map(step =>
            step.id === stepId ? { ...step, completed: true } : step
          )
        );
        showNotification(`✨ Reward received! View on Basescan: https://sepolia.basescan.org/tx/${tx.hash}`);
      }
    } catch (error: any) {
      console.error('Error sending reward:', error);
      showNotification(`Error: ${error.message || 'Could not send reward'}`);
    }
  };

  const showNotification = (message: string) => {
    const notification = document.createElement('div');
    notification.className = 'tutorial-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
  };

  // Check for MetaMask installation on component mount
  useEffect(() => {
    if (window.ethereum) {
      setSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === 1 ? { ...step, completed: true } : step
        )
      );
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        setAccount(accounts[0] || '');
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  return (
    <div className="metamask-tutorial">
      <div className="tutorial-header">
        <h1>Welcome to Crypto Journey</h1>
        <div className="ai-assistant">
          <div className="hologram-effect"></div>
        </div>
      </div>

      <div className="tutorial-content">
        <div className="steps-container">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`tutorial-step ${step.completed ? 'completed' : ''}`}
            >
              <div className="step-header">
                <h3>{step.title}</h3>
                {step.completed && <span className="checkmark">✓</span>}
              </div>
              <p>{step.description}</p>
              {!step.completed && (
                <>
                  {step.id === 2 && !account && (
                    <button onClick={connectWallet} className="connect-button">
                      Connect Wallet
                    </button>
                  )}
                  {step.id === 4 && account && (
                    <button onClick={() => sendReward(step.id)} className="connect-button">
                      Claim Reward
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <div className="video-container">
          {videoStream && (
            <div className="screen-share-preview">
              <h3>Screen Share Preview</h3>
              {/* Video preview is handled by the parent component */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetaMaskTutorial;