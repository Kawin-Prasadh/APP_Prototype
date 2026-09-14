import { User, FoodItem, Order, CrowdState } from '../types';

export const HOSTEL_BLOCKS = ['Block A', 'Block B', 'Block C'] as const;
export type HostelBlock = typeof HOSTEL_BLOCKS[number];

const STORAGE_KEYS = {
  USERS: 'night_mess_v2_users',
  FOODS: 'night_mess_v2_foods',
  ORDERS: 'night_mess_v2_orders',
  CROWD: 'night_mess_v2_crowd_',
  CURRENT_USER: 'night_mess_v2_current_user',
  ACTIVE_ORDER_ID: 'night_mess_v2_active_order_id',
};

const INITIAL_USERS: User[] = [
  {
    id: 'STU1023',
    name: 'Aditya Sharma',
    role: 'student',
    block: 'Block A',
    roomNo: 'A-204',
    email: 'aditya.stu1023@campus.edu',
  },
  {
    id: 'STU2045',
    name: 'Rohan Verma',
    role: 'student',
    block: 'Block B',
    roomNo: 'B-112',
    email: 'rohan.stu2045@campus.edu',
  },
  {
    id: 'STU3089',
    name: 'Pooja Nair',
    role: 'student',
    block: 'Block C',
    roomNo: 'C-305',
    email: 'pooja.stu3089@campus.edu',
  },
  {
    id: 'ADMIN-A',
    name: 'Block A Mess Warden',
    role: 'admin',
    block: 'Block A',
    email: 'mess.blocka@campus.edu',
  },
  {
    id: 'ADMIN-B',
    name: 'Block B Mess Warden',
    role: 'admin',
    block: 'Block B',
    email: 'mess.blockb@campus.edu',
  },
  {
    id: 'ADMIN-C',
    name: 'Block C Mess Warden',
    role: 'admin',
    block: 'Block C',
    email: 'mess.blockc@campus.edu',
  },
];

