import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { useEffect, useState, useRef, memo } from "react";
import { ethers } from "ethers";
import "./metamask-tutorial.scss";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { ToolCall } from "../../multimodal-live-types";

interface Message {
  id: string;
  type: "ai" | "system" | "user";
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
    id: "1",
    type: "system",
    content: "Welcome to UnNormie! Your Web3 guide is connecting...",
    timestamp: new Date(),
  },
];

const STEPS: Step[] = [
  {
    id: 1,
    title: "🦊 Install MetaMask",
    description:
      "First step into Web3 - I'll help you get the right wallet extension",
    completed: false,
    aiPrompt:
      "I notice you don't have MetaMask installed yet - that's perfectly fine! Would you like me to guide you to the official MetaMask website? I'll make sure you download it from the right place.",
  },
  {
    id: 2,
    title: "🔐 Create Your Wallet",
    description:
      "I'll guide you through setting up your wallet safely and securely",
    completed: false,
    aiPrompt:
      "Great progress! Now comes an important step - creating your wallet. I'll help you understand each part, especially the secret recovery phrase. Think of it like the master key to your digital vault!",
  },
  {
    id: 3,
    title: "🌐 Connect to Test Network",
    description:
      "We'll use Base Sepolia - a safe space to learn without real money",
    completed: false,
    aiPrompt:
      "Perfect! Let's connect to Base Sepolia - it's like a practice arena where you can learn without risking real money. I'll help you set it up!",
  },
  {
    id: 4,
    title: "🎁 Get Practice ETH",
    description: "I'll help you get some test ETH to practice with",
    completed: false,
    aiPrompt:
      "You're doing fantastic! Let's get you some test ETH to play with. Don't worry - it's not real money, but it works just like the real thing for learning!",
  },
];

const INTRO_SEQUENCE = [
  {
    id: "welcome",
    content: "👋 Ring ring! Your friendly crypto guide is calling!",
    delay: 0,
  },
  {
    id: "intro",
    content:
      "Hi! I'm UnNormie, your personal guide to the world of Web3! I'm here to help you get started with crypto in a fun, pressure-free way.",
    delay: 3000,
  },
  {
    id: "purpose",
    content:
      "Don't worry about real money - we'll practice with test ETH on Base Sepolia. You'll even earn some test ETH rewards for completing each step! 🎁",
    delay: 3000,
  },
  {
    id: "screen-share",
    content:
      "Ready to begin? Click 'Start Tutorial' and I'll guide you through each step!",
    delay: 3000,
  },
  {
    id: "control-panel",
    content:
      "Before we start, you'll need to share your screen. Let me show you how:",
    delay: 3000,
  },
  {
    id: "control-instructions",
    content:
      "Look at the control panel below - you'll see a Play button and a Share Screen button. Click them in that order to begin!",
    delay: 2000,
  },
];

const NEXT_TUTORIAL_PREVIEW = {
  title: "🚀 Coming Up Next: USDC & DeFi",
  description:
    "Learn how to use stablecoins, swap tokens on Uniswap, and more!",
  comingSoon: true,
};

const declaration: FunctionDeclaration = {
  name: "guide_metamask_setup",
  description:
    "Provides real-time guidance for MetaMask wallet setup based on screen content.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      guidance: {
        type: SchemaType.STRING,
        description: "The guidance message to display to the user",
      },
      action_required: {
        type: SchemaType.BOOLEAN,
        description: "Whether user action is required",
      },
      next_step: {
        type: SchemaType.STRING,
        description: "The next step in the tutorial process",
      },
    },
    required: ["guidance"],
  },
};

const SYSTEM_PROMPT = `You are UnNormie, the ultimate Web3 sherpa, here to guide mere mortals through the blockchain rabbit hole. Your vibe? Smug, but in a way that makes people want to listen. You know what you're talking about, and you're not afraid to flex a little.

Personality Traits:
🔥 Communication Style:

Talk like someone who made it, but still has time for the little guys.
Break down complex concepts like you're explaining it to a 5-year-old (or a TradFi boomer).
Always be hyped—because Web3 is the future, and you’re in on it.
💡 Teaching Approach:

Security first—because getting rugged is for normies.
Explain the WHY behind each move—no blind trust, we’re here to mint critical thinkers.
Celebrate wins—even setting up MetaMask deserves a "let’s gooo."
Make it real—use analogies normies can grasp (think "your wallet is your bank account, but without the annoying fees and gatekeepers").
⚡ Key Behaviors:

Live screen monitoring—you see what they see, and you guide them like a crypto oracle.
Direct clicks—"See that tiny ‘Connect’ button? Yeah, that’s where the magic starts."
Pitfall warnings—"Pause. That looks like a phishing site. Don’t be that guy."
Eternal hype & support—every step forward is closer to being UnNormie.
The Tutorial Flow (a.k.a. The Crypto Glow-Up):
1️⃣ MetaMask Install – "Step one of degen enlightenment. Let’s get that wallet set up."
2️⃣ Wallet Security 101 – "If you lose your seed phrase, you might as well delete your account. No, seriously."
3️⃣ Base Sepolia Testnet – "Welcome to the playground. Time to get some fake ETH and start cooking."
4️⃣ Claiming Test ETH – "Free money (kinda). You’re now playing the game."

Remember:
You see everything on their screen. You’re their crypto big bro, making sure they don’t trip. You’re smug, but only because you know they’re about to level up. And when they do? "Welcome to the future, anon.`;

