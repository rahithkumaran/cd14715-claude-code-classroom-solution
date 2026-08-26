/**
 * Mock data generator for testing report generation
 * Produces realistic, schema-compliant review data
 */

import { ReviewReport } from '../types/report-types.js';
import {
  CodeQualityResult,
  TestCoverageResult,
  RefactoringSuggestion
} from '../types/analysis-results.js';

export function generateMockReviewReport(
  owner: string,
  repo: string,
  prNumber: number
): ReviewReport {
  // Generate PR-specific mock data
  const fileReviews = generateFileReviews(prNumber);

  const summary = {
    totalFiles: fileReviews.length,
    overallScore: Math.round(
      fileReviews.reduce((sum, r) => sum + r.codeQuality.overallScore, 0) /
        fileReviews.length
    ),
    criticalIssues: fileReviews.reduce(
      (sum, r) => sum + r.codeQuality.issues.filter(i => i.severity === 'critical').length,
      0
    ),
    highPriorityTests: fileReviews.reduce(
      (sum, r) =>
        sum +
        r.testCoverage.untestedPaths.filter(p => p.priority === 'critical' || p.priority === 'high')
          .length,
      0
    ),
    refactoringOpportunities: fileReviews.reduce(
      (sum, r) => sum + r.refactorings.suggestions.length,
      0
    )
  };

  const recommendations = generateRecommendations(fileReviews);

  return {
    pullRequest: { owner, repo, number: prNumber },
    fileReviews,
    summary,
    recommendations,
    metadata: {
      analyzedAt: new Date().toISOString(),
      duration: Math.floor(Math.random() * 30000) + 5000,
      agentVersions: {
        'code-quality-analyzer': '1.0.0',
        'test-coverage-analyzer': '1.0.0',
        'refactoring-suggester': '1.0.0'
      }
    }
  };
}

function generateFileReviews(prNumber: number) {
  const files = getFilesForPR(prNumber);
  return files.map(file => ({
    file,
    codeQuality: generateCodeQualityResult(file, prNumber),
    testCoverage: generateTestCoverageResult(file, prNumber),
    refactorings: generateRefactoringSuggestions(file, prNumber)
  }));
}

function getFilesForPR(prNumber: number): string[] {
  const filesByPR: Record<number, string[]> = {
    1: ['src/components/TodoItem.tsx', 'src/utils/helpers.ts', 'src/types/index.ts'],
    2: ['src/components/SearchBar.tsx', 'src/hooks/useSearch.ts', 'src/utils/search.ts'],
    3: [
      'src/components/Premium.tsx',
      'src/services/subscription.ts',
      'src/utils/payment.ts',
      'src/types/subscription.ts'
    ]
  };
  return filesByPR[prNumber] || ['src/example.ts'];
}

function generateCodeQualityResult(file: string, prNumber: number): CodeQualityResult {
  const issuesByFile: Record<string, any[]> = {
    'src/components/TodoItem.tsx': [
      {
        line: 45,
        severity: 'high' as const,
        category: 'maintainability' as const,
        description: 'Missing TypeScript return type on component',
        suggestion: 'Add explicit return type: React.FC<TodoItemProps>'
      },
      {
        line: 67,
        severity: 'medium' as const,
        category: 'best-practice' as const,
        description: 'useState without initial value check',
        suggestion: 'Provide explicit initial state or verify value exists'
      }
    ],
    'src/components/SearchBar.tsx': [
      {
        line: 23,
        severity: 'high' as const,
        category: 'performance' as const,
        description: 'Missing debounce on search input',
        suggestion: 'Use useCallback or a debounce hook to prevent excessive searches'
      }
    ],
    'src/components/Premium.tsx': [
      {
        line: 34,
        severity: 'critical' as const,
        category: 'security' as const,
        description: 'API key exposed in client-side code',
        suggestion: 'Move API key to environment variables and backend proxy'
      },
      {
        line: 78,
        severity: 'high' as const,
        category: 'bug-risk' as const,
        description: 'Missing error boundary for payment processing',
        suggestion: 'Wrap payment component with error boundary'
      }
    ],
    'src/utils/search.ts': [
      {
        line: 12,
        severity: 'medium' as const,
        category: 'maintainability' as const,
        description: 'Function too complex with nested conditionals',
        suggestion: 'Extract nested conditions into separate helper functions'
      }
    ]
  };

  const issues = issuesByFile[file] || [];
  const baseScore =
    prNumber === 3
      ? 65 // PR 3 has security issues
      : prNumber === 2
        ? 80
        : 85;

  const scoreAdjustment = issues.reduce((sum, issue) => {
    return sum + (issue.severity === 'critical' ? -15 : issue.severity === 'high' ? -10 : -5);
  }, 0);

  return {
    file,
    issues,
    overallScore: Math.max(30, Math.min(100, baseScore + scoreAdjustment)),
    summary:
      issues.length === 0
        ? 'File has good code quality with no major issues'
        : `File has ${issues.length} issue(s) that should be addressed before merging`
  };
}

