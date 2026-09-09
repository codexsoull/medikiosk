import { createCase } from 'file:///c:/Users/adiis/Desktop/New folder/medikiosk/src/api/cases.js'

async function testErrorHandling() {
  console.log('=== TESTING ERROR HANDLING IN createCase() ===\n')

  try {
    // Attempt submitting without patient_name
    await createCase({ age: 30, gender: 'Male' })
    console.error('Test Failed: Expected error was not thrown!')
    process.exit(1)
  } catch (err) {
    console.log('Successfully caught error:', err.message)
    if (err.message.includes('patient_name is required')) {
      console.log('✓ Validation error properly caught and parsed!\n')
    } else {
      console.error('Unexpected error message:', err.message)
      process.exit(1)
    }
  }

  console.log('>>> ERROR HANDLING TESTS PASSED SUCCESSFULLY! <<<')
}

testErrorHandling().catch((err) => {
  console.error(err)
  process.exit(1)
})
