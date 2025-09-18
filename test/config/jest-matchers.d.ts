// Custom Jest matchers types
declare namespace jest {
  interface Matchers<R> {
    toHaveValidationError(expectedError: string): R;
  }
}
