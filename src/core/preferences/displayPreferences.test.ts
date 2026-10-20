import { describe, expect, it } from 'vitest'
import { defaultDisplayPreference, displayPreferenceRecordSchema, highlightCounter, personalComfort } from './displayPreferences'

describe('personal counters', () => {
  it.each([0, undefined, NaN, Infinity])('keeps zero and unavailable values neutral: %s', (value) => {
    expect(highlightCounter(value, defaultDisplayPreference)).toBe(false)
  })
  it.each([1, -1, 0.5])('highlights every finite nonzero value: %s', (value) => {
    expect(highlightCounter(value, defaultDisplayPreference)).toBe(true)
    expect(highlightCounter(value, { ...defaultDisplayPreference, highlightNonZero: false })).toBe(false)
  })
  it('rejects unknown fields, string booleans and invalid revisions', () => {
    expect(displayPreferenceRecordSchema.safeParse({ revision: 0, preference: defaultDisplayPreference }).success).toBe(true)
    for (const value of [
      { revision: -1, preference: defaultDisplayPreference },
      { revision: 0, preference: { ...defaultDisplayPreference, user: 'other' } },
      { revision: 0, preference: { showCounters: 'false', highlightNonZero: true } },
    ]) expect(displayPreferenceRecordSchema.safeParse(value).success).toBe(false)
  })
})

describe('personal comfort', () => {
  it('inherits all administrator values by default and reads old preferences', () => {
    expect(personalComfort(defaultDisplayPreference)).toEqual({})
    expect(displayPreferenceRecordSchema.parse({ revision: 4, preference: { showCounters: false, highlightNonZero: true } }).preference).toEqual({ ...defaultDisplayPreference, showCounters: false })
  })
  it('overrides only explicit widths and density', () => {
    expect(personalComfort({ ...defaultDisplayPreference, searchWidth: 600, density: 'compact' })).toEqual({ search_width: 600, row_height: 30, control_height: 30 })
    expect(personalComfort({ ...defaultDisplayPreference, sidebarWidth: 240, density: 'comfortable' })).toEqual({ sidebar_width: 240, row_height: 38, control_height: 36 })
  })
  it.each([{ theme: 'admin' }, { density: 'huge' }, { searchWidth: 399 }, { searchWidth: 1201 }, { sidebarWidth: 179 }, { sidebarWidth: 361 }, { sidebarWidth: 240.5 }])('rejects invalid overrides %s', (input) => {
    expect(displayPreferenceRecordSchema.safeParse({ revision: 0, preference: { ...defaultDisplayPreference, ...input } }).success).toBe(false)
  })
})
