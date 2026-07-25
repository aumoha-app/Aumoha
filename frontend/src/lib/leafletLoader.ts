let leafletPromise: Promise<any> | null = null;

export function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Leaflet cannot be loaded on the server side'));
  }

  const win = window as any;
  if (win.L) {
    return Promise.resolve(win.L);
  }

  if (leafletPromise) {
    return leafletPromise;
  }

  leafletPromise = new Promise((resolve, reject) => {
    // 1. Load CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // 2. Load JS Script
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        if (win.L) {
          resolve(win.L);
        } else {
          reject(new Error('Leaflet loaded but L is not defined on window'));
        }
      };
      script.onerror = (err) => {
        reject(err);
      };
      document.body.appendChild(script);
    } else {
      // If the script tag already exists but L is not loaded yet, poll for it
      const checkInterval = setInterval(() => {
        if (win.L) {
          clearInterval(checkInterval);
          resolve(win.L);
        }
      }, 50);
    }
  });

  return leafletPromise;
}
