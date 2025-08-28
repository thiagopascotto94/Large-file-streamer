import React, { useState, useMemo } from 'react';
import { LogFile } from '../types';
import FileIcon from './icons/FileIcon';
import SearchIcon from './icons/SearchIcon';
import Spinner from './Spinner';

interface FileListProps {
  files: LogFile[];
  onFileSelect: (fileName: string) => void;
  isLoading: boolean;
}

const FileList: React.FC<FileListProps> = ({ files, onFileSelect, isLoading }) => {
  const [filter, setFilter] = useState('');

  const filteredFiles = useMemo(() => {
    if (!filter) {
      return files;
    }
    const lowercasedFilter = filter.toLowerCase();
    return files.filter(file => !file.name.startsWith("Error:") && file.name.toLowerCase().includes(lowercasedFilter));
  }, [files, filter]);

  const hasError = files.length > 0 && files[0].name.startsWith("Error:");

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-semibold text-slate-200">Available Log Files</h2>
        <div className="relative">
           <label htmlFor="filter-files" className="sr-only">Filter files</label>
           <input
            id="filter-files"
            type="text"
            placeholder="Filter files..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-md py-2 pl-10 pr-4 w-64 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={isLoading || hasError}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8 text-slate-400 flex items-center justify-center">
            <Spinner /> <span className="ml-2">Loading files...</span>
        </div>
      ) : hasError ? (
        <p className="text-red-400 bg-red-900/20 p-4 rounded-md">{files[0].name}</p>
      ) : (
        <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {filteredFiles.length > 0 ? filteredFiles.map((file, index) => (
            <li key={index}>
              <button
                onClick={() => onFileSelect(file.name)}
                className="w-full flex items-center text-left p-4 rounded-md bg-slate-700/50 hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                <FileIcon className="w-5 h-5 mr-4 text-cyan-400 flex-shrink-0" />
                <span className="flex-grow text-slate-300">
                  {file.name}
                </span>
              </button>
            </li>
          )) : (
            <p className="text-slate-400 text-center py-8">
                {filter ? `No files match "${filter}".` : 'No log files found.'}
            </p>
          )}
        </ul>
      )}
    </div>
  );
};

export default FileList;