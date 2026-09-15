import Loader from '@/shared/Loaders/Loader';
import { useEffect, useState, type ComponentProps } from 'react';
import { useNavigation } from 'react-router-dom';

interface NavigationLoaderProps extends ComponentProps<typeof Loader> {}

export function NavigationLoader(props: NavigationLoaderProps) {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== 'idle';

  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isNavigating) {
      timeout = setTimeout(() => {
        setShowLoader(true);
      }, 400);
    } else {
      setShowLoader(false);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [isNavigating]);

  if (!showLoader) return null;

  return <Loader {...props} fullScreen />;
}
