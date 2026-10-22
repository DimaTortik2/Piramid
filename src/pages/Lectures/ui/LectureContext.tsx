import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { create } from 'zustand';
import { triggerHaptic } from '@/shared/lib/telegram';
import { useDisciplineStore } from '@/shared/store/useDisciplineStore';
import { toast } from 'sonner';

export interface LectureTopicMeta {
  id: string;
  title: string;
  description?: string;
}

const COMPLETED_STORAGE_KEY = 'piramid:lectures-completed';
const OPEN_STORAGE_KEY = 'piramid:lectures-open';
const SCROLL_STORAGE_KEY = 'piramid:lectures-scroll';

const loadMapFromStorage = <T = boolean,>(
  storageKey: string
): Record<string, T> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveMapToStorage = <T = boolean,>(
  storageKey: string,
  map: Record<string, T>
) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(map));
  } catch {
    return;
  }
};

const getTopicStorageKey = (id: string) => {
  const discipline = useDisciplineStore.getState().discipline;
  return `${discipline}:${id}`;
};

interface LectureStoreState {
  topics: LectureTopicMeta[];
  openMap: Record<string, boolean>;
  completedMap: Record<string, boolean>;
  scanSections: () => void;
  isSectionOpen: (id: string) => boolean;
  toggleSection: (id: string) => void;
  isSectionCompleted: (id: string) => boolean;
  markSectionCompleted: (id: string) => void;
  toggleSectionCompleted: (id: string) => void;
  navigateToTopic: (id: string) => void;
  copyTopicLink: (id: string) => void;
}

export const scrollWithOffset = (element: HTMLElement) => {
  const isDesktop = window.innerWidth >= 1024;
  const topOffset = isDesktop ? 32 : 64;
  const elementTop = element.getBoundingClientRect().top + window.scrollY;

  window.scrollTo({
    top: Math.max(0, elementTop - topOffset),
    behavior: 'smooth',
  });
};

const scrollToTopicById = (id: string) => {
  const target = document.getElementById(id);
  if (!target) return;
  scrollWithOffset(target);
};

export const useLectureStore = create<LectureStoreState>((set, get) => ({
  topics: [],
  openMap: loadMapFromStorage<boolean>(OPEN_STORAGE_KEY),
  completedMap: loadMapFromStorage<boolean>(COMPLETED_STORAGE_KEY),

  scanSections: () => {
    if (typeof document === 'undefined') return;

    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>('[data-lecture-section]')
    );

    const extracted: LectureTopicMeta[] = nodes.map((node) => ({
      id: node.dataset.sectionId || '',
      title: node.dataset.sectionTitle || '',
      description: node.dataset.sectionDesc || undefined,
    }));

    set({ topics: extracted });
  },

  isSectionOpen: (id: string) => {
    const key = getTopicStorageKey(id);
    return get().openMap[key] ?? true;
  },

  toggleSection: (id: string) => {
    triggerHaptic('light');
    const key = getTopicStorageKey(id);

    set((state) => {
      const current = state.openMap[key] ?? true;
      const next = {
        ...state.openMap,
        [key]: !current,
      };
      saveMapToStorage(OPEN_STORAGE_KEY, next);
      return { openMap: next };
    });
  },

  isSectionCompleted: (id: string) => {
    const key = getTopicStorageKey(id);
    return Boolean(get().completedMap[key]);
  },

  markSectionCompleted: (id: string) => {
    const key = getTopicStorageKey(id);
    if (get().completedMap[key]) return;

    set((state) => {
      const next = { ...state.completedMap, [key]: true };
      saveMapToStorage(COMPLETED_STORAGE_KEY, next);
      return { completedMap: next };
    });
  },

  toggleSectionCompleted: (id: string) => {
    triggerHaptic('light');
    const key = getTopicStorageKey(id);

    set((state) => {
      const nextCompletedState = !state.completedMap[key];
      const nextCompletedMap = {
        ...state.completedMap,
        [key]: nextCompletedState,
      };
      saveMapToStorage(COMPLETED_STORAGE_KEY, nextCompletedMap);

      if (nextCompletedState) {
        const nextOpenMap = {
          ...state.openMap,
          [key]: false,
        };
        saveMapToStorage(OPEN_STORAGE_KEY, nextOpenMap);
        return {
          completedMap: nextCompletedMap,
          openMap: nextOpenMap,
        };
      }

      return { completedMap: nextCompletedMap };
    });
  },

  navigateToTopic: (id: string) => {
    triggerHaptic('light');
    const discipline = useDisciplineStore.getState().discipline;
    const key = getTopicStorageKey(id);
    const wasClosed = !(get().openMap[key] ?? true);

    set((state) => {
      const next = { ...state.openMap, [key]: true };
      saveMapToStorage(OPEN_STORAGE_KEY, next);
      return { openMap: next };
    });

    const url = new URL(window.location.href);
    url.searchParams.set('discipline', discipline);
    url.hash = id;
    window.history.replaceState(null, '', url.toString());

    window.setTimeout(
      () => {
        scrollToTopicById(id);
      },
      wasClosed ? 320 : 20
    );
  },

  copyTopicLink: async (id: string) => {
    triggerHaptic('light');
    const discipline = useDisciplineStore.getState().discipline;

    const url = new URL(window.location.href);
    url.pathname = '/lectures';
    url.searchParams.set('discipline', discipline);
    url.hash = id;

    try {
      await navigator.clipboard.writeText(url.toString());
      toast.success('Ссылка на тему скопирована');
    } catch {
      toast.error('Не удалось скопировать ссылку');
    }
  },
}));

