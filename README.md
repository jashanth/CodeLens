# CodeLens

> **Smarter Code Reviews for Modern Developers.**
> 🏆 **1st Place Winner** - KG Reddy College of Engineering and Technology Hackathon (Feb 2026)


## 💡 The Vision
**"Why not just paste code into ChatGPT?"**

Because developers don't need a jack-of-all-trades chatbot; they need a specialized scalpel. CodeLens is an AI-driven, zero-friction code auditing environment. Instead of a generic chat window, we engineered an integrated tool that acts like a strict senior engineer doing a ruthless code review. 

CodeLens doesn't just fix typos—it actively scans for vulnerabilities, grades logic flaws, and tracks algorithmic bottlenecks. 

## ✨ Key Features
* 🧠 **Deep AI Auditing:** Analyzes code for logic, security, and performance issues using Groq's high-speed LPU inference.
* ⚡ **Algorithmic Metrics:** Automatically calculates real-time Time & Space complexity shifts (e.g., tracking an optimization from `O(N^2)` to `O(N)`) and generates a definitive 0-100 Health Score.
* 💻 **Integrated Execution:** A built-in, VS Code-style simulated terminal allows you to execute code instantly in the browser without leaving the environment.
* 📄 **Enterprise-Ready Reports:** One-click export takes the AI's analysis and formats it into a clean, professional PDF audit document for clients or managers.
* 🎨 **Premium IDE Experience:** Features automatic language detection, real-time syntax highlighting, custom WebGL light rays, and meticulously synchronized caret tracking.

## 🛠️ Tech Stack
**Frontend & UI**
* [Next.js (React)](https://nextjs.org/) - Core framework
* [TypeScript](https://www.typescriptlang.org/) - Type safety
* [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
* [OGL (WebGL)](https://github.com/oframe/ogl) - High-performance dynamic background rendering
* [Framer Motion](https://www.framer.com/motion/) - Smooth micro-interactions and layout animations

**Backend & AI**
* [Groq API](https://groq.com/) - Blazing fast AI inference running the `llama-3.3-70b-versatile` model.

**Utilities**
* `jsPDF` - Client-side PDF generation
* `react-syntax-highlighter` - Native browser code parsing
* `react-markdown` - Dynamic text formatting

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js installed, and grab a free API key from [Groq Console](https://console.groq.com/).

### Installation
just clone the repo and replace API key and hit "npm run dev", visit the local host.
