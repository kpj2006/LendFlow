import { useState, useEffect } from 'react'

// Walrus Protocol integration hook for data storage
export function useWalrusStorage() {
  const [isConnected, setIsConnected] = useState(false)
  const [walrusClient, setWalrusClient] = useState(null)

  // Walrus Testnet endpoints with fallback options
  const AGGREGATORS = [
    'https://aggregator.walrus-testnet.walrus.space',
    'http://cs74th801mmedkqu25ng.bdnodes.net:8443',
    'http://walrus-storage.testnet.nelrann.org:9000',
    'http://walrus-testnet.equinoxdao.xyz:9000',
    'http://walrus-testnet.suicore.com:9000',
    'https://agg.test.walrus.eosusa.io',
    'https://aggregator.testnet.walrus.atalma.io',
    'https://aggregator.testnet.walrus.mirai.cloud',
    'https://aggregator.walrus-01.tududes.com'
  ]

  const PUBLISHERS = [
    'https://publisher.walrus-testnet.walrus.space',
    'http://walrus-publisher-testnet.cetus.zone:9001',
    'http://walrus-publisher-testnet.haedal.xyz:9001',
    'http://walrus-publisher-testnet.suisec.tech:9001',
    'http://walrus-storage.testnet.nelrann.org:9001',
    'http://walrus-testnet.equinoxdao.xyz:9001',
    'http://walrus-testnet.suicore.com:9001',
    'http://walrus.testnet.pops.one:9001',
    'http://waltest.chainflow.io:9001'
  ]

  useEffect(() => {
    // Initialize Walrus client
    const initWalrus = async () => {
      try {
        // Test connection to primary aggregator
        const response = await fetch(`${AGGREGATORS[0]}/v1/api`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          setWalrusClient({
            aggregators: AGGREGATORS,
            publishers: PUBLISHERS,
            primaryAggregator: AGGREGATORS[0],
            primaryPublisher: PUBLISHERS[0]
          })
          setIsConnected(true)
          console.log('Walrus client initialized with fallback endpoints')
        } else {
          throw new Error('Failed to connect to primary aggregator')
        }
      } catch (error) {
        console.error('Failed to initialize Walrus client:', error)
        // Still set as connected with fallback endpoints
        setWalrusClient({
          aggregators: AGGREGATORS,
          publishers: PUBLISHERS,
          primaryAggregator: AGGREGATORS[0],
          primaryPublisher: PUBLISHERS[0]
        })
        setIsConnected(true)
        console.log('Walrus client initialized with fallback endpoints (primary may be down)')
      }
    }

    initWalrus()
  }, [])

  return {
    isConnected,
    walrusClient
  }
}

