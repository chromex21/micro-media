// Media catalog - list your files here
// This is a temporary solution until nginx autoindex is set up

const mediaCatalog = {
    videos: [
        '0107.mp4',
        'vid (1).mp4',
        'vid (2).mp4',
        'vid (3).mp4'
    ],
    images: [
        'ChatGPT Image Jan 7, 2026, 08_41_21 AM.png',
        'ChatGPT Image Jan 7, 2026, 08_44_10 AM.png',
        'ChatGPT Image Jan 7, 2026, 08_46_29 AM.png'
    ]
};

// Storage-based catalog loading for instant updates from admin panel
async function getStorageCatalog() {
    try {
        const videosData = await window.storage.get('media-videos');
        const imagesData = await window.storage.get('media-images');
        
        return {
            videos: videosData && videosData.value ? JSON.parse(videosData.value) : mediaCatalog.videos,
            images: imagesData && imagesData.value ? JSON.parse(imagesData.value) : mediaCatalog.images
        };
    } catch (error) {
        console.log('Using fallback catalog');
        return mediaCatalog;
    }
}
