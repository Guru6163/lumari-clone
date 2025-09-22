/* eslint-disable @typescript-eslint/no-explicit-any */
import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useState } from 'react';

interface PreviewFrameProps {
  files: any[];
  webContainer?: WebContainer;
}


export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function main() {
      if (!webContainer) return;

      const installProcess = await webContainer.spawn("npm", ["install"]);
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            if (!cancelled) console.log(data);
          },
        })
      );

      await installProcess.exit;

      await webContainer.spawn("npm", ["run", "dev"]);

      webContainer.on("server-ready", (_port, serverUrl) => {
        if (!cancelled) {
          console.log(serverUrl);
          setUrl(serverUrl);
        }
      });
    }

    main();

    return () => {
      cancelled = true;
    };
  }, [webContainer]);

  return (
    <div className="h-full bg-white">
      {!url ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Starting Preview</h3>
            <p className="text-sm text-gray-500">Installing dependencies and starting the development server...</p>
          </div>
        </div>
      ) : (
        <iframe 
          width="100%" 
          height="100%" 
          src={url}
          className="border-0"
          title="Preview"
        />
      )}
    </div>
  );
}
