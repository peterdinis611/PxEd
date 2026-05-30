import { EditorProvider } from '@/context/EditorContext'
import { AppRouter } from '@/routes/AppRouter'

export default function App() {
  return (
    <EditorProvider>
      <AppRouter />
    </EditorProvider>
  )
}
