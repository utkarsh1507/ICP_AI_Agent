import React, { useEffect, useRef } from 'react'
import "./index.css"
const Explore = () => {
    const ref = useRef<HTMLDivElement | null>(null);
    
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
  return (
    <div ref={ref} className='explore fade-in-up' id='explore-section'>
        <div className='heading'>Revolutionising Token Management</div>
    </div>
  )
}

export default Explore