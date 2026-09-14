import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User, FoodItem, CrowdState, Order } from '../types';
import { MessStore } from '../services/store';
import jsQR from 'jsqr';

interface AdminConsoleProps {
  currentUser: User;
  crowdState: CrowdState;
  foods: FoodItem[];
  onUpdateFoods: (foods: FoodItem[]) => void;
  onRefreshCrowd: () => void;
  onLogout: () => void;
  onOpenVendorSlip: (order: Order) => void;
  showToast: (msg: string) => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  currentUser,
  crowdState,
  foods,
  onUpdateFoods,
  onRefreshCrowd,
  onLogout,
  onOpenVendorSlip,
  showToast,
}) => {
  // Navigation sub-tab inside Admin Console - separate menu and scanner menus
  const [activeTab, setActiveTab] = useState<'menu' | 'scanner' | 'students' | 'orders'>('menu');
  const [ordersKey, setOrdersKey] = useState(0);

  // Menu Management State (Admin can only manage dishes for their own block)
  const [adminDate, setAdminDate] = useState(new Date().toISOString().split('T')[0]);
  const [menuTitle, setMenuTitle] = useState(`${currentUser.block} Chef’s Special`);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodPrice, setNewFoodPrice] = useState('');
  const [publishMessage, setPublishMessage] = useState('');

  // Add Student to Database State (Only Admin/Staff can add students)
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoom, setNewStudentRoom] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [studentError, setStudentError] = useState('');
  const [studentSuccess, setStudentSuccess] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [rosterKey, setRosterKey] = useState(0);

  // Scanner & Validation State (idle state starts without awaiting block)
  const [manualToken, setManualToken] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'checking' | 'approved' | 'rejected'>('idle');
  const [scanTitle, setScanTitle] = useState('');
  const [scanDetails, setScanDetails] = useState('');
  const [lastValidatedOrder, setLastValidatedOrder] = useState<Order | null>(null);

  const handleUpdateOrderStatus = (orderId: string, status: 'placed' | 'preparing' | 'completed') => {
    const updated = MessStore.updateOrderStatus(orderId, status);
    if (updated) {
      setOrdersKey((k) => k + 1);
      if (lastValidatedOrder && lastValidatedOrder.order_id === orderId) {
        setLastValidatedOrder({ ...lastValidatedOrder, ...updated });
      }
      const label = status === 'completed' ? 'Completed & sent to student' : status === 'preparing' ? 'Preparing in kitchen' : 'Order Placed';
      showToast(`Order ${updated.token}: ${label}`);
    }
  };

  // Camera Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Filter foods for current admin's block only
  const blockFoods = foods.filter((f) => f.block === currentUser.block);

  // Filter orders for current admin's block only
  const blockOrders = MessStore.getOrders(currentUser.block);

  // Filter students for current admin's block only
  const blockStudents = MessStore.getStudentsByBlock(currentUser.block);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const executeTokenValidation = useCallback(
    (token: string) => {
      if (!token.trim()) return;

      setScanStatus('checking');
      setScanTitle('Verifying pass with backend...');
      setScanDetails(`Checking token & enforcing ${currentUser.block} mess jurisdiction...`);

      setTimeout(() => {
        // Enforce that this token belongs to the admin's block
        const result = MessStore.validateToken(token, currentUser.block);
        onRefreshCrowd();

        if (result.success && result.order) {
          setScanStatus('approved');
          setScanTitle(`✓ ENTRY GRANTED: ${result.order.student_name}`);
          setScanDetails(
            `ID: ${result.order.student_id} • Mess: ${result.order.block} • Paid ₹${result.order.total_amount} for ${result.order.items
              .map((i) => `${i.name} (${i.quantity})`)
              .join(', ')}`
          );
          setLastValidatedOrder(result.order);
          showToast(`Pass validated for ${result.order.student_name}!`);
        } else {
          setScanStatus('rejected');
          setScanTitle('❌ ENTRY DENIED');
          setScanDetails(result.message);
          setLastValidatedOrder(result.order || null);
          showToast(result.message);
        }
      }, 350);
    },
    [currentUser.block, onRefreshCrowd, showToast]
  );

  const tickScan = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          stopCamera();
          executeTokenValidation(code.data);
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(tickScan);
  }, [isCameraActive, stopCamera, executeTokenValidation]);

  useEffect(() => {
    if (isCameraActive) {
      animationFrameRef.current = requestAnimationFrame(tickScan);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraActive, tickScan]);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access unavailable:', err);
      setCameraError(
        'Camera access not available or permitted. Use the manual token validator below to test passes.'
      );
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Food handlers - scoped strictly to currentUser.block
  const handleAddFood = () => {
    if (!newFoodName.trim()) return;
    const priceNum = parseFloat(newFoodPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    MessStore.addFood(newFoodName.trim(), priceNum, currentUser.block);
    onUpdateFoods(MessStore.getFoods());
    setNewFoodName('');
    setNewFoodPrice('');
    setPublishMessage(`Added "${newFoodName.trim()}" to ${currentUser.block} menu.`);
  };

  const handleDeleteFood = (id: number | string) => {
    MessStore.deleteFood(id, currentUser.block);
    onUpdateFoods(MessStore.getFoods());
  };

  const handlePublishMenu = () => {
    setPublishMessage(`✓ ${currentUser.block} Menu "${menuTitle}" published for ${adminDate}!`);
    showToast(`Menu updated and live for ${currentUser.block} students!`);
  };

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    executeTokenValidation(manualToken);
    setManualToken('');
  };

  // Admin student enrollment handler
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');
    setStudentSuccess('');

    if (!newStudentId.trim() || !newStudentName.trim()) {
      setStudentError('Student ID and full name are required.');
      return;
    }

    const result = MessStore.addStudentByAdmin(currentUser, {
      id: newStudentId.trim().toUpperCase(),
      name: newStudentName.trim(),
      block: currentUser.block,
      roomNo: newStudentRoom.trim() || `${currentUser.block.split(' ')[1]}-Room`,
      email: newStudentEmail.trim(),
    });

    if (!result.success || !result.student) {
      setStudentError(result.error || 'Failed to enroll student.');
      return;
    }

    setStudentSuccess(`✓ Student ${result.student.name} (${result.student.id}) added to ${currentUser.block} database!`);
    showToast(`Added ${result.student.name} to ${currentUser.block} roster!`);
    setNewStudentId('');
    setNewStudentName('');
    setNewStudentRoom('');
    setNewStudentEmail('');
    setRosterKey((k) => k + 1);
  };

  const filteredStudents = blockStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.id.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.roomNo && s.roomNo.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  return (
    <section id="admin" className="screen active">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{currentUser.block.toUpperCase()} MESS WARDEN PORTAL</p>
          <h1>
            <span id="adminBlock">{currentUser.block}</span> Control Room
          </h1>
          <p className="flex items-center gap-2 flex-wrap">
            <span>Admin: <strong>{currentUser.name}</strong></span>
            <span>•</span>
            <span className="text-[#13736d] font-semibold bg-[#e6f4f1] px-2 py-0.5 rounded text-xs">
              Exclusive jurisdiction: {currentUser.block}
            </span>
          </p>
        </div>
      </div>

      {/* Admin stats for this block */}
      <div className="admin-stats">
        <article>
          <span>👥</span>
          <strong id="adminCrowd">{crowdState.currentCount}</strong>
          <p>{currentUser.block} students inside</p>
        </article>
        <article>
          <span>🎟️</span>
          <strong id="tokenCount">{crowdState.tokensToday}</strong>
          <p>{currentUser.block} passes issued today</p>
        </article>
        <article>
          <span>⏱</span>
          <strong id="adminWait">~{crowdState.waitTimeMinutes} min</strong>
          <p>{currentUser.block} queue estimate</p>
        </article>
      </div>

      {/* Tab Navigation for Admin */}
      <div className="flex items-center gap-2 border-b border-[#e9dfce] pb-3 mb-5 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'menu'
              ? 'bg-[#17253a] text-white shadow-xs'
              : 'bg-[#f4efe4] text-[#17253a] hover:bg-[#e9e1d2]'
          }`}
        >
          <span>📋</span> Menu Management
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('scanner')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'scanner'
              ? 'bg-[#17253a] text-white shadow-xs'
              : 'bg-[#f4efe4] text-[#17253a] hover:bg-[#e9e1d2]'
          }`}
        >
          <span>📷</span> QR Scanner
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'students'
              ? 'bg-[#17253a] text-white shadow-xs'
              : 'bg-[#f4efe4] text-[#17253a] hover:bg-[#e9e1d2]'
          }`}
        >
          <span>🎓</span> Add Students to Database ({blockStudents.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-[#17253a] text-white shadow-xs'
              : 'bg-[#f4efe4] text-[#17253a] hover:bg-[#e9e1d2]'
          }`}
        >
          <span>📦</span> {currentUser.block} Orders ({blockOrders.length})
        </button>
      </div>

      {/* Menu Management Tab */}
      {activeTab === 'menu' && (
        <div className="max-w-3xl mx-auto">
          <article className="admin-card">
            <div className="flex items-center justify-between pb-2 border-b border-[#eee5d6] mb-3">
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>MENU MANAGEMENT</p>
                <h2 style={{ margin: '3px 0 0' }}>{currentUser.block} Menu</h2>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-[#e6f4f1] text-[#13736d] rounded border border-[#c4e3dc]">
                {currentUser.block} Only
              </span>
            </div>

            <label htmlFor="adminDate">
              Dinner Date
              <input
                id="adminDate"
                type="date"
                value={adminDate}
                onChange={(e) => setAdminDate(e.target.value)}
              />
            </label>

            <label htmlFor="menuTitle">
              Menu Title
              <input
                id="menuTitle"
                value={menuTitle}
                onChange={(e) => setMenuTitle(e.target.value)}
              />
            </label>

            <div className="food-add">
              <input
                id="foodName"
                placeholder={`New dish for ${currentUser.block}...`}
                value={newFoodName}
                onChange={(e) => setNewFoodName(e.target.value)}
              />
              <input
                id="foodPrice"
                type="number"
                min="1"
                placeholder="₹ price"
                value={newFoodPrice}
                onChange={(e) => setNewFoodPrice(e.target.value)}
              />
              <button
                id="addFood"
                className="square-button"
                type="button"
                onClick={handleAddFood}
                title={`Add dish to ${currentUser.block}`}
              >
                +
              </button>
            </div>

            <div id="draftFoods" className="draft-foods">
              {blockFoods.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">
                  No dishes currently published for {currentUser.block}. Add items above.
                </p>
              ) : (
                blockFoods.map((food) => (
                  <div key={food.id} className="draft-item">
                    <span className="flex items-center gap-2">
                      <span>{food.icon || '🍲'}</span>
                      <strong>{food.name}</strong>
                      <span className="font-mono text-xs text-[#69768a]">₹{food.price}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteFood(food.id)}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            <button id="publishMenu" className="primary wide" onClick={handlePublishMenu}>
              Publish {currentUser.block} Menu <b>→</b>
            </button>
            {publishMessage && (
              <p id="publishMessage" className="field-note text-emerald-700 font-semibold mt-2">
                {publishMessage}
              </p>
            )}
          </article>
        </div>
      )}

      {/* QR Scanner Tab */}
      {activeTab === 'scanner' && (
        <div className="max-w-2xl mx-auto">
          <article className="admin-card scanner-card">
            <div className="scanner-heading">
              <div>
                <p className="eyebrow">VERIFICATION</p>
                <h2>{currentUser.block} QR Scanner</h2>
              </div>
              <span className="secure-pill">● {currentUser.block.toUpperCase()} SCANNER</span>
            </div>

            <p className="text-xs text-[#69768a] mb-2">
              Validates student passes and verifies orders exclusively for {currentUser.block}.
            </p>

            {/* Scanner frame */}
            <div id="scannerFrame" className="scanner-frame">
              <video
                ref={videoRef}
                className={isCameraActive ? 'block' : 'hidden'}
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {!isCameraActive && (
                <div className="scanner-placeholder">
                  <span className="scan-corners">⌗</span>
                  <strong>Ready to scan passes</strong>
                  <small>Start camera and scan student QR, or test with pass buttons below.</small>
                </div>
              )}
            </div>

            {cameraError && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg mt-2">
                {cameraError}
              </p>
            )}

            <div className="scanner-actions">
              {!isCameraActive ? (
                <button
                  id="startScanner"
                  className="dark-button w-full"
                  type="button"
                  onClick={startCamera}
                >
                  <span>📷</span> Start camera scan
                </button>
              ) : (
                <button
                  id="stopScanner"
                  className="quiet-button w-full"
                  type="button"
                  onClick={stopCamera}
                >
                  Stop camera
                </button>
              )}
            </div>

            {/* Scan result notification - only displayed when not idle */}
            {scanStatus !== 'idle' && (
              <div id="scanResult" className={`scan-result ${scanStatus}`}>
                <span id="scanResultIcon" className="result-icon">
                  {scanStatus === 'approved' && '✓'}
                  {scanStatus === 'rejected' && '✕'}
                  {scanStatus === 'checking' && '⏳'}
                </span>
                <div className="flex-1">
                  <b id="scanResultTitle">{scanTitle}</b>
                  <p id="scanResultDetails">{scanDetails}</p>
                  {lastValidatedOrder && scanStatus === 'approved' && (
                    <div className="mt-2.5 pt-2 border-t border-emerald-200 flex items-center justify-between flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenVendorSlip(lastValidatedOrder)}
                        className="text-xs font-bold text-[#13736d] underline"
                      >
                        Open Kitchen Slip for {lastValidatedOrder.student_name}
                      </button>

                      {/* Quick order completion button */}
                      {lastValidatedOrder.completion_status !== 'completed' ? (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(lastValidatedOrder.order_id, 'completed')}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs shadow-xs"
                        >
                          Mark Order Completed ✓
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          Order Completed
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="scan-or">OR ENTER TOKEN MANUALLY</div>

            <form id="scanForm" className="scan-form" onSubmit={handleManualScan}>
              <input
                id="scanInput"
                placeholder="e.g. NM-8F2D9A7C"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                required
              />
              <button className="primary" type="submit">
                Validate
              </button>
            </form>

            {/* Quick test buttons for active passes in this block */}
            {blockOrders.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#eee5d6]">
                <span className="text-[11px] font-bold text-[#69768a] uppercase tracking-wider block mb-1.5">
                  Test Passes for {currentUser.block}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {blockOrders.slice(0, 4).map((ord) => (
                    <button
                      key={ord.order_id}
                      type="button"
                      onClick={() => executeTokenValidation(ord.token)}
                      className="text-[11px] font-mono font-bold bg-[#f1f5f3] hover:bg-[#c8efd9] text-[#13736d] px-2 py-1 rounded border border-[#d2e4dc] transition"
                    >
                      {ord.token} ({ord.student_name.split(' ')[0]} - {ord.status})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      )}

      {/* Tab: Add Students to Database */}
      {activeTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" key={rosterKey}>
          {/* Add Student Form */}
          <article className="admin-card">
            <div className="flex items-center justify-between pb-2 border-b border-[#eee5d6] mb-3">
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>STUDENT ENROLLMENT</p>
                <h2 style={{ margin: '3px 0 0' }}>Add Student to Database</h2>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-[#fff2dc] text-[#17253a] rounded border border-[#ebd8bc]">
                Admin Privilege
              </span>
            </div>

            <p className="text-xs text-[#69768a] mb-4">
              Only authorized mess wardens can register students into the campus database. Students cannot create accounts themselves.
            </p>

            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label htmlFor="stuIdInput" className="text-xs font-bold text-[#17253a] block mb-1">
                  College ID *
                </label>
                <input
                  id="stuIdInput"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  placeholder="e.g. STU1024"
                  required
                  className="w-full p-2.5 rounded-lg border border-[#d8d3c7] text-sm"
                />
              </div>

              <div>
                <label htmlFor="stuNameInput" className="text-xs font-bold text-[#17253a] block mb-1">
                  Student Full Name *
                </label>
                <input
                  id="stuNameInput"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Maya Krishnan"
                  required
                  className="w-full p-2.5 rounded-lg border border-[#d8d3c7] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="stuBlockInput" className="text-xs font-bold text-[#17253a] block mb-1">
                    Assigned Mess
                  </label>
                  <input
                    id="stuBlockInput"
                    value={currentUser.block}
                    disabled
                    className="w-full p-2.5 rounded-lg border border-[#d8d3c7] bg-[#f7f5f0] text-sm font-bold text-[#13736d]"
                  />
                  <small className="text-[10px] text-[#69768a]">Fixed to your block</small>
                </div>
                <div>
                  <label htmlFor="stuRoomInput" className="text-xs font-bold text-[#17253a] block mb-1">
                    Hostel Room No.
                  </label>
                  <input
                    id="stuRoomInput"
                    value={newStudentRoom}
                    onChange={(e) => setNewStudentRoom(e.target.value)}
                    placeholder="e.g. A-304"
                    className="w-full p-2.5 rounded-lg border border-[#d8d3c7] text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="stuEmailInput" className="text-xs font-bold text-[#17253a] block mb-1">
                  College Email (Optional)
                </label>
                <input
                  id="stuEmailInput"
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="e.g. maya.stu1024@campus.edu"
                  className="w-full p-2.5 rounded-lg border border-[#d8d3c7] text-sm"
                />
              </div>

              {studentError && (
                <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                  {studentError}
                </p>
              )}

              {studentSuccess && (
                <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  {studentSuccess}
                </p>
              )}

              <button type="submit" className="primary wide">
                Add Student to Database <b>+</b>
              </button>

              <p className="text-[11px] text-[#69768a] text-center">
                Initial password will be set to <code className="bg-gray-100 px-1 py-0.5 rounded">demo123</code>. The student can sign in immediately.
              </p>
            </form>
          </article>

          {/* Existing Roster for this block */}
          <article className="admin-card">
            <div className="flex items-center justify-between pb-2 border-b border-[#eee5d6] mb-3">
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>REGISTERED RESIDENTS</p>
                <h2 style={{ margin: '3px 0 0' }}>{currentUser.block} Roster ({blockStudents.length})</h2>
              </div>
              <input
                type="text"
                placeholder="Search roster..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-[#d8d3c7]"
              />
            </div>

            <p className="text-xs text-[#69768a] mb-3">
              These students are authorized to dine at <strong>{currentUser.block} Mess</strong>.
            </p>

            <div className="max-h-96 overflow-y-auto divide-y divide-[#eee5d6]">
              {filteredStudents.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">
                  No students found matching your search in {currentUser.block}.
                </p>
              ) : (
                filteredStudents.map((stu) => (
                  <div key={stu.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-[#17253a] text-sm block">{stu.name}</strong>
                      <span className="font-mono text-[#69768a] text-xs">{stu.id}</span>
                      {stu.roomNo && (
                        <span className="ml-2 text-[#13736d] bg-[#e6f4f1] px-1.5 py-0.5 rounded text-[11px] font-semibold">
                          Room {stu.roomNo}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[11px] text-[#556272] block">
                        Pass: demo123
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">
                        ● Authorized
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      )}

      {/* Tab: Orders for this Block */}
      {activeTab === 'orders' && (
        <article className="admin-card">
          <div className="flex items-center justify-between pb-2 border-b border-[#eee5d6] mb-3">
            <div>
              <p className="eyebrow" style={{ margin: 0 }}>ORDER LOG & KITCHEN STATUS</p>
              <h2 style={{ margin: '3px 0 0' }}>{currentUser.block} Orders ({blockOrders.length})</h2>
            </div>
            <span className="text-xs text-[#69768a]">
              Manage order completion & update student status for {currentUser.block}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#eee5d6] text-[#69768a] uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-2">Token</th>
                  <th className="py-2 px-2">Student</th>
                  <th className="py-2 px-2">Items</th>
                  <th className="py-2 px-2">Amount</th>
                  <th className="py-2 px-2">Check-in</th>
                  <th className="py-2 px-2">Kitchen Status & Update</th>
                  <th className="py-2 px-2 text-right">Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee5d6]">
                {blockOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-500">
                      No orders placed for {currentUser.block} yet.
                    </td>
                  </tr>
                ) : (
                  blockOrders.map((ord) => (
                    <tr key={ord.order_id} className="hover:bg-[#faf6ed] transition">
                      <td className="py-2.5 px-2 font-mono font-bold text-[#ff7759]">{ord.token}</td>
                      <td className="py-2.5 px-2">
                        <strong className="block text-[#17253a]">{ord.student_name}</strong>
                        <span className="font-mono text-[#69768a] text-[11px]">{ord.student_id}</span>
                      </td>
                      <td className="py-2.5 px-2 max-w-xs">
                        {ord.items.map((i) => `${i.name} (×${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-bold text-[#17253a]">
                        ₹{ord.total_amount}
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                            ord.status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status === 'verified' ? '✓ Checked In' : 'Paid • Unchecked'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {ord.is_completed || ord.completion_status === 'completed' ? (
                            <>
                              <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ✅ Completed
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.order_id, 'preparing')}
                                className="text-[10px] text-[#69768a] hover:text-[#17253a] underline ml-1"
                              >
                                Set Preparing
                              </button>
                            </>
                          ) : ord.completion_status === 'preparing' ? (
                            <>
                              <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-amber-100 text-amber-800 border border-amber-300">
                                🍳 Preparing
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.order_id, 'completed')}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] transition shadow-xs"
                              >
                                Mark Completed ✓
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-blue-100 text-blue-800 border border-blue-200">
                                ⏳ Placed
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.order_id, 'completed')}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] transition shadow-xs"
                              >
                                Mark Completed ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.order_id, 'preparing')}
                                className="px-2 py-0.5 bg-[#fff2dc] hover:bg-[#fae2be] text-[#17253a] rounded font-semibold text-[11px] border border-[#ebd8bc] transition"
                              >
                                Preparing
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenVendorSlip(ord)}
                          className="font-semibold text-[#13736d] hover:underline"
                        >
                          Slip 📋
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </section>
  );
};
