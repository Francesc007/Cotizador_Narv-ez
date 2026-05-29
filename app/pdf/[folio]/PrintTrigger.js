"use client";

import { useEffect } from "react";

function waitForImages() {
  const images = Array.from(document.images);

  return Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }

          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        })
    )
  );
}

function waitForPageReady() {
  if (document.readyState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.addEventListener("load", resolve, { once: true });
  });
}

export default function PrintTrigger() {
  useEffect(() => {
    let cancelled = false;

    async function triggerPrint() {
      await waitForPageReady();
      await waitForImages();

      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });

      if (!cancelled) {
        window.print();
      }
    }

    triggerPrint();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
