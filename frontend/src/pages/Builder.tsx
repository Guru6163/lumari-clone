import React, { useEffect, useState } from 'react';
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
import { FileNode } from '@webcontainer/api';
import { Loader } from '../components/Loader';

const MOCK_FILE_CONTENT = `// This is a sample file content
import React from 'react';

function Component() {
  return <div>Hello World</div>;
}

export default Component;`;

export function Builder() {
  const location = useLocation();
  const { prompt } = location.state as { prompt: string };
  const [userPrompt, setPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<{role: "user" | "assistant", content: string;}[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const webcontainer = useWebContainer();

  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('preview');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  
  const [steps, setSteps] = useState<Step[]>([]);

  const [files, setFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    steps.filter(({status}) => status === "pending").map(step => {
      updateHappened = true;
      if (step?.type === StepType.CreateFile) {
        let parsedPath = step.path?.split("/") ?? []; // ["src", "components", "App.tsx"]
        let currentFileStructure = [...originalFiles]; // {}
        let finalAnswerRef = currentFileStructure;
  
        let currentFolder = ""
        while(parsedPath.length) {
          currentFolder =  `${currentFolder}/${parsedPath[0]}`;
          let currentFolderName = parsedPath[0];
          parsedPath = parsedPath.slice(1);
  
          if (!parsedPath.length) {
            // final file
            let file = currentFileStructure.find(x => x.path === currentFolder)
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
            let folder = currentFileStructure.find(x => x.path === currentFolder)
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
    }
    console.log(files);
  }, [steps, files]);

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};
  
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

  async function init() {
    const response = await axios.post(`${BACKEND_URL}/template`, {
      prompt: prompt.trim()
    });
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
    })

    setLoading(false);

    setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
      ...x,
      status: "pending" as "pending"
    }))]);

    setLlmMessages([...prompts, prompt].map(content => ({
      role: "user",
      content
    })));

    setLlmMessages(x => [...x, {role: "assistant", content: stepsResponse.data.response}])
  }

  useEffect(() => {
    init();
  }, [])

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
                        role: "user" as "user",
                        content: userPrompt
                      };

                      setLoading(true);
                      axios.post(`${BACKEND_URL}/chat`, {
                        messages: [...llmMessages, newMessage]
                      }).then(stepsResponse => {
                        setLoading(false);
                        setLlmMessages(x => [...x, newMessage]);
                        setLlmMessages(x => [...x, {
                          role: "assistant",
                          content: stepsResponse.data.response
                        }]);
                        
                        setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
                          ...x,
                          status: "pending" as "pending"
                        }))]);
                        setPrompt("");
                      });
                    }
                  }}
                />
                <button 
                  onClick={async () => {
                    const newMessage = {
                      role: "user" as "user",
                      content: userPrompt
                    };

                    setLoading(true);
                    const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
                      messages: [...llmMessages, newMessage]
                    });
                    setLoading(false);

                    setLlmMessages(x => [...x, newMessage]);
                    setLlmMessages(x => [...x, {
                      role: "assistant",
                      content: stepsResponse.data.response
                    }]);
                    
                    setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
                      ...x,
                      status: "pending" as "pending"
                    }))]);

                    setPrompt("");
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
              <CodeEditor file={selectedFile} />
            ) : (
              <PreviewFrame webContainer={webcontainer ?? undefined} files={files} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}