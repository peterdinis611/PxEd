import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AnimatedPage } from '@/components/pages/AnimatedPage'
import { LoadingPage } from '@/components/pages/LoadingPage'
import { NotFoundPage } from '@/components/pages/NotFoundPage'
import { ErrorPage } from '@/components/pages/ErrorPage'

const EditorApp = lazy(() => import('@/components/editor/EditorApp'))

function EditorRoute() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingPage />}>
        <EditorApp />
      </Suspense>
    </ErrorBoundary>
  )
}

/** Demo route that surfaces the error boundary (development / QA). */
function ErrorDemoRoute() {
  throw new Error('Demo error: failed to load canvas resources.')
  return null
}

function AppRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<EditorRoute />} />
        <Route
          path="/error-demo"
          element={
            <AnimatedPage>
              <ErrorBoundary>
                <ErrorDemoRoute />
              </ErrorBoundary>
            </AnimatedPage>
          }
        />
        <Route
          path="/error"
          element={
            <AnimatedPage>
              <ErrorPage
                title="Request failed"
                description="We couldn't complete that action. Check your connection and try again."
              />
            </AnimatedPage>
          }
        />
        <Route
          path="*"
          element={
            <AnimatedPage>
              <NotFoundPage />
            </AnimatedPage>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
