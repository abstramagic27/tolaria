import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEditorTheme } from './useTheme'

describe('useEditorTheme', () => {
  it('keeps inline code on the Adams editor surface without exporting code block overrides', () => {
    const { result } = renderHook(() => useEditorTheme())

    expect(result.current.cssVars['--inline-styles-code-background-color']).toBe(
      '#242322'
    )
    expect(result.current.cssVars['--code-blocks-background-color']).toBeUndefined()
  })
})
