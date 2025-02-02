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

export const MetaMaskTutorial = ({
  videoStream,
  onRequestScreenShare
}: {
  videoStream: MediaStream | null;
  onRequestScreenShare: () => void;
}) => {
  const [account, setAccount] = useState<string>('');
  const [isStarted, setIsStarted] = useState(false);
  const [steps, setSteps] = useState<Step[]>([
    {
      id: 1,
      title: 'Install MetaMask',
      description: 'Install the MetaMask browser extension to get started with Web3',
      completed: false,
    },
    {
      id: 2,
      title: 'Create or Import Wallet',
      description: 'Set up your MetaMask wallet - we\'ll guide you through it',
      completed: false,
    },
    {
      id: 3,
      title: 'Connect to Base Sepolia',
      description: 'Connect to the Base Sepolia testnet for testing',
      completed: false,
    },
    {
      id: 4,
      title: 'Get Test ETH',
      description: 'Get some test ETH to start experimenting',
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

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x14A34' }],
        });
      } catch (switchError: any) {
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

      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(0x14A34)) {
        throw new Error('Please switch to Base Sepolia network');
      }

      const tx = await signer.sendTransaction({
        to: account,
        value: ethers.parseEther('0.00000001'),
        gasLimit: 21000,
      });

      showNotification(`🎉 Task ${stepId} completed! Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
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

  useEffect(() => {
    if (window.ethereum) {
      setSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === 1 ? { ...step, completed: true } : step
        )
      );
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      setAccount(accounts[0] || '');
    };

    const ethereum = window.ethereum;
    (ethereum as any).on('accountsChanged', handleAccountsChanged);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  if (!isStarted) {
    return (
      <div className="landing-page">
        <div className="content">
          <h1>Welcome to CryptoGuide</h1>
          <p className="subtitle">Your interactive journey into Web3</p>
          <div className="features">
            <div className="feature">
              <span className="icon">🦊</span>
              <p>Learn MetaMask</p>
            </div>
            <div className="feature">
              <span className="icon">🎓</span>
              <p>Step-by-step guidance</p>
            </div>
            <div className="feature">
              <span className="icon">🎁</span>
              <p>Earn rewards</p>
            </div>
          </div>
          <button
            className="start-button"
            onClick={() => {
              setIsStarted(true);
              onRequestScreenShare();
            }}
          >
            Start Your Journey
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tutorial-container">
      <div className="main-content">
        {videoStream ? (
          <div className="screen-preview">
            <h2>Your Screen</h2>
            <div className="video-container">
              <video
                autoPlay
                playsInline
                muted
                ref={(video) => {
                  if (video && videoStream) {
                    video.srcObject = videoStream;
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <div className="screen-prompt">
            <p>Please share your screen to continue</p>
            <button onClick={onRequestScreenShare}>Share Screen</button>
          </div>
        )}
      </div>

      <div className="steps-panel">
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
                    <button onClick={connectWallet} className="action-button">
                      Connect Wallet
                    </button>
                  )}
                  {step.id === 4 && account && (
                    <button onClick={() => sendReward(step.id)} className="action-button">
                      Claim Reward
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MetaMaskTutorial;