// Hook for storing lending data on Walrus
export function useLendingDataStorage() {
  const { isConnected, walrusClient } = useWalrusStorage()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Helper function to try multiple endpoints
  const tryWithFallback = async (endpoints, operation) => {
    for (const endpoint of endpoints) {
      try {
        const result = await operation(endpoint)
        return result
      } catch (error) {
        console.warn(`Failed with ${endpoint}:`, error.message)
        continue
      }
    }
    throw new Error('All endpoints failed')
  }

  const storeLendingData = async (data) => {
    if (!isConnected || !walrusClient) {
      setError('Walrus not connected')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      // Convert data to JSON string
      const dataString = JSON.stringify(data)

      // Try storing with fallback publishers
      const storeOperation = async (publisher) => {
        const response = await fetch(`${publisher}/v1/blobs?epochs=1`, {
          method: 'PUT',
          body: dataString,
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()

        if (result.newlyCreated) {
          return {
            blobId: result.newlyCreated.blobObject.blobId,
            success: true
          }
        } else if (result.alreadyCertified) {
          return {
            blobId: result.alreadyCertified.blobId,
            success: true,
            alreadyExists: true
          }
        } else {
          throw new Error('Unexpected response format')
        }
      }

      const result = await tryWithFallback(walrusClient.publishers, storeOperation)

      setIsLoading(false)
      return result

    } catch (err) {
      setError(err.message)
      setIsLoading(false)
      return null
    }
  }

  const retrieveLendingData = async (blobId) => {
    if (!isConnected || !walrusClient) {
      console.warn('Walrus not connected')
      return null
    }

    try {
      // Try retrieving with fallback aggregators
      const retrieveOperation = async (aggregator) => {
        const response = await fetch(`${aggregator}/v1/blobs/${blobId}`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.text()
        return JSON.parse(data)
      }

      const data = await tryWithFallback(walrusClient.aggregators, retrieveOperation)
      return data

    } catch (err) {
      console.error('Error retrieving from Walrus:', err.message)
      return null
    }
  }

  return {
    storeLendingData,
    retrieveLendingData,
    isLoading,
    error,
    isConnected
  }
}

// Hook for storing orderbook data
export function useOrderbookStorage() {
  const { storeLendingData, retrieveLendingData, isLoading, error, isConnected } = useLendingDataStorage()

  const storeOrderbookSnapshot = async (snapshot) => {
    const data = {
      type: 'orderbook_snapshot',
      timestamp: Date.now(),
      data: snapshot
    }

    return await storeLendingData(data)
  }

  const storeMatchingEvent = async (event) => {
    const data = {
      type: 'matching_event',
      timestamp: Date.now(),
      data: event
    }

    return await storeLendingData(data)
  }

  const getOrderbookHistory = async (timeRange) => {
    // In a real implementation, you'd query Walrus for historical data
    // For now, return empty array as historical queries require indexing
    return []
  }

  return {
    storeOrderbookSnapshot,
    storeMatchingEvent,
    getOrderbookHistory,
    isLoading,
    error,
    isConnected
  }
}

// Hook for storing user preferences
export function useUserPreferences() {
  const { storeLendingData, retrieveLendingData, isLoading, error, isConnected } = useLendingDataStorage()

  const savePreferences = async (preferences) => {
    const data = {
      type: 'user_preferences',
      timestamp: Date.now(),
      data: preferences
    }

    return await storeLendingData(data)
  }

  const loadPreferences = async (userId) => {
    // Note: This requires maintaining a mapping of userId to blobId
    // In a real implementation, you'd store this mapping on-chain or in a database
    return null
  }

  return {
    savePreferences,
    loadPreferences,
    isLoading,
    error,
    isConnected
  }
}

// Utility functions for Walrus integration
export const walrusUtils = {
  // Generate unique key for data storage
  generateKey: (type, identifier) => {
    return `${type}_${identifier}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  // Format data for Walrus storage
  formatData: (type, data) => {
    return {
      type,
      timestamp: Date.now(),
      version: '1.0',
      data
    }
  },

  // Validate data before storage
  validateData: (data) => {
    return data && typeof data === 'object' && data.type && data.timestamp
  },

  // Check if blob ID is valid format
  isValidBlobId: (blobId) => {
    // Walrus blob IDs are base64url encoded
    const base64urlRegex = /^[A-Za-z0-9_-]+$/
    return typeof blobId === 'string' && blobId.length > 0 && base64urlRegex.test(blobId)
  },

  // Get aggregator endpoints
  getAggregators: () => [
    'https://aggregator.walrus-testnet.walrus.space',
    'http://cs74th801mmedkqu25ng.bdnodes.net:8443',
    'http://walrus-storage.testnet.nelrann.org:9000',
    'http://walrus-testnet.equinoxdao.xyz:9000',
    'http://walrus-testnet.suicore.com:9000',
    'https://agg.test.walrus.eosusa.io',
    'https://aggregator.testnet.walrus.atalma.io',
    'https://aggregator.testnet.walrus.mirai.cloud',
    'https://aggregator.walrus-01.tududes.com'
  ],

  // Get publisher endpoints
  getPublishers: () => [
    'https://publisher.walrus-testnet.walrus.space',
    'http://walrus-publisher-testnet.cetus.zone:9001',
    'http://walrus-publisher-testnet.haedal.xyz:9001',
    'http://walrus-publisher-testnet.suisec.tech:9001',
    'http://walrus-storage.testnet.nelrann.org:9001',
    'http://walrus-testnet.equinoxdao.xyz:9001',
    'http://walrus-testnet.suicore.com:9001',
    'http://walrus.testnet.pops.one:9001',
    'http://waltest.chainflow.io:9001'
  ]
}
