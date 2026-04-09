import { writable } from 'svelte/store';

export const currentRoute = writable(window.location.pathname);

export function navigate(path) {
  window.history.pushState({}, '', path);
  currentRoute.set(path);
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    currentRoute.set(window.location.pathname);
  });
}