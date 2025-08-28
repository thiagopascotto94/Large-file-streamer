import React, { useState } from 'react';
import LogViewer from './components/LogViewer';
import PencilIcon from './components/icons/PencilIcon';
import CalendarIcon from './components/icons/CalendarIcon';
import TerminalIcon from './components/icons/TerminalIcon';

const LOG_URL_KEY = 'logStreamer_serverUrl';
const DEFAULT_LOG_URL = '';

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [logServerUrl, setLogServerUrl] = useState<string>(() => localStorage.getItem(LOG_URL_KEY) || DEFAULT_LOG_URL);
  const [urlInput, setUrlInput] = useState<string>(logServerUrl);
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [inputMode, setInputMode] = useState<'date' | 'manual'>('date');
  const [manualFileName, setManualFileName] = useState<string>('');

  const handleBack = () => {
    setSelectedFile(null);
  };

  const handleViewLog = () => {
    if (inputMode === 'date' && selectedDate) {
      const fileName = `${selectedDate}-backend-logs.json`;
      setSelectedFile(fileName);
    } else if (inputMode === 'manual' && manualFileName.trim()) {
      setSelectedFile(manualFileName.trim());
    }
  };

  const handleUrlEditToggle = () => {
    if (isEditingUrl) { // Was editing, now saving
      const newUrl = urlInput.trim();
      if(newUrl) {
        setLogServerUrl(newUrl);
        localStorage.setItem(LOG_URL_KEY, newUrl);
      } else {
        setUrlInput(logServerUrl); // Reset input if it was emptied
      }
    }
    setIsEditingUrl(!isEditingUrl);
  };
  
  const handleUrlFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUrlEditToggle();
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 sm:p-6 md:p-8">
      <main className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-center text-cyan-400 tracking-tight">
            Log Streamer
          </h1>
          <p className="text-center text-slate-400 mt-2">
            Stream and search large log files from a remote server.
          </p>
        </header>

        {selectedFile ? (
          <LogViewer fileName={selectedFile} baseUrl={logServerUrl} onBack={handleBack} />
        ) : (
          <div className="space-y-8">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-slate-200">Log Server URL</h2>
                <form onSubmit={handleUrlFormSubmit} className="flex items-center gap-4 flex-wrap">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            id="logServerUrl"
                            name="logServerUrl"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="e.g., https://my-logs.com/path"
                            required
                            disabled={!isEditingUrl}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition disabled:bg-slate-800 disabled:text-slate-400"
                        />
                    </div>
                    <button 
                        type="button"
                        onClick={handleUrlEditToggle}
                        className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-900 transition-colors"
                    >
                        {isEditingUrl ? 'Save' : <><PencilIcon className="w-4 h-4 mr-2" /> Edit</>}
                    </button>
                </form>
                 <p className="mt-3 text-xs text-slate-500">
                   Configure the base URL where your log files are hosted. This is saved in your browser's local storage.
                </p>
            </div>
            
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-slate-200">
                  Select Log File
                </h2>
                 <div className="flex items-center justify-center space-x-1 bg-slate-700/50 p-1 rounded-lg mb-6 max-w-sm mx-auto">
                    <button 
                        onClick={() => setInputMode('date')} 
                        className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 ${inputMode === 'date' ? 'bg-cyan-600 text-white shadow' : 'text-slate-300 hover:bg-slate-600/50'}`}
                        aria-pressed={inputMode === 'date'}
                    >
                        <div className="flex items-center justify-center">
                            <CalendarIcon className="w-5 h-5 mr-2" /> By Date
                        </div>
                    </button>
                    <button 
                        onClick={() => setInputMode('manual')} 
                        className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 ${inputMode === 'manual' ? 'bg-cyan-600 text-white shadow' : 'text-slate-300 hover:bg-slate-600/50'}`}
                        aria-pressed={inputMode === 'manual'}
                    >
                        <div className="flex items-center justify-center">
                            <TerminalIcon className="w-5 h-5 mr-2" /> Manual Input
                        </div>
                    </button>
                </div>

                {inputMode === 'date' && (
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="relative flex-grow max-w-xs">
                                <label htmlFor="log-date" className="sr-only">Select Date</label>
                                <input
                                    type="date"
                                    id="log-date"
                                    name="log-date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                                />
                            </div>
                            <button
                                onClick={handleViewLog}
                                disabled={!selectedDate}
                                className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-900 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
                            >
                                View Log
                            </button>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                          Select a date to construct the log file name (e.g., <strong>{selectedDate}-backend-logs.json</strong>).
                        </p>
                    </div>
                )}

                {inputMode === 'manual' && (
                    <div className="animate-fade-in">
                         <div className="flex items-center gap-4 flex-wrap">
                            <div className="relative flex-grow">
                                 <label htmlFor="manual-filename" className="sr-only">Enter Filename</label>
                                 <input
                                    type="text"
                                    id="manual-filename"
                                    name="manual-filename"
                                    value={manualFileName}
                                    onChange={(e) => setManualFileName(e.target.value)}
                                    placeholder="e.g., my-custom-log.log"
                                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                                  />
                            </div>
                            <button
                                onClick={handleViewLog}
                                disabled={!manualFileName.trim()}
                                className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-900 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
                            >
                                View Log
                            </button>
                        </div>
                         <p className="mt-3 text-xs text-slate-500">
                            Enter the full name of the log file you want to view.
                        </p>
                    </div>
                )}
            </div>
          </div>
        )}
      </main>
      <footer className="text-center mt-12 text-slate-500 text-sm">
        <p>Built for performance with large datasets by Thiago Pascotto.</p>
      </footer>
    </div>
  );
};

export default App;
