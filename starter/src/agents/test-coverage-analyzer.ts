import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { TEST_COVERAGE_ANALYZER_PROMPT } from '../prompts';

/**
 * Test Coverage Analyzer Agent
 * Evaluates test completeness and suggests missing test cases
 */
export const testCoverageAnalyzer: AgentDefinition = {
  description: 'Evaluates test completeness, identifies untested code paths, suggests missing test cases with priorities and specific test suggestions.',
  prompt: TEST_COVERAGE_ANALYZER_PROMPT,
  tools: [],
  model: 'inherit' // Inherit model from orchestrator
};
