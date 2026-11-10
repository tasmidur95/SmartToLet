import { Route, Routes, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { Loader } from './components/Ui.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Properties from './pages/Properties.jsx';
import PropertyDetails from './pages/PropertyDetails.jsx';
import { Login, Register } from './pages/Auth.jsx';
import Wishlist from './pages/Wishlist.jsx';
import AddProperty from './pages/AddProperty.jsx';
import MyProperties from './pages/MyProperties.jsx';
import MyVisits from './pages/MyVisits.jsx';
import MyOrders from './pages/MyOrders.jsx';
import Profile from './pages/Profile.jsx';
import { ForgotPassword, ResetPassword } from './pages/Password.jsx';
import { About, Faq, Privacy, Terms } from './pages/Info.jsx';
import { CategoryPage, CityPage } from './pages/Discover.jsx';
import Compare from './pages/Compare.jsx';
import ListYourProperty from './pages/ListYourProperty.jsx';
import { Blog, BlogPost, Contact, NotFound, PaymentResult } from './pages/Misc.jsx';

// The admin panel is a separate chunk so visitors never download it.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

export default function App() {
  const { pathname } = useLocation();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <Suspense fallback={<Loader />}><Routes><Route path="/admin/*" element={<AdminApp />} /></Routes></Suspense>;
  }
  const bare = ['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname); // auth pages have their own layout

  return (
    <>
      <ScrollTop />
      {!bare && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetails />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/rent/:category" element={<CategoryPage />} />
          <Route path="/city/:id" element={<CityPage />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/list-your-property" element={<ListYourProperty />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/payment/:result" element={<PaymentResult />} />

          <Route path="/wishlist" element={guard(<Wishlist />)} />
          <Route path="/my/properties" element={guard(<MyProperties />)} />
          <Route path="/my/properties/new" element={guard(<AddProperty />)} />
          <Route path="/my/visits" element={guard(<MyVisits />)} />
          <Route path="/my/orders" element={guard(<MyOrders />)} />
          <Route path="/profile" element={guard(<Profile />)} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!bare && <Footer />}
    </>
  );
}
