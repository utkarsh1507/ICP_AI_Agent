

import { Canvas } from '@react-three/fiber'
import Features from '../../components/pages/Landing/Features'
import Footer from '../../components/pages/Landing/Footer'
import Header from '../../components/pages/Landing/Header'
import Hero from '../../components/pages/Landing/Hero'
import WireframeMesh from '../../components/ui/WireMesh'



const Landing = () => {
  return (
  <div >
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
        
        }}
    >
    <WireframeMesh/>
    </Canvas>
    <Features/>
  

    </div>
  )
}

export default Landing