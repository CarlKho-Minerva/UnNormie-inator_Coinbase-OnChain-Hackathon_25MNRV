import { useEffect, useState, useRef } from 'react';
import { ethers } from 'ethers';
import './metamask-tutorial.scss';

interface Message {
  id: string;
  type: 'ai' | 'system' | 'user';
  content: string;
  timestamp: Date;
}

interface Step {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  aiPrompt: string;
  validation?: (stream: MediaStream) => Promise<boolean>;
}

const WELCOME_MESSAGE = `Hey there! 👋 I'm your personal Web3 guide, and I'm here to help you set up your first crypto wallet. Think of me as your friendly neighborhood crypto expert!`;

const INTRO_MESSAGE = `My special power is being able to see your screen in real-time, which means I can guide you through every step of setting up MetaMask. No more getting lost in confusing tutorials!`;

const FEATURES_MESSAGE = `And once we're done with the wallet setup, I've got more exciting tutorials coming soon:
• 🔒 Crypto Security Guide - Learn how to keep your assets safe
• 🎥 Video Call Safety - Tips for secure video meetings in Web3
• 💰 DeFi Basics - Your first steps into decentralized finance`;

const SCREEN_SHARE_INSTRUCTIONS = `Before we begin, I'll need to see your screen so I can guide you better. Don't worry - I'll only look at your browser window, and you're in control of what you share.

Ready to start? Here's what to do:
1. Click the "Share Screen" button when prompted
2. Select the browser tab or window you want to share
3. Click "Share" to begin

I'll be right here to help you every step of the way! 🚀`;

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    type: 'system',
    content: 'Welcome to UnNormie! Your Web3 guide is connecting...',
    timestamp: new Date(),
  }
];

const STEPS: Step[] = [
  {
    id: 1,
    title: '🦊 Install MetaMask',
    description: 'First step into Web3 - I\'ll help you get the right wallet extension',
    completed: false,
    aiPrompt: "I notice you don't have MetaMask installed yet - that's perfectly fine! Would you like me to guide you to the official MetaMask website? I'll make sure you download it from the right place.",
  },
  {
    id: 2,
    title: '🔐 Create Your Wallet',
    description: 'I\'ll guide you through setting up your wallet safely and securely',
    completed: false,
    aiPrompt: "Great progress! Now comes an important step - creating your wallet. I'll help you understand each part, especially the secret recovery phrase. Think of it like the master key to your digital vault!",
  },
  {
    id: 3,
    title: '🌐 Connect to Test Network',
    description: 'We\'ll use Base Sepolia - a safe space to learn without real money',
    completed: false,
    aiPrompt: "Perfect! Let's connect to Base Sepolia - it's like a practice arena where you can learn without risking real money. I'll help you set it up!",
  },
  {
    id: 4,
    title: '🎁 Get Practice ETH',
    description: 'I\'ll help you get some test ETH to practice with',
    completed: false,
    aiPrompt: "You're doing fantastic! Let's get you some test ETH to play with. Don't worry - it's not real money, but it works just like the real thing for learning!",
  }
];

const INTRO_SEQUENCE = [
  {
    id: 'welcome',
    content: "👋 Ring ring! Your friendly crypto guide is calling!",
    delay: 0
  },
  {
    id: 'intro',
    content: "Hi! I'm UnNormie, your personal guide to the world of Web3! I'm here to help you get started with crypto in a fun, pressure-free way.",
    delay: 3000
  },
  {
    id: 'purpose',
    content: "Don't worry about real money - we'll practice with test ETH on Base Sepolia. You'll even earn some test ETH rewards for completing each step! 🎁",
    delay: 3000
  },
  {
    id: 'screen-share',
    content: "Ready to begin? Click 'Start Tutorial' and I'll guide you through each step!",
    delay: 3000
  }
];

const NEXT_TUTORIAL_PREVIEW = {
  title: "🚀 Coming Up Next: USDC & DeFi",
  description: "Learn how to use stablecoins, swap tokens on Uniswap, and more!",
  comingSoon: true
};

