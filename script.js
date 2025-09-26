// Configuration - Replace with your actual API Gateway URL
const API_URL = 'https://wq3sish8bk.execute-api.ap-south-1.amazonaws.com/dev/generate';

// DOM Elements
const promptForm = document.getElementById('promptForm');
const promptTextarea = document.getElementById('prompt');
const generateBtn = document.getElementById('generateBtn');
const charCount = document.getElementById('charCount');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const results = document.getElementById('results');
const generatedImage = document.getElementById('generatedImage');
const generatedCaption = document.getElementById('generatedCaption');
const generatedHashtags = document.getElementById('generatedHashtags');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Global variables
let currentResults = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    checkAPIUrl();
});

function initializeEventListeners() {
    // Form submission
    promptForm.addEventListener('submit', handleFormSubmit);
    
    // Character counter
    promptTextarea.addEventListener('input', updateCharCount);
    
    // Auto-resize textarea
    promptTextarea.addEventListener('input', autoResizeTextarea);
    
    // Modal close on outside click
    imageModal.addEventListener('click', function(e) {
        if (e.target === imageModal) {
            closeModal();
        }
    });

    // Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && imageModal.style.display === 'block') {
            closeModal();
        }
    });

    // Initialize character counter
    updateCharCount();
}

function checkAPIUrl() {
    if (API_URL.includes('your-api-gateway-url')) {
        showError('Please update the API_URL in script.js with your actual API Gateway URL');
    }
}

function updateCharCount() {
    const currentLength = promptTextarea.value.length;
    charCount.textContent = currentLength;
    
    // Color coding for character count
    if (currentLength > 450) {
        charCount.style.color = '#e53e3e';
    } else if (currentLength > 400) {
        charCount.style.color = '#dd6b20';
    } else {
        charCount.style.color = '#718096';
    }
}

function autoResizeTextarea() {
    promptTextarea.style.height = 'auto';
    promptTextarea.style.height = Math.max(120, promptTextarea.scrollHeight) + 'px';
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const prompt = promptTextarea.value.trim();
    
    if (!prompt) {
        showError('Please enter a prompt before generating content.');
        return;
    }

    if (prompt.length < 10) {
        showError('Please enter a more detailed prompt (at least 10 characters).');
        return;
    }

    await generateContent(prompt);
}

async function generateContent(prompt) {
    try {
        // Update UI for loading state
        setLoadingState(true);
        hideError();
        hideResults();
        
        showToast('Sending request to AI...', 2000);
        
        // Make API call
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ prompt: prompt })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        
        // Handle the response based on your API structure
        if (data.error) {
            throw new Error(data.error);
        }

        // Process and display results
        await displayResults(data, prompt);
        
        showToast('Content generated successfully! 🎉', 3000);
        
    } catch (error) {
        console.error('Generation error:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showError('Network error: Please check your internet connection and API URL.');
        } else if (error.message.includes('504')) {
            showError('Request timeout: The AI is taking longer than expected. Please try with a simpler prompt.');
        } else if (error.message.includes('429')) {
            showError('Rate limit exceeded: Please wait a moment before trying again.');
        } else {
            showError(error.message || 'An unexpected error occurred. Please try again.');
        }
    } finally {
        setLoadingState(false);
    }
}

