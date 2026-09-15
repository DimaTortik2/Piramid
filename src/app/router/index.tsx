import { LecturePage } from '@/pages/Lectures/Lecture/LecturePage';
import { lectureLoader } from '@/pages/Lectures/Lecture/loader/lectureLoader';
import { LecturesListPage } from '@/pages/Lectures/List/LecturesListPage';
import { MainPage } from '@/pages/MainPage/MainPage';
import { RootLayout } from '@/pages/RootLayout';
import { TrainingPage } from '@/pages/TrainingPage';
import { createBrowserRouter } from 'react-router-dom';

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
        element: <MainPage />,
      },
      {
        path: 'lectures',
        children: [
          {
            index: true,
            element: <LecturesListPage />,
          },
          {
            path: ':slug',
            element: <LecturePage />,
            loader: lectureLoader,
            handle: { hideNavBar: true },
          },
        ],
      },
      {
        path: 'training',
        element: <TrainingPage />,
      },
    ],
  },
]);