const INITIAL_FOODS: FoodItem[] = [
  // Block A Mess (North Hostel Mess)
  {
    id: 101,
    name: 'Chicken Biryani',
    price: 80,
    available: true,
    block: 'Block A',
    description: 'Aromatic basmati rice cooked with spiced chicken, served with raita & salan.',
    icon: '🍗',
  },
  {
    id: 102,
    name: 'Veg Biryani',
    price: 60,
    available: true,
    block: 'Block A',
    description: 'Fragrant saffron rice layered with fresh farm vegetables and fried onions.',
    icon: '🥕',
  },
  {
    id: 103,
    name: 'Full Meals Plate',
    price: 50,
    available: true,
    block: 'Block A',
    description: 'Hot steamed rice, sambar, rasam, kootu, curd, crisp papad & pickle.',
    icon: '🍛',
  },
  {
    id: 104,
    name: 'Egg Fried Rice & Schezwan Sauce',
    price: 65,
    available: true,
    block: 'Block A',
    description: 'Wok-tossed rice with scrambled eggs, scallions, and spicy pepper dip.',
    icon: '🍳',
  },
  {
    id: 105,
    name: 'Chapati & Dal Tadka (3 pcs)',
    price: 45,
    available: true,
    block: 'Block A',
    description: 'Whole wheat soft chapatis served with aromatic yellow dal tadka.',
    icon: '🍲',
  },

  // Block B Mess (South Hostel Mess)
  {
    id: 201,
    name: 'Malabar Chicken Curry & 2 Parottas',
    price: 85,
    available: true,
    block: 'Block B',
    description: 'Flaky layered Kerala parottas paired with rich coconut-based chicken curry.',
    icon: '🍗',
  },
  {
    id: 202,
    name: 'Paneer Butter Masala & 3 Rotis',
    price: 75,
    available: true,
    block: 'Block B',
    description: 'Cottage cheese cubes simmered in rich makhani gravy with tawa rotis.',
    icon: '🫓',
  },
  {
    id: 203,
    name: 'Ghee Rice & Dal Makhani',
    price: 70,
    available: true,
    block: 'Block B',
    description: 'Fragrant butter ghee jeera rice served with slow-cooked creamy black lentils.',
    icon: '🍚',
  },
  {
    id: 204,
    name: 'Veg Hakka Noodles & Manchurian',
    price: 65,
    available: true,
    block: 'Block B',
    description: 'Wok-tossed Indo-Chinese noodles with crispy vegetable manchurian gravy balls.',
    icon: '🍜',
  },
  {
    id: 205,
    name: 'Masala Dosa & Sambar (2 pcs)',
    price: 50,
    available: true,
    block: 'Block B',
    description: 'Crisp golden fermented crepes stuffed with potato masala, coconut chutney.',
    icon: '🥞',
  },

  // Block C Mess (PG & International Mess)
  {
    id: 301,
    name: 'Hyderabadi Mutton Dum Biryani',
    price: 120,
    available: true,
    block: 'Block C',
    description: 'Authentic kacchi dum tender goat meat cooked with fragrant long-grain basmati.',
    icon: '🍖',
  },
  {
    id: 302,
    name: 'Butter Chicken & 2 Garlic Naans',
    price: 95,
    available: true,
    block: 'Block C',
    description: 'Tandoori chicken morsels in velvet tomato butter gravy with clay oven naan.',
    icon: '🍗',
  },
  {
    id: 303,
    name: 'Andhra Veg Pulao & Raita',
    price: 65,
    available: true,
    block: 'Block C',
    description: 'Spiced aromatic green chilli herb rice with farm vegetables and onion raita.',
    icon: '🥗',
  },
  {
    id: 304,
    name: 'Rajma Chawal Special Bowl',
    price: 55,
    available: true,
    block: 'Block C',
    description: 'Authentic Kashmiri red kidney beans slow cooked with spices over basmati rice.',
    icon: '🍛',
  },
  {
    id: 305,
    name: 'Chilli Paneer & Fried Rice',
    price: 75,
    available: true,
    block: 'Block C',
    description: 'Wok-tossed cottage cheese in tangy soya garlic sauce with vegetable fried rice.',
    icon: '🌶️',
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    order_id: '8F2D9A7C',
    token: 'NM-8F2D9A7C',
    student_id: 'STU1023',
    student_name: 'Aditya Sharma',
    block: 'Block A',
    items: [
      { id: 101, name: 'Chicken Biryani', price: 80, quantity: 1 },
      { id: 103, name: 'Full Meals Plate', price: 50, quantity: 1 },
    ],
    total_amount: 130,
    created_at: new Date().toISOString(),
    dinner_date: new Date().toISOString().split('T')[0],
    status: 'paid',
  },
  {
    order_id: '4B91E27A',
    token: 'NM-4B91E27A',
    student_id: 'STU2045',
    student_name: 'Rohan Verma',
    block: 'Block B',
    items: [
      { id: 201, name: 'Malabar Chicken Curry & 2 Parottas', price: 85, quantity: 1 },
    ],
    total_amount: 85,
    created_at: new Date().toISOString(),
    dinner_date: new Date().toISOString().split('T')[0],
    status: 'paid',
  },
];

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error('Storage error', err);
  }
}

