import React from 'react'
import { ExploreCardsProps } from '../../../types/Card/explore/explore'
import "./exploreCards.css"
const ExploreCards = (props : ExploreCardsProps) => {
  return (
    <div className='card-root'>
        <div className='card-title'>{props.title}</div>
        <img src={props.imageUrl} className='card-image'/>
        <div className='card-desc'>{props.description}</div>
    </div>
  )
}

export default ExploreCards