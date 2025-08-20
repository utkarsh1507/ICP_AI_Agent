import React, { useEffect, useRef } from 'react'
import "./index.css"
import { explore_list } from '../../../ui/Cards/explore/exploreCardsData';
import ExploreCards from '../../../ui/Cards/explore/exploreCards';


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
        <div className='cards'>
            {
                explore_list.map((card)=>(
                    <ExploreCards title={card.title} key={card.id} description={card.description} imageUrl={card.imageUrl}/>
                ))
            }
        </div>
    </div>
  )
}

export default Explore