# Un-Normie-inator

Welcome to **Un-Normie-inator** (Doofenshmirtz moment), a React-based interactive tutorial that guides beginners through setting up their first crypto wallet using MetaMask. Learn, practice, and earn test ETH in a safe, step-by-step environment!

<div>
    <a href="https://www.loom.com/share/3bed507945a84b3d82a554dd6499765d">
      <p>Un-Normie-inator - Watch Video</p>
    </a>
    <a href="https://www.loom.com/share/3bed507945a84b3d82a554dd6499765d">
      <img style="max-width:300px;" src="https://cdn.loom.com/sessions/thumbnails/3bed507945a84b3d82a554dd6499765d-aec075d46460dd48-full-play.gif">
    </a>
  </div>

## Overview

UnNormify leverages live screen sharing and real-time messaging to provide an engaging and comprehensive MetaMask setup experience. The tutorial walks the user through key steps—installing MetaMask, creating a secure wallet, connecting to a test network, and claiming practice ETH—using clear instructions and actionable prompts.

Features include:

- **Interactive Tutorial:** Real-time guidance using step-based instructions ([MetaMaskTutorial.tsx](src/components/metamask-tutorial/MetaMaskTutorial.tsx)).
- **Live API Integration:** Utilizes the [LiveAPIContext](src/contexts/LiveAPIContext.tsx) for dynamic messaging and tool calls.
- **Responsive UI:** Styled with SCSS and subtle animations ([metamask-tutorial.scss](src/components/metamask-tutorial/metamask-tutorial.scss)) for an engaging user experience.
- **Blockchain Education:** Designed for crypto beginners to safely learn about wallets and test networks.

## Installation

To get started, clone the repository and install the dependencies:

```sh
npm install
```

Then run the application in development mode:

```sh
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

## Project Structure

- **public/**
  Files such as `index.html` and `robots.txt` for static assets.

- **src/**
  - `App.tsx`: Main application component.
  - `App.scss`: Global styles.
  - **components/**
    - **metamask-tutorial/**
      - `MetaMaskTutorial.tsx`: Contains the MetaMask tutorial components.
      - `metamask-tutorial.scss`: Styles for the tutorial.
    - Other UI components (e.g., logger, side-panel).
  - **contexts/**
    - `LiveAPIContext.tsx`: Provides live API functions used in the tutorial.
  - **hooks/**
    - `use-live-api.ts`: Custom hook to interact with the live API.

## Usage

Un-Normie-inator is intended for developers and educators looking to enhance Web3 onboarding:

- **Beginners:** Offers a clear, guided walkthrough of MetaMask installation and initial setup.
- **Developers:** Use the project as a reference for integrating live API services into Web3 applications.
- **Educators:** Demonstrates a live, interactive teaching method to simplify blockchain concepts.

## Contributing

Contributions are welcome! Please review our `CONTRIBUTING.md` for guidelines on how to get started.

## License

This project is licensed under the Apache License 2.0. See the LICENSE file for details.
