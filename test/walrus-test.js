const { useLendingDataStorage } = require('../hooks/useWalrus')

// Test Walrus blob storage functionality
async function testWalrusStorage() {
  console.log('🧪 Testing Walrus blob storage...')

  // Create a mock hook instance (since we can't use React hooks in Node.js)
  // We'll test the core functionality directly

  // Walrus Testnet endpoints
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

  // Helper function to try multiple endpoints
  const tryWithFallback = async (endpoints, operation) => {
    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`)
        const result = await operation(endpoint)
        console.log(`✅ Success with ${endpoint}`)
        return result
      } catch (error) {
        console.warn(`❌ Failed with ${endpoint}:`, error.message)
        continue
      }
    }
    throw new Error('All endpoints failed')
  }

  // Test data
  const testData = {
    type: 'test_data',
    message: 'Walrus integration test',
    timestamp: Date.now(),
    testId: Math.random().toString(36).substring(7)
  }

  console.log('📤 Storing test data:', testData)

  try {
    // Test storing data
    const storeOperation = async (publisher) => {
      const response = await fetch(`${publisher}/v1/blobs?epochs=1`, {
        method: 'PUT',
        body: JSON.stringify(testData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('📄 Store response:', result)

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

    const storeResult = await tryWithFallback(PUBLISHERS, storeOperation)
    console.log('✅ Data stored successfully:', storeResult)

    if (storeResult && storeResult.blobId) {
      console.log('📥 Retrieving stored data...')

      // Test retrieving data
      const retrieveOperation = async (aggregator) => {
        const response = await fetch(`${aggregator}/v1/blobs/${storeResult.blobId}`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.text()
        return JSON.parse(data)
      }

      const retrievedData = await tryWithFallback(AGGREGATORS, retrieveOperation)
      console.log('✅ Data retrieved successfully:', retrievedData)

      // Verify data integrity
      if (retrievedData.testId === testData.testId) {
        console.log('🎉 SUCCESS: Data integrity verified!')
        console.log('📊 Test Summary:')
        console.log('   - Original testId:', testData.testId)
        console.log('   - Retrieved testId:', retrievedData.testId)
        console.log('   - Blob ID:', storeResult.blobId)
      } else {
        console.log('❌ FAILURE: Data integrity check failed!')
        console.log('   - Expected:', testData.testId)
        console.log('   - Got:', retrievedData.testId)
      }
    } else {
      console.log('❌ FAILURE: No blob ID returned from storage')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testWalrusStorage().catch(console.error)