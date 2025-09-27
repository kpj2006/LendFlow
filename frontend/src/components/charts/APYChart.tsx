'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

// Mock APY data
const generateAPYData = () => {
  const data = []
  const now = new Date()
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      makerAPY: 6.5 + Math.random() * 0.8 - 0.4,
      aaveAPY: 7.2 + Math.random() * 0.8 - 0.4,
      hybridAPY: 6.85 + Math.random() * 0.6 - 0.3,
    })
  }
  
  return data
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-gaming p-3 shadow-gaming">
        <p className="text-white font-gaming mb-2">{`Date: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="font-semibold">
            {`${entry.name}: ${entry.value.toFixed(2)}%`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function APYChart() {
  const data = generateAPYData()

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(255, 255, 255, 0.1)"
            horizontal={true}
            vertical={false}
          />
          <XAxis 
            dataKey="date" 
            stroke="#888888"
            fontSize={12}
            fontFamily="Orbitron, monospace"
          />
          <YAxis 
            stroke="#888888"
            fontSize={12}
            fontFamily="Orbitron, monospace"
            tickFormatter={(value) => `${value.toFixed(1)}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ 
              fontFamily: 'Orbitron, monospace',
              fontSize: '14px'
            }}
          />
          <Line
            type="monotone"
            dataKey="makerAPY"
            stroke="#00ff80"
            strokeWidth={2}
            name="Maker APY"
            dot={{ fill: '#00ff80', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#00ff80', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="aaveAPY"
            stroke="#0080ff"
            strokeWidth={2}
            name="Aave APY"
            dot={{ fill: '#0080ff', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#0080ff', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="hybridAPY"
            stroke="#ff0080"
            strokeWidth={3}
            name="Hybrid APY"
            dot={{ fill: '#ff0080', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, stroke: '#ff0080', strokeWidth: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}