'use client''use client'



import { useNetwork } from 'wagmi'import { useNetwork } from 'wagmi'

import { AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react'import { AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react'

import { useState } from 'react'import { useState } from 'react'



export default function NetworkValidator() {export default function NetworkValidator() {

  const { chain } = useNetwork()  const { chain } = useNetwork()

  const [showTooltip, setShowTooltip] = useState(false)  const [showTooltip, setShowTooltip] = useState(false)

    

  const isCorrectNetwork = chain?.id === 31 // Rootstock Testnet//   const isCorrectNetwork = chain?.id === 31 // Rootstock Testnet

  const isConnected = !!chain//   const isConnected = !!chain



  // Not connected - show disconnected icon<<<<<<< HEAD

  if (!isConnected) {  // Not connected - show disconnected icon

    return (  if (!isConnected) {

      <div className="relative">    return (

        <div       <div className="relative">

          className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700/50 border border-gray-600"        <div 

          onMouseEnter={() => setShowTooltip(true)}          className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700/50 border border-gray-600"

          onMouseLeave={() => setShowTooltip(false)}          onMouseEnter={() => setShowTooltip(true)}

        >          onMouseLeave={() => setShowTooltip(false)}

          <WifiOff className="h-4 w-4 text-gray-400" />        >

        </div>          <WifiOff className="h-4 w-4 text-gray-400" />

        {showTooltip && (        </div>

          <div className="absolute top-10 left-0 z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg min-w-48">        {showTooltip && (

            <div className="text-xs text-gray-300">          <div className="absolute top-10 left-0 z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg min-w-48">

              <div className="flex items-center mb-2">            <div className="text-xs text-gray-300">

                <WifiOff className="h-3 w-3 text-gray-400 mr-2" />              <div className="flex items-center mb-2">

                <span className="text-gray-400">Wallet Not Connected</span>                <WifiOff className="h-3 w-3 text-gray-400 mr-2" />

              </div>                <span className="text-gray-400">Wallet Not Connected</span>

              <div className="text-gray-500">Connect your wallet to view network status</div>              </div>

            </div>              <div className="text-gray-500">Connect your wallet to view network status</div>

          </div>            </div>

        )}          </div>

      </div>        )}

    )      </div>

  }    )

  }

  // Correct network - show success icon

  if (isCorrectNetwork) {  // Correct network - show success icon

    return (  if (isCorrectNetwork) {

      <div className="relative">    return (

        <div       <div className="relative">

          className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 border border-green-500/50"        <div 

          onMouseEnter={() => setShowTooltip(true)}          className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 border border-green-500/50"

          onMouseLeave={() => setShowTooltip(false)}          onMouseEnter={() => setShowTooltip(true)}

        >          onMouseLeave={() => setShowTooltip(false)}

          <CheckCircle className="h-4 w-4 text-green-400" />        >

        </div>          <CheckCircle className="h-4 w-4 text-green-400" />

        {showTooltip && (        </div>

          <div className="absolute top-10 left-0 z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg min-w-48">        {showTooltip && (

            <div className="text-xs">          <div className="absolute top-10 left-0 z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg min-w-48">

              <div className="flex items-center mb-2">            <div className="text-xs">

                <CheckCircle className="h-3 w-3 text-green-400 mr-2" />              <div className="flex items-center mb-2">

                <span className="text-green-400 font-medium">Connected to Rootstock Testnet</span>                <CheckCircle className="h-3 w-3 text-green-400 mr-2" />

              </div>                <span className="text-green-400 font-medium">Connected to Rootstock Testnet</span>

            </div>              </div>

          </div>            </div>

        )}          </div>

      </div>        )}

    )      </div>

  }    )

  }

  // Wrong network - show warning icon

  return (  // Wrong network - show warning icon

    <div className="relative">  return (

      <div     <div className="relative">

        className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 animate-pulse"      <div 

        onMouseEnter={() => setShowTooltip(true)}        className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 animate-pulse"

        onMouseLeave={() => setShowTooltip(false)}        onMouseEnter={() => setShowTooltip(true)}

      >        onMouseLeave={() => setShowTooltip(false)}

        <AlertTriangle className="h-4 w-4 text-red-400" />      >

      </div>        <AlertTriangle className="h-4 w-4 text-red-400" />

      {showTooltip && (      </div>

        <div className="absolute top-10 left-0 z-50 bg-gray-800 border border-red-600 rounded-lg p-3 shadow-lg min-w-64">      {showTooltip && (

          <div className="text-xs">        <div className="absolute top-10 left-0 z-50 bg-gray-800 border border-red-600 rounded-lg p-3 shadow-lg min-w-64">

            <div className="flex items-center mb-2">          <div className="text-xs">

              <AlertTriangle className="h-3 w-3 text-red-400 mr-2" />            <div className="flex items-center mb-2">

              <span className="text-red-400 font-medium">Wrong Network</span>              <AlertTriangle className="h-3 w-3 text-red-400 mr-2" />

            </div>              <span className="text-red-400 font-medium">Wrong Network</span>

            <div className="space-y-1 text-gray-300 mb-3">            </div>

              <div>Connected: <span className="text-red-300">{chain?.name || 'Unknown'} (ID: {chain?.id})</span></div>            <div className="space-y-1 text-gray-300 mb-3">

              <div>Required: <span className="text-green-300">Rootstock Testnet (ID: 31)</span></div>              <div>Connected: <span className="text-red-300">{chain?.name || 'Unknown'} (ID: {chain?.id})</span></div>

            </div>              <div>Required: <span className="text-green-300">Rootstock Testnet (ID: 31)</span></div>

            <div className="text-gray-500 text-[10px] border-t border-gray-700 pt-2">            </div>

              Switch to Rootstock Testnet in your wallet            <div className="text-gray-500 text-[10px] border-t border-gray-700 pt-2">

            </div>              Switch to Rootstock Testnet in your wallet

          </div>            </div>

        </div>          </div>

      )}        </div>

    </div>      )}

  )    </div>

}  )
}
=======
//   // Not connected - just show basic message
//   if (!isConnected) {
//     return null // Don't show anything if wallet not connected
//   }

//   // Correct network - show success
//   if (isCorrectNetwork) {
//     return (
//       <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
//         <div className="flex items-center">
//           <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
//           <div>
//             <h3 className="text-sm font-medium text-green-800">✅ Connected to Rootstock Testnet</h3>
//             <p className="text-sm text-green-700 mt-1">Chain ID: 31 | Currency: tRBTC</p>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   // Wrong network - just show network details
//   return (
//     <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
//       <div className="flex items-start">
//         <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
//         <div>
//           <h3 className="text-sm font-medium text-red-800 mb-2">⚠️ Wrong Network</h3>
//           <p className="text-sm text-red-700 mb-3">
//             Connected to: <strong>{chain?.name || 'Unknown'}</strong> (Chain ID: {chain?.id})<br/>
//             Required: <strong>Rootstock Testnet</strong>
//           </p>
          
//           <div className="bg-white border border-red-300 rounded-lg p-3 text-xs">
//             <div className="space-y-1 text-red-700">
//               <div><strong>Network Name:</strong> Rootstock Testnet</div>
//               <div><strong>RPC URL:</strong> https://public-node.testnet.rsk.co</div>
//               <div><strong>Chain ID:</strong> 31</div>
//               <div><strong>Currency:</strong> tRBTC</div>
//               <div><strong>Block Explorer:</strong> https://explorer.testnet.rootstock.io</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
>>>>>>> 78de286 (walrus bug)
