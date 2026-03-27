import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './store/CartContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
