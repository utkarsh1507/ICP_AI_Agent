import React, { useEffect, useRef } from 'react';
import './index.css';
import { useAuth } from '../../../hooks/useAuth';

const Features = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const {login} = useAuth();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.classList.add('visible');
        else el.classList.remove('visible');
      },
      { threshold: 0.15 } // trigger when ~15% visible
    );

    io.observe(el);
    return () => io.unobserve(el);
  }, []);

  const explore = () => {
    document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div ref={ref} className="features-root fade-in-up">
      <div className="features-heading">Introducing MintFinity.AI</div>
      <div className="features-bottom-heading">
        Automated AI Agents with smart prompts to handle all your ICRC tokens
      </div>
      <div className='button-div'>

      <button onClick={explore} className="explore-button">Explore ↓</button>
      <button onClick={login} className="explore-button">Start Now</button>
      </div>
    </div>
  );
};

export default Features;
