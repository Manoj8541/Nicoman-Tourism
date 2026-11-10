// client/src/tests/setup.js
import '@testing-library/jest-dom';

// Clean up mocks and localStorage after each test
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