export const MessStore = {
  getUsers(): User[] {
    const users = safeGet<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    if (!users || !users.some((u) => u.id === 'STU1023')) {
      safeSet(STORAGE_KEYS.USERS, INITIAL_USERS);
      return INITIAL_USERS;
    }
    return users;
  },

  getStudentsByBlock(block?: string): User[] {
    const users = this.getUsers().filter((u) => u.role === 'student');
    if (!block) return users;
    return users.filter((u) => u.block === block);
  },

  /**
   * Only admin / warden can add a student to the campus database.
   */
  addStudentByAdmin(
    adminUser: User,
    studentData: { id: string; name: string; block: string; roomNo?: string; email?: string }
  ): { success: boolean; error?: string; student?: User } {
    if (adminUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only mess admins can register students.' };
    }

    const cleanId = studentData.id.trim().toUpperCase();
    const cleanName = studentData.name.trim();

    if (!cleanId || !cleanName) {
      return { success: false, error: 'Student ID and full name are required.' };
    }

    const users = this.getUsers();
    if (users.some((u) => u.id.toUpperCase() === cleanId)) {
      return { success: false, error: `Student with College ID "${cleanId}" already exists.` };
    }

    const newStudent: User = {
      id: cleanId,
      name: cleanName,
      role: 'student',
      block: studentData.block || adminUser.block || 'Block A',
      roomNo: studentData.roomNo?.trim() || 'Unassigned',
      email: studentData.email?.trim() || `${cleanId.toLowerCase()}@campus.edu`,
    };

    users.push(newStudent);
    safeSet(STORAGE_KEYS.USERS, users);
    return { success: true, student: newStudent };
  },

  getCurrentUser(): User | null {
    return safeGet<User | null>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  },

  setCurrentUser(user: User | null) {
    safeSet(STORAGE_KEYS.CURRENT_USER, user);
  },

  getFoods(block?: string): FoodItem[] {
    const allFoods = safeGet<FoodItem[]>(STORAGE_KEYS.FOODS, INITIAL_FOODS);
    if (!allFoods || allFoods.length === 0 || !allFoods.some((f) => f.block)) {
      safeSet(STORAGE_KEYS.FOODS, INITIAL_FOODS);
      return block ? INITIAL_FOODS.filter((f) => f.block === block) : INITIAL_FOODS;
    }
    if (!block) return allFoods;
    return allFoods.filter((f) => f.block === block);
  },

  setFoods(foods: FoodItem[]) {
    safeSet(STORAGE_KEYS.FOODS, foods);
  },

  addFood(name: string, price: number, block: string, icon = '🍲'): FoodItem {
    const allFoods = safeGet<FoodItem[]>(STORAGE_KEYS.FOODS, INITIAL_FOODS);
    const newItem: FoodItem = {
      id: Date.now(),
      name,
      price,
      available: true,
      block,
      description: `Freshly prepared night mess dinner serving at ${block}.`,
      icon,
    };
    allFoods.unshift(newItem);
    this.setFoods(allFoods);
    return newItem;
  },

  deleteFood(id: number | string, adminBlock?: string): boolean {
    const allFoods = safeGet<FoodItem[]>(STORAGE_KEYS.FOODS, INITIAL_FOODS);
    const target = allFoods.find((f) => f.id === id);
    if (!target) return false;

    if (adminBlock && target.block !== adminBlock) {
      return false; // Admin can only delete their own block's menu items
    }

    const filtered = allFoods.filter((f) => f.id !== id);
    this.setFoods(filtered);
    return true;
  },

  getOrders(block?: string): Order[] {
    const orders = safeGet<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    if (!orders || orders.length === 0 || !orders.some((o) => o.block)) {
      safeSet(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
      return block ? INITIAL_ORDERS.filter((o) => o.block === block) : INITIAL_ORDERS;
    }
    if (!block) return orders;
    return orders.filter((o) => o.block === block);
  },

  getOrderById(orderId: string): Order | undefined {
    const orders = safeGet<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    return orders.find(
      (o) => o.order_id.toLowerCase() === orderId.toLowerCase() || o.token.toLowerCase() === orderId.toLowerCase()
    );
  },

  createOrder(payload: {
    student_id: string;
    student_name: string;
    block: string;
    items: { id: number | string; name: string; price: number; quantity: number }[];
    dinner_date: string;
  }): Order {
    const randomHex = Math.random().toString(16).substring(2, 10).toUpperCase();
    const order_id = randomHex;
    const token = `NM-${randomHex}`;

    const total_amount = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const newOrder: Order = {
      order_id,
      token,
      student_id: payload.student_id,
      student_name: payload.student_name,
      block: payload.block,
      items: payload.items,
      total_amount,
      created_at: new Date().toISOString(),
      dinner_date: payload.dinner_date,
      status: 'paid',
      completion_status: 'placed',
      is_completed: false,
    };

    const orders = safeGet<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    orders.unshift(newOrder);
    safeSet(STORAGE_KEYS.ORDERS, orders);
    safeSet(STORAGE_KEYS.ACTIVE_ORDER_ID, newOrder.order_id);

    // Increment tokens today count for this block
    const crowd = this.getCrowdState(payload.block);
    crowd.tokensToday += 1;
    this.setCrowdState(payload.block, crowd);

    return newOrder;
  },

  updateOrderStatus(
    orderId: string,
    completionStatus: 'placed' | 'preparing' | 'completed'
  ): Order | null {
    const orders = safeGet<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    const order = orders.find(
      (o) => o.order_id.toLowerCase() === orderId.toLowerCase() || o.token.toLowerCase() === orderId.toLowerCase()
    );
    if (!order) return null;
    order.completion_status = completionStatus;
    if (completionStatus === 'completed') {
      order.is_completed = true;
      order.completed_at = new Date().toISOString();
    } else {
      order.is_completed = false;
    }
    safeSet(STORAGE_KEYS.ORDERS, orders);
    return order;
  },

  getActiveOrderId(): string | null {
    return safeGet<string | null>(STORAGE_KEYS.ACTIVE_ORDER_ID, null);
  },

  setActiveOrderId(id: string | null) {
    safeSet(STORAGE_KEYS.ACTIVE_ORDER_ID, id);
  },

  getCrowdState(block: string = 'Block A'): CrowdState {
    const key = `${STORAGE_KEYS.CROWD}${block}`;
    const defaultCounts: Record<string, { current: number; cap: number; tokens: number }> = {
      'Block A': { current: 38, cap: 100, tokens: 14 },
      'Block B': { current: 24, cap: 90, tokens: 9 },
      'Block C': { current: 42, cap: 80, tokens: 18 },
    };
    const def = defaultCounts[block] || { current: 25, cap: 100, tokens: 10 };
    const crowd = safeGet<CrowdState>(key, {
      currentCount: def.current,
      capacity: def.cap,
      waitTimeMinutes: 3,
      statusLevel: 'Comfortable',
      tokensToday: def.tokens,
    });
    return this.calculateCrowdMetrics(crowd);
  },

  setCrowdState(block: string, crowd: CrowdState) {
    const key = `${STORAGE_KEYS.CROWD}${block}`;
    const updated = this.calculateCrowdMetrics(crowd);
    safeSet(key, updated);
  },

  calculateCrowdMetrics(crowd: CrowdState): CrowdState {
    const ratio = crowd.currentCount / crowd.capacity;
    let statusLevel = 'Comfortable';
    let waitTimeMinutes = 2;

    if (ratio >= 0.85) {
      statusLevel = 'Peak Rush';
      waitTimeMinutes = Math.round(15 + (ratio - 0.85) * 40);
    } else if (ratio >= 0.6) {
      statusLevel = 'Moderate Wait';
      waitTimeMinutes = Math.round(7 + (ratio - 0.6) * 25);
    } else if (ratio >= 0.35) {
      statusLevel = 'Normal Flow';
      waitTimeMinutes = Math.round(3 + (ratio - 0.35) * 15);
    }

    return {
      ...crowd,
      statusLevel,
      waitTimeMinutes: Math.max(1, waitTimeMinutes),
    };
  },

  validateToken(inputToken: string, adminBlock?: string): {
    success: boolean;
    order?: Order;
    message: string;
    status: 'approved' | 'rejected' | 'not_found';
  } {
    const trimmed = inputToken.trim().toUpperCase();
    const formattedToken = trimmed.startsWith('NM-') ? trimmed : `NM-${trimmed}`;

    const orders = safeGet<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    const found = orders.find(
      (o) => o.token.toUpperCase() === formattedToken || o.order_id.toUpperCase() === trimmed
    );

    if (!found) {
      return {
        success: false,
        status: 'not_found',
        message: `Token "${trimmed}" not recognized in campus database.`,
      };
    }

    // Check block authorization
    if (adminBlock && found.block !== adminBlock) {
      return {
        success: false,
        order: found,
        status: 'rejected',
        message: `WRONG BLOCK MESS: This pass is for ${found.block} Mess. Entry denied at ${adminBlock}.`,
      };
    }

    if (found.status === 'verified') {
      return {
        success: false,
        order: found,
        status: 'rejected',
        message: `PASS ALREADY USED: Entry was granted at ${new Date(found.verified_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Single entry rule enforced.`,
      };
    }

    // Mark as verified & increment crowd inside that block
    found.status = 'verified';
    found.verified_at = new Date().toISOString();
    safeSet(STORAGE_KEYS.ORDERS, orders);

    const crowd = this.getCrowdState(found.block);
    crowd.currentCount = Math.min(crowd.capacity, crowd.currentCount + 1);
    this.setCrowdState(found.block, crowd);

    return {
      success: true,
      order: found,
      status: 'approved',
      message: `MEAL PASS VALIDATED: ${found.student_name} (${found.student_id} - ${found.block}) cleared for dinner entry!`,
    };
  },

  recordStudentExit(block: string = 'Block A'): CrowdState {
    const crowd = this.getCrowdState(block);
    crowd.currentCount = Math.max(0, crowd.currentCount - 1);
    this.setCrowdState(block, crowd);
    return crowd;
  },
};
