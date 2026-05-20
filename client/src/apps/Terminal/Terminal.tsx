import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import type { FileSystemItem } from '@/core/types/filesystem.types';
import { useFileSystemStore } from '@/features/filesystem/store/filesystem.store';
import { useWindowStore } from '@/features/window-manager/store/window.store';

type TerminalProps = {
  windowId: string;
};

type ResolvedPath = {
  item: FileSystemItem | null;
  path: string;
};

const PROMPT_USER = 'user';
const PROMPT_HOST = 'webos';

const tokenize = (input: string) => {
  const tokens: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }

  return tokens;
};

const normalizePath = (inputPath: string, cwd: string) => {
  const rawPath = inputPath.trim();
  const base = rawPath.startsWith('/') ? [] : cwd.split('/').filter(Boolean);
  const parts = rawPath.split('/').filter(Boolean);

  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      base.pop();
      continue;
    }
    base.push(part);
  }

  return `/${base.join('/')}`;
};

const splitParentPath = (path: string) => {
  const parts = path.split('/').filter(Boolean);
  const name = parts.pop() ?? '';
  return {
    name,
    parentPath: `/${parts.join('/')}`,
  };
};

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);

const Terminal: React.FC<TerminalProps> = ({ windowId }) => {
  const terminalElementRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const commandRef = useRef('');
  const cwdRef = useRef('/');
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number | null>(null);
  const openWindow = useWindowStore((state) => state.openWindow);
  const openWindowRef = useRef(openWindow);

  useEffect(() => {
    openWindowRef.current = openWindow;
  }, [openWindow]);

  useEffect(() => {
    if (!terminalElementRef.current) return;

    const fitAddon = new FitAddon();
    const terminal = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontFamily: '"Cascadia Code", "JetBrains Mono", Consolas, monospace',
      fontSize: 14,
      lineHeight: 1.25,
      scrollback: 2000,
      convertEol: true,
      theme: {
        background: '#05070a',
        foreground: '#d7e0ea',
        cursor: '#8be9fd',
        selectionBackground: '#31445f',
        black: '#12151c',
        red: '#ff6b6b',
        green: '#7ddc8f',
        yellow: '#ffd166',
        blue: '#75a7ff',
        magenta: '#c792ea',
        cyan: '#8be9fd',
        white: '#f8fafc',
        brightBlack: '#5c6370',
        brightRed: '#ff8787',
        brightGreen: '#9be7a9',
        brightYellow: '#ffe08a',
        brightBlue: '#9bbcff',
        brightMagenta: '#d7a8ff',
        brightCyan: '#a6f3ff',
        brightWhite: '#ffffff',
      },
    });

    terminal.loadAddon(fitAddon);
    terminal.open(terminalElementRef.current);
    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    const writePrompt = () => {
      terminal.write(`\r\n\x1b[38;5;82m${PROMPT_USER}@${PROMPT_HOST}\x1b[0m:\x1b[38;5;75m${cwdRef.current}\x1b[0m$ `);
    };

    const resolvePath = (pathInput: string): ResolvedPath => {
      const items = useFileSystemStore.getState().items;
      const path = normalizePath(pathInput || '.', cwdRef.current);
      const segments = path.split('/').filter(Boolean);
      let parentId: string | null = null;
      let current: FileSystemItem | null = null;

      for (const segment of segments) {
        const next = items.find((item) => item.parentId === parentId && item.name === segment);
        if (!next) return { item: null, path };
        current = next;
        parentId = next.id;
      }

      return { item: current, path };
    };

    const getDirectoryId = (pathInput: string) => {
      const resolved = resolvePath(pathInput);
      if (resolved.path === '/') return null;
      if (!resolved.item || resolved.item.type !== 'folder') return undefined;
      return resolved.item.id;
    };

    const writeLine = (line = '') => terminal.writeln(line);

    const printHelp = () => {
      [
        'Available commands:',
        '  help                  Show commands',
        '  clear                 Clear terminal',
        '  pwd                   Show current folder',
        '  ls [path]             List files and folders',
        '  cd <path>             Change folder',
        '  mkdir <path>          Create a folder',
        '  touch <path>          Create a file',
        '  cat <file>            Print file contents',
        '  echo <text>           Print text',
        '  echo <text> > <file>  Write text to a file',
        '  rm <path>             Move file or folder to Recycle Bin',
        '  open <path>           Open file or folder in a window',
        '  tree [path]           Show folder tree',
        '  date                  Show current date and time',
        '  whoami                Show current user',
      ].forEach(writeLine);
    };

    const listDirectory = (pathInput = '.') => {
      const directoryId = getDirectoryId(pathInput);
      if (directoryId === undefined) {
        writeLine(`ls: ${pathInput}: not a directory`);
        return;
      }

      const items = useFileSystemStore
        .getState()
        .items
        .filter((item) => item.parentId === directoryId)
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

      if (items.length === 0) {
        writeLine('(empty)');
        return;
      }

      items.forEach((item) => {
        const type = item.type === 'folder' ? 'dir ' : 'file';
        const size = item.type === 'file' ? `${item.content?.length ?? 0}b`.padStart(6, ' ') : '     -';
        const color = item.type === 'folder' ? '\x1b[38;5;75m' : '\x1b[0m';
        writeLine(`${type}  ${size}  ${formatDate(item.createdAt)}  ${color}${item.name}\x1b[0m`);
      });
    };

    const printTree = (pathInput = '.') => {
      const directoryId = getDirectoryId(pathInput);
      if (directoryId === undefined) {
        writeLine(`tree: ${pathInput}: not a directory`);
        return;
      }

      const items = useFileSystemStore.getState().items;
      const walk = (parentId: string | null, prefix: string) => {
        const children = items
          .filter((item) => item.parentId === parentId)
          .sort((a, b) => a.name.localeCompare(b.name));

        children.forEach((child, index) => {
          const isLast = index === children.length - 1;
          const connector = isLast ? '`-- ' : '|-- ';
          writeLine(`${prefix}${connector}${child.name}${child.type === 'folder' ? '/' : ''}`);
          if (child.type === 'folder') {
            walk(child.id, `${prefix}${isLast ? '    ' : '|   '}`);
          }
        });
      };

      writeLine(pathInput === '.' ? cwdRef.current : normalizePath(pathInput, cwdRef.current));
      walk(directoryId, '');
    };

    const createItem = (type: 'file' | 'folder', pathInput?: string) => {
      if (!pathInput) {
        writeLine(`${type === 'file' ? 'touch' : 'mkdir'}: missing path`);
        return;
      }

      const normalized = normalizePath(pathInput, cwdRef.current);
      const existing = resolvePath(normalized).item;
      if (existing) {
        writeLine(`${type === 'file' ? 'touch' : 'mkdir'}: ${pathInput}: already exists`);
        return;
      }

      const { name, parentPath } = splitParentPath(normalized);
      const parentId = getDirectoryId(parentPath);
      if (!name || parentId === undefined) {
        writeLine(`${type === 'file' ? 'touch' : 'mkdir'}: ${pathInput}: invalid path`);
        return;
      }

      if (type === 'file') {
        useFileSystemStore.getState().createFile(name, parentId);
      } else {
        useFileSystemStore.getState().createFolder(name, parentId);
      }
    };

    const writeFile = (pathInput: string | undefined, content: string) => {
      if (!pathInput) {
        writeLine('echo: missing file path');
        return;
      }

      const normalized = normalizePath(pathInput, cwdRef.current);
      const { item } = resolvePath(normalized);

      if (item && item.type !== 'file') {
        writeLine(`echo: ${pathInput}: is a directory`);
        return;
      }

      if (item) {
        useFileSystemStore.getState().updateFileContent(item.id, content);
        return;
      }

      const { name, parentPath } = splitParentPath(normalized);
      const parentId = getDirectoryId(parentPath);
      if (!name || parentId === undefined) {
        writeLine(`echo: ${pathInput}: invalid path`);
        return;
      }

      useFileSystemStore.getState().createFile(name, parentId);
      const created = useFileSystemStore
        .getState()
        .items.find((candidate) => candidate.parentId === parentId && candidate.name === name && candidate.type === 'file');

      if (created) {
        useFileSystemStore.getState().updateFileContent(created.id, content);
      }
    };

    const runCommand = (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      const redirectMatch = trimmed.match(/^echo\s+(.+?)\s*>\s*(.+)$/);
      if (redirectMatch) {
        writeFile(redirectMatch[2].trim(), redirectMatch[1]);
        return;
      }

      const [command, ...args] = tokenize(trimmed);

      switch (command) {
        case 'help':
          printHelp();
          break;
        case 'clear':
          terminal.clear();
          break;
        case 'pwd':
          writeLine(cwdRef.current);
          break;
        case 'ls':
          listDirectory(args[0]);
          break;
        case 'cd': {
          const target = args[0] ?? '/';
          const directoryId = getDirectoryId(target);
          if (directoryId === undefined) {
            writeLine(`cd: ${target}: no such folder`);
            break;
          }
          cwdRef.current = normalizePath(target, cwdRef.current);
          break;
        }
        case 'mkdir':
          createItem('folder', args[0]);
          break;
        case 'touch':
          createItem('file', args[0]);
          break;
        case 'cat': {
          const target = args[0];
          if (!target) {
            writeLine('cat: missing file');
            break;
          }
          const { item } = resolvePath(target);
          if (!item) {
            writeLine(`cat: ${target}: no such file`);
          } else if (item.type !== 'file') {
            writeLine(`cat: ${target}: is a directory`);
          } else {
            writeLine(item.content ?? '');
          }
          break;
        }
        case 'echo':
          writeLine(args.join(' '));
          break;
        case 'rm': {
          const target = args[0];
          if (!target) {
            writeLine('rm: missing path');
            break;
          }
          const { item } = resolvePath(target);
          if (!item) {
            writeLine(`rm: ${target}: no such file or folder`);
            break;
          }
          useFileSystemStore.getState().deleteItem(item.id);
          break;
        }
        case 'open': {
          const target = args[0] ?? '.';
          const { item } = resolvePath(target);
          if (!item) {
            writeLine(`open: ${target}: no such file or folder`);
          } else if (item.type === 'folder') {
            openWindowRef.current(`folder-${item.id}`, item.name, 'folder', item.id);
          } else {
            openWindowRef.current(item.id, item.name, 'notepad', item.id);
          }
          break;
        }
        case 'tree':
          printTree(args[0]);
          break;
        case 'date':
          writeLine(new Date().toString());
          break;
        case 'whoami':
          writeLine(PROMPT_USER);
          break;
        case 'exit':
          writeLine(`Session ${windowId} is running inside WebOS. Close the window to exit.`);
          break;
        default:
          writeLine(`${command}: command not found`);
      }
    };

    terminal.writeln('\x1b[38;5;82mWebOS Terminal\x1b[0m');
    terminal.writeln('Type "help" to see available commands.');
    writePrompt();

    const dataDisposable = terminal.onData((data) => {
      const code = data.charCodeAt(0);

      if (data === '\r') {
        const command = commandRef.current;
        terminal.write('\r\n');
        if (command.trim()) {
          historyRef.current.push(command);
        }
        historyIndexRef.current = null;
        commandRef.current = '';
        runCommand(command);
        writePrompt();
        return;
      }

      if (data === '\u007F') {
        if (commandRef.current.length > 0) {
          commandRef.current = commandRef.current.slice(0, -1);
          terminal.write('\b \b');
        }
        return;
      }

      if (data === '\u001b[A' || data === '\u001b[B') {
        const history = historyRef.current;
        if (history.length === 0) return;

        if (data === '\u001b[A') {
          historyIndexRef.current = historyIndexRef.current === null
            ? history.length - 1
            : Math.max(0, historyIndexRef.current - 1);
        } else {
          historyIndexRef.current = historyIndexRef.current === null
            ? null
            : historyIndexRef.current + 1 >= history.length
              ? null
              : historyIndexRef.current + 1;
        }

        terminal.write('\x1b[2K\r');
        terminal.write(`\x1b[38;5;82m${PROMPT_USER}@${PROMPT_HOST}\x1b[0m:\x1b[38;5;75m${cwdRef.current}\x1b[0m$ `);
        commandRef.current = historyIndexRef.current === null ? '' : history[historyIndexRef.current];
        terminal.write(commandRef.current);
        return;
      }

      if (code >= 32 && code !== 127) {
        commandRef.current += data;
        terminal.write(data);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalElementRef.current);
    fitAddon.fit();
    terminal.focus();

    return () => {
      dataDisposable.dispose();
      resizeObserver.disconnect();
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [windowId]);

  return (
    <div className="h-full w-full bg-[#05070a] p-3">
      <div ref={terminalElementRef} className="h-full w-full overflow-hidden" />
    </div>
  );
};

export default Terminal;
