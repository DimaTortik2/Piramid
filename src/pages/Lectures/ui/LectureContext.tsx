import { useEffect, useLayoutEffect, type ReactNode } from 'react';
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

interface LectureStoreState {
  topics: LectureTopicMeta[];
  openMap: Record<string, boolean>;
  scanSections: () => void;
  isSectionOpen: (id: string) => boolean;
  toggleSection: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
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
  openMap: {},

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

    set((state) => {
      const nextOpenMap: Record<string, boolean> = {};
      for (const item of extracted) {
        nextOpenMap[item.id] = state.openMap[item.id] ?? true;
      }
      return {
        topics: extracted,
        openMap: nextOpenMap,
      };
    });
  },

  isSectionOpen: (id: string) => {
    return get().openMap[id] ?? true;
  },

  toggleSection: (id: string) => {
    triggerHaptic('light');
    set((state) => ({
      openMap: {
        ...state.openMap,
        [id]: !(state.openMap[id] ?? true),
      },
    }));
  },

  expandAll: () => {
    triggerHaptic('light');
    set((state) => {
      const next: Record<string, boolean> = {};
      for (const t of state.topics) {
        next[t.id] = true;
      }
      return { openMap: next };
    });
  },

  collapseAll: () => {
    triggerHaptic('light');
    set((state) => {
      const next: Record<string, boolean> = {};
      for (const t of state.topics) {
        next[t.id] = false;
      }
      return { openMap: next };
    });
  },

  navigateToTopic: (id: string) => {
    triggerHaptic('light');
    const discipline = useDisciplineStore.getState().discipline;
    const wasClosed = !(get().openMap[id] ?? true);

    set((state) => ({
      openMap: { ...state.openMap, [id]: true },
    }));

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

  useLayoutEffect(() => {
    scanSections();
  }, [disciplineKey, scanSections]);

  useEffect(() => {
    if (!location.hash || topics.length === 0) return;

    const rawId = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!rawId) return;

    const exists = topics.some((t) => t.id === rawId);
    if (!exists) return;

    useLectureStore.setState((state) => ({
      openMap: { ...state.openMap, [rawId]: true },
    }));

    const timer = window.setTimeout(() => {
      scrollToTopicById(rawId);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [location.hash, topics]);

  return <div className="flex flex-col">{children}</div>;
}