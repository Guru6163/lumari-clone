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
    <div className="h-full flex items-center justify-center text-gray-400">
      {!url ? (
        <div className="text-center">
          <p className="mb-2">Loading...</p>
        </div>
      ) : (
        <iframe width="100%" height="100%" src={url} />
      )}
    </div>
  );
}
