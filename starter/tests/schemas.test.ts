import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  CodeQualityResultSchema,
  TestCoverageResultSchema,
  RefactoringSuggestionSchema,
  CodeQualityResultJSONSchema,
  TestCoverageResultJSONSchema,
  RefactoringSuggestionJSONSchema
} from '../src/types/analysis-results';
import {
  ReviewReportSchema,
  ReviewReportJSONSchema
} from '../src/types/report-types';

describe('Schema Validation Tests', () => {
  describe('CodeQualityResultSchema', () => {
    it('should accept valid code quality result', () => {
      const validData = {
        file: 'example.ts',
        issues: [
          {
            line: 42,
            severity: 'high' as const,
            category: 'security' as const,
            description: 'SQL injection vulnerability',
            suggestion: 'Use parameterized queries'
          }
        ],
        overallScore: 75,
        summary: 'File has security concerns'
      };
      expect(() => CodeQualityResultSchema.parse(validData)).not.toThrow();
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        file: 'example.ts',
        issues: []
        // missing overallScore and summary
      };
      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid severity', () => {
      const invalidData = {
        file: 'example.ts',
        issues: [
          {
            line: 1,
            severity: 'mega' as any, // Invalid
            category: 'security' as const,
            description: 'test',
            suggestion: 'test'
          }
        ],
        overallScore: 50,
        summary: 'test'
      };
      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid category', () => {
      const invalidData = {
        file: 'example.ts',
        issues: [
          {
            line: 1,
            severity: 'high' as const,
            category: 'invalid-category' as any,
            description: 'test',
            suggestion: 'test'
          }
        ],
        overallScore: 50,
        summary: 'test'
      };
      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow();
    });

    it('should enforce score boundaries (0-100)', () => {
      const invalidLow = {
        file: 'example.ts',
        issues: [],
        overallScore: -1,
        summary: 'test'
      };
      expect(() => CodeQualityResultSchema.parse(invalidLow)).toThrow();

      const invalidHigh = {
        file: 'example.ts',
        issues: [],
        overallScore: 101,
        summary: 'test'
      };
      expect(() => CodeQualityResultSchema.parse(invalidHigh)).toThrow();

      const validBoundary0 = {
        file: 'example.ts',
        issues: [],
        overallScore: 0,
        summary: 'test'
      };
      expect(() => CodeQualityResultSchema.parse(validBoundary0)).not.toThrow();

      const validBoundary100 = {
        file: 'example.ts',
        issues: [],
        overallScore: 100,
        summary: 'test'
      };
      expect(() => CodeQualityResultSchema.parse(validBoundary100)).not.toThrow();
    });

    it('should accept empty issues array', () => {
      const validData = {
        file: 'perfect.ts',
        issues: [],
        overallScore: 100,
        summary: 'Perfect code'
      };
      expect(() => CodeQualityResultSchema.parse(validData)).not.toThrow();
    });
  });

  describe('TestCoverageResultSchema', () => {
    it('should accept valid test coverage result', () => {
      const validData = {
        file: 'utils.ts',
        hasTests: true,
        testFiles: ['utils.test.ts'],
        untestedPaths: [
          {
            type: 'function' as const,
            location: 'parseDate',
            priority: 'high' as const,
            reasoning: 'Critical date parsing function',
            suggestedTest: 'Test parseDate("2024-01-01") returns Date object'
          }
        ],
        coverageEstimate: 85,
        summary: 'Good coverage with a few gaps'
      };
      expect(() => TestCoverageResultSchema.parse(validData)).not.toThrow();
    });

    it('should accept no tests with empty arrays', () => {
      const validData = {
        file: 'constants.ts',
        hasTests: false,
        testFiles: [],
        untestedPaths: [],
        coverageEstimate: 0,
        summary: 'No tests for this file'
      };
      expect(() => TestCoverageResultSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid path types', () => {
      const invalidData = {
        file: 'utils.ts',
        hasTests: false,
        testFiles: [],
        untestedPaths: [
          {
            type: 'invalid-type' as any,
            location: 'test',
            priority: 'high' as const,
            reasoning: 'test',
            suggestedTest: 'test'
          }
        ],
        coverageEstimate: 0,
        summary: 'test'
      };
      expect(() => TestCoverageResultSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid priorities', () => {
      const invalidData = {
        file: 'utils.ts',
        hasTests: false,
        testFiles: [],
        untestedPaths: [
          {
            type: 'function' as const,
            location: 'test',
            priority: 'super-critical' as any,
            reasoning: 'test',
            suggestedTest: 'test'
          }
        ],
        coverageEstimate: 0,
        summary: 'test'
      };
      expect(() => TestCoverageResultSchema.parse(invalidData)).toThrow();
    });

    it('should enforce coverage boundaries (0-100)', () => {
      const validData = {
        file: 'utils.ts',
        hasTests: true,
        testFiles: [],
        untestedPaths: [],
        coverageEstimate: 50,
        summary: 'test'
      };
      expect(() => TestCoverageResultSchema.parse(validData)).not.toThrow();

      const invalidData = {
        file: 'utils.ts',
        hasTests: true,
        testFiles: [],
        untestedPaths: [],
        coverageEstimate: 150,
        summary: 'test'
      };
      expect(() => TestCoverageResultSchema.parse(invalidData)).toThrow();
    });
  });

  describe('RefactoringSuggestionSchema', () => {
    it('should accept valid refactoring suggestion', () => {
      const validData = {
        file: 'handlers.ts',
        suggestions: [
          {
            type: 'extract-function' as const,
            location: 'processRequest (lines 45-78)',
            impact: 'high' as const,
            description: 'Extract validation logic into separate function',
            before: 'if (req.body && req.body.email && req.body.email.includes("@")) {',
            after: 'if (validateEmail(req.body.email)) {',
            benefits: 'Improved readability and reusability'
          }
        ],
        summary: 'Several opportunities for code improvement'
      };
      expect(() => RefactoringSuggestionSchema.parse(validData)).not.toThrow();
    });

    it('should accept empty suggestions array', () => {
      const validData = {
        file: 'perfect.ts',
        suggestions: [],
        summary: 'Code is already well-refactored'
      };
      expect(() => RefactoringSuggestionSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid refactoring types', () => {
      const invalidData = {
        file: 'handlers.ts',
        suggestions: [
          {
            type: 'add-logging' as any, // Invalid
            location: 'test',
            impact: 'high' as const,
            description: 'test',
            before: 'test',
            after: 'test',
            benefits: 'test'
          }
        ],
        summary: 'test'
      };
      expect(() => RefactoringSuggestionSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid impact levels', () => {
      const invalidData = {
        file: 'handlers.ts',
        suggestions: [
          {
            type: 'extract-function' as const,
            location: 'test',
            impact: 'critical' as any, // Invalid (should be low/medium/high)
            description: 'test',
            before: 'test',
            after: 'test',
            benefits: 'test'
          }
        ],
        summary: 'test'
      };
      expect(() => RefactoringSuggestionSchema.parse(invalidData)).toThrow();
    });

    it('should validate all refactoring types', () => {
      const types: Array<'extract-function' | 'rename' | 'modernize' | 'simplify' | 'pattern-improvement'> = [
        'extract-function',
        'rename',
        'modernize',
        'simplify',
        'pattern-improvement'
      ];

      types.forEach(type => {
        const validData = {
          file: 'test.ts',
          suggestions: [
            {
              type,
              location: 'test',
              impact: 'medium' as const,
              description: 'test',
              before: 'test',
              after: 'test',
              benefits: 'test'
            }
          ],
          summary: 'test'
        };
        expect(() => RefactoringSuggestionSchema.parse(validData)).not.toThrow();
      });
    });
  });

  describe('ReviewReportSchema', () => {
    it('should accept valid complete review report', () => {
      const validData = {
        pullRequest: {
          owner: 'facebook',
          repo: 'react',
          number: 1234
        },
        fileReviews: [
          {
            file: 'hooks.ts',
            codeQuality: {
              file: 'hooks.ts',
              issues: [],
              overallScore: 90,
              summary: 'Good code'
            },
            testCoverage: {
              file: 'hooks.ts',
              hasTests: true,
              testFiles: ['hooks.test.ts'],
              untestedPaths: [],
              coverageEstimate: 95,
              summary: 'Well tested'
            },
            refactorings: {
              file: 'hooks.ts',
              suggestions: [],
              summary: 'No refactoring needed'
            }
          }
        ],
        summary: {
          totalFiles: 1,
          overallScore: 90,
          criticalIssues: 0,
          highPriorityTests: 0,
          refactoringOpportunities: 0
        },
        recommendations: [
          {
            priority: 'low' as const,
            category: 'documentation',
            description: 'Add JSDoc comments to exported functions',
            files: ['hooks.ts']
          }
        ],
        metadata: {
          analyzedAt: new Date().toISOString(),
          duration: 5000,
          agentVersions: {
            'code-quality-analyzer': '1.0.0',
            'test-coverage-analyzer': '1.0.0',
            'refactoring-suggester': '1.0.0'
          }
        }
      };
      expect(() => ReviewReportSchema.parse(validData)).not.toThrow();
    });

    it('should accept empty file reviews', () => {
      const validData = {
        pullRequest: {
          owner: 'owner',
          repo: 'repo',
          number: 1
        },
        fileReviews: [],
        summary: {
          totalFiles: 0,
          overallScore: 0,
          criticalIssues: 0,
          highPriorityTests: 0,
          refactoringOpportunities: 0
        },
        recommendations: [],
        metadata: {
          analyzedAt: new Date().toISOString(),
          duration: 100,
          agentVersions: {
            'code-quality-analyzer': '1.0.0',
            'test-coverage-analyzer': '1.0.0',
            'refactoring-suggester': '1.0.0'
          }
        }
      };
      expect(() => ReviewReportSchema.parse(validData)).not.toThrow();
    });

    it('should reject missing required fields in pullRequest', () => {
      const invalidData = {
        pullRequest: {
          owner: 'owner'
          // missing repo and number
        },
        fileReviews: [],
        summary: {
          totalFiles: 0,
          overallScore: 0,
          criticalIssues: 0,
          highPriorityTests: 0,
          refactoringOpportunities: 0
        },
        recommendations: [],
        metadata: {
          analyzedAt: new Date().toISOString(),
          duration: 100,
          agentVersions: {}
        }
      };
      expect(() => ReviewReportSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid recommendation priorities', () => {
      const invalidData = {
        pullRequest: {
          owner: 'owner',
          repo: 'repo',
          number: 1
        },
        fileReviews: [],
        summary: {
          totalFiles: 0,
          overallScore: 0,
          criticalIssues: 0,
          highPriorityTests: 0,
          refactoringOpportunities: 0
        },
        recommendations: [
          {
            priority: 'super-critical' as any,
            category: 'test',
            description: 'test',
            files: []
          }
        ],
        metadata: {
          analyzedAt: new Date().toISOString(),
          duration: 100,
          agentVersions: {}
        }
      };
      expect(() => ReviewReportSchema.parse(invalidData)).toThrow();
    });

    it('should validate JSON schema export', () => {
      expect(CodeQualityResultJSONSchema).toBeDefined();
      expect(typeof CodeQualityResultJSONSchema).toBe('object');
      expect(CodeQualityResultJSONSchema.type).toBe('object');

      expect(TestCoverageResultJSONSchema).toBeDefined();
      expect(typeof TestCoverageResultJSONSchema).toBe('object');
      expect(TestCoverageResultJSONSchema.type).toBe('object');

      expect(RefactoringSuggestionJSONSchema).toBeDefined();
      expect(typeof RefactoringSuggestionJSONSchema).toBe('object');
      expect(RefactoringSuggestionJSONSchema.type).toBe('object');

      expect(ReviewReportJSONSchema).toBeDefined();
      expect(typeof ReviewReportJSONSchema).toBe('object');
      expect(ReviewReportJSONSchema.type).toBe('object');
    });

    it('should have required properties in JSON schemas', () => {
      // CodeQualityResultJSONSchema should have required properties
      if ('required' in CodeQualityResultJSONSchema) {
        const required = CodeQualityResultJSONSchema.required as string[];
        expect(required).toContain('file');
        expect(required).toContain('overallScore');
        expect(required).toContain('summary');
      }

      // ReviewReportJSONSchema should have required properties
      if ('required' in ReviewReportJSONSchema) {
        const required = ReviewReportJSONSchema.required as string[];
        expect(required).toContain('pullRequest');
        expect(required).toContain('fileReviews');
        expect(required).toContain('summary');
        expect(required).toContain('metadata');
      }
    });
  });

  describe('Error Handler Utility Tests', () => {
    it('should validate error handler exports', async () => {
      const { withRetry, withTimeout, ReviewError, ErrorCodes } = await import('../src/utils/error-handler');

      expect(withRetry).toBeDefined();
      expect(typeof withRetry).toBe('function');

      expect(withTimeout).toBeDefined();
      expect(typeof withTimeout).toBe('function');

      expect(ReviewError).toBeDefined();
      expect(typeof ReviewError).toBe('function');

      expect(ErrorCodes).toBeDefined();
      expect(typeof ErrorCodes).toBe('object');
    });

    it('should retry on failure with exponential backoff', async () => {
      const { withRetry } = await import('../src/utils/error-handler');

      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary error');
        }
        return 'success';
      };

      const result = await withRetry(fn, 3, 100);
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should timeout if operation takes too long', async () => {
      const { withTimeout } = await import('../src/utils/error-handler');

      const slowFn = async () => {
        return new Promise(resolve => {
          setTimeout(() => resolve('done'), 5000);
        });
      };

      try {
        await withTimeout(slowFn, 100);
        expect.fail('Should have timed out');
      } catch (error: any) {
        expect(error.code).toBe('AGENT_TIMEOUT');
      }
    });
  });

  describe('Rate Limiter Utility Tests', () => {
    it('should validate rate limiter exports', async () => {
      const { RateLimiter, DEFAULT_RATE_LIMITS } = await import('../src/utils/rate-limiter');

      expect(RateLimiter).toBeDefined();
      expect(typeof RateLimiter).toBe('function');

      expect(DEFAULT_RATE_LIMITS).toBeDefined();
      expect(typeof DEFAULT_RATE_LIMITS).toBe('object');
      expect(DEFAULT_RATE_LIMITS.maxRequestsPerMinute).toBeGreaterThan(0);
      expect(DEFAULT_RATE_LIMITS.maxTokensPerMinute).toBeGreaterThan(0);
      expect(DEFAULT_RATE_LIMITS.maxConcurrent).toBeGreaterThan(0);
    });

    it('should allow requests within limits', async () => {
      const { RateLimiter } = await import('../src/utils/rate-limiter');

      const limiter = new RateLimiter({
        maxRequestsPerMinute: 10,
        maxTokensPerMinute: 10000,
        maxConcurrent: 5
      });

      // Should proceed immediately when under limits
      expect(limiter.canProceed(100)).toBe(true);

      // Acquire a request
      await limiter.acquire(100);

      // Still have capacity
      expect(limiter.canProceed(100)).toBe(true);

      // Release
      limiter.release();

      // Should proceed again
      expect(limiter.canProceed(100)).toBe(true);
    });
  });
});