function generateTestCoverageResult(file: string, prNumber: number): TestCoverageResult {
  const testFilesByPR: Record<number, Record<string, string[]>> = {
    1: {
      'src/components/TodoItem.tsx': ['src/components/TodoItem.test.tsx'],
      'src/utils/helpers.ts': [],
      'src/types/index.ts': []
    },
    2: {
      'src/components/SearchBar.tsx': ['src/components/SearchBar.test.tsx'],
      'src/hooks/useSearch.ts': [],
      'src/utils/search.ts': ['src/utils/search.test.ts']
    },
    3: {
      'src/components/Premium.tsx': [],
      'src/services/subscription.ts': [],
      'src/utils/payment.ts': [],
      'src/types/subscription.ts': []
    }
  };

  const testFiles = testFilesByPR[prNumber]?.[file] || [];
  const hasTests = testFiles.length > 0;

  const untestedPathsByFile: Record<string, any[]> = {
    'src/components/TodoItem.tsx': [
      {
        type: 'function' as const,
        location: 'handleDelete',
        priority: 'high' as const,
        reasoning: 'Critical user action that should have test coverage',
        suggestedTest:
          'Test that clicking delete button calls onDelete with correct ID and shows confirmation'
      }
    ],
    'src/components/SearchBar.tsx': [
      {
        type: 'branch' as const,
        location: 'search result filtering',
        priority: 'high' as const,
        reasoning: 'Core functionality must be tested',
        suggestedTest: 'Test search filters results correctly for partial matches'
      },
      {
        type: 'edge-case' as const,
        location: 'empty search state',
        priority: 'medium' as const,
        reasoning: 'Edge case handling',
        suggestedTest: 'Test that empty search returns all items'
      }
    ],
    'src/utils/search.ts': [
      {
        type: 'function' as const,
        location: 'search algorithm',
        priority: 'critical' as const,
        reasoning: 'Core algorithm must be thoroughly tested',
        suggestedTest:
          'Test search accuracy with partial matches, case sensitivity, and special characters'
      },
      {
        type: 'edge-case' as const,
        location: 'null/undefined handling',
        priority: 'high' as const,
        reasoning: 'Prevent runtime errors',
        suggestedTest: 'Test that null/undefined inputs are handled gracefully'
      }
    ],
    'src/components/Premium.tsx': [
      {
        type: 'function' as const,
        location: 'payment processing',
        priority: 'critical' as const,
        reasoning: 'Financial transactions must be tested',
        suggestedTest: 'Test successful payment flow and error scenarios'
      },
      {
        type: 'branch' as const,
        location: 'subscription validation',
        priority: 'critical' as const,
        reasoning: 'Business logic validation',
        suggestedTest: 'Test valid and invalid subscription states'
      }
    ],
    'src/services/subscription.ts': [
      {
        type: 'function' as const,
        location: 'API integration',
        priority: 'critical' as const,
        reasoning: 'API errors must be properly handled',
        suggestedTest: 'Test success responses, network errors, and invalid responses'
      }
    ]
  };

  const untestedPaths = untestedPathsByFile[file] || [];
  const coverageEstimate = hasTests ? 65 + Math.random() * 25 : 0;

  return {
    file,
    hasTests,
    testFiles,
    untestedPaths,
    coverageEstimate: Math.round(coverageEstimate),
    summary: hasTests
      ? `File has ${testFiles.length} test file(s) with ${Math.round(coverageEstimate)}% estimated coverage. Several paths need additional tests.`
      : 'No test files found for this component. Tests are critical and should be added.'
  };
}

