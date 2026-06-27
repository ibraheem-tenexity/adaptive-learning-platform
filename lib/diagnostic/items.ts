import type { DiagnosticItem } from '@/lib/zod/diagnostic';

export const DIAGNOSTIC_ITEMS: DiagnosticItem[] = [
  {
    id: 'diag-001',
    prompt: 'What does a variable declaration with `const` mean in JavaScript?',
    options: [
      { label: 'The value can never change', value: 'never-change', isCorrect: false },
      { label: 'The binding cannot be reassigned, but objects it points to can be mutated', value: 'binding-const', isCorrect: true },
      { label: 'The variable is global', value: 'global', isCorrect: false },
      { label: 'The variable is a constant integer', value: 'int', isCorrect: false },
    ],
    conceptArea: 'javascript-fundamentals',
    difficultyLevel: 0.2,
  },
  {
    id: 'diag-002',
    prompt: 'What does JSX compile to in React?',
    options: [
      { label: 'Pure HTML strings', value: 'html', isCorrect: false },
      { label: 'React.createElement() calls', value: 'create-element', isCorrect: true },
      { label: 'Virtual DOM objects directly', value: 'vdom', isCorrect: false },
      { label: 'TypeScript types', value: 'ts', isCorrect: false },
    ],
    conceptArea: 'react-basics',
    difficultyLevel: 0.35,
  },
  {
    id: 'diag-003',
    prompt: 'In React, what hook do you use to run code after a component renders?',
    options: [
      { label: 'useState', value: 'usestate', isCorrect: false },
      { label: 'useCallback', value: 'usecallback', isCorrect: false },
      { label: 'useEffect', value: 'useeffect', isCorrect: true },
      { label: 'useRef', value: 'useref', isCorrect: false },
    ],
    conceptArea: 'react-hooks',
    difficultyLevel: 0.5,
  },
  {
    id: 'diag-004',
    prompt: 'What is the purpose of the dependency array in useEffect?',
    options: [
      { label: 'To list all variables used inside the effect', value: 'all-vars', isCorrect: false },
      { label: 'To control when the effect re-runs — it re-runs when any dependency changes', value: 'control-rerun', isCorrect: true },
      { label: 'To inject props into the effect', value: 'inject-props', isCorrect: false },
      { label: "To declare the effect's return type", value: 'return-type', isCorrect: false },
    ],
    conceptArea: 'react-hooks',
    difficultyLevel: 0.6,
  },
  {
    id: 'diag-005',
    prompt: 'What does Array.prototype.map() return?',
    options: [
      { label: 'A new array with the same length, each element transformed', value: 'new-array', isCorrect: true },
      { label: 'The first element that matches a condition', value: 'first-match', isCorrect: false },
      { label: 'A boolean indicating if any element matches', value: 'boolean', isCorrect: false },
      { label: 'The original array, mutated', value: 'mutated', isCorrect: false },
    ],
    conceptArea: 'javascript-fundamentals',
    difficultyLevel: 0.15,
  },
  {
    id: 'diag-006',
    prompt: 'In React Router v6, which hook gives you access to URL parameters like /users/:id?',
    options: [
      { label: 'useNavigate', value: 'usenavigate', isCorrect: false },
      { label: 'useLocation', value: 'uselocation', isCorrect: false },
      { label: 'useParams', value: 'useparams', isCorrect: true },
      { label: 'useRoute', value: 'useroute', isCorrect: false },
    ],
    conceptArea: 'react-routing',
    difficultyLevel: 0.65,
  },
  {
    id: 'diag-007',
    prompt: 'What is the correct way to update state that depends on the previous value in React?',
    options: [
      { label: 'setState(state + 1)', value: 'direct', isCorrect: false },
      { label: 'setState(prev => prev + 1)', value: 'functional', isCorrect: true },
      { label: 'state = state + 1', value: 'mutate', isCorrect: false },
      { label: 'setState({ prev: state + 1 })', value: 'object', isCorrect: false },
    ],
    conceptArea: 'react-state',
    difficultyLevel: 0.55,
  },
  {
    id: 'diag-008',
    prompt: "Which method is used to prevent a form's default submission behavior in JavaScript?",
    options: [
      { label: 'event.stopPropagation()', value: 'stop', isCorrect: false },
      { label: 'event.preventDefault()', value: 'prevent', isCorrect: true },
      { label: 'event.cancel()', value: 'cancel', isCorrect: false },
      { label: 'return null from the handler', value: 'return-null', isCorrect: false },
    ],
    conceptArea: 'javascript-events',
    difficultyLevel: 0.3,
  },
];

// Seeded answers for the Playwright happy-flow (all correct)
export const PLAYWRIGHT_DIAGNOSTIC_ANSWERS: Record<string, string> = {
  'diag-001': 'binding-const',
  'diag-002': 'create-element',
  'diag-003': 'useeffect',
  'diag-004': 'control-rerun',
  'diag-005': 'new-array',
};
