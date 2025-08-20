import React from 'react'
import { ToolCardProps } from '../../../types/Card/tools/tools'
import "./toolCard.css"

const ToolCard = (props : ToolCardProps) => {
  return (
    <div className="tool-card">
        <h2 className="tool-title">{props.title}</h2>
        <p className="tool-desc">{props.description}</p>
       {props.sample_prompt != '' &&

           <div className="tool-prompt">
            <span className="prompt-label">Sample Prompt:</span>
            <code className="prompt-text">{props.sample_prompt}</code>
          </div>
        }
     
    </div>
  )
}

export default ToolCard
