'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Code,
  Copy,
  Check,
  Play,
  Zap,
  Search,
  MoreVertical,
  Terminal,
  Loader2,
  Download,
  ShieldCheck,
  AlertTriangle,
  X // 🆕 Added X for closing the terminal
} from 'lucide-react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from "jspdf";

type Message = {
  role: string;
  content: string;
  type?: 'general' | 'analysis' | 'optimization';
  isHidden?: boolean;
  timestamp: string;
};

const getCurrentTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// 🧠 SUPER SMART LANGUAGE DETECTOR
const detectLanguage = (codeString: string) => {
  const code = codeString.toLowerCase();
  
  if (code.includes('using system;') || code.includes('console.writeline') || code.includes('namespace ')) {
    return { name: 'C#', syntax: 'csharp', file: 'Program.cs' };
  } else if (code.includes('std::') || code.includes('#include <iostream>') || code.includes('cout <<') || code.includes('cin >>') || code.includes('using namespace std;')) {
    return { name: 'C++', syntax: 'cpp', file: 'main.cpp' };
  } else if (code.includes('#include <stdio.h>') || code.includes('printf(') || code.includes('malloc(')) {
    return { name: 'C', syntax: 'c', file: 'main.c' };
  } else if (code.includes('section .data') || code.includes('global _start') || (/\bmov\b/.test(code) && /\bpush\b/.test(code)) || code.includes('syscall')) {
    return { name: 'Assembly', syntax: 'x86asm', file: 'program.asm' };
  } else if ((/\bdef\b/.test(code) && !code.includes(':')) || code.includes('puts ') || (/\bdef\b/.test(code) && /\bend\b/.test(code))) {
    return { name: 'Ruby', syntax: 'ruby', file: 'script.rb' };
  } else if (code.includes('public static void main') || code.includes('system.out.print')) {
    return { name: 'Java', syntax: 'java', file: 'Main.java' };
  } else if (code.includes('import react') || code.includes('use client') || code.includes('usestate')) {
    return { name: 'React', syntax: 'tsx', file: 'component.tsx' };
  } else if (code.includes('interface ') || code.includes('type ') || (code.includes('const ') && code.includes(':'))) {
    return { name: 'TypeScript', syntax: 'typescript', file: 'script.ts' };
  } else if ((/\bdef\b/.test(code) && code.includes(':')) || code.includes('print(') || code.includes('import sys') || code.includes('"""')) {
    return { name: 'Python', syntax: 'python', file: 'script.py' };
  } else if (code.includes('const ') || code.includes('let ') || code.includes('console.log') || code.includes('=>') || code.includes('function(')) {
    return { name: 'JavaScript', syntax: 'javascript', file: 'script.js' };
  } else if (code.includes('<html>') || code.includes('<div>') || code.includes('<!doctype html>')) {
    return { name: 'HTML', syntax: 'html', file: 'index.html' };
  }
  return { name: 'Plain Text', syntax: 'text', file: 'snippet.txt' };
};

