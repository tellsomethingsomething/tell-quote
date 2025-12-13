// Quick test of encryption utilities
import { encryptData, decryptData, encryptFields, decryptFields, maskSensitiveData, validateApiKeyFormat } from './src/utils/encryption.js';

async function testEncryption() {
    console.log('Testing Encryption Utilities...\n');

    // Test 1: Basic encryption/decryption
    console.log('Test 1: Basic Encryption/Decryption');
    const original = 'sk-ant-api03-test-key-1234567890';
    const encrypted = await encryptData(original);
    const decrypted = await decryptData(encrypted);
    console.log('  Original:', original);
    console.log('  Encrypted:', encrypted.substring(0, 30) + '...');
    console.log('  Decrypted:', decrypted);
    console.log('  Match:', original === decrypted ? '✓ PASS' : '✗ FAIL');
    console.log();

    // Test 2: Field encryption
    console.log('Test 2: Field Encryption');
    const testObj = {
        anthropicKey: 'sk-ant-api03-test123',
        openaiKey: 'sk-proj-test456',
        publicData: 'not encrypted'
    };
    const encryptedObj = await encryptFields(testObj, ['anthropicKey', 'openaiKey']);
    const decryptedObj = await decryptFields(encryptedObj, ['anthropicKey', 'openaiKey']);
    console.log('  Original:', testObj);
    console.log('  Encrypted:', encryptedObj);
    console.log('  Decrypted:', decryptedObj);
    console.log('  Match:', testObj.anthropicKey === decryptedObj.anthropicKey ? '✓ PASS' : '✗ FAIL');
    console.log();

    // Test 3: Data masking
    console.log('Test 3: Data Masking');
    const apiKey = 'sk-ant-api03-1234567890abcdef';
    const masked = maskSensitiveData(apiKey);
    console.log('  Original:', apiKey);
    console.log('  Masked:', masked);
    console.log('  Masked correctly:', masked.includes('****') ? '✓ PASS' : '✗ FAIL');
    console.log();

    // Test 4: API key validation
    console.log('Test 4: API Key Validation');
    const validAnthropicKey = 'sk-ant-api03-1234567890abcdef1234567890';
    const invalidKey = 'invalid-key';
    const validAnthropic = validateApiKeyFormat(validAnthropicKey, 'sk-ant-');
    const invalid = validateApiKeyFormat(invalidKey, 'sk-ant-');
    console.log('  Valid Anthropic:', validAnthropicKey, '→', validAnthropic ? '✓ PASS' : '✗ FAIL');
    console.log('  Invalid key:', invalidKey, '→', !invalid ? '✓ PASS' : '✗ FAIL');
    console.log();

    console.log('All tests completed!');
}

testEncryption().catch(console.error);
