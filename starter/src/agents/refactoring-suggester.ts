import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { REFACTORING_SUGGESTER_PROMPT } from '../prompts';

/**
 * Refactoring Suggester Agent
 * Recommends architectural improvements and refactoring opportunities
 */
export const refactoringSuggester: AgentDefinition = {
  description: 'Recommends architectural improvements, refactoring opportunities, and code modernization with before/after examples and impact assessment.',
  prompt: REFACTORING_SUGGESTER_PROMPT,
  tools: [],
  model: 'inherit' // Inherit model from orchestrator
};
