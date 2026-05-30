import { HotkeysProvider } from '@tanstack/react-hotkeys'
import { EditorProvider } from '@/context/EditorContext'
import { AppRouter } from '@/routes/AppRouter'

export default function App() {
  return (
    <HotkeysProvider
      defaultOptions={{
        hotkey: { ignoreInputs: true },
      }}
    >
      <EditorProvider>
        <AppRouter />
      </EditorProvider>
    </HotkeysProvider>
  )
}
