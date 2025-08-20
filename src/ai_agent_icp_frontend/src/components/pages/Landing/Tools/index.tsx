import React from 'react'
import { ToolsList } from '../../../ui/Cards/tools/toolsData'
import ToolCard from '../../../ui/Cards/tools/toolCard'
import "./index.css"
const Tools = () => {
  return (
    <div className='tool-root'>
        <div>What We Offer</div>
        <div className='card-container'>
            {ToolsList.map((tool)=>(
                <ToolCard key={tool.id} title={tool.title} description={tool.description} sample_prompt={tool.sample_prompt} />
            ))}
        </div>
    </div>
  )
}

export default Tools