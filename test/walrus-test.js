const { useLendingDataStorage } = require('../hooks/useWalrus')

// Test Walrus blob storage functionality
async function testWalrusStorage() {
  console.log('🧪 Testing Walrus blob storage...')

  // Create a mock hook instance (since we can't use React hooks in Node.js)
  // We'll test the core functionality directly

  // Walrus Testnet endpoints with comprehensive fallback options
  const AGGREGATORS = [
    'https://aggregator.walrus-testnet.walrus.space',
    'http://cs74th801mmedkqu25ng.bdnodes.net:8443',
    'http://walrus-storage.testnet.nelrann.org:9000',
    'http://walrus-testnet.equinoxdao.xyz:9000',
    'http://walrus-testnet.suicore.com:9000',
    'https://agg.test.walrus.eosusa.io',
    'https://aggregator.testnet.walrus.atalma.io',
    'https://aggregator.testnet.walrus.mirai.cloud',
    'https://aggregator.walrus-01.tududes.com',
    'https://aggregator.walrus-testnet.h2o-nodes.com',
    'https://aggregator.walrus.banansen.dev',
    'https://aggregator.walrus.testnet.mozcomputing.dev',
    'https://sm1-walrus-testnet-aggregator.stakesquid.com',
    'https://sui-walrus-tn-aggregator.bwarelabs.com',
    'https://suiftly-testnet-agg.mhax.io',
    'https://testnet-aggregator-walrus.kiliglab.io',
    'https://testnet-aggregator.walrus.graphyte.dev',
    'https://testnet-walrus.globalstake.io',
    'https://testnet.aggregator.walrus.silentvalidator.com',
    'https://wal-aggregator-testnet.staketab.org',
    'https://walrus-agg-test.bucketprotocol.io',
    'https://walrus-agg-testnet.chainode.tech:9002',
    'https://walrus-agg.testnet.obelisk.sh',
    'https://walrus-aggregator-testnet.cetus.zone',
    'https://walrus-aggregator-testnet.haedal.xyz',
    'https://walrus-aggregator-testnet.n1stake.com',
    'https://walrus-aggregator-testnet.staking4all.org',
    'https://walrus-aggregator-testnet.suisec.tech',
    'https://walrus-aggregator.thcloud.dev',
    'https://walrus-test-aggregator.thepassivetrust.com',
    'https://walrus-testnet-aggregator-1.zkv.xyz',
    'https://walrus-testnet-aggregator.brightlystake.com',
    'https://walrus-testnet-aggregator.chainbase.online',
    'https://walrus-testnet-aggregator.chainflow.io',
    'https://walrus-testnet-aggregator.crouton.digital',
    'https://walrus-testnet-aggregator.dzdaic.com',
    'https://walrus-testnet-aggregator.everstake.one',
    'https://walrus-testnet-aggregator.luckyresearch.org',
    'https://walrus-testnet-aggregator.natsai.xyz',
    'https://walrus-testnet-aggregator.nodeinfra.com',
    'https://walrus-testnet-aggregator.nodes.guru',
    'https://walrus-testnet-aggregator.redundex.com',
    'https://walrus-testnet-aggregator.rpc101.org',
    'https://walrus-testnet-aggregator.rubynodes.io',
    'https://walrus-testnet-aggregator.stakecraft.com',
    'https://walrus-testnet-aggregator.stakeengine.co.uk',
    'https://walrus-testnet-aggregator.stakely.io',
    'https://walrus-testnet-aggregator.stakeme.pro',
    'https://walrus-testnet-aggregator.stakin-nodes.com',
    'https://walrus-testnet-aggregator.stakingdefenseleague.com',
    'https://walrus-testnet-aggregator.starduststaking.com',
    'https://walrus-testnet-aggregator.talentum.id',
    'https://walrus-testnet-aggregator.trusted-point.com',
    'https://walrus-testnet.blockscope.net',
    'https://walrus-testnet.lionscraft.blockscape.network:9000',
    'https://walrus-testnet.validators.services.kyve.network/aggregate',
    'https://walrus-testnet.veera.com',
    'https://walrus-tn.juicystake.io:9443',
    'https://walrus.testnet.aggregator.stakepool.dev.br',
    'https://walrusagg.testnet.pops.one'
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
    'http://waltest.chainflow.io:9001',
    'https://publisher.testnet.walrus.atalma.io',
    'https://publisher.walrus-01.tududes.com',
    'https://publisher.walrus-testnet.h2o-nodes.com',
    'https://publisher.walrus-testnet.walrus.space',
    'https://publisher.walrus.banansen.dev',
    'https://sm1-walrus-testnet-publisher.stakesquid.com',
    'https://sui-walrus-testnet-publisher.bwarelabs.com',
    'https://suiftly-testnet-pub.mhax.io',
    'https://testnet-publisher-walrus.kiliglab.io',
    'https://testnet-publisher.walrus.graphyte.dev',
    'https://testnet.publisher.walrus.silentvalidator.com',
    'https://wal-publisher-testnet.staketab.org',
    'https://walrus-publish-testnet.chainode.tech:9003',
    'https://walrus-publisher-testnet.n1stake.com',
    'https://walrus-publisher-testnet.staking4all.org',
    'https://walrus-publisher.rubynodes.io',
    'https://walrus-publisher.thcloud.dev',
    'https://walrus-testnet-published.luckyresearch.org',
    'https://walrus-testnet-publisher-1.zkv.xyz',
    'https://walrus-testnet-publisher.chainbase.online',
    'https://walrus-testnet-publisher.crouton.digital',
    'https://walrus-testnet-publisher.dzdaic.com',
    'https://walrus-testnet-publisher.everstake.one',
    'https://walrus-testnet-publisher.nami.cloud',
    'https://walrus-testnet-publisher.natsai.xyz',
    'https://walrus-testnet-publisher.nodeinfra.com',
    'https://walrus-testnet-publisher.nodes.guru',
    'https://walrus-testnet-publisher.redundex.com',
    'https://walrus-testnet-publisher.rpc101.org',
    'https://walrus-testnet-publisher.stakecraft.com',
    'https://walrus-testnet-publisher.stakeengine.co.uk',
    'https://walrus-testnet-publisher.stakely.io',
    'https://walrus-testnet-publisher.stakeme.pro',
    'https://walrus-testnet-publisher.stakingdefenseleague.com',
    'https://walrus-testnet-publisher.starduststaking.com',
    'https://walrus-testnet-publisher.trusted-point.com',
    'https://walrus-testnet.blockscope.net:11444',
    'https://walrus-testnet.validators.services.kyve.network/publish',
    'https://walrus.testnet.publisher.stakepool.dev.br'
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