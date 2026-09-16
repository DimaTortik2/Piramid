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
        children: [
          {
            index: true,
            lazy: async () => {
              const { LecturesListPage } =
                await import('@/pages/Lectures/List/LecturesListPage');
              return { Component: LecturesListPage };
            },
          },
          {
            path: ':slug',
            lazy: async () => {
              const { LecturePage } =
                await import('@/pages/Lectures/Lecture/LecturePage');
              const { lectureLoader } =
                await import('@/pages/Lectures/Lecture/loader/lectureLoader');
              return {
                Component: LecturePage,
                loader: lectureLoader,
              };
            },
            handle: { hideNavBar: true },
          },
        ],
      },
      {
        path: 'training',
        lazy: async () => {
          const { TrainingPage } = await import('@/pages/TrainingPage');
          return { Component: TrainingPage };
        },
      },
    ],
  },
]);
