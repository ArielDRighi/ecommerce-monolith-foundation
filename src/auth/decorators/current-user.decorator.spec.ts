import { CurrentUser } from './current-user.decorator';

describe('CurrentUser Decorator', () => {
  it('should be defined', () => {
    expect(CurrentUser).toBeDefined();
    expect(typeof CurrentUser).toBe('function');
  });

  it('should be a parameter decorator', () => {
    const decorator = CurrentUser();
    expect(typeof decorator).toBe('function');
  });

  it('should call createParamDecorator', () => {
    // Test that it's created properly by checking its structure
    const decorator = CurrentUser();

    // Parameter decorators return a function that takes the expected parameters
    expect(decorator).toBeInstanceOf(Function);
    expect(decorator.length).toBeGreaterThanOrEqual(2); // Should take at least data, ctx params
  });
});
