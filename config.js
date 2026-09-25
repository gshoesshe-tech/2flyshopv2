// Public API client. Secrets belong in Cloudflare Worker settings, never here.
(() => {
  const listeners = [];
  async function request(path, method = 'GET', body) {
    try {
      const headers = {};
      if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
      const response = await fetch('/api' + path, {
        method, credentials: 'same-origin', headers, cache: 'no-store',
        body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body)
      });
      const result = await response.json();
      if (!response.ok) return { data: null, error: { message: result.error || 'Request failed.' } };
      return { data: result, error: null };
    } catch { return { data: null, error: { message: 'Connection failed. Please try again.' } }; }
  }
  window.TwoFlyAPI = {
    importCatalog: () => request('/admin/import', 'POST', { confirm: true }),
    listProducts: admin => request(admin ? '/admin/products' : '/products'),
    checkAvailability: ids => request('/availability', 'POST', { ids }),
    createProduct: product => request('/admin/products', 'POST', product),
    updateProduct: (id, changes) => request('/admin/products/' + encodeURIComponent(id), 'PATCH', changes),
    deleteProduct: id => request('/admin/products/' + encodeURIComponent(id), 'DELETE'),
    upload: file => { const body = new FormData(); body.append('file', file); return request('/admin/upload', 'POST', body); },
    auth: {
      getSession: () => request('/session'),
      signInWithPassword: async credentials => {
        const result = await request('/login', 'POST', credentials);
        if (!result.error) listeners.forEach(fn => fn('SIGNED_IN', result.data.session));
        return result;
      },
      signOut: async () => {
        const result = await request('/logout', 'POST', {});
        if (!result.error) listeners.forEach(fn => fn('SIGNED_OUT', null));
        return result;
      },
      onAuthStateChange: fn => listeners.push(fn)
    }
  };
})();
