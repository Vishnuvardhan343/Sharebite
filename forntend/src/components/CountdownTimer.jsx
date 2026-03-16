import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ expiryTime, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(expiryTime) - new Date();
    if (difference <= 0) return null;

    return {
      h: Math.floor(difference / (1000 * 60 * 60)),
      m: Math.floor((difference / (1000 * 60)) % 60),
      s: Math.floor((difference / 1000) % 60),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (!remaining && onExpire) {
        onExpire();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTime]);

  if (!timeLeft) return <span style={{ color: 'var(--coral)', fontWeight: 700 }}>EXPIRED</span>;

  const { h, m, s } = timeLeft;
  return (
    <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>
      ⏱ {h}:{m < 10 ? `0${m}` : m}:{s < 10 ? `0${s}` : s}
    </span>
  );
};

export default CountdownTimer;
