# 💧 Glass & Water: Navidrome Music Player

A fluid, minimalist, and visually stunning web-based music player for Subsonic/Navidrome servers. It features real-time, audio-reactive water particle visualizers, glassmorphic styling, keyboard hotkeys, custom backgrounds, and a draggable playback widget.

_This work use the help of AI studio and GEMINI 3.5 collaborate with human review._

---

## ✨ Key Features

- **🌊 Audio-Reactive Water Particle Backdrop**: High-fidelity HTML5 Canvas particle system that dances dynamically in response to your music stream using the Web Audio API (`AnalyserNode`).
- **🎛️ Dynamic Synchronization**: Fetches a fast, lightweight list of 28 random songs from your server at launch. When the queue finishes playing, it automatically synchronizes and loads a new batch of 28 tracks.
- **🔍 Full Library Search**: Instantly look up tracks, albums, or artists directly on your Navidrome server.
- **🧘 Zen Mode**: Press `H` to toggle Zen Mode—hiding all HUD elements and controls to leave only the glowing water droplets and a minimal center track visualizer.
- **🖲️ Draggable Now-Playing Widget**: A persistent, glassmorphic time and track widget you can drag anywhere on the screen.
- **⌨️ Keyboard Shortcuts**: Fully loaded hotkey system for seamless, mouse-free playback control.
- **🐳 Docker Ready**: Dockerized setup supporting clean volume persistence for configurations and custom backgrounds.

---

## ⌨️ Keyboard Shortcuts

| Key             | Action                     |
| --------------- | -------------------------- |
| **Space**       | Play / Pause               |
| **Arrow Left**  | Seek backward 5 seconds    |
| **Arrow Right** | Seek forward 5 seconds     |
| **Arrow Up**    | Volume up (5% steps)       |
| **Arrow Down**  | Volume down (5% steps)     |
| **M**           | Mute / Unmute              |
| **S**           | Toggle Shuffle             |
| **R**           | Toggle Repeat One          |
| **H**           | Toggle Zen Mode (Hide HUD) |

---

## 🏗️ Refactored Architecture

The client application follows a clean, modular React hooks-based architecture:

- **[src/App.tsx](file:///src/App.tsx)**: Main layout shell.
- **[src/hooks/useAudioPlayer.ts](file:///src/hooks/useAudioPlayer.ts)**: Handles playback control, queue manipulation, shortcuts, and AudioContext analysis.
- **[src/hooks/useNavidrome.ts](file:///src/hooks/useNavidrome.ts)**: Manages API communication and configurations with the backend.
- **[src/components/](file:///src/components)**: Separated UI panels (Library, Search, Immersive Displays, Settings, Controllers).

---

## 🚀 Running Locally

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

Open `http://localhost:3000` in your web browser, click the **SERVER** tab (or Settings), and enter your Navidrome credentials to sync.

### 3. Lint / Build

```bash
# Check for compiler errors
npm run lint

# Build production assets and node bundle
npm run build
```

---

## 🐳 Docker Deployment

You can build and deploy this application using the provided Dockerfile and Docker Compose setup.

### Run with Docker Compose

1. Ensure your existing Navidrome container network name matches `navidrome_default` in `docker-compose.yml`.
2. Spin up the containers:
   ```bash
   docker compose up -d --build
   ```
3. Open `http://<your-server-ip>:3000` in your browser.
4. Input your Server URL in the configuration modal. If Navidrome is in the same Docker network, you can use its container name directly: `http://navidrome:4533`.
5. Set your background folder in the settings UI to `/app/backgrounds`.

---

## 🔒 Security & Git Practices

- **`server_config.json`**: This file contains your plaintext Navidrome credentials and is automatically ignored by Git inside `.gitignore`.
- **Background Images**: Any images you add to the `backgrounds/` folder for custom styling will not be uploaded to GitHub, protecting your server disk space and privacy. Only the `readme.txt` placeholder is tracked.
