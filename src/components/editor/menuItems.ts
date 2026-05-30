export type MenuItem =
  | { type: 'separator' }
  | {
      type: 'item'
      label: string
      action: () => void
      shortcut?: string
      disabled?: boolean
    }

export type MenuDefinition = {
  label: string
  items: MenuItem[]
}