export default function ChatbotPage() {
  const [code, setCode] = useState(`team_name = "Team Kernel"
team_size = 3
print(f"Built by: {team_name} | Size: {team_size}")
print("Sharper Reviews. Smarter Code.")
`);

  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hello There! I am ready to Analyze or Optimize your code.', type: 'general', timestamp: 'Now' }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // METRICS STATE
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [timeComplexity, setTimeComplexity] = useState<string | null>(null);
  const [spaceComplexity, setSpaceComplexity] = useState<string | null>(null);
  const [oldTimeComplexity, setOldTimeComplexity] = useState<string | null>(null);

  // 🆕 TERMINAL STATE FOR "RUN"
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const lineNumberRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const syntaxRef = useRef<HTMLDivElement>(null); // 🆕 Added to fix scrolling bug
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeLanguage = detectLanguage(code);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  // 🛠️ FIXED: Synchronize scrolling perfectly
  const handleScroll = () => {
    if (textareaRef.current) {
      if (lineNumberRef.current) lineNumberRef.current.scrollTop = textareaRef.current.scrollTop;
      if (syntaxRef.current) {
        syntaxRef.current.scrollTop = textareaRef.current.scrollTop;
        syntaxRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // 🚀 NEW: Simulate Code Execution
  const handleRun = async () => {
    setIsExecuting(true);
    setTerminalOutput('Initializing environment...\nRunning...');
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: `Act strictly as a compiler/interpreter for ${activeLanguage.name}. Execute the following code and return ONLY the raw console output it would produce. If there are compilation or runtime errors, output the exact error message. DO NOT wrap the output in markdown code blocks. DO NOT explain anything. DO NOT converse. ONLY output the raw terminal result:\n\n${code}`, 
            code: code, 
            history: [] // No history needed for pure execution
        }),
      });

      const data = await response.json();
      // Strip out markdown if AI tries to wrap it in ```
      let output = data.response.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
      setTerminalOutput(output || 'Process finished with exit code 0 (No output)');
    } catch (error) {
      setTerminalOutput('Execution failed. Network or server error.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExportPDF = (content: string) => {
    const doc = new jsPDF();
    const pageWidth = 170;
    const margin = 20;
    let y = 45; 

    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185); 
    doc.setFont("helvetica", "bold");
    doc.text("CodeLens Audit Report", margin, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated by CodeLens • ${new Date().toLocaleString()}`, margin, 30);

    if (healthScore !== null) {
       doc.setFontSize(11);
       doc.setTextColor(healthScore >= 80 ? 'green' : 'red');
       doc.text(`Health: ${healthScore}/100`, margin + 110, 25);
       if (timeComplexity) doc.text(`Time: ${oldTimeComplexity ? oldTimeComplexity + ' -> ' : ''}${timeComplexity}`, margin + 110, 30);
    }
    
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(margin, 35, 190, 35);

    const cleanContent = content.replace(/\*\*/g, "").replace(/###/g, "").replace(/`/g, "");   
    const lines = cleanContent.split('\n');

    lines.forEach((line) => {
        doc.setFontSize(11);
        doc.setTextColor(60); 
        doc.setFont("helvetica", "normal");

        const trimmedLine = line.trim();
        const isBullet = trimmedLine.startsWith('*') || trimmedLine.startsWith('-');
        const isHeader = (line.match(/^[A-Z][a-z]+:/) || trimmedLine.endsWith(':')) && trimmedLine.length < 50;

        if (isHeader) {
            y += 5; 
            doc.setTextColor(0, 0, 0); 
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text(trimmedLine, margin, y);
            y += 8; 
        } else if (isBullet) {
            doc.setTextColor(0, 51, 102); 
            const cleanLine = "•  " + trimmedLine.replace(/^[*|-]/, '').trim();
            const splitLines = doc.splitTextToSize(cleanLine, pageWidth);
            doc.text(splitLines, margin, y);
            y += (splitLines.length * 6) + 2; 
        } else {
            if (trimmedLine.length > 0) {
                const splitLines = doc.splitTextToSize(trimmedLine, pageWidth);
                doc.text(splitLines, margin, y);
                y += (splitLines.length * 5) + 2;
            }
        }

        if (y > 270) {
            doc.addPage();
            y = 20; 
        }
    });

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Powered by CodeLens & Team Kernel", margin, 285);
    doc.save("CodeLens-Report.pdf");
  };

  const lineCount = Math.max(code.split('\n').length, 15);

  const callGroqAPI = async (userPrompt: string, messageType: 'general' | 'analysis' | 'optimization' = 'general') => {
    setIsLoading(true);
    
    const newHistory = [...messages];
    let finalPrompt = userPrompt;
    
    if (messageType === 'analysis') {
        setOldTimeComplexity(null); 
        finalPrompt += " Evaluate code quality (0-100), Time Complexity, and Space Complexity. Return them strictly at the very end in this exact format: [SCORE: number] [TIME: O(N)] [SPACE: O(1)].";
    } else if (messageType === 'optimization') {
        finalPrompt += " Optimize this code to the absolute best possible Time and Space Complexity. Return the new code. At the very end, provide the new score, the old time complexity, and the new time complexity in this exact format: [SCORE: number] [OLD_TIME: O(N^2)] [NEW_TIME: O(N)] [NEW_SPACE: O(1)].";
    }

    newHistory.push({ role: 'user', content: userPrompt, type: 'general', isHidden: messageType !== 'general', timestamp: getCurrentTime() });
    setMessages(newHistory);

    try {
      const historyForAI = newHistory.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: finalPrompt, code: code, history: historyForAI }),
      });

      const data = await response.json();
      const aiText = data.response;

      const codeBlockRegex = /```(?:[\w]*\n)?([\s\S]*?)```/;
      const match = aiText.match(codeBlockRegex);

      let chatDisplayMessage = aiText;

      if (match && match[1]) {
        setCode(match[1].trim());
        chatDisplayMessage = aiText.replace(codeBlockRegex, '').trim();
        if (!chatDisplayMessage) chatDisplayMessage = "✅ I have optimized the code to the best possible complexity.";
      }

      const scoreMatch = chatDisplayMessage.match(/\[SCORE:\s*(\d+)\]/i);
      const timeMatch = chatDisplayMessage.match(/\[TIME:\s*(O\([^)]+\))\]/i);
      const spaceMatch = chatDisplayMessage.match(/\[SPACE:\s*(O\([^)]+\))\]/i);
      const oldTimeMatch = chatDisplayMessage.match(/\[OLD_TIME:\s*(O\([^)]+\))\]/i);
      const newTimeMatch = chatDisplayMessage.match(/\[NEW_TIME:\s*(O\([^)]+\))\]/i);
      const newSpaceMatch = chatDisplayMessage.match(/\[NEW_SPACE:\s*(O\([^)]+\))\]/i);
      
      if (scoreMatch) setHealthScore(parseInt(scoreMatch[1]));
      if (timeMatch) setTimeComplexity(timeMatch[1]);
      if (spaceMatch) setSpaceComplexity(spaceMatch[1]);
      
      if (oldTimeMatch) setOldTimeComplexity(oldTimeMatch[1]);
      if (newTimeMatch) setTimeComplexity(newTimeMatch[1]);
      if (newSpaceMatch) setSpaceComplexity(newSpaceMatch[1]);

      chatDisplayMessage = chatDisplayMessage
          .replace(/\[SCORE:\s*\d+\]/gi, '')
          .replace(/\[TIME:\s*O\([^)]+\)\]/gi, '')
          .replace(/\[SPACE:\s*O\([^)]+\)\]/gi, '')
          .replace(/\[OLD_TIME:\s*O\([^)]+\)\]/gi, '')
          .replace(/\[NEW_TIME:\s*O\([^)]+\)\]/gi, '')
          .replace(/\[NEW_SPACE:\s*O\([^)]+\)\]/gi, '')
          .trim();

      setMessages(prev => [...prev, { role: 'ai', content: chatDisplayMessage, type: messageType, timestamp: getCurrentTime() }]);

    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Error connecting to AI.", type: 'general', timestamp: getCurrentTime() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => { if(!input.trim()) return; callGroqAPI(input, 'general'); setInput(''); };
  const handleAnalyze = () => { callGroqAPI(`Analyze this ${activeLanguage.name} code for logic, security, and performance issues. DO NOT rewrite the code.`, 'analysis'); };
  const handleOptimize = () => { callGroqAPI(`Optimize this ${activeLanguage.name} code for better performance and readability. Return the full updated code block.`, 'optimization'); };

  if (!mounted) return null; 

  const getScoreColor = (score: number) => {
      if (score >= 80) return "text-green-400 border-green-500/30 bg-green-500/10";
      if (score >= 50) return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
      return "text-red-400 border-red-500/30 bg-red-500/10";
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-gray-200 font-sans overflow-hidden">
      
      {/* LEFT COLUMN: Code Editor & Terminal */}
      <div className="flex-1 flex flex-col border-r border-white/5 relative min-h-0">
        
        {/* Header */}
        <div className="h-14 flex-none border-b border-white/5 flex items-center justify-between px-6 bg-zinc-900/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors group">
                <Code className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
                <span className="font-medium">{activeLanguage.file}</span>
             </div>

             {healthScore !== null && (
                 <div className="flex items-center gap-2 ml-2 animate-in fade-in zoom-in">
                     <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border ${getScoreColor(healthScore)}`}>
                         {healthScore >= 80 ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                         <span className="text-[11px] font-bold">Score: {healthScore}</span>
                     </div>
                     {timeComplexity && (
                         <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-400">
                             <span className="text-[11px] font-bold font-mono">
                                 ⏱️ {oldTimeComplexity ? `${oldTimeComplexity} ➔ ${timeComplexity}` : timeComplexity}
                             </span>
                         </div>
                     )}
                     {spaceComplexity && (
                         <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                             <span className="text-[11px] font-bold font-mono">💾 {spaceComplexity}</span>
                         </div>
                     )}
                 </div>
             )}
          </div>

          <div className="flex items-center gap-3">
             {/* 🚀 NEW RUN BUTTON */}
             <button 
                onClick={handleRun} 
                disabled={isExecuting} 
                className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-xs font-bold rounded-lg transition-all disabled:opacity-50"
             >
                {isExecuting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />} Run
             </button>

             <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-gray-300 rounded-lg transition-all">
                {isCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />} Copy
             </button>

             <button onClick={handleAnalyze} disabled={isLoading} className="flex items-center gap-2 px-4 py-1.5 bg-blue-600/10 text-blue-400 border border-blue-600/20 text-xs font-bold rounded-lg hover:bg-blue-600/20 transition-all disabled:opacity-50">
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />} Analyze
             </button>

             <button onClick={handleOptimize} disabled={isLoading} className="flex items-center gap-2 px-4 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50">
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 fill-current" />} Optimize
             </button>
          </div>
        </div>

       {/* Editor Area */}
        <div className="flex-1 relative group min-h-0 bg-zinc-900/20 overflow-hidden flex flex-col">
          <div className="flex-1 flex relative overflow-hidden">
            {/* 🛠️ SCROLL FIX: Line numbers now sync with the main scroll area */}
            <div 
              ref={lineNumberRef}
              className="w-12 bg-transparent border-r border-white/5 flex flex-col items-end pt-4 pr-3 text-zinc-600 text-sm font-mono select-none overflow-hidden flex-shrink-0"
            >
               {Array.from({ length: lineCount }).map((_, i) => (
                 <div key={i} className="leading-6 h-6">{i + 1}</div>
               ))}
            </div>

            {/* 🛠️ SCROLL FIX: Made this container the single source of truth for scrolling */}
            <div 
                className="flex-1 relative font-mono text-sm overflow-auto"
                onScroll={(e) => {
                    if (lineNumberRef.current) {
                        lineNumberRef.current.scrollTop = e.currentTarget.scrollTop;
                    }
                }}
            >
              <div ref={syntaxRef} className="absolute inset-0 pointer-events-none p-4 pb-20 min-w-max">
                <SyntaxHighlighter
                  language={activeLanguage.syntax}
                  style={atomOneDark}
                  customStyle={{ 
                      backgroundColor: 'transparent', 
                      padding: 0, 
                      margin: 0, 
                      fontFamily: 'inherit', 
                      fontSize: 'inherit', 
                      lineHeight: '1.5rem',
                      tabSize: 4
                  }}
                  codeTagProps={{
                      style: { 
                          fontFamily: 'inherit', 
                          fontSize: 'inherit', 
                          lineHeight: '1.5rem',
                          tabSize: 4
                      }
                  }}
                  showLineNumbers={false}
                  wrapLines={false}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
              
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck="false"
                wrap="off" 
                // 🛠️ SCROLL FIX: Removed overflow-auto from the textarea itself, let parent handle it. Added min-h-full.
                className="absolute inset-0 min-w-full min-h-full bg-transparent text-transparent p-4 pb-20 resize-none focus:outline-none placeholder:text-transparent caret-white whitespace-pre overflow-hidden"
                style={{ 
                    fontFamily: 'inherit', 
                    fontSize: 'inherit',
                    lineHeight: '1.5rem',
                    letterSpacing: 'normal',
                    wordSpacing: 'normal',
                    tabSize: 4
                }}
                placeholder="// Paste your code here..."
              />
            </div>
          </div>
        </div>

        {/* 🚀 NEW: Terminal Output Window */}
        {terminalOutput !== null && (
          <div className="h-48 flex-none border-t border-white/10 bg-black flex flex-col relative z-20 animate-in slide-in-from-bottom-5">
             <div className="h-8 flex items-center justify-between px-4 border-b border-white/5 bg-zinc-900/50">
                <span className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                   <Terminal className="w-3 h-3"/> Console Output
                </span>
                <button onClick={() => setTerminalOutput(null)} className="text-zinc-500 hover:text-white transition-colors">
                   <X className="w-3 h-3" />
                </button>
             </div>
             <div className="flex-1 p-4 font-mono text-sm overflow-auto whitespace-pre-wrap text-green-400">
                {isExecuting ? <span className="animate-pulse flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Executing...</span> : terminalOutput}
             </div>
          </div>
        )}

        {/* Footer */}
        <div className="h-10 flex-none border-t border-white/5 bg-zinc-900/40 backdrop-blur-md flex items-center px-4 gap-6 text-xs text-zinc-500 font-mono">
           <div className="flex items-center gap-2 hover:text-gray-300 cursor-pointer transition-colors">
              <Terminal className="w-3 h-3" />
              <span>Ready</span>
           </div>
           <div className="ml-auto flex items-center gap-3">
              <span>Ln {code.split('\n').length}, Col 1</span>
              <span className="w-px h-3 bg-zinc-700"></span>
              <span>UTF-8</span>
              <span>{activeLanguage.name}</span>
           </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Chat Interface */}
      <div className="flex flex-col w-[420px] bg-black/20 border-l border-white/5 backdrop-blur-xl">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-white/5 bg-zinc-900/20 backdrop-blur-md flex-none z-10">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <div className="h-8 w-8 bg-gradient-to-br from-zinc-800 to-black rounded-lg flex items-center justify-center border border-white/10 shadow-sm">
                    <MessageSquare className="w-4 h-4 text-white" />
                 </div>
                 <div>
                    <h2 className="text-sm font-semibold text-white leading-none">AI Assistant</h2>
                    <span className="text-[10px] text-zinc-500 font-medium">CODE LENS AI 3.0 - BY TEAM KERNEL</span>
                 </div>
             </div>
             <button className="text-zinc-500 hover:text-white transition-colors">
                <MoreVertical className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 min-h-0 scroll-smooth">
           {messages.filter(m => !m.isHidden).map((msg, idx) => ( 
               <div key={idx} className={`group flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                   
                   <div className={`max-w-[85%] px-4 py-3 text-sm shadow-lg backdrop-blur-sm rounded-2xl ${
                       msg.role === 'user' 
                       ? 'bg-white text-black rounded-br-sm font-medium' 
                       : 'bg-zinc-800/80 text-gray-200 border border-white/10 rounded-bl-sm'
                   }`}>
                       <ReactMarkdown 
                          components={{
                            strong: ({node, ...props}) => <span className="font-bold text-blue-300" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1" {...props} />,
                            code: ({node, ...props}) => <code className="bg-black/30 px-1 py-0.5 rounded text-xs font-mono text-yellow-300" {...props} />
                          }}
                       >
                         {msg.content}
                       </ReactMarkdown>
                   </div>
                   
                   <div className="flex items-center gap-2 mt-2 px-1">
                      <span className="text-[10px] text-zinc-500 font-medium tracking-wide">
                        {msg.role === 'user' ? 'You' : 'AI'} • {msg.timestamp}
                      </span>
                      
                      {msg.role === 'ai' && (
                        <div className="flex items-center gap-3 ml-2">
                           <button onClick={() => navigator.clipboard.writeText(msg.content)} className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors" title="Copy Text">
                              <Copy className="w-3 h-3" /> <span>Copy</span>
                           </button>

                           {msg.type === 'analysis' && (
                               <button onClick={() => handleExportPDF(msg.content)} className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/30 px-2 py-0.5 rounded-full bg-blue-500/10" title="Export Audit Report">
                                  <Download className="w-3 h-3" /> <span>Export PDF</span>
                               </button>
                           )}
                        </div>
                      )}
                   </div>
               </div>
           ))}
           
           {isLoading && (
             <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2">
               <div className="bg-zinc-800/80 text-gray-200 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                 <Loader2 className="w-4 h-4 animate-spin" />
                 <span className="text-sm">Thinking...</span>
               </div>
             </div>
           )}
           <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 pt-2 pb-8 bg-gradient-to-t from-black via-black/80 to-transparent flex-none">
          <div className="hover:bg-zinc-900/80 bg-zinc-900/60 group w-full flex items-center gap-4 rounded-full border border-white/10 p-1 pl-4 shadow-xl shadow-black/50 transition-colors duration-300 hover:border-white/20">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask AI to review or modify..."
              className="flex-1 bg-transparent border-none focus:outline-none text-sm text-white placeholder-zinc-500 font-medium caret-white"
            />
            <span className="block h-4 w-0.5 border-l bg-white/10"></span>
            
            <button onClick={handleSend} disabled={isLoading} className="bg-white/10 group-hover:bg-white/20 size-6 overflow-hidden rounded-full duration-500 cursor-pointer flex-shrink-0 disabled:opacity-50">
              <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                <span className="flex size-6 items-center justify-center">
                  <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="m-auto size-3 text-white"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </span>
                <span className="flex size-6 items-center justify-center">
                  <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="m-auto size-3 text-white"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </span>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}