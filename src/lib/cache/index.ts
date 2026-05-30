export { LruCache } from '@/lib/cache/lruCache'
export {
  getCheckerboardCanvas,
  clearCheckerboardCache,
} from '@/lib/cache/checkerboardCache'
export {
  DRAFT_CACHE_VERSION,
  saveEditorDraft,
  loadEditorDraft,
  clearEditorDraft,
  isDraftStorageAvailable,
  draftHasMeaningfulContent,
  type EditorDraftCache,
  type CachedLayerSnapshot,
} from '@/lib/cache/draftStorage'
export { buildEditorDraft, type DraftSourceState } from '@/lib/cache/buildDraft'
