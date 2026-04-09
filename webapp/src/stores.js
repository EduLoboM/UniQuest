import { writable } from 'svelte/store';

export function persistedWritable(key, initialValue) {
  let storedValue;
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        storedValue = JSON.parse(item);
      }
    } catch (e) {
      console.error("Erro ao ler localStorage", e);
    }
  }

  const store = writable(storedValue !== undefined ? storedValue : initialValue);

  if (typeof window !== 'undefined') {
    store.subscribe((val) => {
      localStorage.setItem(key, JSON.stringify(val));
    });
  }
  return store;
}

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

export const playerSkills = persistedWritable('uniquest_skills', []);
export const playerProfile = persistedWritable('uniquest_profile', {
  name: "Nome do Jogador",
  jobClass: "",
  description: "",
  avatar: "/perfil.png"
});

export const currentJob = writable({
  title: "Esperando Vaga",
  description: "",
  skills: []
});