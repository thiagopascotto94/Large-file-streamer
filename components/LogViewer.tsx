import React, { useState, useEffect, useMemo, useRef } from 'react';
import ChevronLeftIcon from './icons/ChevronLeftIcon.tsx';
import SearchIcon from './icons/SearchIcon.tsx';
import Spinner from './Spinner.tsx';
import StopIcon from './icons/StopIcon.tsx';
import LogLineDetailModal from './LogLineDetailModal.tsx';
import { LogSource } from '../App.tsx';

interface LogViewerProps {
  source: { type: 'remote'; fileName: string; baseUrl: string } | { type: 'local'; file: File };
  onBack: () => void;
}

const ROW_HEIGHT = 22; // Crucial for virtualization calculations. Corresponds to text-sm, leading-relaxed.

const LogViewer: React.FC<LogViewerProps> = ({ source, onBack }) => {
  const [logLines, setLogLines] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [totalBytes, setTotalBytes] = useState(0);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [selectedLine, setSelectedLine] = useState<{ lineNumber: number; content: string } | null>(null);
  
  const logContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialLoad = useRef(true);

  // Debounce search term to avoid performance issues on large datasets
  useEffect(() => {
    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    isInitialLoad.current = true;

    const streamLogFile = async () => {
      setLogLines([]);
      setTotalBytes(0);
      setFileSize(null);
      setError(null);
      setStatus('Initializing...');

      try {
        // Step 1: Get total file size if possible for progress indicator
        if (source.type === 'remote') {
            try {
                setStatus('Fetching file size...');
                const fullUrl = `${source.baseUrl}/${source.fileName}`;
                const headResponse = await fetch(fullUrl, { method: 'HEAD', signal });
                if (headResponse.ok) {
                    const contentLength = headResponse.headers.get('Content-Length');
                    if (contentLength) {
                        setFileSize(parseInt(contentLength, 10));
                    }
                }
            } catch (e) {
                console.warn("Could not fetch file size with HEAD request. Progress bar will not be available.", e);
            }
        } else { // Local file
            setFileSize(source.file.size);
        }


        // Step 2: Start streaming the content
        let reader: ReadableStreamDefaultReader<Uint8Array>;

        if (source.type === 'remote') {
          setStatus('Connecting to stream...');
          const fullUrl = `${source.baseUrl}/${source.fileName}`;
          const response = await fetch(fullUrl, { signal });

          if (!response.ok) {
             const errorText = await response.text().catch(() => 'Could not retrieve error details from server.');
             throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}. Server says: ${errorText}`);
          }

          if (!response.body) {
              throw new Error("Response body is empty.");
          }
          reader = response.body.getReader();
          setStatus('Streaming log data...');
        } else { // Local file
          setStatus('Reading local file...');
          if (!source.file.stream) {
            throw new Error("This browser doesn't support the File System Access API for streaming. Please try a modern browser like Chrome or Edge.");
          }
          const stream = source.file.stream();
          reader = stream.getReader();
          setStatus('Streaming local file...');
        }


        const decoder = new TextDecoder();
        let buffer = '';
        let allLines: string[] = [];

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                if (buffer) {
                    allLines.push(buffer);
                }
                setLogLines(allLines);
                setStatus('Stream finished.');
                break;
            }
            
            setTotalBytes(prev => prev + value.length);
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            if (lines.length > 0) {
                allLines.push(...lines);
            }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Stream aborted by user.');
          setStatus('Stream cancelled.');
        } else {
          console.error("Streaming error:", err);
          const errorMessage = source.type === 'remote'
            ? `Failed to stream file. This is likely a CORS issue, a network problem, or the file may not exist. Please check the browser console for details. Error: ${err.message}`
            : `Failed to read the local file. The file might be corrupted or the browser may have blocked access. Error: ${err.message}`;
          setError(errorMessage);
          setStatus('Error occurred.');
        }
      }
    };

    streamLogFile();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [source]);

  const filteredLines = useMemo(() => {
    const linesWithIndices = logLines.map((line, index) => ({ line, originalIndex: index }));
    if (!debouncedSearchTerm) {
      return linesWithIndices;
    }
    const lowercasedSearchTerm = debouncedSearchTerm.toLowerCase();
    return linesWithIndices.filter(item => item.line.toLowerCase().includes(lowercasedSearchTerm));
  }, [logLines, debouncedSearchTerm]);

  // Autoscroll to bottom after initial load
  useEffect(() => {
    if (logContainerRef.current && status === 'Stream finished.' && isInitialLoad.current && logLines.length > 0) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      isInitialLoad.current = false;
    }
  }, [logLines, status]);

  const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  const handleCancelStream = () => {
    abortControllerRef.current?.abort();
  };
  
  const handleCloseModal = () => {
    setSelectedLine(null);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };
  
  // Virtualization calculations
  const containerHeight = logContainerRef.current?.clientHeight || 0;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 10); // Render 10 rows before as buffer
  const endIndex = Math.min(
      filteredLines.length,
      Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + 10 // and 10 after
  );

  const visibleLines = useMemo(() => filteredLines.slice(startIndex, endIndex), [filteredLines, startIndex, endIndex]);

  const isLoading = status === 'Connecting to stream...' || status === 'Streaming log data...' || status === 'Reading local file...' || status === 'Streaming local file...' || status === 'Fetching file size...';
  const fileName = source.type === 'remote' ? source.fileName : source.file.name;

  const progressPercent = fileSize && totalBytes > 0 ? Math.min((totalBytes / fileSize) * 100, 100) : 0;

  const renderContent = () => {
    if (isLoading && logLines.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-4 text-slate-500 h-full">
          <Spinner />
          <span className="ml-2 mt-4">{status}</span>
          {fileSize ? (
            <div className="text-center mt-2">
              <p className="text-sm text-slate-400">
                {formatBytes(totalBytes)} / {formatBytes(fileSize)} ({progressPercent.toFixed(1)}%)
              </p>
              <div className="w-64 bg-slate-700 rounded-full h-1.5 mt-2">
                <div
                  className="bg-cyan-500 h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          ) : (
             <span className="text-xs mt-1 text-slate-600">({formatBytes(totalBytes)} loaded)</span>
          )}
        </div>
      );
    }

    if (filteredLines.length > 0) {
      return (
        <div style={{ height: `${filteredLines.length * ROW_HEIGHT}px`, position: 'relative' }}>
          <code style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${startIndex * ROW_HEIGHT}px)`
          }}>
            {visibleLines.map(({line, originalIndex}) => (
              <div 
                key={originalIndex} 
                className="flex hover:bg-slate-800/50 cursor-pointer" 
                style={{ height: `${ROW_HEIGHT}px` }}
                onClick={() => setSelectedLine({ lineNumber: originalIndex + 1, content: line })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedLine({ lineNumber: originalIndex + 1, content: line })}}
              >
                <span className="text-right text-slate-500 w-12 select-none flex-shrink-0 pr-4 pt-[2px]">{originalIndex + 1}</span>
                <span className="whitespace-pre pt-[2px] truncate">{line}</span>
              </div>
            ))}
          </code>
        </div>
      );
    }

    if (isSearching) {
        return (
            <div className="flex items-center justify-center p-4 text-slate-500 h-full">
                <Spinner />
                <span className="ml-2">Searching...</span>
            </div>
        )
    }
    
    if (status === 'Stream cancelled.') {
      return (
        <div className="flex items-center justify-center p-4 text-slate-500 h-full">
          <p>Stream cancelled by user.</p>
        </div>
      );
    }
    
    if (filteredLines.length === 0 && debouncedSearchTerm) {
         return (
             <div className="flex items-center justify-center p-4 text-slate-500 h-full">
                <p>No results found for "{debouncedSearchTerm}"</p>
            </div>
        )
    }

     if (logLines.length === 0 && status === 'Stream finished.') {
        return (
             <div className="flex items-center justify-center p-4 text-slate-500 h-full">
                <p>Log file is empty.</p>
            </div>
        )
    }

    return null;
  };

  return (
    <div className="flex flex-col h-[80vh] bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg overflow-hidden">
      <div className="flex-shrink-0 relative flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 flex-wrap gap-4">
        <div className="flex items-center min-w-0">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-700 transition-colors mr-3" aria-label="Go back">
            <ChevronLeftIcon className="w-6 h-6 text-slate-300" />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="text-lg font-semibold text-slate-100 truncate" title={fileName}>{fileName}</h2>
            <div className="text-xs text-slate-400 flex items-center mt-1 flex-wrap">
              <span>{status}</span>
              {isLoading && <div className="ml-2 w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
              <span className="mx-2">|</span>
              {isLoading && fileSize ? (
                  <span>
                    {formatBytes(totalBytes)} / {formatBytes(fileSize)} ({progressPercent.toFixed(0)}%)
                  </span>
              ) : (
                 <span>{formatBytes(totalBytes)} streamed</span>
              )}
              {!isLoading && logLines.length > 0 && (
                <>
                  <span className="mx-2">|</span>
                  {debouncedSearchTerm ? (
                    <span>
                      Showing {filteredLines.length.toLocaleString()} of {logLines.length.toLocaleString()} lines
                    </span>
                  ) : (
                    <span>
                      {logLines.length.toLocaleString()} total lines
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isLoading && (
            <button
                onClick={handleCancelStream}
                className="flex items-center justify-center py-2 px-4 border border-red-500/50 rounded-md shadow-sm text-sm font-medium text-red-300 bg-red-900/30 hover:bg-red-900/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-slate-800 transition-colors"
                aria-label="Cancel log stream"
            >
                <StopIcon className="w-4 h-4 mr-2" />
                Cancel
            </button>
          )}
          <div className="relative">
            <label htmlFor="search-logs" className="sr-only">Search logs</label>
            <input
              id="search-logs"
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-md py-2 pl-10 pr-10 w-64 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              disabled={isLoading || error !== null || logLines.length === 0}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="w-5 h-5 text-slate-400" />
            </div>
             {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Spinner className="h-5 w-5" />
              </div>
            )}
          </div>
        </div>
        {isLoading && fileSize && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-700/50">
                <div
                    className="h-full bg-cyan-400 transition-all duration-100"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        )}
      </div>

      {error ? (
         <div className="flex-grow p-6 text-center text-red-400 bg-slate-900 flex items-center justify-center">
            <div>
                <h3 className="text-xl font-bold mb-2">Streaming Error</h3>
                <p className="max-w-md mx-auto text-sm">{error}</p>
            </div>
        </div>
      ) : (
        <div ref={logContainerRef} onScroll={handleScroll} className="flex-grow p-4 overflow-auto bg-gray-900 font-mono text-sm leading-relaxed relative" aria-live="polite">
          {renderContent()}
        </div>
      )}

      {selectedLine && (
        <LogLineDetailModal
          lineNumber={selectedLine.lineNumber}
          line={selectedLine.content}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default LogViewer;