export function useLectureContext() {
  return useLectureStore();
}

export function LectureProvider({
  disciplineKey,
  children,
}: {
  disciplineKey?: string;
  children: ReactNode;
}) {
  const location = useLocation();
  const scanSections = useLectureStore((state) => state.scanSections);
  const topics = useLectureStore((state) => state.topics);
  const isScrollRestoredRef = useRef(false);

  const activeDiscipline =
    disciplineKey || useDisciplineStore.getState().discipline;

  useLayoutEffect(() => {
    scanSections();
  }, [activeDiscipline, scanSections]);

  useEffect(() => {
    isScrollRestoredRef.current = false;

    if (window.location.hash) {
      isScrollRestoredRef.current = true;
      return;
    }

    const scrollMap = loadMapFromStorage<number>(SCROLL_STORAGE_KEY);
    const savedY = scrollMap[activeDiscipline];

    const rafId = window.requestAnimationFrame(() => {
      if (typeof savedY === 'number' && savedY > 0) {
        window.scrollTo({ top: savedY, behavior: 'instant' });
      }
      isScrollRestoredRef.current = true;
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [activeDiscipline]);

  useEffect(() => {
    let rafId: number | null = null;

    const handleScroll = () => {
      if (!isScrollRestoredRef.current) return;
      if (rafId !== null) return;

      rafId = window.requestAnimationFrame(() => {
        const scrollMap = loadMapFromStorage<number>(SCROLL_STORAGE_KEY);
        scrollMap[activeDiscipline] = Math.round(window.scrollY);
        saveMapToStorage(SCROLL_STORAGE_KEY, scrollMap);
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeDiscipline]);

  useEffect(() => {
    if (!location.hash || topics.length === 0) return;

    const rawId = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!rawId) return;

    const exists = topics.some((t) => t.id === rawId);
    if (!exists) return;

    const key = getTopicStorageKey(rawId);

    useLectureStore.setState((state) => {
      const next = { ...state.openMap, [key]: true };
      saveMapToStorage(OPEN_STORAGE_KEY, next);
      return { openMap: next };
    });

    const timer = window.setTimeout(() => {
      scrollToTopicById(rawId);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [location.hash, topics]);

  return <div className="flex flex-col">{children}</div>;
}