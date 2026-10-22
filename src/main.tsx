import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster
      position="top-center"
      theme="dark"
       duration={1500}
      toastOptions={{
        classNames: {
          toast:
            '!bg-background !text-foreground !border-foreground/5 !rounded-md touch-none',
        },
      }}
    />
    <Analytics />
  </StrictMode>
);