function generateRefactoringSuggestions(file: string, prNumber: number): RefactoringSuggestion {
  const suggestionsByFile: Record<string, any[]> = {
    'src/components/TodoItem.tsx': [
      {
        type: 'extract-function' as const,
        location: 'render method (lines 45-85)',
        impact: 'high' as const,
        description: 'Extract delete confirmation logic into separate component',
        before:
          '{showConfirm ? <ConfirmDialog onClick={handleDelete} /> : <button onClick={() => setShowConfirm(true)}>Delete</button>}',
        after: '<DeleteButton onDelete={handleDelete} />',
        benefits:
          'Improves component readability and makes confirmation logic reusable across the app'
      },
      {
        type: 'modernize' as const,
        location: 'state management',
        impact: 'medium' as const,
        description: 'Use useReducer instead of multiple useState for complex state',
        before:
          'const [isDone, setIsDone] = useState(false); const [showConfirm, setShowConfirm] = useState(false);',
        after:
          'const [state, dispatch] = useReducer(todoReducer, initialState);',
        benefits:
          'Cleaner state management and easier to test state transitions'
      }
    ],
    'src/components/SearchBar.tsx': [
      {
        type: 'simplify' as const,
        location: 'search filter logic',
        impact: 'high' as const,
        description: 'Reduce deeply nested conditionals in filter function',
        before:
          'if (query) { if (!isLoading) { if (results) { return results.filter(...) } } }',
        after: 'return isSearchActive(query, isLoading) ? filterResults(results, query) : results;',
        benefits: 'Improves readability and makes logic easier to maintain'
      }
    ],
    'src/components/Premium.tsx': [
      {
        type: 'extract-function' as const,
        location: 'payment form validation',
        impact: 'high' as const,
        description: 'Move validation logic to separate utility module',
        before: 'if (!cardNumber || !expiry || !cvc) { showError(...) }',
        after: 'const validation = validatePaymentInfo(paymentData); if (!validation.valid) showError(...)',
        benefits:
          'Enables reuse across multiple payment forms and easier unit testing'
      },
      {
        type: 'pattern-improvement' as const,
        location: 'async payment handling',
        impact: 'high' as const,
        description: 'Use custom hook for payment processing (usePayment)',
        before:
          'const [loading, setLoading] = useState(false); const processPayment = async () => { setLoading(true); ... }',
        after: 'const { processPayment, loading } = usePayment();',
        benefits: 'Reduces component complexity and enables testing business logic separately'
      }
    ],
    'src/utils/search.ts': [
      {
        type: 'simplify' as const,
        location: 'search algorithm',
        impact: 'medium' as const,
        description: 'Use Array.filter and includes for simpler search',
        before:
          'for (let i = 0; i < items.length; i++) { if (items[i].name.indexOf(query) > -1) { results.push(...) } }',
        after: 'items.filter(item => item.name.toLowerCase().includes(query.toLowerCase()))',
        benefits: 'More readable and leverages built-in array methods'
      }
    ]
  };

  const suggestions = suggestionsByFile[file] || [];

  return {
    file,
    suggestions,
    summary:
      suggestions.length === 0
        ? 'Code structure is well-organized and follows best practices'
        : `${suggestions.length} refactoring opportunity(ies) identified that could improve maintainability and performance`
  };
}

function generateRecommendations(
  fileReviews: Array<{
    file: string;
    codeQuality: CodeQualityResult;
    testCoverage: TestCoverageResult;
    refactorings: RefactoringSuggestion;
  }>
) {
  const recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    description: string;
    files: string[];
  }> = [];

  // Collect critical and high-severity issues
  fileReviews.forEach(review => {
    review.codeQuality.issues.forEach(issue => {
      if (issue.severity === 'critical') {
        recommendations.push({
          priority: 'critical',
          category: issue.category,
          description: issue.description,
          files: [review.file]
        });
      } else if (issue.severity === 'high') {
        recommendations.push({
          priority: 'high',
          category: issue.category,
          description: issue.description,
          files: [review.file]
        });
      }
    });
  });

  // Collect high-priority test gaps
  fileReviews.forEach(review => {
    const highPriorityTests = review.testCoverage.untestedPaths.filter(p =>
      ['critical', 'high'].includes(p.priority)
    );
    if (highPriorityTests.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'test-coverage',
        description: `Add tests for untested code paths: ${highPriorityTests.map(p => p.location).join(', ')}`,
        files: [review.file]
      });
    }
  });

  // Collect high-impact refactorings
  fileReviews.forEach(review => {
    review.refactorings.suggestions
      .filter(s => s.impact === 'high')
      .forEach(suggestion => {
        recommendations.push({
          priority: 'medium',
          category: suggestion.type,
          description: suggestion.description,
          files: [review.file]
        });
      });
  });

  // Sort by priority
  const priorityOrder: Record<'critical' | 'high' | 'medium' | 'low', number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3
  };
  return recommendations
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 10);
}
