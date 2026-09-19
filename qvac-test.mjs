import {
  loadModel,
  LLAMA_3_2_1B_INST_Q4_0,
  completion,
  unloadModel
} from '@qvac/sdk'

try {
  console.log('Starting QVAC...')

  console.log('Loading AI model...')
  const modelId = await loadModel({
    modelSrc: LLAMA_3_2_1B_INST_Q4_0,
    modelType: 'llm',
    onProgress: (p) => {
      console.log(`Downloading: ${p.percentage.toFixed(0)}%`)
    }
  })

  console.log('Model loaded!')
  console.log('Generating response...')

  const result = completion({
    modelId,
    history: [
      {
        role: 'user',
        content: 'Explain Java inheritance in one simple sentence.'
      }
    ],
    stream: true
  })

  for await (const token of result.tokenStream) {
    process.stdout.write(token)
  }

  console.log('\n')
  console.log('AI response generated successfully.')

  await unloadModel({ modelId })

  console.log('Model unloaded.')
  console.log('QVAC TEST PASSED!')
} catch (error) {
  console.error('\nQVAC TEST FAILED:')
  console.error(error)
  process.exit(1)
}