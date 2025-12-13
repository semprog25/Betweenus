import { projectId, publicAnonKey } from './supabase/info';

export async function addLikesToPosts() {
  try {
    const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`;
    
    // Fetch all posts
    const response = await fetch(`${baseUrl}/posts?language=all`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    const data = await response.json();
    const posts = data.posts || [];

    console.log(`Found ${posts.length} posts to add likes to...`);

    // Update each post with random likes
    let updatedCount = 0;
    for (const post of posts) {
      const randomLikes = Math.floor(Math.random() * (450 - 30 + 1)) + 30;
      
      // Update the post
      const updateResponse = await fetch(`${baseUrl}/posts/${post.id}/likes`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          upvotes: randomLikes,
        }),
      });

      if (updateResponse.ok) {
        updatedCount++;
        console.log(`Updated post ${post.id} with ${randomLikes} likes`);
      }
    }

    return {
      success: true,
      message: `Successfully added random likes to ${updatedCount} posts!`,
      updatedCount,
    };
  } catch (error) {
    console.error('Error adding likes to posts:', error);
    return {
      success: false,
      error: 'Failed to add likes to posts',
    };
  }
}
