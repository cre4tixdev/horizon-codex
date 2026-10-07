import { describe, expect, it } from 'vitest'
import { opportunityDraft, opportunityInputSchema } from './opportunities'
const valid = { ...opportunityDraft(), title: 'Studio', company: 'company00000001', owner: 'owner0000000001', stage: 'stage0000000001' }
describe('qualification multiple des opportunités', () => {
  it('accepte zéro ou plusieurs types et refuse les doublons', () => {
    expect(opportunityInputSchema.parse(valid).market_types).toEqual([])
    const markets = ['market000000001', 'market000000002']
    expect(opportunityInputSchema.parse({ ...valid, market_types: markets }).market_types).toEqual(markets)
    expect(opportunityInputSchema.safeParse({ ...valid, market_types: [markets[0], markets[0]] }).success).toBe(false)
    expect(opportunityInputSchema.safeParse({ ...valid, market_types: markets[0] }).success).toBe(false)
  })
})
