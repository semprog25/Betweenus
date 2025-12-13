import { projectId, publicAnonKey } from './supabase/info';

/**
 * Updates existing posts to make most of them anonymous
 * Only keeps about 20% of posts as public (with usernames)
 */
export async function makePostsAnonymous() {
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
    
    console.log(`Found ${posts.length} posts to update`);
    
    let anonymousCount = 0;
    let publicCount = 0;
    
    // Update each post - make 80% anonymous, keep 20% public
    for (const post of posts) {
      // Randomly decide if this post should be public (20% chance)
      const shouldBePublic = Math.random() < 0.2;
      
      // Only update if the post is currently not set correctly
      const needsUpdate = shouldBePublic 
        ? post.isAnonymous !== false 
        : post.isAnonymous !== true;
      
      if (needsUpdate) {
        const updateResponse = await fetch(`${baseUrl}/posts/${post.id}/privacy`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            isAnonymous: !shouldBePublic
          }),
        });

        if (updateResponse.ok) {
          if (shouldBePublic) {
            publicCount++;
            console.log(`✓ Set post ${post.id.slice(0, 8)} as PUBLIC`);
          } else {
            anonymousCount++;
            console.log(`✓ Set post ${post.id.slice(0, 8)} as ANONYMOUS`);
          }
        } else {
          console.error(`✗ Failed to update post ${post.id.slice(0, 8)}`);
        }
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return {
      success: true,
      message: `✅ Updated posts: ${anonymousCount} anonymous, ${publicCount} public`,
      anonymousCount,
      publicCount,
      totalProcessed: posts.length
    };
  } catch (error) {
    console.error('Error making posts anonymous:', error);
    return {
      success: false,
      message: 'Failed to update posts',
      error
    };
  }
}
