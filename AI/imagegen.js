/**
 * Image Generation using Google Gemini API
 * Generates personalized product images by replacing models with user photos
 */
const testMode = true;
// Configuration
const GEMINI_API_KEY = 'your key here'; // Replace with your actual API key
const GEMINI_MODEL = 'gemini-2.5-flash-image-preview';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Optimized generation configuration for fast response and landscape images
const GENERATION_CONFIG = {
    temperature: 0.4,                    // Lower temperature for more consistent, faster generation
    // topP: 0.8,                          // Nucleus sampling for focused generation
    // topK: 40,                           // Top-k sampling for quality control
    maxOutputTokens: 1024,               // Sufficient tokens for image generation
    candidateCount: 1,                   // Single candidate for faster response
    responseModalities: ["IMAGE"],       // Explicitly request image modality
    seed: 42,                           // Fixed seed for consistent results
    // responseSchema: {
    //     type: "OBJECT",
    //     properties: {
    //       image: { type: "STRING", description: "Base64 encoded image" },
    //       aspectRatio: { type: "STRING", description: "Aspect ratio, e.g., '16:9'" }
    //     },
    //   }
};

// Prompt template will be loaded from prompt.txt
let PROMPT_TEMPLATE = '';

// User image base64 will be loaded from userImageBase64.txt
let USER_IMAGE_BASE64 = '';

/**
 * Load prompt template from prompt.txt file
 */
async function loadPromptTemplate() {
    try {
        const response = await fetch(chrome.runtime.getURL('AI/prompt.txt'));
        if (!response.ok) {
            throw new Error(`Failed to load prompt template: ${response.status}`);
        }
        PROMPT_TEMPLATE = await response.text();
        console.log('Prompt template loaded successfully');
    } catch (error) {
        console.error('Error loading prompt template:', error);
        // Fallback prompt if file loading fails
        PROMPT_TEMPLATE = `PRIMARY GOAL:
Replace the model with the USER while preserving identity and realism.

FEATURED PRODUCT (DESCRIPTION-BASED REPLACEMENT):
Wear and integrate the following product into the outfit: "[USER_PRODUCT_DESCRIPTION_TEXT]".

ART STYLE & QUALITY:
Hyper‑realistic, high‑detail, sharp focus, high‑end commercial fashion photography, 8K look.`;
    }
}

/**
 * Load user image base64 from userImageBase64.txt file
 */
async function loadUserImageBase64() {
    try {
        const response = await fetch(chrome.runtime.getURL('AI/userImageBase64.txt'));
        if (!response.ok) {
            throw new Error(`Failed to load user image: ${response.status}`);
        }
        USER_IMAGE_BASE64 = await response.text();
        console.log('User image base64 loaded successfully');
    } catch (error) {
        console.error('Error loading user image base64:', error);
        throw new Error('User image base64 file not found or invalid');
    }
}

/**
 * Update user image base64 for daisy chaining
 * @param {string} newUserImageBase64 - New base64 encoded user image
 */
function updateUserImageBase64(newUserImageBase64) {
    if (newUserImageBase64) {
        USER_IMAGE_BASE64 = newUserImageBase64;
        console.log('User image base64 updated for daisy chaining');
    }
}

/**
 * Reset user image base64 to default (from file)
 */
async function resetToDefaultUserImage() {
    try {
        await loadUserImageBase64();
        console.log('User image base64 reset to default');
    } catch (error) {
        console.error('Error resetting user image to default:', error);
    }
}

/**
 * Initialize the image generation module
 */
async function initializeImageGen() {
    await Promise.all([
        loadPromptTemplate(),
        loadUserImageBase64()
    ]);
    console.log('Image generation module initialized');
}

/**
 * Generate personalized product image using Gemini API
 * @param {string} ogImageUrl - URL of the og:image from the page
 * @param {string} productDescription - Description of the product to integrate
 * @param {string} daisyChainUserImage - Optional base64 user image for daisy chaining
 * @returns {Promise<Object>} - Response with generated image data
 */
