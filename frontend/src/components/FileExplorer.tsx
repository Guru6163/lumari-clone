import React, { useState } from 'react';
import { FolderTree, File, ChevronRight, ChevronDown } from 'lucide-react';
import { FileItem } from '../types';

interface FileExplorerProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
}

interface FileNodeProps {
  item: FileItem;
  depth: number;
  onFileClick: (file: FileItem) => void;
}

function FileNode({ item, depth, onFileClick }: FileNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    if (item.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onFileClick(item);
    }
  };

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors duration-150 group"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
        onClick={handleClick}
      >
        {item.type === 'folder' && (
          <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
        )}
        {item.type === 'folder' ? (
          <FolderTree className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-600 transition-colors" />
        ) : (
          <File className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700 transition-colors" />
        )}
        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors truncate">
          {item.name}
        </span>
      </div>
      {item.type === 'folder' && isExpanded && item.children && (
        <div>
          {item.children.map((child, index) => (
            <FileNode
              key={`${child.path}-${index}`}
              item={child}
              depth={depth + 1}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({ files, onFileSelect }: FileExplorerProps) {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <FolderTree className="w-4 h-4" />
          Files
        </h2>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-2">
          {files.length === 0 ? (
            <div className="text-center py-8">
              <FolderTree className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No files available</p>
            </div>
          ) : (
            <div className="space-y-1">
              {files.map((file, index) => (
                <FileNode
                  key={`${file.path}-${index}`}
                  item={file}
                  depth={0}
                  onFileClick={onFileSelect}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}