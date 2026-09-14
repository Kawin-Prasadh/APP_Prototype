import { useState, useEffect } from 'react';
import { User, ActiveScreen, FoodItem, CrowdState, Order } from './types';
import { MessStore } from './services/store';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { StudentDashboard } from './components/StudentDashboard';
import { CheckoutScreen } from './components/CheckoutScreen';
import { PassScreen } from './components/PassScreen';
import { AdminConsole } from './components/AdminConsole';
import { VendorSlipModal } from './components/VendorSlipModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => MessStore.getCurrentUser());
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(() => {
    const user = MessStore.getCurrentUser();
    if (!user) return 'login';
    return user.role === 'admin' ? 'admin' : 'student';
  });

  const [foods, setFoods] = useState<FoodItem[]>(() => MessStore.getFoods());
  const [cart, setCart] = useState<{ [foodId: string]: number }>({});
  const [crowdState, setCrowdState] = useState<CrowdState>(() => MessStore.getCrowdState());
  const [menuDate, setMenuDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    const activeId = MessStore.getActiveOrderId();
    if (activeId) {
      return MessStore.getOrderById(activeId) || null;
    }
    const orders = MessStore.getOrders();
    return orders.length > 0 ? orders[0] : null;
  });

  const [vendorSlipOrder, setVendorSlipOrder] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? '' : current));
    }, 3200);
  };

  // Keep state synchronized for current user's block
  const refreshCrowd = () => {
    setCrowdState(MessStore.getCrowdState(currentUser?.block || 'Block A'));
  };

  useEffect(() => {
    if (currentUser) {
      setCrowdState(MessStore.getCrowdState(currentUser.block));
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCart({}); // clear cart on login
    setCrowdState(MessStore.getCrowdState(user.block));
    if (user.role === 'admin') {
      setActiveScreen('admin');
    } else {
      setActiveScreen('student');
    }
  };

  const handleLogout = () => {
    MessStore.setCurrentUser(null);
    setCurrentUser(null);
    setCart({});
    setActiveScreen('login');
    showToast('Logged out successfully.');
  };

  const handleSwitchRole = (role: 'student' | 'admin') => {
    const users = MessStore.getUsers();
    const target = users.find((u) => u.role === role);
    if (target) {
      MessStore.setCurrentUser(target);
      setCurrentUser(target);
      setCart({});
      setCrowdState(MessStore.getCrowdState(target.block));
      setActiveScreen(role === 'admin' ? 'admin' : 'student');
      showToast(`Switched to demo ${role}: ${target.name} (${target.block})`);
    }
  };

  const handleUpdateCart = (foodId: number | string, delta: number) => {
    setCart((prev) => {
      const current = prev[foodId] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[foodId];
      } else {
        updated[foodId] = next;
      }
      return updated;
    });
  };

  const handleConfirmPayment = () => {
    if (!currentUser) return;

    const cartEntries = Object.entries(cart).filter(([_, qty]) => (qty as number) > 0);
    const orderItems = cartEntries.map(([fId, qty]) => {
      const food = foods.find((f) => String(f.id) === String(fId));
      return {
        id: fId,
        name: food ? food.name : 'Dinner Item',
        price: food ? food.price : 0,
        quantity: Number(qty),
      };
    });

    const newOrder = MessStore.createOrder({
      student_id: currentUser.id,
      student_name: currentUser.name,
      block: currentUser.block,
      items: orderItems,
      dinner_date: menuDate,
    });

    setActiveOrder(newOrder);
    setCart({}); // clear cart
    refreshCrowd();
    showToast(`Order confirmed for ${currentUser.block}! Token: ${newOrder.token}`);
    setActiveScreen('pass');
  };

  // Periodically refresh crowd simulation slightly for live feel
  useEffect(() => {
    const interval = setInterval(() => {
      refreshCrowd();
    }, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Current student only sees dishes for their assigned block
  const studentFoods = currentUser ? foods.filter((f) => f.block === currentUser.block) : foods;

  return (
    <div>
      <div className="noise" />

      <Header
        currentUser={currentUser}
        activeScreen={activeScreen}
        onNavigate={(screen) => setActiveScreen(screen)}
        onLogout={handleLogout}
        hasActiveOrder={Boolean(activeOrder)}
        onSwitchRole={handleSwitchRole}
      />

      <main className="shell">
        {activeScreen === 'login' && (
          <AuthScreen
            onLoginSuccess={handleLoginSuccess}
            showToast={showToast}
          />
        )}

        {activeScreen === 'student' && currentUser && (
          <StudentDashboard
            currentUser={currentUser}
            foods={studentFoods}
            cart={cart}
            onUpdateCart={handleUpdateCart}
            crowdState={crowdState}
            onProceedToCheckout={() => setActiveScreen('checkout')}
            onLogout={handleLogout}
            menuDate={menuDate}
            onDateChange={setMenuDate}
          />
        )}

        {activeScreen === 'checkout' && currentUser && (
          <CheckoutScreen
            currentUser={currentUser}
            cart={cart}
            foods={studentFoods}
            dinnerDate={menuDate}
            onBackToMenu={() => setActiveScreen('student')}
            onConfirmPayment={handleConfirmPayment}
          />
        )}

        {activeScreen === 'pass' && (
          <PassScreen
            order={activeOrder}
            onBackToDashboard={() => setActiveScreen('student')}
            onOpenVendorSlip={(ord) => setVendorSlipOrder(ord)}
            showToast={showToast}
          />
        )}

        {activeScreen === 'admin' && currentUser && (
          <AdminConsole
            currentUser={currentUser}
            crowdState={crowdState}
            foods={foods}
            onUpdateFoods={(updated) => setFoods(updated)}
            onRefreshCrowd={refreshCrowd}
            onLogout={handleLogout}
            onOpenVendorSlip={(ord) => setVendorSlipOrder(ord)}
            showToast={showToast}
          />
        )}
      </main>

      {/* Vendor Serving Slip Modal */}
      {vendorSlipOrder && (
        <VendorSlipModal
          order={vendorSlipOrder}
          onClose={() => setVendorSlipOrder(null)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div id="toast" className="toast show" role="status">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
