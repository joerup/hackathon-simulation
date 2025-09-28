# LinkedOut – BlockArena

LinkedOut – BlockArena is a tongue‑in‑cheek hackathon simulation of the modern job hunt. Add student avatars backed by resume‑derived attributes, watch them mingle with recruiters on a grid, and see who lands offers. With Qualcomm Imagine API LLM integration, resumes can be analyzed into gameplay stats and agents can hold short, realistic networking chats.

## Application Description

- Simulation game rendered in an Electron app (HTML/CSS/JS).
- Students and recruiters move on a 10×10 grid, meet, and converse.
- Resume uploads (or samples) generate stats that influence outcomes.
- Qualcomm Imagine API LLM integration powers resume parsing and chat.

## Team (Eligible Individuals)

- Hao Teng - hteng@princeton.edu
- Joseph Rupertus - joerup@princeton.edu
- Christina Nikolova - cn8979@princeton.edu
- Jorrel Rajan - jorrel@princeton.edu

## Prerequisites

- Node.js 18+ and npm
- OS: Windows, macOS, or Linux
- Qualcomm Imagine API credentials via Cirrascale for LLM features

## Setup (From Scratch)

1) Clone the repository

```bash
git clone https://github.com/joerup/hackathon-simulation.git
cd hackathon-simulation
```

2) Install dependencies

```bash
npm install
```

3) Configure environment (optional but recommended for LLM features)

Create a file named `.env` in the project root with:

```env
SNAPDRAGON_API_KEY=your_api_key_here
SNAPDRAGON_API_URL=https://aisuite.cirrascale.com/apis/v2/chat/completions
SNAPDRAGON_MODEL=Llama-3.1-8B
```

Notes:

- Do not commit your real API key (`.env` is gitignored).
- The `.env` file is automatically loaded in both development and production builds.
- Without an API key: resume stats will fall back to placeholders; LLM conversations may be disabled.

## Run & Usage

Run locally (launches Electron):

```bash
npm start
```

In the app:

- Header: click "Add Student" to add a new avatar.
  - Choose "Upload Resume" (PDF/DOCX/TXT) or pick a sample resume.
  - With a valid API key, resumes are analyzed by the Snapdragon LLM.
  - Without a key, placeholder stats are used.
- Simulation: starts automatically. Agents walk the grid, meet, and (with LLM enabled) exchange brief messages shown as chat bubbles.
- Left sidebar: Student list with key stats; collapsible.
- Right sidebar: Live leaderboard of distance traveled and activity; collapsible.
- Speed control: Adjusts simulation tick speed.

## Dependencies

- Dev/runtime shell: Electron (via `npm start`)
- In‑app: PDF.js via CDN for PDF parsing

## Building

The application includes convenient npm scripts for building on different platforms. All builds automatically include the sample resume files and environment configuration.

### Quick Build Commands

```bash
# Build for macOS (Apple Silicon)
npm run build:mac

# Build for macOS (Intel)
npm run build:mac-intel

# Build for Windows (ARM64)
npm run build:win

# Build for Windows (Intel)
npm run build:win-intel

# Build for Linux
npm run build:linux

# Build for all platforms
npm run build:all
```

### Manual Build Commands

You can also use Electron Packager directly with custom options:

```bash
# macOS (Apple Silicon)
npx @electron/packager . LinkedOut --platform=darwin --arch=arm64 --out=dist --overwrite --extra-resource=sample-resumes

# Windows (ARM64)
npx @electron/packager . LinkedOut --platform=win32 --arch=arm64 --out=dist --overwrite --extra-resource=sample-resumes
```

### Build Features

- **Sample Resumes**: Automatically included via `--extra-resource=sample-resumes`
- **Environment Variables**: `.env` file is loaded in both development and production builds
- **Cross-Platform**: Builds work on macOS, Windows, and Linux

### Additional Build Options

You can extend the build commands with these optional flags:

- `--icon=assets/icon` - Add a custom icon
- `--app-bundle-id=com.linkedout.blockarena` - Set bundle identifier
- `--app-version=1.0.0` - Set application version
- `--build-version=1.0.0` - Set build version
- `--asar` - Package app in asar archive
- `--prune` - Remove devDependencies

Example with additional options:

```bash
npx @electron/packager . LinkedOut --platform=darwin --arch=arm64 --out=dist --overwrite --extra-resource=sample-resumes --asar --prune --app-version=1.0.0
```

---

## How It Works

### Code Overview

- **Electron entry**: `main.js` loads `.env` file and opens `index.html`
- **App bootstrap**: `src/app.js` wires the header, grid, and sidebars
- **Game state**: `src/gameState.js` manages grid cells, agents, movement, and conversations; `src/conversationState.js` tracks conversation state
- **Rendering**: `src/gridRenderer.js` draws the grid and agents with responsive sizing and chat bubble placement
- **Generators**: `src/generators/agentStats.js`, `agentAppearance.js`, `obstacles.js` create agent attributes and obstacles
- **Logic**: `src/logic/agentMovement.js` and `conversationManager.js` handle movement and meeting rules
- **Services**: `src/services/snapdragonClient.js` (resume → stats), `src/services/conversationService.js` (LLM chat turns)
- **UI components**: `src/ui/header.js`, `modal.js` (Add Student, upload/sample), `studentSidebar.js`, `leaderboardSidebar.js`, `chatBubble.js`, `speedControl.js`
- **Utils**: `src/utils/fileProcessor.js`, `pdfProcessor.js`, `gridUtils.js`, `random.js`, `domUtils.js`

### Environment & Build Features

- **Environment Variables**: Automatically loaded from `.env` file in both development and production
- **Sample Resumes**: 10 sample PDF resumes included in all builds for testing
- **Cross-Platform**: Works on macOS, Windows, and Linux with platform-specific builds
- **LLM Integration**: Snapdragon API integration for resume analysis and conversation generation

## License

This project is licensed under the **GNU General Public License (GPL) 3.0**.
See the [LICENSE](LICENSE) file for details.