async function displayResults(data, originalPrompt) {
    try {
        // Store current results
        currentResults = {
            image: data.image_url || data.s3_url || null,
            caption: data.caption || generateFallbackCaption(originalPrompt),
            hashtags: data.hashtags || generateFallbackHashtags(originalPrompt),
            prompt: originalPrompt
        };

        // Display image
        if (currentResults.image) {
            generatedImage.src = currentResults.image;
            generatedImage.onload = function() {
                showToast('Image loaded successfully!', 2000);
            };
            generatedImage.onerror = function() {
                // If S3 URL fails, show placeholder
                generatedImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEdlbmVyYXRlZDwvdGV4dD48L3N2Zz4=';
                showToast('Image generated but couldn\'t be loaded directly', 3000);
            };
        } else {
            // Show placeholder if no image URL
            generatedImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEdlbmVyYXRlZDwvdGV4dD48L3N2Zz4=';
        }

        // Display caption and hashtags
        generatedCaption.textContent = currentResults.caption;
        generatedHashtags.textContent = currentResults.hashtags;

        // Show results with animation
        showResults();
        
        // Scroll to results
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (error) {
        console.error('Error displaying results:', error);
        showError('Generated content successfully, but there was an error displaying it.');
    }
}

function generateFallbackCaption(prompt) {
    const templates = [
        `Amazing AI-generated content based on: "${prompt}"`,
        `Creative visualization of: ${prompt}`,
        `Stunning AI artwork featuring: ${prompt}`,
        `Digital creation inspired by: ${prompt}`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}

function generateFallbackHashtags(prompt) {
    const baseHashtags = ['#AI', '#GeneratedContent', '#Digital', '#Creative', '#ArtificialIntelligence'];
    const promptWords = prompt.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(word => word.length > 3)
        .slice(0, 3)
        .map(word => `#${word.charAt(0).toUpperCase() + word.slice(1)}`);
    
    return [...baseHashtags, ...promptWords].join(' ');
}

function setLoadingState(isLoading) {
    const btnText = generateBtn.querySelector('.btn-text');
    const spinner = generateBtn.querySelector('.spinner');
    
    if (isLoading) {
        generateBtn.disabled = true;
        generateBtn.classList.add('loading');
        loadingMessage.style.display = 'block';
        promptTextarea.disabled = true;
    } else {
        generateBtn.disabled = false;
        generateBtn.classList.remove('loading');
        loadingMessage.style.display = 'none';
        promptTextarea.disabled = false;
    }
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
    errorMessage.style.display = 'none';
}

function clearError() {
    hideError();
    promptTextarea.focus();
}

function showResults() {
    results.style.display = 'block';
    results.classList.add('animate-in');
}

function hideResults() {
    results.style.display = 'none';
}

function showToast(message, duration = 3000) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Image modal functions
function enlargeImage() {
    if (generatedImage.src) {
        modalImage.src = generatedImage.src;
        imageModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    imageModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Copy functionality
function copyText(type) {
    let textToCopy = '';
    let button = document.querySelector(`[data-type="${type}"]`);
    
    if (type === 'caption') {
        textToCopy = currentResults.caption;
    } else if (type === 'hashtags') {
        textToCopy = currentResults.hashtags;
    }
    
    if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Visual feedback
            const originalIcon = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i>';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.innerHTML = originalIcon;
                button.classList.remove('copied');
            }, 2000);
            
            showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} copied to clipboard!`);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            // Fallback for older browsers
            fallbackCopyText(textToCopy);
        });
    }
}

function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('Copied to clipboard!');
    } catch (err) {
        showToast('Please manually copy the text');
    }
    
    document.body.removeChild(textArea);
}

// Action button functions
function generateNew() {
    // Clear previous results
    hideResults();
    hideError();
    
    // Reset form
    promptTextarea.value = '';
    updateCharCount();
    autoResizeTextarea();
    
    // Focus on textarea
    promptTextarea.focus();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function shareContent() {
    if (!currentResults.caption && !currentResults.hashtags) {
        showToast('No content to share');
        return;
    }
    
    const shareText = `${currentResults.caption}\n\n${currentResults.hashtags}\n\nGenerated with AI Content Generator`;
    
    if (navigator.share) {
        // Use native sharing if available
        navigator.share({
            title: 'AI Generated Content',
            text: shareText,
            url: window.location.href
        }).catch(err => {
            console.log('Error sharing:', err);
            fallbackShare(shareText);
        });
    } else {
        fallbackShare(shareText);
    }
}

function fallbackShare(text) {
    // Copy to clipboard as fallback
    navigator.clipboard.writeText(text).then(() => {
        showToast('Content copied to clipboard for sharing!');
    }).catch(() => {
        showToast('Use the copy buttons to share individual elements');
    });
}

function downloadResults() {
    if (!currentResults.caption && !currentResults.hashtags) {
        showToast('No content to download');
        return;
    }
    
    const content = `AI Generated Content
====================

Prompt: ${currentResults.prompt}

Caption:
${currentResults.caption}

Hashtags:
${currentResults.hashtags}

Generated on: ${new Date().toLocaleString()}
Generated with: AI Content Generator`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-content-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Content downloaded successfully!');
}

// Utility functions
function sanitizeInput(input) {
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/[<>]/g, '');
}

function validatePrompt(prompt) {
    if (!prompt || prompt.trim().length === 0) {
        return { valid: false, message: 'Please enter a prompt' };
    }
    
    if (prompt.trim().length < 10) {
        return { valid: false, message: 'Prompt too short. Please provide more details.' };
    }
    
    if (prompt.length > 500) {
        return { valid: false, message: 'Prompt too long. Please keep it under 500 characters.' };
    }
    
    return { valid: true };
}

// Handle network errors and retries
async function retryRequest(url, options, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
            }
        }
    }
    
    throw lastError;
}

// Handle page visibility changes (pause/resume functionality)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden
        console.log('Page hidden');
    } else {
        // Page is visible
        console.log('Page visible');
    }
});

// Handle online/offline status
window.addEventListener('online', function() {
    showToast('Connection restored!');
});

window.addEventListener('offline', function() {
    showToast('Connection lost. Please check your internet.', 5000);
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !generateBtn.disabled) {
        e.preventDefault();
        promptForm.dispatchEvent(new Event('submit'));
    }
    
    // Escape to clear error
    if (e.key === 'Escape' && errorMessage.style.display === 'block') {
        clearError();
    }
});

// Auto-save draft (optional feature)
function saveDraft() {
    if (promptTextarea.value.trim()) {
        localStorage.setItem('promptDraft', promptTextarea.value);
    }
}

function loadDraft() {
    const draft = localStorage.getItem('promptDraft');
    if (draft && !promptTextarea.value) {
        promptTextarea.value = draft;
        updateCharCount();
        autoResizeTextarea();
    }
}

// Initialize draft functionality
setTimeout(loadDraft, 100); // Load draft after page loads
promptTextarea.addEventListener('input', debounce(saveDraft, 1000));

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Performance monitoring
function measurePerformance(label, fn) {
    return async function(...args) {
        const start = performance.now();
        try {
            const result = await fn.apply(this, args);
            const end = performance.now();
            console.log(`${label} took ${end - start} milliseconds`);
            return result;
        } catch (error) {
            const end = performance.now();
            console.log(`${label} failed after ${end - start} milliseconds`);
            throw error;
        }
    };
}

// Error reporting (optional - integrate with your error tracking service)
function reportError(error, context = {}) {
    console.error('Application Error:', error, context);
    
    // You can integrate with services like Sentry, LogRocket, etc.
    // Example:
    // Sentry.captureException(error, { extra: context });
}

// Initialize error boundary
window.addEventListener('error', function(e) {
    reportError(e.error, {
        message: e.message,
        filename: e.filename,
        line: e.lineno,
        column: e.colno
    });
});

window.addEventListener('unhandledrejection', function(e) {
    reportError(e.reason, {
        type: 'unhandledrejection'
    });
});

console.log('🎨 AI Content Generator initialized successfully!');
