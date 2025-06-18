// hooks/useWebContainer.ts
import { useEffect, useState } from "react";
import { WebContainer } from "@webcontainer/api";

let instance: WebContainer | null = null;
let instancePromise: Promise<WebContainer> | null = null;

export function useWebContainer() {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootWebContainer() {
      try {
        if (instance) {
          setWebcontainer(instance);
          return;
        }

        if (!instancePromise) {
          instancePromise = WebContainer.boot();
        }

        const container = await instancePromise;

        if (!cancelled) {
          instance = container;
          setWebcontainer(container);
        }
      } catch (e) {
        console.error("Failed to boot WebContainer", e);
      }
    }

    bootWebContainer();

    return () => {
      cancelled = true;
    };
  }, []);

  return webcontainer;
}
