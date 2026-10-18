import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/pages/RootLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: (
      <div className="p-10 font-bold text-red-500">
        Ой, страница не найдена 404!
      </div>
    ),
    children: [
      {
        index: true,
        lazy: async () => {
          const { MainPage } = await import('@/pages/MainPage/MainPage');
          return { Component: MainPage };
        },
      },
      {
        path: 'lectures',
        loader: async (args) => {
          const { lectureLoader } =
            await import('@/pages/Lectures/loader/lectureLoader');
          return lectureLoader(args);
        },
        lazy: async () => {
          const { LecturePage } =
            await import('@/pages/Lectures/LecturePage');
          return {
            Component: LecturePage,
          };
        },
        handle: { hideNavBar: true, pauseBackground: true },
      },
      {
        path: 'training',
        lazy: async () => {
          const { TrainingPage } = await import('@/pages/TrainingPage');
          return { Component: TrainingPage };
        },
      },
      {
        path: 'spectator',
        lazy: async () => {
          const { SpectatorPage } = await import('@/pages/SpectatorPage');
          return { Component: SpectatorPage };
        },
        handle: { hideNavBar: true },
      },
      {
        path: 'settings',
        lazy: async () => {
          const { SettingsPage } =
            await import('@/pages/Settings/SettingsPage');
          return { Component: SettingsPage };
        },
      },
      {
        path: 'game/:mode',
        lazy: async () => {
          const { GamePage } = await import('@/pages/Game/GamePage');
          return { Component: GamePage };
        },
        handle: { hideNavBar: true },
      },
      {
        path: 'history',
        lazy: async () => {
          const { HistoryPage } = await import('@/pages/History/HistoryPage');
          return { Component: HistoryPage };
        },
      },
    ],
  },
]);