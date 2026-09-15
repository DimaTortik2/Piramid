import React, { useEffect } from 'react';

interface LoaderProps {
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  text = 'Грузимся...',
  fullScreen = true,
  className = '',
}) => {
  useEffect(() => {
    if (!fullScreen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [fullScreen]);

  return (
    <>
      <style>{`
        /* 1. Плавное проявление самого оверлея */
        .loader-fade-in {
          animation: fadeIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* 2. Лёгкое мягкое выплывание контента внутри (scale + fade) */
        .loader-content-enter {
          animation: contentScaleIn 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .perspective-container {
          perspective: 800px;
        }

        .circle-loader {
          transform-origin: center;
          animation: rotate-coin 3s linear infinite;
          will-change: transform;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes contentScaleIn {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes rotate-coin {
          0% {
            transform: rotateX(0deg) rotateY(0deg);
          }
          45% {
            transform: rotateX(70deg) rotateY(50deg);
          }
          50%,
          52% {
            transform: rotateX(75deg) rotateY(55deg);
          }
          100% {
            transform: rotateX(0deg) rotateY(0deg);
          }
        }
      `}</style>

      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        className={`loader-fade-in perspective-container flex flex-col items-center justify-center bg-[#212121] select-none ${
          fullScreen
            ? 'pointer-events-auto fixed inset-0 z-[9999] h-[100dvh] w-screen touch-none'
            : 'h-full w-full p-8'
        } ${className}`}
      >
        <div className="loader-content-enter flex flex-col items-center justify-center gap-4">
          <svg
            viewBox="0 0 200 200"
            stroke="currentColor"
            className="h-[calc((1vh+1vw)*15)] w-[calc((1vh+1vw)*15)] text-[#219644]"
          >
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              strokeWidth={4}
              className="circle-loader"
            />
          </svg>
          {text && (
            <p className="text-center font-sans text-[20px] leading-[1.4] font-semibold text-white/45">
              {text}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Loader;