export const MetaMaskTutorial = ({
  videoStream,
  onRequestScreenShare
}: {
  videoStream: MediaStream | null;
  onRequestScreenShare: () => void;
}) => {
  const [account, setAccount] = useState<string>('');
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [steps, setSteps] = useState<Step[]>(STEPS);
  const [isAITyping, setIsAITyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioQueue = useRef<string[]>([]);
  const isSpeaking = useRef(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showingIntro, setShowingIntro] = useState(true);
  const [introIndex, setIntroIndex] = useState(0);
  const [showNextPreview, setShowNextPreview] = useState(false);
  const [isScreenShared, setIsScreenShared] = useState(false);
  const [showMicPrompt, setShowMicPrompt] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);

  const speak = async (text: string) => {
    try {
      const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_GOOGLE_API_KEY}`,
        },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'en-US', name: 'en-US-Neural2-D' },
          audioConfig: { audioEncoding: 'MP3' },
        }),
      });

      const { audioContent } = await response.json();
      if (!audioContext.current) {
        audioContext.current = new AudioContext();
      }

      const audioBuffer = await audioContext.current.decodeAudioData(
        Uint8Array.from(atob(audioContent), c => c.charCodeAt(0)).buffer
      );

      const source = audioContext.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.current.destination);
      source.start(0);

      return new Promise((resolve) => {
        source.onended = resolve;
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const addMessage = async (message: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, {
      ...message,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }]);

    if (message.type === 'ai') {
      await speak(message.content);
    }
  };

  const simulateAITyping = async (message: string) => {
    setIsAITyping(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    await addMessage({ type: 'ai', content: message });
    setIsAITyping(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      addMessage({ type: 'system', content: 'Wallet connected successfully!' });
      simulateAITyping(STEPS[2].aiPrompt);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      addMessage({ type: 'system', content: 'Error connecting wallet. Please try again.' });
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

      addMessage({ type: 'system', content: 'Sending reward...' });

      const tx = await signer.sendTransaction({
        to: account,
        value: ethers.parseEther('0.00000001'),
        gasLimit: 21000,
      });

      addMessage({
        type: 'system',
        content: `🎉 Transaction sent: ${tx.hash}`
      });

      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        setSteps(prevSteps =>
          prevSteps.map(step =>
            step.id === stepId ? { ...step, completed: true } : step
          )
        );
        addMessage({
          type: 'system',
          content: `✨ View on Basescan: https://sepolia.basescan.org/tx/${tx.hash}`
        });
        simulateAITyping("Congratulations! You've completed all the steps. You're now ready to explore Web3!");
      }
    } catch (error: any) {
      console.error('Error sending reward:', error);
      addMessage({ type: 'system', content: `Error: ${error.message || 'Could not send reward'}` });
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      setSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === 1 ? { ...step, completed: true } : step
        )
      );
      simulateAITyping(STEPS[1].aiPrompt);
    } else {
      simulateAITyping(STEPS[0].aiPrompt);
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

  const playIntroSequence = async () => {
    for (let i = 0; i < INTRO_SEQUENCE.length; i++) {
      setIntroIndex(i);
      await new Promise(resolve => setTimeout(resolve, INTRO_SEQUENCE[i].delay));
      await speak(INTRO_SEQUENCE[i].content);
      if (i === INTRO_SEQUENCE.length - 1) {
        setShowNextButton(true);
      }
    }
    setShowingIntro(false);
    onRequestScreenShare();
  };

  const handleStepCompletion = async (stepId: number) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId ? { ...step, completed: true } : step
      )
    );

    if (stepId === 4) {
      await simulateAITyping("🎉 Amazing job! You've completed your first Web3 tutorial!");
      await simulateAITyping("You've earned test ETH rewards and learned the basics of crypto wallets.");
      setShowNextPreview(true);
    } else {
      await simulateAITyping(STEPS[stepId].aiPrompt);
    }
  };

  const startTutorial = async () => {
    setIsStarted(true);
    await playIntroSequence();
  };

  const handleScreenShareComplete = () => {
    setIsScreenShared(true);
    setIsStarted(true);
    if (videoStream) {
      videoStream.getTracks().forEach(track => {
        if (track.kind === 'audio') {
          track.enabled = false;
        }
      });
    }
  };

  if (!isStarted) {
    return (
      <div className="landing-page">
        <div className="incoming-call">
          <div className="ring-animation">
            <div className="avatar-container">
              <img
                src="/unnormie-avatar.png"
                alt="UnNormie Avatar"
                className="avatar-image"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%235865f2'/%3E%3Ctext x='50%25' y='50%25' font-size='48' fill='white' text-anchor='middle' dy='.3em'%3E👋%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
            <div className="emoji-ring">
              {['🦊', '💰', '🎮', '🔒', '🌟', '🚀', '💎', '🎁'].map((emoji, i) => (
                <div
                  key={i}
                  className="ring-emoji"
                  style={{
                    transform: `rotate(${i * 45}deg) translateX(80px) rotate(-${i * 45}deg)`
                  }}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>
          {!showingIntro ? (
            <div className="intro-message">
              <button
                className="share-screen-button"
                onClick={() => {
                  onRequestScreenShare();
                  handleScreenShareComplete();
                }}
              >
                Start Tutorial
              </button>
            </div>
          ) : (
            <div className="intro-message">
              <p className="intro-text">{INTRO_SEQUENCE[introIndex].content}</p>
              {introIndex === 0 && (
                <button
                  className="accept-call"
                  onClick={() => {
                    setShowMicPrompt(false);
                    playIntroSequence();
                  }}
                >
                  Accept Call
                </button>
              )}
              {showNextButton && (
                <button
                  className="next-button"
                  onClick={() => {
                    setShowingIntro(false);
                  }}
                >
                  Next →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="tutorial-container">
      <div className="main-content">
        <div className="screen-preview">
          {videoStream && isScreenShared ? (
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
          ) : (
            <div className="screen-share-prompt">
              <div className="prompt-content">
                <h2>One Last Step!</h2>
                <p>Share your screen with me so I can guide you through the setup.</p>
                <div className="instructions">
                  <p>Here's how to share your screen:</p>
                  <ol>
                    <li>Click the "Share Screen" button below</li>
                    <li>Select the browser tab or window you want to share</li>
                    <li>Make sure "Share audio" is unchecked</li>
                    <li>Click "Share" to begin</li>
                  </ol>
                </div>
                <button
                  onClick={() => {
                    onRequestScreenShare();
                    handleScreenShareComplete();
                  }}
                  className="share-screen-button"
                >
                  <span className="icon">📺</span>
                  Share Screen
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="current-step">
          <div className="step-content">
            {currentStep < steps.length ? (
              <>
                <h2>{steps[currentStep].title}</h2>
                <p>{steps[currentStep].description}</p>
                {!steps[currentStep].completed && (
                  <>
                    {currentStep === 1 && !account && (
                      <button onClick={connectWallet} className="action-button">
                        Connect Wallet
                      </button>
                    )}
                    {currentStep === 3 && account && (
                      <button onClick={() => sendReward(currentStep)} className="action-button">
                        Get Test ETH
                      </button>
                    )}
                  </>
                )}
              </>
            ) : showNextPreview && (
              <div className="next-preview">
                <h2>{NEXT_TUTORIAL_PREVIEW.title}</h2>
                <p>{NEXT_TUTORIAL_PREVIEW.description}</p>
                <button className="preview-button" disabled>
                  Coming Soon!
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="steps-panel">
        <div className="panel-header">
          <h2>Your Progress</h2>
          <p>Let's get you started with Web3!</p>
        </div>
        <div className="steps-container">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`tutorial-step ${step.completed ? 'completed' : ''}`}
            >
              <div className="step-header">
                <h3>{step.title}</h3>
                {step.completed ? (
                  <span className="checkmark">✅</span>
                ) : (
                  <span className="step-number">{step.id}</span>
                )}
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
                      Get Test ETH
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