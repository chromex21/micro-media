// Helper function to create interactions section
// Called by gallery.js when creating media cards
// MINIMAL VERSION - Reactions only, no thought chips

function createInteractionsSection() {
    const interactions = document.createElement('div');
    interactions.className = 'interactions';
    
    // Create reactions row only
    const reactions = document.createElement('div');
    reactions.className = 'reactions';
    
    const reactionTypes = [
        { type: 'fire', icon: '🔥' },
        { type: 'exhale', icon: '😮‍💨' },
        { type: 'neutral', icon: '😐' },
        { type: 'down', icon: '👎' }
    ];
    
    reactionTypes.forEach(function(r) {
        const btn = document.createElement('button');
        btn.className = 'reaction-btn';
        btn.type = 'button';
        btn.dataset.reaction = r.type;
        
        const icon = document.createElement('span');
        icon.className = 'reaction-icon';
        icon.textContent = r.icon;
        
        const count = document.createElement('span');
        count.className = 'reaction-count';
        count.textContent = '0';
        
        btn.appendChild(icon);
        btn.appendChild(count);
        reactions.appendChild(btn);
    });
    
    interactions.appendChild(reactions);
    
    return interactions;
}