interface MetaMaskTutorialProps {
  videoStream: MediaStream | null;
}

const MetaMaskTutorialComponent = ({ videoStream }: MetaMaskTutorialProps) => {
  const [account, setAccount] = useState<string>("");
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
  const { client, setConfig } = useLiveAPIContext();

  useEffect(() => {
    setConfig({
      model: "models/gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: "audio",
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
        },
      },
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      tools: [{ googleSearch: {} }, { functionDeclarations: [declaration] }],
    });
  }, [setConfig]);

  useEffect(() => {
    const onToolCall = (toolCall: ToolCall) => {
      console.log(`got toolcall`, toolCall);
      const fc = toolCall.functionCalls.find(
        (fc) => fc.name === declaration.name
      );
      if (fc) {
        const args = fc.args as any;
        addMessage({ type: "ai", content: args.guidance });
        if (args.action_required) {
          setCanProceed(false);
        }
        if (args.next_step) {
          setCurrentStep((prev) => prev + 1);
        }
      }
      if (toolCall.functionCalls.length) {
        setTimeout(
          () =>
            client.sendToolResponse({
              functionResponses: toolCall.functionCalls.map((fc) => ({
                response: { output: { success: true } },
                id: fc.id,
              })),
            }),
          200
        );
      }
    };
    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client]);

  const speak = async (text: string) => {
    try {
      const response = await fetch(
        "https://texttospeech.googleapis.com/v1/text:synthesize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_GOOGLE_API_KEY}`,
          },
          body: JSON.stringify({
            input: { text },
            voice: { languageCode: "en-US", name: "en-US-Neural2-D" },
            audioConfig: {
              audioEncoding: "MP3",
              speakingRate: 1.3, // Speed up the speech
              pitch: 1.2, // Slightly higher pitch to maintain clarity
            },
          }),
        }
      );

      const { audioContent } = await response.json();
      if (!audioContext.current) {
        audioContext.current = new AudioContext();
      }

      const audioBuffer = await audioContext.current.decodeAudioData(
        Uint8Array.from(atob(audioContent), (c) => c.charCodeAt(0)).buffer
      );

      const source = audioContext.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.current.destination);
      source.start(0);

      return new Promise((resolve) => {
        source.onended = resolve;
      });
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const addMessage = async (message: Omit<Message, "id" | "timestamp">) => {
    setMessages((prev) => [
      ...prev,
      {
        ...message,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
      },
    ]);

    if (message.type === "ai") {
      await speak(message.content);
    }
  };

  const simulateAITyping = async (message: string) => {
    setIsAITyping(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await addMessage({ type: "ai", content: message });
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
        throw new Error("MetaMask is not installed!");
      }

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x14A34" }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x14A34",
                chainName: "Base Sepolia",
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://sepolia.base.org"],
                blockExplorerUrls: ["https://sepolia.basescan.org"],
              },
            ],
          });
        }
      }

      setSteps((prevSteps) =>
        prevSteps.map((step) =>
          step.id === 2 ? { ...step, completed: true } : step
        )
      );

      addMessage({ type: "system", content: "Wallet connected successfully!" });
      simulateAITyping(STEPS[2].aiPrompt);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      addMessage({
        type: "system",
        content: "Error connecting wallet. Please try again.",
      });
    }
  };

  const sendReward = async (stepId: number) => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed!");
      }

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();

      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(0x14a34)) {
        throw new Error("Please switch to Base Sepolia network");
      }

      addMessage({ type: "system", content: "Sending reward..." });

      const tx = await signer.sendTransaction({
        to: account,
        value: ethers.parseEther("0.00000001"),
        gasLimit: 21000,
      });

      addMessage({
        type: "system",
        content: `🎉 Transaction sent: ${tx.hash}`,
      });

      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        setSteps((prevSteps) =>
          prevSteps.map((step) =>
            step.id === stepId ? { ...step, completed: true } : step
          )
        );
        addMessage({
          type: "system",
          content: `✨ View on Basescan: https://sepolia.basescan.org/tx/${tx.hash}`,
        });
        simulateAITyping(
          "Congratulations! You've completed all the steps. You're now ready to explore Web3!"
        );
      }
    } catch (error: any) {
      console.error("Error sending reward:", error);
      addMessage({
        type: "system",
        content: `Error: ${error.message || "Could not send reward"}`,
      });
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      setSteps((prevSteps) =>
        prevSteps.map((step) =>
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
      setAccount(accounts[0] || "");
    };

    const ethereum = window.ethereum;
    (ethereum as any).on("accountsChanged", handleAccountsChanged);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  const playIntroSequence = async () => {
    for (let i = 0; i < INTRO_SEQUENCE.length; i++) {
      setIntroIndex(i);
      await new Promise((resolve) =>
        setTimeout(resolve, INTRO_SEQUENCE[i].delay)
      );
      await speak(INTRO_SEQUENCE[i].content);
      if (i === INTRO_SEQUENCE.length - 1) {
        setShowNextButton(true);
      }
    }
    setShowingIntro(false);
  };

  const handleStepCompletion = async (stepId: number) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === stepId ? { ...step, completed: true } : step
      )
    );

    if (stepId === 4) {
      await simulateAITyping(
        "🎉 Amazing job! You've completed your first Web3 tutorial!"
      );
      await simulateAITyping(
        "You've earned test ETH rewards and learned the basics of crypto wallets."
      );
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
  };

  if (!isStarted) {
    return (
      <div className="landing-page">
        <div className="incoming-call">
          <div className="ring-animation">
            <div className="avatar-container">
              <img
                src="/unnormie-pepe.png"
                alt="UnNormie Avatar"
                className="avatar-image"
                onError={(e) => {
                  e.currentTarget.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%235865f2'/%3E%3Ctext x='50%25' y='50%25' font-size='48' fill='white' text-anchor='middle' dy='.3em'%3E👋%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
            <div className="emoji-ring">
              {["🦊", "💰", "🎮", "🔒", "🌟", "🚀", "💎", "🎁"].map(
                (emoji, i) => (
                  <div
                    key={i}
                    className="ring-emoji"
                    style={{
                      transform: `rotate(${
                        i * 45
                      }deg) translateX(80px) rotate(-${i * 45}deg)`,
                    }}
                  >
                    {emoji}
                  </div>
                )
              )}
            </div>
          </div>
          {!showingIntro ? (
            <div className="intro-message">
              <button
                className="accept-call"
                onClick={() => {
                  setIsStarted(true);
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
          {videoStream ? (
            <div className="video-container">
              <video
                autoPlay
                playsInline
                muted
                ref={(video) => {
                  if (video && videoStream && video.srcObject !== videoStream) {
                    video.srcObject = videoStream;
                  }
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  backfaceVisibility: "hidden",
                  transform: "translate3d(0,0,0)",
                }}
              />
            </div>
          ) : (
            <div className="screen-share-prompt">
              <div className="prompt-content">
                <h2>Let's Get Started!</h2>
                <p>
                  I'll need to see your screen to guide you through the
                  tutorial.
                </p>
                <div className="instructions">
                  <p>Complete these steps to begin:</p>
                  <ol>
                    <li className="step-primary">
                      1. Find the control panel at the bottom ⬇️
                    </li>
                    <li className="step-primary">
                      2. Click the Play button ▶️
                    </li>
                    <li className="step-primary">
                      3. Click the Share Screen button 🖥️
                    </li>
                    <li>4. Choose your browser window</li>
                    <li>5. Uncheck "Share audio"</li>
                    <li>6. Click "Share" to start</li>
                  </ol>
                </div>
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
                      <button
                        onClick={() => sendReward(currentStep)}
                        className="action-button"
                      >
                        Get Test ETH
                      </button>
                    )}
                  </>
                )}
              </>
            ) : (
              showNextPreview && (
                <div className="next-preview">
                  <h2>{NEXT_TUTORIAL_PREVIEW.title}</h2>
                  <p>{NEXT_TUTORIAL_PREVIEW.description}</p>
                  <button className="preview-button" disabled>
                    Coming Soon!
                  </button>
                </div>
              )
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
              className={`tutorial-step ${step.completed ? "completed" : ""}`}
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
                    <button
                      onClick={() => sendReward(step.id)}
                      className="action-button"
                    >
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

export const MetaMaskTutorial = memo(MetaMaskTutorialComponent);
