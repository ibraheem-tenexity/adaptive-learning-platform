import type { PathPlan } from '@/lib/zod/planner';

export const MOCK_PATH_PLAN: PathPlan = {
  skills: [
    { name: 'JavaScript Fundamentals', objective: 'Understand variables, functions, arrays, and objects', difficultySeed: 0.2, position: 0, prereqs: [] },
    { name: 'React Basics', objective: 'Understand components, JSX, and props', difficultySeed: 0.35, position: 1, prereqs: ['JavaScript Fundamentals'] },
    { name: 'React State & Hooks', objective: 'Master useState, useEffect, and component lifecycle', difficultySeed: 0.5, position: 2, prereqs: ['React Basics'] },
    { name: 'React Forms & Events', objective: 'Handle user input and form submissions in React', difficultySeed: 0.6, position: 3, prereqs: ['React State & Hooks'] },
    { name: 'React Routing', objective: 'Implement client-side navigation with React Router', difficultySeed: 0.65, position: 4, prereqs: ['React Forms & Events'] },
  ],
  modules: [
    {
      skillName: 'JavaScript Fundamentals',
      title: 'JavaScript Fundamentals for React',
      objective: 'Review the JS concepts you need before touching React',
      estMinutes: 60,
      resources: [
        { title: 'JavaScript basics review', type: 'article', whatToStudy: 'Variables (let/const), arrow functions, array methods (map, filter, reduce), destructuring, and modules', url: null, isAiSuggested: true },
        { title: 'ES6+ features walkthrough', type: 'exercise', whatToStudy: 'Practice spread operator, template literals, and async/await basics', url: null, isAiSuggested: true },
      ],
      check: {
        items: [
          { prompt: 'What does the spread operator (...) do when used with an array?', answerKey: 'copies all elements of the array into a new array or function arguments', conceptTag: 'spread-operator' },
          { prompt: 'Write a one-line arrow function that doubles a number.', answerKey: 'const double = x => x * 2', conceptTag: 'arrow-functions' },
          { prompt: 'What is the difference between let and const?', answerKey: 'let allows reassignment while const does not allow reassignment after declaration', conceptTag: 'variables' },
        ],
      },
    },
    {
      skillName: 'React Basics',
      title: 'React Components & JSX',
      objective: 'Build your first React components with JSX and props',
      estMinutes: 75,
      resources: [
        { title: 'React official intro', type: 'article', whatToStudy: 'What React is, how JSX works, creating functional components, and passing props', url: null, isAiSuggested: true },
        { title: 'Component composition exercise', type: 'exercise', whatToStudy: 'Build a card component that accepts title, description, and onClick props', url: null, isAiSuggested: true },
      ],
      check: {
        items: [
          { prompt: 'What does JSX stand for and what does it compile to?', answerKey: 'JavaScript XML; it compiles to React.createElement calls', conceptTag: 'jsx' },
          { prompt: 'How do you pass data from a parent component to a child component?', answerKey: 'via props — attributes on the JSX element', conceptTag: 'props' },
          { prompt: 'Why must JSX elements have a single root element (or Fragment)?', answerKey: 'because JSX compiles to a single function call which can only return one value', conceptTag: 'jsx-structure' },
        ],
      },
    },
    {
      skillName: 'React State & Hooks',
      title: 'State Management with Hooks',
      objective: 'Make components interactive with useState and useEffect',
      estMinutes: 90,
      resources: [
        { title: 'useState deep dive', type: 'article', whatToStudy: 'How useState works, when to use state vs props, state immutability', url: null, isAiSuggested: true },
        { title: 'useEffect patterns', type: 'exercise', whatToStudy: 'Fetch data on mount, clean up subscriptions, dependency array rules', url: null, isAiSuggested: true },
      ],
      check: {
        items: [
          { prompt: 'What does useState return?', answerKey: 'an array with the current state value and a setter function', conceptTag: 'useState' },
          { prompt: 'When does useEffect run with an empty dependency array []?', answerKey: 'once after the initial render (mount)', conceptTag: 'useEffect' },
          { prompt: 'Why should you not mutate state directly?', answerKey: 'React does not detect direct mutations; you must call the setter to trigger a re-render', conceptTag: 'immutability' },
        ],
      },
    },
    {
      skillName: 'React Forms & Events',
      title: 'Forms and User Interaction',
      objective: 'Build controlled forms and handle user events',
      estMinutes: 60,
      resources: [
        { title: 'Controlled components guide', type: 'article', whatToStudy: 'Controlled vs uncontrolled inputs, onChange handler pattern, form submission', url: null, isAiSuggested: true },
      ],
      check: {
        items: [
          { prompt: 'What makes a form input "controlled" in React?', answerKey: 'its value is bound to state and updated via an onChange handler', conceptTag: 'controlled-components' },
          { prompt: 'How do you prevent default form submission behavior?', answerKey: 'call event.preventDefault() in the submit handler', conceptTag: 'events' },
          { prompt: 'What is the typical pattern for managing multiple form fields?', answerKey: 'use a single state object and update it by field name using computed property names', conceptTag: 'form-state' },
        ],
      },
    },
    {
      skillName: 'React Routing',
      title: 'Client-Side Routing with React Router',
      objective: 'Add multi-page navigation to your React app',
      estMinutes: 60,
      resources: [
        { title: 'React Router v6 essentials', type: 'article', whatToStudy: 'BrowserRouter, Routes, Route, Link, useNavigate, and useParams', url: null, isAiSuggested: true },
      ],
      check: {
        items: [
          { prompt: 'What component do you use to define routes in React Router v6?', answerKey: 'Routes (containing individual Route components)', conceptTag: 'routing-setup' },
          { prompt: 'How do you navigate programmatically in React Router v6?', answerKey: 'use the useNavigate hook and call navigate("/path")', conceptTag: 'programmatic-navigation' },
          { prompt: 'How do you access URL parameters (e.g. /users/:id) in a component?', answerKey: 'use the useParams hook which returns an object with the parameter values', conceptTag: 'url-params' },
        ],
      },
    },
  ],
};

export function getMockPathPlan(): PathPlan {
  return MOCK_PATH_PLAN;
}
