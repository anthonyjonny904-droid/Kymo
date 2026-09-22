import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  Download,
  Copy,
  Check,
  Search,
  Code2,
  FileText,
  Smartphone,
  Server,
  Terminal,
  Archive
} from 'lucide-react';
import JSZip from 'jszip';
import { KYMO_BUNDLE_FILES, SourceFile } from '../data/bundleFiles';

export const CodeBundleViewer: React.FC = () => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>(KYMO_BUNDLE_FILES[0].path);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const selectedFile: SourceFile =
    KYMO_BUNDLE_FILES.find((f) => f.path === selectedFilePath) || KYMO_BUNDLE_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      KYMO_BUNDLE_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'kymo_chat_flutter_android_bundle.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error creating ZIP bundle:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const filteredFiles = KYMO_BUNDLE_FILES.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lines = selectedFile.content.split('\n');

  return (
    <div className="h-full flex flex-col bg-[#0d1117] text-gray-200 overflow-hidden font-sans">
      {/* Top Banner */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Code2 className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-white">Flutter Android APK Source Bundle</h2>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
              com.kymo.chat
            </span>
          </div>
          <p className="text-xs text-[#8b949e] mt-0.5">
            Full release-ready Flutter codebase, Cloud Functions, and Android Gradle configurations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition shadow-md disabled:opacity-50"
          >
            <Archive className="w-4 h-4" />
            <span>{isZipping ? 'Archiving...' : 'Download ZIP Bundle'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Sidebar & Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree Explorer (Sidebar) */}
        <div className="w-72 sm:w-80 flex-shrink-0 bg-[#0d1117] border-r border-[#30363d] flex flex-col">
          {/* Search Box */}
          <div className="p-3 border-b border-[#30363d]">
            <div className="flex items-center gap-2 bg-[#161b22] px-3 py-1.5 rounded-md border border-[#30363d] text-xs">
              <Search className="w-3.5 h-3.5 text-[#8b949e]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter files..."
                className="bg-transparent border-none outline-none text-white w-full placeholder-[#8b949e]"
              />
            </div>
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="text-[11px] font-semibold text-[#8b949e] uppercase px-2 py-1 tracking-wider">
              Project Structure
            </div>

            {filteredFiles.map((file) => {
              const isSelected = selectedFilePath === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`w-full text-left px-2.5 py-2 rounded-md text-xs flex items-center gap-2.5 transition ${
                    isSelected
                      ? 'bg-[#1f242c] text-emerald-400 font-semibold border-l-2 border-emerald-500'
                      : 'text-[#c9d1d9] hover:bg-[#161b22]'
                  }`}
                >
                  {file.category === 'functions' && <Server className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                  {file.category === 'flutter' && <Smartphone className="w-4 h-4 text-sky-400 flex-shrink-0" />}
                  {file.category === 'android' && <FileCode className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  {file.category === 'config' && <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />}
                  
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[12px]">{file.name}</span>
                    <span className="block text-[10px] text-[#8b949e] truncate">{file.path}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-[#30363d] bg-[#161b22] text-[11px] text-[#8b949e]">
            <span>Generated for: </span>
            <strong className="text-white">ogkymo@gmail.com</strong>
          </div>
        </div>

        {/* Code Editor Preview */}
        <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
          {/* File Tab Bar */}
          <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-emerald-400 font-semibold truncate">
                {selectedFile.path}
              </span>
              <span className="text-[10px] bg-[#30363d] text-[#8b949e] px-1.5 py-0.5 rounded font-mono uppercase">
                {selectedFile.language}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-white px-2.5 py-1 rounded text-xs transition"
                title="Copy code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownloadSingle}
                className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-white px-2.5 py-1 rounded text-xs transition"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Description Callout */}
          <div className="px-4 py-2 bg-[#12161f] border-b border-[#30363d] text-xs text-[#8b949e]">
            {selectedFile.description}
          </div>

          {/* Code Lines Display */}
          <div className="flex-1 overflow-y-auto overflow-x-auto p-4 font-mono text-xs leading-relaxed bg-[#0d1117] select-text">
            <table className="border-collapse w-full">
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-[#161b22]">
                    <td className="text-right pr-4 select-none text-[#484f58] w-12 text-[11px] align-top">
                      {idx + 1}
                    </td>
                    <td className="text-[#c9d1d9] whitespace-pre font-mono text-[12px]">
                      {line || ' '}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
