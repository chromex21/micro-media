/**
 * Gallery Interactions System - MEDIUM TIER
 * PERSISTENT reactions using localStorage (survives browser restart)
 * One reaction per user, no thought chips
 */

(function() {
  'use strict';

  // MEDIUM TIER: localStorage for persistence
  const STORAGE_KEY_PREFIX = 'reactions:';
  const USER_ID_KEY = 'gallery-user-id';
  
  // User ID generation (persistent browser fingerprint)
  let userId = null;
  
  function generateUserId() {
    // MEDIUM TIER: Check localStorage first (persistent)
    let id = localStorage.getItem(USER_ID_KEY);
    if (id) {
      console.log('→ Using existing user ID from localStorage');
      return id;
    }
    
    // Generate simple ID from browser characteristics
    const nav = navigator;
    const screen = window.screen;
    const fingerprint = [
      nav.userAgent,
      nav.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage
    ].join('|');
    
    // Simple hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    id = 'user_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
    
    // MEDIUM TIER: Store in localStorage (persistent)
    localStorage.setItem(USER_ID_KEY, id);
    console.log('→ Generated new persistent user ID');
    
    return id;
  }

  // MEDIUM TIER: Load reactions from localStorage
  function loadReactionsForMedia(mediaId) {
    try {
      const key = STORAGE_KEY_PREFIX + mediaId;
      const data = localStorage.getItem(key);
      
      if (data) {
        const parsed = JSON.parse(data);
        console.log(`→ Loaded reactions for ${mediaId}:`, parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Error loading reactions:', e);
    }
    
    return {
      reactions: {}, // { reactionType: { count: N, users: [userId1, ...] } }
      userChoice: null // userId -> reactionType
    };
  }

  // MEDIUM TIER: Save reactions to localStorage
  function saveReactionsForMedia(mediaId, data) {
    try {
      const key = STORAGE_KEY_PREFIX + mediaId;
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`→ Saved reactions for ${mediaId}`);
    } catch (e) {
      console.error('Error saving reactions:', e);
    }
  }

  // Initialize on DOM ready
  function init() {
    userId = generateUserId();
    console.log('→ Interactions system initialized (Medium Tier - localStorage)');
    console.log('→ User ID:', userId);
    
    const gallery = document.querySelector('.gallery');
    if (!gallery) return;

    // Single delegated listener for entire gallery
    gallery.addEventListener('click', handleInteraction);

    // Load persisted reactions for visible cards
    loadPersistedReactions(gallery);
  }

  // MEDIUM TIER: Load persisted reactions from localStorage
  function loadPersistedReactions(gallery) {
    const cards = gallery.querySelectorAll('.media-card');
    
    cards.forEach(card => {
      const mediaId = card.dataset.mediaId;
      if (!mediaId) return;

      // Load from localStorage
      const savedData = loadReactionsForMedia(mediaId);
      
      // Update UI with loaded data
      updateAllReactionsUI(card, savedData);
    });
  }

  // Handle all interactions via delegation
  function handleInteraction(e) {
    const btn = e.target.closest('.reaction-btn');
    if (!btn) return;

    const card = btn.closest('.media-card');
    if (!card) return;

    const mediaId = card.dataset.mediaId;
    if (!mediaId) return;

    handleReaction(btn, card, mediaId);
  }

  // Handle reaction button tap
  function handleReaction(btn, card, mediaId) {
    const reactionType = btn.dataset.reaction;
    if (!reactionType) return;

    // MEDIUM TIER: Load current state from localStorage
    const data = loadReactionsForMedia(mediaId);
    
    // Check if user already voted
    const previousChoice = data.userChoice;
    
    if (previousChoice === reactionType) {
      // User clicked same reaction - deselect it
      removeReaction(data, previousChoice, userId);
      data.userChoice = null;
    } else {
      // Remove previous vote if exists
      if (previousChoice) {
        removeReaction(data, previousChoice, userId);
      }
      
      // Add new vote
      if (!data.reactions[reactionType]) {
        data.reactions[reactionType] = { count: 0, users: [] };
      }
      
      data.reactions[reactionType].count++;
      data.reactions[reactionType].users.push(userId);
      data.userChoice = reactionType;
    }

    // MEDIUM TIER: Save to localStorage
    saveReactionsForMedia(mediaId, data);

    // Update UI
    updateAllReactionsUI(card, data);
  }

  // Remove a reaction vote
  function removeReaction(data, reactionType, userId) {
    const reaction = data.reactions[reactionType];
    if (!reaction) return;
    
    reaction.count = Math.max(0, reaction.count - 1);
    reaction.users = reaction.users.filter(id => id !== userId);
    
    if (reaction.count === 0) {
      delete data.reactions[reactionType];
    }
  }

  // Update all reaction buttons for a card
  function updateAllReactionsUI(card, data) {
    const userChoice = data.userChoice;
    
    card.querySelectorAll('.reaction-btn').forEach(btn => {
      const type = btn.dataset.reaction;
      const reaction = data.reactions[type];
      const count = reaction ? reaction.count : 0;
      
      // Update count
      const countEl = btn.querySelector('.reaction-count');
      if (countEl) {
        countEl.textContent = count;
      }
      
      // Update classes
      btn.classList.toggle('has-count', count > 0);
      btn.classList.toggle('selected', userChoice === type);
    });
  }

  // MEDIUM TIER: Export state for inspection/debugging
  window.galleryInteractions = {
    getState: (mediaId) => {
      if (mediaId) {
        return loadReactionsForMedia(mediaId);
      }
      
      // Get all reactions from localStorage
      const allReactions = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          const mediaId = key.replace(STORAGE_KEY_PREFIX, '');
          allReactions[mediaId] = loadReactionsForMedia(mediaId);
        }
      }
      return allReactions;
    },
    getUserId: () => userId,
    clearAll: () => {
      // Clear all reaction data (useful for testing)
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          keys.push(key);
        }
      }
      keys.forEach(key => localStorage.removeItem(key));
      console.log('→ Cleared all reaction data');
    }
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
