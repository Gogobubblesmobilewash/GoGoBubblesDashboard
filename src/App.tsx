import React from 'react'
import { Header } from './components/Header'
import { Overview } from './components/Overview'
import './styles/layout.css'

export function App(){
  return (
    <div className="app-root text-slate-900">
      <Header />
      <Overview />
    </div>
  )
}


