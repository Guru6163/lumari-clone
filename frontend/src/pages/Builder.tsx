import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { StepsList } from '../components/StepsList';
import { FileExplorer } from '../components/FileExplorer';
import { TabView } from '../components/TabView';
import { CodeEditor } from '../components/CodeEditor';
import { PreviewFrame } from '../components/PreviewFrame';
import { Step, FileItem, StepType } from '../types';
import axios from 'axios';
import { BACKEND_URL } from '../congif';
import { parseXml } from '../steps';
import { useWebContainer } from '../hooks/useWebContainer';
import { FileSystemTree } from '@webcontainer/api';
import { ErrorDialog } from '../components/ErrorDialog';


export function Builder() {
  const location = useLocation();
  const { prompt } = location.state as { prompt: string };
  const [userPrompt, setPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<{role: "user" | "assistant", content: string;}[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const webcontainer = useWebContainer();

  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  
  const [steps, setSteps] = useState<Step[]>([]);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [projectReady, setProjectReady] = useState(false);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setShowErrorDialog(true);
    setLoading(false);
  }, []);

  const getErrorMessage = (error: unknown): string => {
    const errorObj = error as { response?: { data?: { message?: string } }; message?: string };
    return errorObj.response?.data?.message || errorObj.message || "An unexpected error occurred";
  };

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    steps.filter(({status}) => status === "pending").map(step => {
      updateHappened = true;
      if (step?.type === StepType.CreateFile) {
        let parsedPath = step.path?.split("/") ?? []; // ["src", "components", "App.tsx"]
        let currentFileStructure = [...originalFiles]; // {}
        const finalAnswerRef = currentFileStructure;
  
        let currentFolder = ""
        while(parsedPath.length) {
          currentFolder =  `${currentFolder}/${parsedPath[0]}`;
          const currentFolderName = parsedPath[0];
          parsedPath = parsedPath.slice(1);
  
          if (!parsedPath.length) {
            // final file
            const file = currentFileStructure.find(x => x.path === currentFolder)
            if (!file) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'file',
                path: currentFolder,
                content: step.code
              })
            } else {
              file.content = step.code;
            }
          } else {
            /// in a folder
            const folder = currentFileStructure.find(x => x.path === currentFolder)
            if (!folder) {
              // create the folder
              currentFileStructure.push({
                name: currentFolderName,
                type: 'folder',
                path: currentFolder,
                children: []
              })
            }
  
            currentFileStructure = currentFileStructure.find(x => x.path === currentFolder)!.children!;
          }
        }
        originalFiles = finalAnswerRef;
      }

    })

    if (updateHappened) {
      setFiles(originalFiles)
      setSteps(steps => steps.map((s: Step) => {
        return {
          ...s,
          status: "completed"
        }
      }))
      
      // Auto-select the first file and switch to preview tab once files are created
      if (originalFiles.length > 0 && !selectedFile) {
        const firstFile = originalFiles.find(file => file.type === 'file');
        if (firstFile) {
          setSelectedFile(firstFile);
        }
        
        // Switch to preview tab if project is ready and files are created
        if (projectReady) {
          setTimeout(() => {
            setActiveTab('preview');
          }, 1000);
        }
      }
    }
    console.log(files);
  }, [steps, files, selectedFile, projectReady]);

  // Switch to preview tab when project is ready and files exist
  useEffect(() => {
    if (projectReady && files.length > 0 && activeTab === 'code') {
      setTimeout(() => {
        setActiveTab('preview');
      }, 1500); // Give a bit more time for files to mount
    }
  }, [projectReady, files.length, activeTab]);

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): FileSystemTree => {
      const mountStructure: FileSystemTree = {};
  
      const processFile = (file: FileItem, isRootFolder: boolean) => {  
        if (file.type === 'folder') {
          // For folders, create a directory entry
          mountStructure[file.name] = {
            directory: file.children ? 
              Object.fromEntries(
                file.children.map(child => [child.name, processFile(child, false)])
              ) 
              : {}
          };
        } else if (file.type === 'file') {
          if (isRootFolder) {
            mountStructure[file.name] = {
              file: {
                contents: file.content || ''
              }
            };
          } else {
            // For files, create a file entry with contents
            return {
              file: {
                contents: file.content || ''
              }
            };
          }
        }
  
        return mountStructure[file.name];
      };
  
      // Process each top-level file/folder
      files.forEach(file => processFile(file, true));
  
      return mountStructure;
    };
  
    const mountStructure = createMountStructure(files);
  
    // Mount the structure if WebContainer is available
    console.log(mountStructure);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  const init = useCallback(async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/template`, {
        prompt: prompt.trim()
      });
      
      // Check if response contains an error
      if (response.data.error) {
        handleError(response.data.message);
        return;
      }
      
      setTemplateSet(true);
      
      const {prompts, uiPrompts} = response.data;

      setSteps(parseXml(uiPrompts[0]).map((x: Step) => ({
        ...x,
        status: "pending"
      })));

      setLoading(true);
      const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [...prompts, prompt].map(content => ({
          role: "user",
          content
        }))
      });

      // Check if response contains an error
      if (stepsResponse.data.error) {
        handleError(stepsResponse.data.message);
        return;
      }

      setLoading(false);

      setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
        ...x,
        status: "pending" as const
      }))]);

      setLlmMessages([...prompts, prompt].map(content => ({
        role: "user",
        content
      })));

      setLlmMessages(x => [...x, {role: "assistant", content: stepsResponse.data.response}])
      
      // Mark project as ready for preview
      setProjectReady(true);
    } catch (error: unknown) {
      console.error("Error in init:", error);
      const errorMessage = getErrorMessage(error);
      handleError(errorMessage);
    }
  }, [prompt, handleError]);

  useEffect(() => {
    init();
  }, [init])

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">Lumari</h1>
              <p className="text-xs text-gray-500 truncate max-w-xs">{prompt}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!(loading || !templateSet) && (
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  value={userPrompt} 
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask for changes..."
                  className="w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      // Trigger send
                      const newMessage = {
                        role: "user" as const,
                        content: userPrompt
                      };

                      setLoading(true);
                      axios.post(`${BACKEND_URL}/chat`, {
                        messages: [...llmMessages, newMessage]
                      }).then(stepsResponse => {
                        // Check if response contains an error
                        if (stepsResponse.data.error) {
                          handleError(stepsResponse.data.message);
                          return;
                        }
                        
                        setLoading(false);
                        setLlmMessages(x => [...x, newMessage]);
                        setLlmMessages(x => [...x, {
                          role: "assistant",
                          content: stepsResponse.data.response
                        }]);
                        
                        setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
                          ...x,
                          status: "pending" as const
                        }))]);
                        setPrompt("");
                      }).catch(error => {
                        console.error("Error in chat request:", error);
                        const errorMessage = getErrorMessage(error);
                        handleError(errorMessage);
                      });
                    }
                  }}
                />
                <button 
                  onClick={async () => {
                    try {
                      const newMessage = {
                        role: "user" as const,
                        content: userPrompt
                      };

                      setLoading(true);
                      const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
                        messages: [...llmMessages, newMessage]
                      });
                      
                      // Check if response contains an error
                      if (stepsResponse.data.error) {
                        handleError(stepsResponse.data.message);
                        return;
                      }
                      
                      setLoading(false);

                      setLlmMessages(x => [...x, newMessage]);
                      setLlmMessages(x => [...x, {
                        role: "assistant",
                        content: stepsResponse.data.response
                      }]);
                      
                      setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
                        ...x,
                        status: "pending" as const
                      }))]);

                      setPrompt("");
                    } catch (error: unknown) {
                      console.error("Error in chat request:", error);
                      const errorMessage = getErrorMessage(error);
                      handleError(errorMessage);
                    }
                  }} 
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Collapsible */}
        <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
          {/* Steps Section */}
          <div className="h-1/2 border-b border-gray-200">
            <StepsList
              steps={steps}
              currentStep={currentStep}
              onStepClick={setCurrentStep}
              loading={loading || !templateSet}
            />
          </div>
          
          {/* File Explorer Section */}
          <div className="h-1/2">
            <FileExplorer 
              files={files} 
              onFileSelect={setSelectedFile}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white">
          <TabView activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1 min-h-0">
            {activeTab === 'code' ? (
              <CodeEditor file={selectedFile} loading={loading || !templateSet} />
            ) : (
              <PreviewFrame webContainer={webcontainer ?? undefined} files={files} />
            )}
          </div>
        </div>
      </div>
      
      {/* Error Dialog */}
      <ErrorDialog
        isOpen={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        error={error || ""}
      />
    </div>
  );
}