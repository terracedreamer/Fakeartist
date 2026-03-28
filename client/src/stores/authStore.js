import { create } from 'zustand';

const PLATFORM_URL = 'https://magicbusstudios.com';
const PRODUCT_DOMAIN = 'https://fakeartist.magicbusstudios.com';

const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('mbs_token') || null,
  user: JSON.parse(localStorage.getItem('mbs_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('mbs_token'),

  /**
   * Handle incoming token from platform redirect (?token=JWT)
   */
  handleTokenRedirect: () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return false;

    try {
      // Decode JWT payload (no verification on client — backend verifies)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user = {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        avatar: payload.avatar,
        isAdmin: payload.isAdmin || false,
      };

      localStorage.setItem('mbs_token', token);
      localStorage.setItem('mbs_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true });

      // Clean URL — remove ?token= param
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.pathname + url.search);

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Redirect to MBS Platform login
   */
  login: () => {
    window.location.href = `${PLATFORM_URL}/auth/login?redirect=${encodeURIComponent(PRODUCT_DOMAIN)}&brand=mbs`;
  },

  /**
   * Logout — clear stored token and user
   */
  logout: () => {
    localStorage.removeItem('mbs_token');
    localStorage.removeItem('mbs_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  /**
   * Get Authorization header value for API calls
   */
  getAuthHeader: () => {
    const token = get().token;
    return token ? `Bearer ${token}` : null;
  },
}));

export default useAuthStore;
