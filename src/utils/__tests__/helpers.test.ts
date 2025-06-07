import { formatDate, truncateText, generateId, validateApiKey } from '../helpers'

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const testDateString = '2025-01-01T12:00:00Z'
      const formatted = formatDate(testDateString)
      expect(formatted).toBeDefined()
      expect(typeof formatted).toBe('string')
    })

    it('returns relative time for recent dates', () => {
      const recentDate = new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      const formatted = formatDate(recentDate)
      expect(formatted).toBe('30分前')
    })
  })

  describe('truncateText', () => {
    it('truncates long text correctly', () => {
      const longText = 'This is a very long text that should be truncated'
      const result = truncateText(longText, 20)
      expect(result.length).toBeLessThanOrEqual(23) // 20 + '...'
      expect(result).toContain('...')
    })

    it('does not truncate short text', () => {
      const shortText = 'Short text'
      const result = truncateText(shortText, 20)
      expect(result).toBe(shortText)
    })

    it('uses default max length when not specified', () => {
      const longText = 'This is a very long text that should be truncated because it exceeds the default length'
      const result = truncateText(longText)
      expect(result.length).toBeLessThanOrEqual(53) // 50 + '...'
    })
  })

  describe('generateId', () => {
    it('generates unique IDs with prefix', () => {
      const id1 = generateId('test')
      const id2 = generateId('test')
      expect(id1).toMatch(/^test_[a-f0-9]{8}$/)
      expect(id2).toMatch(/^test_[a-f0-9]{8}$/)
      expect(id1).not.toBe(id2)
    })

    it('uses default prefix when not specified', () => {
      const id = generateId()
      expect(id).toMatch(/^id_[a-f0-9]{8}$/)
    })
  })

  describe('validateApiKey', () => {
    it('validates correct OpenAI API key format', () => {
      const validKey = 'sk-1234567890abcdef1234567890abcdef'
      expect(validateApiKey(validKey)).toBe(true)
    })

    it('rejects invalid API key format', () => {
      expect(validateApiKey('invalid-key')).toBe(false)
      expect(validateApiKey('sk-short')).toBe(false)
      expect(validateApiKey('')).toBe(false)
    })
  })
})