async function generatePersonalizedImage(ogImageUrl, productDescription, daisyChainUserImage = null) {
    try {
        // Ensure initialization is complete
        if (!PROMPT_TEMPLATE || !USER_IMAGE_BASE64) {
            await initializeImageGen();
        }

        // Validate inputs
        if (!ogImageUrl || !productDescription) {
            throw new Error('Both ogImageUrl and productDescription are required');
        }

        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
            throw new Error('Please set your Gemini API key in the GEMINI_API_KEY constant');
        }

        // Fetch the og:image and convert to base64
        const ogImageBase64 = await fetchImageAsBase64(ogImageUrl);

        // Use daisy chain user image if provided, otherwise use default user image
        const userImageToUse = daisyChainUserImage || USER_IMAGE_BASE64;
        
        // Build the prompt with dynamic replacements
        const finalPrompt = PROMPT_TEMPLATE
            .replace('[USER_IMAGE_REFERENCE]', 'the provided user photo image 1')
            .replace('[USER_PRODUCT_DESCRIPTION_TEXT]', productDescription);

        // Prepare the request payload
        const requestPayload = {
            contents: [{
                parts: [
                    { text: finalPrompt },
                    {
                        inlineData: {
                            mimeType: "image/png",
                            data: userImageToUse
                        }
                    },
                    {
                        inlineData: {
                            mimeType: "image/png", // Adjust based on actual image type
                            data: ogImageBase64
                        }
                    }
                ]
            }],
            generationConfig: GENERATION_CONFIG
        };
        console.error('api request :', requestPayload);
        let result;
        if (!testMode) {
            // Make API call to Gemini
            const response = await fetch(`${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestPayload)
            });

            console.error('api response :', response);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            result = await response.json();
        } else {

            result = await fetch(chrome.runtime.getURL('AI/testData.json'));
        }
        result = await result.json();
        console.error('api result :', result);

        // Extract the generated image from the response
        const generatedImage = extractGeneratedImage(result);

        return {
            success: true,
            imageData: generatedImage,
            response: result
        };

    } catch (error) {
        console.error('Error generating personalized image:', error);
        return {
            success: false,
            error: error.message,
            details: error
        };
    }
}

/**
 * Fetch image from URL and convert to base64
 * @param {string} imageUrl - URL of the image to fetch
 * @returns {Promise<string>} - Base64 encoded image data
 */
async function fetchImageAsBase64(imageUrl) {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Remove data:image/png;base64, prefix if present
                const base64 = reader.result.split(',')[1] || reader.result;
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        throw new Error(`Error converting image to base64: ${error.message}`);
    }
}

/**
 * Extract generated image data from Gemini API response
 * @param {Object} apiResponse - Response from Gemini API
 * @returns {Object|null} - Generated image data or null if not found
 */
function extractGeneratedImage(apiResponse) {
    try {
        const candidates = apiResponse.candidates;
        if (!candidates || candidates.length === 0) {
            return null;
        }

        const content = candidates[0].content;
        if (!content || !content.parts) {
            return null;
        }

        // Look for inline data (image) in the response parts
        for (const part of content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return {
                    data: part.inlineData.data,
                    mimeType: part.inlineData.mimeType || 'image/png'
                };
            }
        }

        return null;
    } catch (error) {
        console.error('Error extracting generated image:', error);
        return null;
    }
}

/**
 * Save generated image to file (for Node.js environments)
 * @param {string} imageData - Base64 encoded image data
 * @param {string} filename - Output filename
 * @param {string} mimeType - MIME type of the image
 */
function saveImageToFile(imageData, filename, mimeType = 'image/png') {
    try {
        // This function is for Node.js environments
        if (typeof window === 'undefined') {
            const fs = require('fs');
            const buffer = Buffer.from(imageData, 'base64');
            fs.writeFileSync(filename, buffer);
            console.log(`Image saved as ${filename}`);
        } else {
            // For browser environments, trigger download
            const link = document.createElement('a');
            link.href = `data:${mimeType};base64,${imageData}`;
            link.download = filename;
            link.click();
        }
    } catch (error) {
        console.error('Error saving image:', error);
    }
}

/**
 * Convert base64 image data to Blob URL (for browser environments)
 * @param {string} base64Data - Base64 encoded image data
 * @param {string} mimeType - MIME type of the image
 * @returns {string} - Blob URL
 */
function base64ToBlobUrl(base64Data, mimeType = 'image/png') {
    try {
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });

        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Error converting base64 to blob URL:', error);
        return null;
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        generatePersonalizedImage,
        fetchImageAsBase64,
        extractGeneratedImage,
        saveImageToFile,
        base64ToBlobUrl,
        updateUserImageBase64,
        resetToDefaultUserImage,
        GEMINI_API_KEY,
        GEMINI_MODEL,
        GENERATION_CONFIG
    };
} else {
    // Browser environment
    window.ImageGen = {
        generatePersonalizedImage,
        fetchImageAsBase64,
        extractGeneratedImage,
        saveImageToFile,
        base64ToBlobUrl,
        updateUserImageBase64,
        resetToDefaultUserImage,
        GEMINI_API_KEY,
        GEMINI_MODEL,
        GENERATION_CONFIG
    };
}

// Example usage:
/*
// Set your API key
const GEMINI_API_KEY = 'your_actual_api_key_here';

// Generate image
const result = await generatePersonalizedImage(
    'https://example.com/product-image.jpg',
    'a bright red chunky knit scarf'
);

if (result.success) {
    // Save or display the generated image
    saveImageToFile(result.imageData.data, 'personalized_product_image.png');
    
    // Or create blob URL for browser display
    const blobUrl = base64ToBlobUrl(result.imageData.data);
    console.log('Generated image blob URL:', blobUrl);
} else {
    console.error('Generation failed:', result.error);
}
*/
