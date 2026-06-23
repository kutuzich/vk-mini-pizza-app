const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getHeaders(auth = false): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  async getPizzas(categoryId?: number, search?: string) {
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', String(categoryId));
    if (search) params.set('search', search);
    const res = await fetch(`${API_URL}/pizzas?${params}`);
    return res.json();
  },

  async getCategories() {
    const res = await fetch(`${API_URL}/categories`);
    return res.json();
  },

  async getAvailableSlots(date: string) {
    const res = await fetch(`${API_URL}/orders/availability/${date}`);
    return res.json();
  },

  async createOrder(data: {
    customerName: string;
    customerPhone: string;
    address: string;
    vkUserId?: number;
    paymentMethod?: string;
    deliveryDate?: string;
    timeSlot?: string;
    comment?: string;
    items: { pizzaId: number; size: number; quantity: number; price: number }[];
  }) {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async login(username: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Invalid credentials');
    return res.json();
  },

  async getOrders() {
    const res = await fetch(`${API_URL}/orders`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  async updateOrderStatus(id: number, status: string) {
    const res = await fetch(`${API_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async createPizza(data: FormData) {
    const token = localStorage.getItem('token');
    const file = data.get('file') as File | null;
    const imageFromForm = (data.get('image') as string | null)?.trim() ?? '';
    let image = '';

    if (file && file.size > 0) {
      const uploadRes = await fetch(`${API_URL}/uploads/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: (() => {
          const fd = new FormData();
          fd.append('file', file);
          return fd;
        })(),
      });
      const uploadData = await uploadRes.json();
      image = uploadData.url;
    } else if (imageFromForm) {
      image = imageFromForm;
    }

    const body = {
      name: data.get('name'),
      description: data.get('description'),
      categoryId: Number(data.get('categoryId')),
      price25: Number(data.get('price25')),
      price30: Number(data.get('price30')),
      price35: Number(data.get('price35')),
      isAvailable: data.get('isAvailable') === 'true',
      isHit: data.get('isHit') === 'true',
      image,
    };

    const res = await fetch(`${API_URL}/pizzas`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(body),
    });
    return res.json();
  },

  async updatePizza(id: number, data: FormData) {
    const token = localStorage.getItem('token');
    const imageFromFormRaw = data.get('image') as string | null;
    let image: string | undefined;
    const file = data.get('file') as File | null;
    if (file && file.size > 0) {
      const uploadRes = await fetch(`${API_URL}/uploads/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: (() => {
          const fd = new FormData();
          fd.append('file', file);
          return fd;
        })(),
      });
      const uploadData = await uploadRes.json();
      image = uploadData.url;
    } else if (imageFromFormRaw !== null) {
      image = imageFromFormRaw;
    }

    const body: Record<string, unknown> = {
      name: data.get('name'),
      description: data.get('description'),
      categoryId: Number(data.get('categoryId')),
      price25: Number(data.get('price25')),
      price30: Number(data.get('price30')),
      price35: Number(data.get('price35')),
      isAvailable: data.get('isAvailable') === 'true',
      isHit: data.get('isHit') === 'true',
    };
    if (image !== undefined) body.image = image;

    const res = await fetch(`${API_URL}/pizzas/${id}`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(body),
    });
    return res.json();
  },

  async deletePizza(id: number) {
    const res = await fetch(`${API_URL}/pizzas/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    return res.json();
  },

  async createCategory(data: { name: string; icon?: string }) {
    const res = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateCategory(id: number, data: { name?: string; icon?: string }) {
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteCategory(id: number) {
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    return res.json();
  },

  async deleteOrder(id: number) {
    const res = await fetch(`${API_URL}/orders/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    return res.json();
  },
};
