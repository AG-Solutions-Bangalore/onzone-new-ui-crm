import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Clock, Timer } from 'lucide-react';

const SessionTimeoutTracker = ({ expiryTime, onLogout }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const [isExpiring, setIsExpiring] = useState(false);
  const hasLoggedOut = useRef(false);

   const isTokenPresent = () => {
      return !!localStorage.getItem('token');
    };
  
    const checkExpiry = () => {
      if (hasLoggedOut.current || !isTokenPresent()) {
        setShowBanner(false);
        return;
      }
  
      const now = new Date();
      const expiry = new Date(expiryTime);
      const timeUntilExpiry = expiry - now;
      const fiveMinutes = 5 * 60 * 1000;
  
      if (timeUntilExpiry <= fiveMinutes && timeUntilExpiry > 0) {
        if (!isExpiring) {
          setIsExpiring(true);
          setShowBanner(true);
          setCountdown(Math.floor(timeUntilExpiry / 1000));
        }
      } else if (timeUntilExpiry <= 0) {
        performLogout();
      }
    };
  
    const performLogout = () => {
      if (!hasLoggedOut.current && isTokenPresent()) {
        hasLoggedOut.current = true;
        onLogout();
      }
    };
  
    useEffect(() => {
     
      if (!isTokenPresent()) {
        return;
      }
  
     
      checkExpiry();
  
      let intervalIds = [];
  
      const countdownTimer = () => {
        
        if (isExpiring && !hasLoggedOut.current && isTokenPresent()) {
          setCountdown(prev => {
            if (prev <= 1) {
              performLogout();
              return 0;
            }
            return prev - 1;
          });
        }
      };
  
      // Set up intervals for ongoing checks
      const checkInterval = setInterval(checkExpiry, 1000);
      const countdownInterval = setInterval(countdownTimer, 1000);
      
      intervalIds.push(checkInterval, countdownInterval);
  
      // Also set up a listener for storage events to catch manual logouts
      const handleStorageChange = (e) => {
        if (e.key === 'token' && !e.newValue) {
          // Token was removed
          setShowBanner(false);
          hasLoggedOut.current = true;
          intervalIds.forEach(id => clearInterval(id));
        }
      };
  
      window.addEventListener('storage', handleStorageChange);
  
      return () => {
        intervalIds.forEach(id => clearInterval(id));
        intervalIds = [];
        window.removeEventListener('storage', handleStorageChange);
      };
    }, [expiryTime, onLogout, isExpiring]);
  
    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
  
  
    if (!showBanner || hasLoggedOut.current || !isTokenPresent()) return null;

  return (
    <div className="space-y-20">
  
 <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md animate-slide-down">
        <div className="mx-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-300">
          <div className="h-1 bg-yellow-500 rounded-tl-lg" style={{ 
              width: `${(countdown / 300) * 100}%`,
              transition: 'width 1s linear'
            }} />
            <div className="p-2">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-100 rounded-full p-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-gray-800 text-sm">
                    Session timeout in <span className="text-yellow-600 font-bold font-mono">{formatTime(countdown)}</span>
                  </div>
                  <div className="text-gray-600 text-xs mt-1">Save your work to prevent data loss</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 


    

     
  
    </div>
  );
};

export default SessionTimeoutTracker;