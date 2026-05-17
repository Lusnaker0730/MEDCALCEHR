/**
 * Navigation helper extracted into its own module so tests can `jest.mock()` it.
 *
 * Background: jest 30 / jsdom 26 makes `window.location` non-configurable, so
 * `Object.defineProperty(window, 'location', ...)`, `delete window.location`,
 * and `jest.spyOn(window.location, 'href', 'set')` all fail. Production code
 * that performs hard-navigation via `window.location.href = url` therefore
 * cannot be intercepted in-test through location itself; the conventional
 * workaround is to call navigation through a separate function whose entire
 * module can be replaced via `jest.mock`.
 */
export function navigateTo(url: string): void {
    window.location.href = url;
}
