import { useState } from 'react';
import { HomeScreen } from './pages/HomeScreen';
import { EditorScreen } from './pages/EditorScreen';

export default function App() {
  const [activeTreeId, setActiveTreeId] = useState<string | null>(null);

  if (activeTreeId) {
    return (
      <EditorScreen
        treeId={activeTreeId}
        onBack={() => setActiveTreeId(null)}
      />
    );
  }

  return <HomeScreen onOpenTree={setActiveTreeId} />;
}
