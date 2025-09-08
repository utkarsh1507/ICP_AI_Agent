

import { Canvas } from '@react-three/fiber'
import Features from '../../components/pages/Landing/Features'
import Footer from '../../components/pages/Landing/Footer'
import Header from '../../components/pages/Landing/Header'
import Hero from '../../components/pages/Landing/Hero'
import WireframeMesh from '../../components/ui/WireMesh'

import "./index.css"
import Explore from '../../components/pages/Landing/Explore'
import Tools from '../../components/pages/Landing/Tools'
import { useAuth } from '../../components/hooks/useAuth'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Landing = () => {
  const {isAuthenticated} = useAuth();
  const navigate = useNavigate();
  useEffect(()=>{
    if(isAuthenticated){
      navigate("/user")
    }
  })
  return (
  <div className='landing-root-div'>
    <Header/>

    <Canvas 
    camera={{position : [0,0,5]}}
    style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1, // push behind content
          background : "black "
        }}
    >
    <WireframeMesh/>
    </Canvas>
    <div className="overlay" />
    <div className='landing-hero'>
    <Features/>
    <Explore/>
    <Tools/>
    <Footer/>
    </div>
  

    </div>
  )
}

export default Landing