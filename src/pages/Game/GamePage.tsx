import { useParams } from 'react-router-dom';

interface GamePageProps {}

export function GamePage({}: GamePageProps) {
  const { mode } = useParams<{ mode: string }>();

  

  return <div>{mode}</div>;
}
