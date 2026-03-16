import React from 'react';
import Navbar from './Navbar';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const location = useLocation();
    
    // We only want to add padding top if we aren't on the landing page or login/register
    // Because those pages might have their own hero sections that shouldn't be pushed down by the navbar
    const isFullScreenPage = ['/', '/login', '/register', '/forgot-password'].includes(location.pathname) || location.pathname.startsWith('/reset-password');

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
            <Navbar />
            <main style={{ 
                flex: 1, 
                paddingTop: isFullScreenPage ? '0px' : '0px', 
                marginTop: isFullScreenPage ? '0px' : '76px', // Account for fixed navbar (approx 76px height)
                display: 'flex', 
                flexDirection: 'column'
            }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
