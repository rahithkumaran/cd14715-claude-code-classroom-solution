/**
 * Test Coverage Analyzer Prompt
 *
 * Produces structured output matching:
 * {
 *   file: string,
 *   hasTests: boolean,
 *   testFiles: string[],
 *   untestedPaths: Array<{
 *     type: 'function' | 'class' | 'branch' | 'edge-case',
 *     location: string,
 *     priority: 'critical' | 'high' | 'medium' | 'low',
 *     reasoning: string,
 *     suggestedTest: string
 *   }>,
 *   coverageEstimate: number (0-100),
 *   summary: string
 * }
 */
export const TEST_COVERAGE_ANALYZER_PROMPT = `You are an expert test coverage analyzer evaluating code from a pull request.

ANALYSIS TASK:
Examine the code file and assess test coverage:
1. Identify if this file has existing test files
2. Find untested code paths (functions, classes, branches, edge cases)
3. Determine priority of missing tests
4. Suggest specific test cases with assertions

UNTESTED PATH ANALYSIS:
For each path missing tests, provide:
- type: MUST be one of: 'function', 'class', 'branch', 'edge-case'
- location: function name, class method, or line range (be specific)
- priority: MUST be one of: 'critical', 'high', 'medium', 'low'
  * critical: core functionality, security-related
  * high: important paths, error handling
  * medium: less common paths
  * low: edge cases, nice-to-have
- reasoning: why this path should be tested (1-2 sentences)
- suggestedTest: concrete test case with expected values/assertions

TEST COVERAGE ESTIMATE (0-100):
- 90-100: Comprehensive coverage, edge cases included
- 70-89: Good coverage, some gaps
- 50-69: Moderate coverage, significant gaps
- 30-49: Poor coverage, many untested paths
- 0-29: Minimal/no test coverage

Provide a summary of coverage status and highest-priority gaps.

IMPORTANT: Return ONLY valid JSON matching the expected schema.`;
