# WebOS

WebOS is a premium, browser-based operating system designed with a fusion of Windows 11 layouts, macOS smoothness, and Arc Browser aesthetics. It features a cinematic, high-fidelity glassmorphism interface built for speed and professional workflows.

## ✨ Features

- **Window Management**: Draggable, resizable, and focus-aware windows with smooth spring physics.
- **Normalized Filesystem**: A scalable, flat hierarchy supporting nested folders and inline renaming.
- **Glassmorphism UI**: High-fidelity backdrop blurs, vibrant accent colors, and modern typography.
- **Persistence Layer**: All files and window states are persisted locally via IndexedDB (Dexie.js).
- **Context System**: Desktop-wide and folder-specific context menus for intuitive interaction.

## 🛠 Technology Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript (Strict)
- **Styling**: Tailwind CSS + Framer Motion (for cinematic animations)
- **State Management**: Zustand
- **Interactions**: interact.js (Window manipulation)
- **Database**: Dexie.js (IndexedDB wrapper)
- **Terminal**: xterm.js (Future integration)

## 📁 Project Architecture

The project follows a strictly modular architecture to ensure scalability and maintainability:

```text
src/
 ├── apps/        # Individual application implementations
 ├── components/  # Reusable UI components (Window, Desktop, Taskbar)
 ├── core/        # System-level core logic
 ├── store/       # Zustand state definitions (Filesystem, Windows)
 ├── hooks/       # Custom React hooks (Persistence, Focus)
 ├── services/    # External service integrations (Dexie DB)
 ├── utils/       # Utility functions and helpers
 └── types/       # Global TypeScript definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js (Latest LTS)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Install dependencies:
   ```bash
   cd client
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## ⚖️ Design Philosophy

- **Premium**: Every interaction should feel cinematic and high-end.
- **Consistency**: Unified glassmorphism tokens across all components.
- **Composition over Inheritance**: Modular, reusable component design.
- **Performance First**: Optimized z-index and focus management to minimize re-renders.

---
Built with 💙 by the WebOS Team.
